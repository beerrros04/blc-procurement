# DATABASE ENTITY RELATIONSHIP DIAGRAM — PHASE 00
**Project:** BLC Caready Procurement Pro  
**Audit Scope:** Physical, Logical, and Target Relationship Architecture (AUDIT-005)  
**Status:** AUTHORIZED — AUDIT ONLY  
**Review Authority:** Project Manager & Product Owner  
**Date:** 10 November 2026  

---

## 1. Overview & Batasan Arsitektur

Dokumen ini memetakan relasi entitas pada sistem BLC Caready Procurement Pro ke dalam tiga perspektif terpisah:
1. **Existing Physical Relationships**: Relasi tabel nyata yang dijamin oleh foreign key (FK) dan constraint fisik pada engine SQLite.
2. **Logical Relationships in Code**: Relasi data yang diatur secara logis pada lapisan aplikasi (*application-level integrity*) dan dokumen JSON di dalam tabel `workspace`.
3. **Proposed Target Relational Architecture**: Rancangan skema relasional terstandarisasi untuk rilis skala enterprise masa depan.

> [!WARNING]
> Relasi pada Diagram 1 dan Diagram 2 merepresentasikan implementasi kode saat ini. Diagram 3 adalah rekomendasi target arsitektur dan **belum diimplementasikan** pada database operasional.

---

## 2. Diagram 1: Hubungan Fisik Database Aktual (Physical SQLite Schema)

Diagram berikut menampilkan struktur 16 tabel relasional fisik di SQLite yang terhubung melalui Foreign Keys (`REFERENCES`) dan Partial Unique Indexes.

```mermaid
erDiagram
    app_users ||--o{ app_user_audit : "user_id"
    app_retired_user_ids ||--|| app_users : "retired ID tombstone"
    
    org_units ||--o{ org_assignments : "unit_id"
    org_assignments ||--o{ org_assignment_audit : "assignment_id"
    app_users ||--o{ org_assignments : "supervisor_user_id (logical/indexed)"

    approval_workflows ||--|{ approval_assignment_snapshots : "workflow_id"
    approval_workflows ||--|{ approval_stages : "workflow_id"
    approval_workflows ||--o{ approval_decisions : "workflow_id"
    approval_workflows ||--o{ approval_stage_reassignments : "workflow_id"
    
    approval_assignment_snapshots ||--|{ approval_stages : "snapshot_id"
    approval_stages ||--o| approval_decisions : "stage_id (UNIQUE)"
    approval_stages ||--o{ approval_stage_reassignments : "stage_id"
    
    approval_stage_assignments ||--o{ approval_stage_assignment_audit : "stage_key audit"

    app_users {
        TEXT id PK
        TEXT legacy_id UK
        TEXT email UK
        TEXT full_name
        TEXT role
        TEXT branch
        TEXT branch_scope
        TEXT status
        TEXT verification_status
        TEXT verified_at
        TEXT verified_by
        TEXT created_at
    }

    app_user_audit {
        TEXT id PK
        TEXT user_id FK
        TEXT actor_user_id
        TEXT action
        TEXT at
        TEXT before_json
        TEXT after_json
    }

    app_retired_user_ids {
        TEXT id PK
        TEXT retired_at
        TEXT reason
    }

    org_units {
        TEXT id PK
        TEXT name UK
        TEXT created_at
        TEXT created_by
    }

    org_assignments {
        TEXT id PK
        TEXT unit_id FK
        TEXT supervisor_user_id
        INTEGER active
        TEXT created_at
        TEXT updated_at
    }

    org_assignment_audit {
        TEXT id PK
        TEXT assignment_id FK
        TEXT actor_user_id
        TEXT action
        TEXT at
        TEXT before_json
        TEXT after_json
    }

    approval_workflows {
        TEXT id PK
        TEXT document_id
        TEXT doc_type
        TEXT doc_number
        TEXT unit_id
        INTEGER workflow_version
        TEXT status
        TEXT submitted_at
        TEXT submitted_by
        TEXT completed_at
    }

    approval_assignment_snapshots {
        TEXT id PK
        TEXT workflow_id FK
        TEXT document_id
        TEXT unit_id
        TEXT assignment_id
        TEXT stage_key
        TEXT approver_user_id
        TEXT approver_name
        TEXT role_context
    }

    approval_stages {
        TEXT id PK
        TEXT workflow_id FK
        TEXT stage_key
        INTEGER stage_order
        TEXT parallel_group
        TEXT assigned_approver_id
        TEXT approver_name
        TEXT approver_role
        TEXT snapshot_id FK
        TEXT status
    }

    approval_decisions {
        TEXT id PK
        TEXT workflow_id FK
        TEXT stage_id FK
        TEXT approver_user_id
        TEXT decision
        TEXT comment
        TEXT decided_at
    }

    approval_stage_reassignments {
        TEXT id PK
        TEXT workflow_id FK
        TEXT stage_id FK
        TEXT previous_approver_id
        TEXT new_approver_id
        TEXT reason
        TEXT reassigned_by
        TEXT reassigned_at
    }

    approval_stage_assignments {
        TEXT id PK
        TEXT stage_key UK
        TEXT assigned_user_id
        INTEGER active
        TEXT created_at
        TEXT updated_at
    }

    approval_stage_assignment_audit {
        TEXT id PK
        TEXT stage_key
        TEXT assigned_user_id
        INTEGER active
        TEXT actor_user_id
        TEXT action
        TEXT at
        TEXT before_json
        TEXT after_json
    }

    workspace {
        INTEGER id PK
        TEXT payload
    }
```

---

## 3. Diagram 2: Hubungan Logis Aplikasi & Dokumen JSON (Logical Data Architecture)

Diagram berikut merepresentasikan bagaimana entitas bisnis saling terhubung di tingkat logika kode aplikasi ([`server/repository.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/repository.ts), [`server/app.ts`](file:///C:/Users/BLC/orca/workspaces/blc-procurement/betta/server/app.ts), dan model transaksi JSON):

```mermaid
flowchart TD
    subgraph Identity_Org["Identitas & Master Organisasi (SQLite)"]
        User["app_users (usr-*)"]
        Unit["org_units"]
        OrgAssign["org_assignments"]
        StageAssign["approval_stage_assignments"]
    end

    subgraph Static_Defs["Definisi Statis & Enums (TypeScript / JSX)"]
        BranchEnum["OFFICIAL_BRANCHES (7 Cabang)"]
        BudgetTypes["Budget Types (OPEX, CAPEX, PROJECT)"]
        DocTypeEnum["DocType (PR, PO, AV, RB, RC, GR, PV)"]
        MimeConst["ALLOWED_MIME_TYPES (PDF, PNG, JPEG)"]
    end

    subgraph Transaction_Docs["Dokumen Pengadaan (JSON di workspace.payload)"]
        PR["PR Document"]
        PO["PO Document"]
        GR["GR Document"]
        AV["AV Document"]
        RC["RC Document"]
        RB["RB Document"]
        PV["PV Document"]
        PaymentRecord["Payment Record Details"]
    end

    subgraph Filesystem["Storage Fisik Lampiran"]
        UploadDisk[".data/uploads/ (${id}-${safeName})"]
    end

    subgraph Workflow_Engine["Approval Engine (SQLite)"]
        WfInstance["approval_workflows"]
        WfSnapshots["approval_assignment_snapshots"]
        WfStages["approval_stages"]
        WfDecisions["approval_decisions"]
    end

    %% Relasi Identitas ke Dokumen
    User -->|ownerId / applicant| PR
    User -->|ownerId / applicant| PO
    User -->|ownerId / applicant| AV
    User -->|ownerId / applicant| RB
    User -->|Finance Staff| PV

    %% Relasi Organisasi ke Workflow
    Unit -->|unitId / supervisor lookup| OrgAssign
    OrgAssign -->|Stage 1 candidate| WfSnapshots
    StageAssign -->|Stage 2 & Stage 3 candidate| WfSnapshots

    %% Relasi Antar Dokumen Transaksi
    PR -->|parentPrId (1:1)| PO
    PO -->|parentPoId (1:N)| GR
    PO -.->|parentPoId (Opsional)| AV
    PO -->|sourceDocId (1:1 aktif)| PV
    AV -->|sourceDocId (1:1 aktif)| PV
    RB -->|sourceDocId (1:1 aktif)| PV
    AV -->|parentAvId (1:1)| RC
    RC -.->|sourceDocId jika DEFICIT| PV
    PV -->|disetujui & dicairkan| PaymentRecord

    %% Denormalized Vendor & Bank
    PO ---|menampung nama vendor & rekening| VendorEmbedded["Vendor & Bank Details (Denormalized)"]
    PV ---|disalin dari PO/AV/RB| VendorEmbedded

    %% Relasi Dokumen ke Workflow
    PR -->|document_id| WfInstance
    PO -->|document_id| WfInstance
    AV -->|document_id| WfInstance
    RB -->|document_id| WfInstance
    RC -->|document_id| WfInstance
    GR -->|document_id| WfInstance
    PV -->|document_id| WfInstance

    WfInstance --> WfSnapshots
    WfInstance --> WfStages
    WfStages --> WfDecisions

    %% Relasi Lampiran
    PR -->|attachments[]| UploadDisk
    PO -->|attachments[]| UploadDisk
    GR -->|Foto / BAST| UploadDisk
    RB -->|Kuitansi / Receipt| UploadDisk
    RC -->|Bukti Transfer / Refund| UploadDisk
    PaymentRecord -->|Bukti Bayar / Proof| UploadDisk
```

---

## 4. Diagram 3: Usulan Skema Relasional Enterprise (Proposed Target Relational Schema)

Jika sistem dimigrasikan penuh ke basis data relasional enterprise (PostgreSQL / SQLite Relasional Penuh), struktur tabel target yang disarankan adalah sebagai berikut:

```mermaid
erDiagram
    branches ||--o{ users : "branch_id"
    branches ||--o{ procurement_documents : "branch_id"
    
    departments ||--o{ user_departments : "department_id"
    users ||--o{ user_departments : "user_id"
    
    job_positions ||--o{ users : "position_id"
    
    departments ||--o{ department_supervisors : "department_id"
    users ||--o{ department_supervisors : "supervisor_user_id"

    budget_categories ||--o{ budget_allocations : "budget_category_id"
    branches ||--o{ budget_allocations : "branch_id"
    
    vendors ||--o{ vendor_bank_accounts : "vendor_id"
    vendors ||--o{ procurement_documents : "vendor_id"
    vendor_bank_accounts ||--o{ procurement_documents : "vendor_bank_account_id"

    company_bank_accounts ||--o{ payment_records : "source_bank_account_id"

    users ||--o{ procurement_documents : "created_by"
    document_types ||--o{ procurement_documents : "doc_type_id"
    
    procurement_documents ||--o{ document_line_items : "document_id"
    procurement_documents ||--o{ document_attachments : "document_id"
    
    procurement_documents ||--o| approval_workflows : "document_id"
    approval_workflows ||--|{ approval_stages : "workflow_id"
    approval_stages ||--o| approval_decisions : "stage_id"

    procurement_documents ||--o{ payment_records : "pv_document_id"

    branches {
        UUID id PK
        VARCHAR code UK "e.g. BKS, SBY"
        VARCHAR name UK "Bekasi, Surabaya"
        BOOLEAN is_active
        TIMESTAMP created_at
    }

    job_positions {
        UUID id PK
        VARCHAR code UK "e.g. STF, SPV, MGR, DIR"
        VARCHAR title "Staff, Supervisor, Director"
        INTEGER level
    }

    departments {
        UUID id PK
        UUID parent_department_id FK "Hirarki subordinasi"
        VARCHAR code UK
        VARCHAR name UK
        BOOLEAN is_active
    }

    vendors {
        UUID id PK
        VARCHAR code UK "VND-2026-0001"
        VARCHAR name
        VARCHAR tax_id_npwp
        VARCHAR contact_email
        VARCHAR contact_phone
        VARCHAR address
        BOOLEAN is_active
    }

    vendor_bank_accounts {
        UUID id PK
        UUID vendor_id FK
        VARCHAR bank_name
        VARCHAR account_number
        VARCHAR account_holder
        BOOLEAN is_primary
    }

    company_bank_accounts {
        UUID id PK
        VARCHAR account_code UK "BCA-OPS-PST"
        VARCHAR bank_name "BCA"
        VARCHAR account_number "123-456-7890"
        VARCHAR account_name "PT BLC Caready"
        VARCHAR branch_name "Cabang Rawamangun"
        BOOLEAN is_active
    }

    budget_categories {
        UUID id PK
        VARCHAR code UK "OPEX, CAPEX, PROJECT"
        VARCHAR name
        VARCHAR coa_prefix
    }

    document_types {
        VARCHAR code PK "PR, PO, AV, RB, RC, GR, PV"
        VARCHAR name
        BOOLEAN requires_iam_above_threshold
        BOOLEAN is_active
    }

    procurement_documents {
        UUID id PK
        VARCHAR doc_number UK
        VARCHAR doc_type_id FK
        UUID branch_id FK
        UUID department_id FK
        UUID created_by FK
        UUID vendor_id FK
        UUID vendor_bank_account_id FK
        NUMERIC subtotal
        NUMERIC ppn_amount
        NUMERIC pph_amount
        NUMERIC total_amount
        VARCHAR status "DRAFT, SUBMITTED, APPROVED, REJECTED, PAID"
        UUID parent_document_id FK "Self-referencing tree"
        TIMESTAMP created_at
    }

    document_line_items {
        UUID id PK
        UUID document_id FK
        VARCHAR description
        NUMERIC quantity
        VARCHAR unit
        NUMERIC unit_price
        NUMERIC total_price
    }

    payment_records {
        UUID id PK
        UUID pv_document_id FK
        UUID source_bank_account_id FK
        VARCHAR reference_number
        NUMERIC amount_paid
        TIMESTAMP paid_at
        UUID recorded_by FK
    }
```

---

## 5. Analisis Perbandingan & Implikasi Transisi

| Aspek Arsitektur | Kondisi Eksisting (Saat Ini) | Target Relasional Enterprise | Dampak Risiko Jika Tidak Dimigrasi |
|---|---|---|---|
| **Penyimpanan Transaksi** | JSON blob di SQLite `workspace` | Tabel ternormalisasi `procurement_documents`, `line_items` | Query analitik, pelaporan multi-dokumen, dan indexing data lambat jika volume membesar. |
| **Integritas Vendor** | String bebas `po.vendorName`, rekening disalin ke form | Master `vendors` & `vendor_bank_accounts` | Rawan typo nama vendor, rekening salah transfer, sulit audit histori belanja per vendor. |
| **Integritas Cabang** | Enum statis 7 string | Master `branches` berelasi FK | Penambahan cabang baru wajib mengubah kode program (redeploy build). |
| **Pagu Anggaran** | String opsional `budgetType` | Master `budget_categories` & kuota anggaran | Tidak dapat membatasi anggaran riil per departemen atau cabang. |
| **Workflow Engine** | Relasional SQLite terpisah (`approval_*`) | Terintegrasi penuh dengan foreign key ke dokumen | Saat ini butuh `cross_storage_sync_records` untuk menjaga konsistensi antara SQLite dan JSON blob. |
