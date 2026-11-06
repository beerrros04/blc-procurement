export type DocType = 'PR' | 'PO' | 'AV' | 'RB' | 'RC' | 'PV';

export type UserRole =
  | 'PEMOHON'
  | 'ATASAN'
  | 'AYU'
  | 'BOD_HERY'
  | 'BOD_HASHIMOTO'
  | 'KEUANGAN';

export type DocumentStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'PAID';

export type ApprovalStage = 'ATASAN' | 'AYU' | 'BOD';

export type StageDecision = 'WAITING' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ApprovalStepState {
  stage: ApprovalStage;
  label: string;
  assignedTo: string;
  status: StageDecision;
  decisionAt?: string;
  comment?: string;
}

export interface BodParallelState {
  heryStatus: StageDecision;
  heryDecisionAt?: string;
  heryComment?: string;
  hashimotoStatus: StageDecision;
  hashimotoDecisionAt?: string;
  hashimotoComment?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  comment?: string;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface BaseDocument {
  id: string;
  docNumber: string;
  docType: DocType;
  title: string;
  branch: string;
  purpose: string;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
  currentStage: ApprovalStage;
  approvalSteps: {
    atasan: ApprovalStepState;
    ayu: ApprovalStepState;
    bod: BodParallelState;
  };
  auditLog: AuditLogEntry[];
}

export interface PRDocument extends BaseDocument {
  docType: 'PR';
  budgetType: string;
  subtotalAmount: number;
  isIamRequired: boolean;
  requiredDate?: string;
  notes?: string;
}

export interface PODocument extends BaseDocument {
  docType: 'PO';
  parentPrId?: string;
  poCategory: 'STANDARD' | 'ROUTINE' | 'MOBILIZATION';
  vendorName: string;
  paymentMethod: 'BANK_TRANSFER' | 'CASH';
  bankDetails?: BankDetails;
  subtotal: number;
  otherCosts: number;
  discount: number;
  ppnRate: number;
  ppnAmount: number;
  pphRate: number;
  pphAmount: number;
  totalAmount: number;
  requiredDate?: string;
}

export interface AVDocument extends BaseDocument {
  docType: 'AV';
  parentPoId?: string;
  activityDate: string;
  paymentDueDate: string;
  amount: number;
  disbursementMethod: 'TRANSFER' | 'CASH';
  bankDetails?: BankDetails;
}

export interface RBDocument extends BaseDocument {
  docType: 'RB';
  expenseCategory: string;
  transactionDate: string;
  subtotal: number;
  otherCosts: number;
  discount: number;
  totalAmount: number;
  beneficiaryBank: BankDetails;
  attachmentCount: number;
}

export type RcOutcomeType = 'SURPLUS' | 'DEFICIT' | 'EXACT';

export interface RCDocument extends BaseDocument {
  docType: 'RC';
  parentAvId: string;
  avOriginalAmount: number;
  realizedAmount: number;
  balanceAmount: number;
  outcomeType: RcOutcomeType;
  refundProofUrl?: string;
  reimbursementBank?: BankDetails;
  activityCompletedDate: string;
  submissionDeadline: string;
}

export interface PVPaymentDetails {
  paidAt: string;
  sourceBank: string;
  referenceNumber: string;
  proofUrl?: string;
}

export interface PVDocument extends BaseDocument {
  docType: 'PV';
  sourceDocType: 'PO' | 'AV' | 'RB' | 'RC_DEFICIT';
  sourceDocId: string;
  sourceDocNumber: string;
  vendorOrPayeeName: string;
  beneficiaryBank: BankDetails;
  grossAmount: number;
  pphDeduction: number;
  netAmountToPay: number;
  paymentStatus: 'UNPAID' | 'PAID';
  paymentDetails?: PVPaymentDetails;
}

export type AnyDocument =
  | PRDocument
  | PODocument
  | AVDocument
  | RBDocument
  | RCDocument
  | PVDocument;
