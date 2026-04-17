export type UserRole =
  | "admin"
  | "accountant"
  | "secretary"
  | "tenant"
  | "homeowner"
  | "representative";

export interface MetadataObject {
  [key: string]: MetadataValue;
}

export type PenaltyPayload = {
  invoice_id: number;
  penalties: {
    amount: number;
    reason: string;
    applied_date: string;
  }[];
};

export type MetadataValue =
  | string
  | boolean
  | number
  | null
  | MetadataObject
  | MetadataValue[];
  
export type User = {
  id: string | number;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string | null;
  email: string;
  role: UserRole;
  city: string | null;
  sub_city: string | null;
  woreda: string | null;
  house_number: string | null;
  status: string;
  idFile?: Document;
  owned_units?: UnitResource[];
  rented_units?: UnitResource[];
  leases?: UnitLeaseResource[];
  created_templates?: DocumentTemplate[];
  updated_templates?: DocumentTemplate[];
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type UserSelectOption = {
  data: User[];
}

export type UnitSelectOption = {
  data: Unit[];
}

export type InvoiceSelectOption = {
  data: Invoice[];
}

export type IdNamePair = {
  id: string | number;
  name: string;
};

export type UserPaginatedResponse = {
  data: User[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};

export type UnitResource = {
  id: string | number;
  name: string;
  description: string | null;
  floor_number: string;
  status: string;
  size_m2: number | null;
  type_name: string;
};

export type UnitLeaseResource = {
  id: number | string;
  unit?: Unit | null;
  tenant?: User | null;
  representative?: User | null;
  representative_document?: Document | null;
  agreement_type: string | null;
  agreement_amount: number | string | null;
  lease_template?: DocumentTemplate | null;
  lease_document?: Document | null;
  /** Scanned copy of the physically signed agreement */
  signed_agreement?: Document | null;
  lease_start_date: string | null;
  lease_end_date: string | null;
  status: string;
  witness_1_full_name: string | null;
  witness_2_full_name: string | null;
  witness_3_full_name: string | null;
  notes: string | null;
  created_by?: User | null;
  updated_by?: User | null;
  created_at: string;
  updated_at: string;
};

export type DocumentTemplate = {
  id: string | number;           
  category: string;      
  sub_category: string;  
  name: string;          
  url: string;       
  pdf_url: string;   
  placeholders: string;  
  description: string;   
  version: string | number;       
  created_by: User;  
  updated_by: User;  
  created_at: string;    
  updated_at: string;    
};

export type DocumentTemplatePaginatedResponse = {
  data: DocumentTemplate[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};

export type Document = {
  id: string | number;
  url: string;
  file_path: string;
  file_name : string;
  mime_type : string;
  file_size : string;
  category : string;
  uploaded_at : string;
  created_at: string;
  updated_at: string;
};

export type Building = {
  id: string | number;
  name: string;
  floors: number;
  units_per_floor: number;
  address: string;
  notes: string | null;
  units?: Unit[];
  created_at: string;
  updated_at: string;
};

export type BuildingPaginatedResponse = {
  data: Building[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};

export type Unit = {
  id: string | number;
  building?: Building; 
  have_issue: boolean;
  name: string;
  floor_number: number | null;
  floor_name?: string;
  owners?: UnitOwnership[]; 
  currentOwner?: UnitOwnership;
  unit_type: string;
  type_name: string;
  size_m2: number | null;
  status: string;
  status_name: string;
  isRentable: boolean;
  currentLease?: UnitLeaseResource;
  leases?: UnitLeaseResource[];
  invoices?: Invoice[];
  vehicles?: Vehicle[];
  created_at: string;
  updated_at: string;
};

export type UnitPaginatedResponse = {
  data: Unit[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};

export type UnitFormData = {
  status: string;
  unit_types: string[] | null;
  unit_statuses: string[] | null;
  data: IdNamePair[];
};

export type UnitOwnership = {
  id: string | number;
  unit?: UnitResource;
  owner?: User;
  ownership_document?: Document;
  start_date: string;
  end_date: string | null;
  status: string;
  created_by?: User;
  updated_by?: User;
  created_at: string;
  updated_at: string;
}

export interface Fee {
  id: number | string;
  name: string;
  description: string;
  category: string;
  amount: number | string; 
  is_recurring: boolean;
  recurring_period_months: number | null;
  last_recurring_date: string | null;
  next_recurring_date: string | null;
  is_penalizable: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface FeePaginatedResponse {
  data: Fee[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export type PollStatus = "draft" | "open" | "closed";

/** Mirrors backend PollRepository::validateEligibleScope. */
export type PollEligibleScope =
  | { type: "all" }
  | { type: "buildings"; building_ids: number[] }
  | { type: "units"; unit_ids: number[] };

export interface PollOption {
  id: number;
  poll_id: number;
  option_text: string;
  order: number;
  created_at?: string;
  updated_at?: string;
}

export interface Poll {
  id: number;
  title: string;
  description: string | null;
  eligible_scope: PollEligibleScope | null;
  start_at: string;
  end_at: string;
  status: PollStatus | string;
  votes_count?: number;
  options?: PollOption[];
  created_at: string;
  updated_at: string;
}

export interface PollPaginatedResponse {
  data: Poll[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export type PollResultsResponse = {
  poll_id: number;
  status: string;
  options: { option_id: number; option_text: string; vote_count: number }[];
  total_votes: number;
};

export type ComplaintStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "closed";

export type ComplaintPriority = "low" | "normal" | "high" | "urgent";

export type ComplaintCategory =
  | "maintenance"
  | "noise"
  | "parking"
  | "security"
  | "billing"
  | "common_areas"
  | "other";

export interface Complaint {
  id: number;
  user_id: number;
  unit_id: number | null;
  category: ComplaintCategory | string;
  subject: string;
  body: string;
  status: ComplaintStatus | string;
  priority: ComplaintPriority | string;
  assigned_to: number | null;
  submitter?: User;
  assignee?: User | null;
  unit?: Unit | null;
  documents?: Document[];
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface ComplaintPaginatedResponse {
  data: Complaint[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface OutgoingLetter {
  id: number;
  letter_number: string;
  title: string;
  description: string | null;
  unit_id: number | null;
  recipient_name: string | null;
  scanned_document_id: number | null;
  unit?: Unit | null;
  creator?: User | null;
  scan?: Document | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface OutgoingLetterPaginatedResponse {
  data: OutgoingLetter[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export type StickerIssueStatus =
  | "active"
  | "lost"
  | "revoked"
  | "expired"
  | "replaced"
  | "returned";

export interface StickerIssue {
  id: number;
  vehicle_id: number;
  replaces_sticker_issue_id: number | null;
  sticker_code: string;
  lookup_token: string | null;
  status: StickerIssueStatus | string;
  issued_at: string | null;
  expires_at: string | null;
  replacement_invoice_id?: number | null;
  replacement_invoice?: {
    id: number;
    invoice_number: string;
  } | null;
  lost_penalty_invoice_id?: number | null;
  lost_penalty_invoice?: Invoice | null;
  issuer?: User | null;
  created_at: string;
  updated_at: string;
}

export interface StickerPrintData {
  sticker_code: string;
  lookup_token: string | null;
  sticker_line: string;
}

export interface Vehicle {
  id: string | number;
  unit?: Unit;
  make: string;
  model: string;
  year: number | string;
  license_plate: string;
  color: string | null;
  document?: Document;
  lost_sticker_fee_id?: number | null;
  lost_sticker_fee?: Fee | null;
  stickers?: StickerIssue[];
  created_at: string;
  updated_at: string;
}

export interface VehiclePaginatedResponse {
  data: Vehicle[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export type InvoiceStatus = 'issued' | 'partial' | 'paid' | 'overdue' | 'cancelled';
export type PaymentStatus = 'pending' | 'confirmed' | 'failed' | 'refunded';


export interface PaymentWithSameReference {
  id: number;
  reference: string;
}

export interface Payment {
  id: number;
  amount: number;
  method: string;
  reference: string;
  status: PaymentStatus;
  type: string;
  processed_by?: string;
  processed_at: string | null;
  receipt_number?: string | null;
  payment_date: string | null;
  reconciliation_metadata?: Record<string, string> | null;
  invoice: Invoice;
  screenshot?: Document;
  created_at: string;
  updated_at: string;
  /** Other payments sharing this reference (payment detail response only). */
  payments_with_same_reference?: PaymentWithSameReference[];
}

export interface PaymentPaginatedResponse {
  data: Payment[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface InvoiceSource {
  id: number;
  name?: string; 
  description?: string;
  is_recurring?: boolean;
}

export interface Invoice {
  id: number | string;
  invoice_number: string;
  issue_date: string;
  invoice_type: string;
  due_date: string | null;
  total_amount: number | string;
  amount_paid: number | string;
  status: InvoiceStatus;
  source_type: string;
  source_id: number;
  metadata?: MetadataObject | null;
  penalty_amount: number | string;
  final_amount_due: number | string;
  user?: User;
  unit?: Unit;
  source?: InvoiceSource;
  payments?: Payment[];
  penalties?:InvoicePenalities[];
  created_at: string;
  updated_at: string;
}

export interface UnitInvoiceProp { 
  unit_id: number; 
  total_amount: number; 
  issue_date: string; 
  due_date: string; 
  source_id: number; 
}


export interface InvoicePenalities {
  id: number | string;
  invoice?: Invoice;
  amount: number | string;
  reason: string | null;
  applied_date: string;
  created_at: string;
  updated_at: string;
}

export interface InvoicePaginatedResponse {
  data: Invoice[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface BankStatementBatch {
  id: number;
  admin: User | null;
  file_path: string;
  file_name: string;
  row_count: number;
  status: string;
  uploaded_at: string;
  transactions?: BankTransaction[];
  created_at: string;
  updated_at: string;
}

export interface BankStatementBatchPaginatedResponse {
  data: BankStatementBatch[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface BankTransaction {
  id: number;
  batch_id: number;
  amount: number;
  reference: string;
  transaction_date: string;
  description: string;
  raw_data: Record<string, string> | null;
  matched_payment_id: number | null;
  matched_payment?: Payment | null;
  status: string;
  created_at: string;
}

export interface ReconciliationEscalation {
  id: number;
  payment_id: number | null;
  payment?: Payment | null;
  bank_transaction_id: number | null;
  bank_transaction?: BankTransaction | null;
  reason: string;
  status: string;
  resolved_by: number | null;
  resolver?: User | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
}

export interface EscalationPaginatedResponse {
  data: ReconciliationEscalation[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export type ExpenseStatus = "unpaid" | "partially_paid" | "paid";

export interface ExpenseCategory {
  id: number;
  name: string;
  code: string;
  parent_id: number | null;
  sort_order: number;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExpenseVendor {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: number;
  expense_category_id: number;
  vendor_id: number | null;
  description: string;
  amount: number;
  invoice_number: string | null;
  status: ExpenseStatus;
  expense_date: string;
  created_by: number | null;
  category?: ExpenseCategory;
  vendor?: ExpenseVendor | null;
  creator?: User;
  created_at: string;
  updated_at: string;
}

export interface ExpensePaginatedResponse {
  data: Expense[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface ExpenseCategoryPaginatedResponse {
  data: ExpenseCategory[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface VendorPaginatedResponse {
  data: ExpenseVendor[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

/** In-house staff (payroll). */
export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  employment_type: string;
  gross_salary: number | string;
  bank_account_encrypted?: string | null;
  hired_at: string | null;
  terminated_at: string | null;
  created_at: string;
  updated_at: string;
}

export type PayrollStatus = "draft" | "pending" | "approved" | "paid";

export interface Payroll {
  id: number;
  employee_id: number;
  payroll_period_start: string;
  payroll_period_end: string;
  gross_salary: number | string;
  taxes: number | string;
  deductions: number | string;
  net_salary: number | string;
  pay_date: string | null;
  status: PayrollStatus;
  payslip_document_id: number | null;
  expense_id: number | null;
  created_by: number | null;
  calculation_metadata?: Record<string, unknown> | null;
  approved_by: number | null;
  approved_at: string | null;
  employee?: Employee;
  payslip?: Document | null;
  expense?: Expense | null;
  creator?: User | null;
  approver?: User | null;
  created_at: string;
  updated_at: string;
}

export interface PayrollPaginatedResponse {
  data: Payroll[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface Agency {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  default_worker_count: number | null;
  default_monthly_amount: number | string | null;
  created_at: string;
  updated_at: string;
}

export interface AgencyPaginatedResponse {
  data: Agency[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export type AgencyServiceLine =
  | "security"
  | "cleaning"
  | "maintenance"
  | "other";

export interface AgencyPlacement {
  id: number;
  agency_id: number;
  line_of_work: AgencyServiceLine | string;
  workers_count: number;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
  agency?: Agency;
  created_at: string;
  updated_at: string;
}

export interface AgencyPlacementPaginatedResponse {
  data: AgencyPlacement[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export type AgencyMonthlyPaymentStatus =
  | "draft"
  | "pending"
  | "approved"
  | "paid";

export interface AgencyMonthlyPayment {
  id: number;
  agency_id: number;
  calendar_month: string;
  amount_paid: number | string;
  worker_count: number;
  placement_id: number | null;
  reference: string | null;
  notes: string | null;
  status: AgencyMonthlyPaymentStatus;
  expense_id: number | null;
  pay_date: string | null;
  created_by: number | null;
  generation_metadata?: Record<string, unknown> | null;
  approved_by: number | null;
  approved_at: string | null;
  agency?: Agency;
  placement?: AgencyPlacement | null;
  expense?: Expense | null;
  creator?: User | null;
  approver?: User | null;
  created_at: string;
  updated_at: string;
}

export interface AgencyMonthlyPaymentPaginatedResponse {
  data: AgencyMonthlyPayment[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface EmployeePaginatedResponse {
  data: Employee[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface PayrollTaxBracket {
  id: number;
  min_inclusive: number | string;
  max_inclusive: number | string | null;
  rate_percent: number | string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PayrollSettingsResponse {
  deduction_fixed: number;
  deduction_percent_of_gross: number;
}