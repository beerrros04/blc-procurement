-- =============================================================================
-- BLC Procurement System - Production PostgreSQL 16 Schema (DDL)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Master Cabang & Organisasi
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS branches (
  code        VARCHAR(32) PRIMARY KEY,
  name        VARCHAR(128) NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. Pengguna & Matriks Peran (RBAC + SSO Entra ID Mapping)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entra_oid     VARCHAR(128) UNIQUE,
  email         VARCHAR(255) NOT NULL UNIQUE,
  full_name     VARCHAR(255) NOT NULL,
  branch_code   VARCHAR(32) NOT NULL REFERENCES branches(code),
  manager_id    UUID REFERENCES users(id),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_code     VARCHAR(32) NOT NULL CHECK (
    role_code IN ('PEMOHON', 'ATASAN', 'AYU', 'BOD_HERY', 'BOD_HASHIMOTO', 'KEUANGAN', 'ADMIN')
  ),
  branch_scope  VARCHAR(32) NOT NULL DEFAULT '*', -- '*' untuk akses lintas cabang, atau kode cabang
  PRIMARY KEY (user_id, role_code, branch_scope)
);

-- -----------------------------------------------------------------------------
-- 3. Generator Nomor Dokumen Atomik (Per Tipe & Tahun-Bulan)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS doc_sequences (
  doc_type    VARCHAR(8) NOT NULL CHECK (doc_type IN ('PR', 'PO', 'AV', 'RB', 'RC', 'PV')),
  year_month  CHAR(6) NOT NULL, -- Format YYYYMM, misal '202611'
  last_seq    INT NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (doc_type, year_month)
);

-- -----------------------------------------------------------------------------
-- 4. Tabel Induk Dokumen Pengadaan (Optimistic Concurrency via version)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_number      VARCHAR(32) NOT NULL UNIQUE,
  doc_type        VARCHAR(8) NOT NULL CHECK (doc_type IN ('PR', 'PO', 'AV', 'RB', 'RC', 'PV')),
  title           VARCHAR(255) NOT NULL,
  branch_code     VARCHAR(32) NOT NULL REFERENCES branches(code),
  purpose         TEXT NOT NULL DEFAULT '',
  status          VARCHAR(24) NOT NULL DEFAULT 'DRAFT' CHECK (
    status IN ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED')
  ),
  current_stage   VARCHAR(16) NOT NULL DEFAULT 'ATASAN' CHECK (
    current_stage IN ('ATASAN', 'AYU', 'BOD')
  ),
  requester_id    UUID REFERENCES users(id),
  version         INT NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_type_status ON documents(doc_type, status);
CREATE INDEX IF NOT EXISTS idx_documents_branch_status ON documents(branch_code, status);
CREATE INDEX IF NOT EXISTS idx_documents_stage_status ON documents(current_stage, status);

-- -----------------------------------------------------------------------------
-- 5. Ringkasan Finansial Dokumen (Satuan Rupiah Penuh dalam BIGINT)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS document_financials (
  document_id     UUID PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
  currency        CHAR(3) NOT NULL DEFAULT 'IDR',
  subtotal        BIGINT NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  other_costs     BIGINT NOT NULL DEFAULT 0 CHECK (other_costs >= 0),
  discount        BIGINT NOT NULL DEFAULT 0 CHECK (discount >= 0),
  ppn_rate        NUMERIC(6,4) NOT NULL DEFAULT 0,
  ppn_amount      BIGINT NOT NULL DEFAULT 0 CHECK (ppn_amount >= 0),
  pph_rate        NUMERIC(6,4) NOT NULL DEFAULT 0,
  pph_amount      BIGINT NOT NULL DEFAULT 0 CHECK (pph_amount >= 0),
  total_amount    BIGINT NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 6. Tabel Spesifik Per Jenis Dokumen (1:1 dengan documents)
-- -----------------------------------------------------------------------------

-- 6a. Purchase Requisition (PR)
CREATE TABLE IF NOT EXISTS pr_details (
  document_id     UUID PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
  budget_type     VARCHAR(32) NOT NULL DEFAULT 'OPEX',
  subtotal_amount BIGINT NOT NULL DEFAULT 0 CHECK (subtotal_amount >= 0),
  is_iam_required BOOLEAN NOT NULL DEFAULT FALSE,
  required_date   DATE,
  notes           TEXT
);

-- 6b. Purchase Order (PO)
CREATE TABLE IF NOT EXISTS po_details (
  document_id     UUID PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
  parent_pr_id    UUID REFERENCES documents(id),
  po_category     VARCHAR(32) NOT NULL DEFAULT 'STANDARD' CHECK (
    po_category IN ('STANDARD', 'ROUTINE', 'MOBILIZATION')
  ),
  vendor_name     VARCHAR(255) NOT NULL,
  payment_method  VARCHAR(32) NOT NULL DEFAULT 'BANK_TRANSFER' CHECK (
    payment_method IN ('BANK_TRANSFER', 'CASH')
  ),
  bank_name       VARCHAR(128),
  account_number  VARCHAR(64),
  account_holder  VARCHAR(255),
  required_date   DATE
);

-- 6c. Advance / Uang Muka (AV)
CREATE TABLE IF NOT EXISTS av_details (
  document_id         UUID PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
  parent_po_id        UUID REFERENCES documents(id),
  activity_date       DATE NOT NULL,
  payment_due_date    DATE NOT NULL,
  amount              BIGINT NOT NULL DEFAULT 0 CHECK (amount >= 0),
  disbursement_method VARCHAR(32) NOT NULL DEFAULT 'TRANSFER' CHECK (
    disbursement_method IN ('TRANSFER', 'CASH')
  ),
  bank_name           VARCHAR(128),
  account_number      VARCHAR(64),
  account_holder      VARCHAR(255)
);

-- 6d. Reimbursement (RB)
CREATE TABLE IF NOT EXISTS rb_details (
  document_id       UUID PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
  expense_category  VARCHAR(64) NOT NULL,
  transaction_date  DATE NOT NULL,
  bank_name         VARCHAR(128) NOT NULL,
  account_number    VARCHAR(64) NOT NULL,
  account_holder    VARCHAR(255) NOT NULL,
  attachment_count  INT NOT NULL DEFAULT 1 CHECK (attachment_count >= 0)
);

-- 6e. Realization of Cash Advance (RC) - Enforces 1 AV : 1 Active RC
CREATE TABLE IF NOT EXISTS rc_details (
  document_id             UUID PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
  parent_av_id            UUID NOT NULL REFERENCES documents(id),
  av_original_amount      BIGINT NOT NULL CHECK (av_original_amount >= 0),
  realized_amount         BIGINT NOT NULL CHECK (realized_amount >= 0),
  balance_amount          BIGINT NOT NULL, -- av_original_amount - realized_amount
  outcome_type            VARCHAR(16) NOT NULL CHECK (
    outcome_type IN ('SURPLUS', 'DEFICIT', 'EXACT')
  ),
  refund_proof_url        TEXT,
  reimb_bank_name         VARCHAR(128),
  reimb_account_number    VARCHAR(64),
  reimb_account_holder    VARCHAR(255),
  activity_completed_date DATE NOT NULL,
  submission_deadline     DATE NOT NULL,
  is_active               BOOLEAN NOT NULL DEFAULT TRUE
);

-- Partial unique index: 1 AV hanya boleh memiliki maksimal 1 RC yang aktif (tidak dibatalkan)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_rc_per_av
  ON rc_details(parent_av_id)
  WHERE is_active = TRUE;

-- 6f. Payment Voucher (PV) - Enforces 1 Source Doc : 1 PV
CREATE TABLE IF NOT EXISTS pv_details (
  document_id         UUID PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
  source_doc_type     VARCHAR(16) NOT NULL CHECK (
    source_doc_type IN ('PO', 'AV', 'RB', 'RC_DEFICIT')
  ),
  source_doc_id       UUID NOT NULL UNIQUE REFERENCES documents(id),
  source_doc_number   VARCHAR(32) NOT NULL,
  vendor_or_payee     VARCHAR(255) NOT NULL,
  bank_name           VARCHAR(128) NOT NULL,
  account_number      VARCHAR(64) NOT NULL,
  account_holder      VARCHAR(255) NOT NULL,
  gross_amount        BIGINT NOT NULL CHECK (gross_amount >= 0),
  pph_deduction       BIGINT NOT NULL DEFAULT 0 CHECK (pph_deduction >= 0),
  net_amount_to_pay   BIGINT NOT NULL CHECK (net_amount_to_pay >= 0),
  payment_status      VARCHAR(16) NOT NULL DEFAULT 'UNPAID' CHECK (
    payment_status IN ('UNPAID', 'PAID')
  ),
  paid_at             TIMESTAMPTZ,
  source_bank         VARCHAR(128),
  reference_number    VARCHAR(128),
  proof_url           TEXT
);

-- -----------------------------------------------------------------------------
-- 7. Mesin Persetujuan (3 Tahap + Paralel BoD Hery & Hashimoto)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS approval_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  stage           VARCHAR(16) NOT NULL CHECK (stage IN ('ATASAN', 'AYU', 'BOD')),
  approver_role   VARCHAR(32) NOT NULL CHECK (
    approver_role IN ('ATASAN', 'AYU', 'BOD_HERY', 'BOD_HASHIMOTO')
  ),
  assigned_to      VARCHAR(255) NOT NULL,
  status          VARCHAR(16) NOT NULL DEFAULT 'WAITING' CHECK (
    status IN ('WAITING', 'PENDING', 'APPROVED', 'REJECTED')
  ),
  decided_by_id   UUID REFERENCES users(id),
  decision_at     TIMESTAMPTZ,
  comment         TEXT,
  UNIQUE (document_id, approver_role)
);

CREATE INDEX IF NOT EXISTS idx_approval_tasks_pending
  ON approval_tasks(approver_role, status)
  WHERE status = 'PENDING';

CREATE TABLE IF NOT EXISTS approval_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id       UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  approver_role     VARCHAR(32) NOT NULL,
  actor_name        VARCHAR(255) NOT NULL,
  decision          VARCHAR(16) NOT NULL CHECK (decision IN ('APPROVE', 'REJECT', 'SUBMIT')),
  comment           TEXT,
  idempotency_key   VARCHAR(128) UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 8. Lampiran Dokumen (Bukti Kwitansi, Memo IAM, Bukti Bayar PV/RC)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attachments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  category        VARCHAR(32) NOT NULL DEFAULT 'SUPPORTING' CHECK (
    category IN ('IAM_MEMO', 'INVOICE', 'RECEIPT', 'REFUND_PROOF', 'PAYMENT_PROOF', 'SUPPORTING')
  ),
  original_name   VARCHAR(255) NOT NULL,
  mime_type       VARCHAR(128) NOT NULL CHECK (
    mime_type IN ('application/pdf', 'image/png', 'image/jpeg')
  ),
  size_bytes      BIGINT NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 10485760),
  sha256_hash     CHAR(64) NOT NULL,
  storage_path    TEXT NOT NULL,
  uploaded_by     VARCHAR(255) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attachments_doc ON attachments(document_id, category);

-- -----------------------------------------------------------------------------
-- 9. Log Audit Imutabel (Append-Only) & Transactional Outbox
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  actor           VARCHAR(255) NOT NULL,
  action          VARCHAR(64) NOT NULL,
  comment         TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_doc_time ON audit_logs(document_id, created_at ASC);

CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs bersifat append-only dan tidak dapat diubah atau dihapus';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_logs_immutable ON audit_logs;
CREATE TRIGGER trg_audit_logs_immutable
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();

CREATE TABLE IF NOT EXISTS outbox_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type      VARCHAR(64) NOT NULL,
  document_id     UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  payload         JSONB NOT NULL,
  status          VARCHAR(16) NOT NULL DEFAULT 'PENDING' CHECK (
    status IN ('PENDING', 'PROCESSING', 'SENT', 'FAILED')
  ),
  attempts        INT NOT NULL DEFAULT 0,
  last_error      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_outbox_jobs_pending
  ON outbox_jobs(status, created_at ASC)
  WHERE status = 'PENDING';
