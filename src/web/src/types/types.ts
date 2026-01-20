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

export type InvoiceStatus = 'issued' | 'partial' | 'paid' | 'overdue' | 'cancelled';
export type PaymentStatus = 'pending' | 'confirmed' | 'failed' | 'refunded';


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