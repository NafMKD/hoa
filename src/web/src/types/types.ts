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
  phone: string | null;
  email: string;
  role: UserRole;
  status: string;
  owned_units?: UnitResource[];
  rented_units?: UnitResource[];
  leases?: TenantLeaseResource[];
  created_templates?: DocumentTemplateResource[];
  updated_templates?: DocumentTemplateResource[];
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
};

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

export type DocumentTemplateResource = {
  id: string | number;
  title: string;
  name: string;
  description: string | null;
  type: string;
  created_at: string;
  updated_at: string;
};

export type Document = {
  id: string | number;
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
  owner?: User; 
  unit_type: string;
  type_name: string;
  size_m2: number | null;
  status: string;
  ownership_file?: Document; 
  leases?: TenantLeaseResource[]; 
  tenant?: User; 
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
