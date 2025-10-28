export type User = {
  id: string | number;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string;
  role: "admin" | "accountant" | "secretary" | "tenant" | "homeowner" | "representative";
  status: string;

//   id_file?: DocumentResource | null;

//   owned_units?: UnitResource[];
//   rented_units?: UnitResource[];

//   leases?: TenantLeaseResource[];
//   created_leases?: TenantLeaseResource[];
//   representative_leases?: TenantLeaseResource[];

//   created_templates?: DocumentTemplateResource[];
//   updated_templates?: DocumentTemplateResource[];

  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
};