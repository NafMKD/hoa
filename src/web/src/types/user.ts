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

//   id_file?: DocumentResource | null;

  owned_units?: UnitResource[];
  rented_units?: UnitResource[];

  leases?: TenantLeaseResource[];
//   created_leases?: TenantLeaseResource[];
//   representative_leases?: TenantLeaseResource[];

  created_templates?: DocumentTemplateResource[];
  updated_templates?: DocumentTemplateResource[];

  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
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
  unit_number: string;
  building_name: string;
  property_name: string;
  property_address: string;
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

// export type DocumentResource = {
