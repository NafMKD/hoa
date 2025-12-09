export type UserRole =
  | "admin"
  | "accountant"
  | "secretary"
  | "tenant"
  | "homeowner"
  | "representative";


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