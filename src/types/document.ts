export type DocType = 'PR' | 'PO' | 'AV' | 'RB' | 'RC' | 'GR' | 'PV';

export type UserRole =
  | 'PEMOHON'
  | 'ADMIN'
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

export type AttachmentCategoryType =
  | 'IAM_MEMO'
  | 'QUOTATION'
  | 'INVOICE'
  | 'RECEIPT'
  | 'REFUND_PROOF'
  | 'PAYMENT_PROOF'
  | 'PHOTO'
  | 'BAST'
  | 'SUPPORTING'
  | 'OTHER';

export interface LineItem {
  id: string;
  description: string;
  qty: number;
  unit: string;
  unitPrice: number;
}

export interface DocumentAttachment {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  category: AttachmentCategoryType;
  uploadedAt: string;
  dataUrl?: string;
}

export interface BaseDocument {
  id: string;
  ownerId?: string;
  stage1ApproverEmail?: string;
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
  attachments?: DocumentAttachment[];
}

export interface PRDocument extends BaseDocument {
  docType: 'PR';
  budgetType: string;
  subtotalAmount: number;
  isIamRequired: boolean;
  items?: LineItem[];
  requiredDate?: string;
  notes?: string;
  otherCosts?: number;
  discount?: number;
  ppnRate?: number;
  pphRate?: number;
  ppnAmount?: number;
  pphAmount?: number;
  totalAmount?: number;
  iamNumber?: string;
  prNumber?: string;
}

export interface PODocument extends BaseDocument {
  docType: 'PO';
  parentPrId?: string;
  poCategory: 'STANDARD' | 'ROUTINE' | 'MOBILIZATION';
  vendorName: string;
  paymentMethod: 'BANK_TRANSFER' | 'CASH';
  bankDetails?: BankDetails;
  items?: LineItem[];
  subtotal: number;
  otherCosts: number;
  discount: number;
  ppnRate: number;
  ppnAmount: number;
  pphRate: number;
  pphAmount: number;
  totalAmount: number;
  requiredDate?: string;
  iamNumber?: string;
  contractNumber?: string;
  vendorCode?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  budgetType?: string;
}

export interface AVDocument extends BaseDocument {
  docType: 'AV';
  parentPoId?: string;
  activityEndDate?: string;
  activityDate: string;
  paymentDueDate: string;
  amount: number;
  subtotal?: number;
  otherCosts?: number;
  discount?: number;
  ppnRate?: number;
  pphRate?: number;
  ppnAmount?: number;
  pphAmount?: number;
  budgetType?: string;
  vendorName?: string;
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
  budgetType?: string;
  paymentDueDate?: string;
  vendorName?: string;
  ppnRate?: number;
  pphRate?: number;
  ppnAmount?: number;
  pphAmount?: number;
  paymentMethod?: 'BANK_TRANSFER' | 'CASH';
}

export type RcOutcomeType = 'SURPLUS' | 'DEFICIT' | 'EXACT';

export interface RCDocument extends BaseDocument {
  docType: 'RC';
  financeConfirmedAt?: string;
  parentAvId: string;
  avOriginalAmount: number;
  realizedAmount: number;
  balanceAmount: number;
  outcomeType: RcOutcomeType;
  refundProofUrl?: string;
  reimbursementBank?: BankDetails;
  activityCompletedDate: string;
  submissionDeadline: string;
  budgetType?: string;
  subtotal?: number;
  otherCosts?: number;
  discount?: number;
}

export interface GRDocument extends BaseDocument {
  docType: 'GR';
  parentPoId: string;
  parentPoNumber?: string;
  vendorName?: string;
  receiptType: 'GOODS' | 'SERVICE';
  receivedDate: string;
  itemCondition: 'BAIK' | 'KURANG' | 'RUSAK';
  notes?: string;
  requiresFollowUp?: boolean;
}

export interface PVPaymentDetails {
  paidAt: string;
  sourceBank: string;
  referenceNumber: string;
  paidAmount?: number;
  notes?: string;
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
  paymentMethod?: 'BANK_TRANSFER' | 'CASH';
  paymentDueDate?: string;
  plannedSourceAccount?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  paymentDetails?: PVPaymentDetails;
}

export type AnyDocument =
  | PRDocument
  | PODocument
  | AVDocument
  | RBDocument
  | RCDocument
  | GRDocument
  | PVDocument;
