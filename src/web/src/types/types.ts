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
  leases?: TenantLeaseResource[];
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

export type TenantLeaseResource = {
  id: string | number;
  title: string;
  description: string | null;
  lease_number: string;
  property_name: string;
  unit_number: string;
  start_date: string;
  end_date: string;
  status: string;
  rent_amount: number;
  currency: string;
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
  units?: UnitResource[];
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
  building?: IdNamePair; 
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
  currentLease?: TenantLeaseResource;
  leases?: TenantLeaseResource[];
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
  created_by?: User;
  updated_by?: User;
  created_at: string;
  updated_at: string;
}