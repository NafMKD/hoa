import api, { handleApi } from "@/lib/api";
import type {
  Agency,
  AgencyMonthlyPayment,
  AgencyMonthlyPaymentPaginatedResponse,
  AgencyPaginatedResponse,
  AgencyPlacement,
  AgencyPlacementPaginatedResponse,
  Employee,
  EmployeePaginatedResponse,
  Payroll,
  PayrollPaginatedResponse,
  PayrollSettingsResponse,
  PayrollTaxBracket,
} from "@/types/types";

/** Laravel JsonResource often wraps single records as `{ data: T }`. */
function unwrapResource<T>(body: unknown): T {
  if (
    body &&
    typeof body === "object" &&
    "data" in body &&
    (body as { data: unknown }).data != null &&
    typeof (body as { data: unknown }).data === "object" &&
    !Array.isArray((body as { data: unknown }).data)
  ) {
    return (body as { data: T }).data;
  }
  return body as T;
}

/**
 * Laravel collection / Resource::collection: `{ data: T[] }`, or a raw array.
 * Some stacks nest pagination as `{ data: { data: T[] } }`.
 */
export function parseJsonList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.data)) return o.data as T[];
    const inner = o.data;
    if (
      inner &&
      typeof inner === "object" &&
      !Array.isArray(inner) &&
      Array.isArray((inner as Record<string, unknown>).data)
    ) {
      return (inner as { data: T[] }).data;
    }
  }
  return [];
}

const paginatedShape = async <T>(
  promise: ReturnType<typeof api.get>,
  perPage: string
): Promise<{
  data: T[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}> => {
  const res = (await handleApi(
    promise as Parameters<typeof handleApi>[0]
  )) as {
    data: T[];
    meta?: {
      current_page: number;
      per_page: number;
      total: number;
      last_page: number;
    };
  };
  return {
    data: Array.isArray(res.data) ? res.data : [],
    meta: {
      current_page: res?.meta?.current_page ?? 1,
      per_page: res?.meta?.per_page ?? parseInt(perPage, 10),
      total: res?.meta?.total ?? 0,
      last_page: res?.meta?.last_page ?? 1,
    },
  };
};

// --- Employees ---

export const fetchEmployeesPaginated = async (
  page: string,
  perPage: string,
  search = ""
): Promise<EmployeePaginatedResponse> => {
  const params = new URLSearchParams({
    page,
    per_page: perPage,
    ...(search && { search }),
  });
  return paginatedShape<Employee>(
    api.get(`/v1/employees?${params}`),
    perPage
  ) as Promise<EmployeePaginatedResponse>;
};

export const fetchEmployeesAll = async (): Promise<Employee[]> => {
  const res = await handleApi<{ data: Employee[] } | Employee[]>(
    api.get("/v1/employees/all")
  );
  if (Array.isArray(res)) return res;
  if (res && typeof res === "object" && "data" in res && Array.isArray(res.data)) {
    return res.data;
  }
  return [];
};

export const createEmployee = async (payload: {
  first_name: string;
  last_name: string;
  role: string;
  employment_type: string;
  gross_salary: number;
  bank_account_encrypted?: string | null;
  hired_at?: string | null;
  terminated_at?: string | null;
}) => {
  const raw = await handleApi(api.post("/v1/employees", payload));
  return unwrapResource<Employee>(raw);
};

export const updateEmployee = async (
  id: number,
  payload: Partial<{
    first_name: string;
    last_name: string;
    role: string;
    employment_type: string;
    gross_salary: number;
    bank_account_encrypted: string | null;
    hired_at: string | null;
    terminated_at: string | null;
  }>
) => {
  const raw = await handleApi(api.put(`/v1/employees/${id}`, payload));
  return unwrapResource<Employee>(raw);
};

export const deleteEmployee = (id: number) =>
  handleApi<{ status: string; message: string }>(api.delete(`/v1/employees/${id}`));

// --- Direct payrolls ---

export const fetchPayrolls = async (
  page: string,
  perPage: string,
  filters: { employee_id?: string; status?: string; search?: string } = {}
): Promise<PayrollPaginatedResponse> => {
  const params = new URLSearchParams({
    page,
    per_page: perPage,
    ...Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== "")
    ),
  });
  return paginatedShape<Payroll>(
    api.get(`/v1/payrolls?${params}`),
    perPage
  ) as Promise<PayrollPaginatedResponse>;
};

export const createPayroll = async (formData: FormData) => {
  const raw = await handleApi(
    api.post("/v1/payrolls", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );
  return unwrapResource<Payroll>(raw);
};

export const updatePayroll = async (
  payrollId: number,
  formData: FormData
) => {
  const raw = await handleApi(
    api.put(`/v1/payrolls/${payrollId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );
  return unwrapResource<Payroll>(raw);
};

export const updatePayrollJson = async (
  payrollId: number,
  payload: Partial<{
    payroll_period_start: string;
    payroll_period_end: string;
    gross_salary: number;
    taxes: number;
    deductions: number;
    net_salary: number;
  }>
) => {
  const raw = await handleApi(api.put(`/v1/payrolls/${payrollId}`, payload));
  return unwrapResource<Payroll>(raw);
};

export const markPayrollPaid = async (payrollId: number, formData: FormData) => {
  const raw = await handleApi(
    api.post(`/v1/payrolls/${payrollId}/mark-paid`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );
  return unwrapResource<Payroll>(raw);
};

export const deletePayroll = (payrollId: number) =>
  handleApi<{ status: string; message: string }>(
    api.delete(`/v1/payrolls/${payrollId}`)
  );

export const generateDirectPayrolls = async (payload: {
  year: number;
  month: number;
  employee_ids: number[];
}) => {
  const raw = await handleApi(api.post("/v1/payrolls/generate-direct", payload));
  const res = raw as { data?: Payroll[] };
  return Array.isArray(res.data) ? res.data : [];
};

export const submitPayrollForReview = async (payrollId: number) => {
  const raw = await handleApi(api.post(`/v1/payrolls/${payrollId}/submit-review`));
  return unwrapResource<Payroll>(raw);
};

export const approvePayroll = async (payrollId: number) => {
  const raw = await handleApi(api.post(`/v1/payrolls/${payrollId}/approve`));
  return unwrapResource<Payroll>(raw);
};

export const fetchPayrollSettings = () =>
  handleApi<PayrollSettingsResponse>(api.get("/v1/payroll-settings"));

export const updatePayrollSettings = (payload: {
  deduction_fixed: number;
  deduction_percent_of_gross: number;
}) => handleApi<PayrollSettingsResponse>(api.put("/v1/payroll-settings", payload));

export const fetchPayrollTaxBrackets = async (): Promise<PayrollTaxBracket[]> => {
  const raw = await handleApi(api.get("/v1/payroll-tax-brackets"));
  return parseJsonList<PayrollTaxBracket>(raw);
};

export const createPayrollTaxBracket = async (payload: {
  min_inclusive: number;
  max_inclusive?: number | null;
  rate_percent: number;
  sort_order?: number;
}) => {
  const raw = await handleApi(api.post("/v1/payroll-tax-brackets", payload));
  return unwrapResource<PayrollTaxBracket>(raw);
};

export const updatePayrollTaxBracket = async (
  id: number,
  payload: Partial<{
    min_inclusive: number;
    max_inclusive: number | null;
    rate_percent: number;
    sort_order: number;
  }>
) => {
  const raw = await handleApi(api.put(`/v1/payroll-tax-brackets/${id}`, payload));
  return unwrapResource<PayrollTaxBracket>(raw);
};

export const deletePayrollTaxBracket = (id: number) =>
  handleApi<{ status: string; message: string }>(
    api.delete(`/v1/payroll-tax-brackets/${id}`)
  );

// --- Agencies ---

export const fetchAgenciesPaginated = async (
  page: string,
  perPage: string,
  search = ""
): Promise<AgencyPaginatedResponse> => {
  const params = new URLSearchParams({
    page,
    per_page: perPage,
    ...(search && { search }),
  });
  return paginatedShape<Agency>(
    api.get(`/v1/agencies?${params}`),
    perPage
  ) as Promise<AgencyPaginatedResponse>;
};

export const fetchAgenciesAll = async (): Promise<Agency[]> => {
  const res = await handleApi<{ data: Agency[] } | Agency[]>(
    api.get("/v1/agencies/all")
  );
  if (Array.isArray(res)) return res;
  if (res && typeof res === "object" && "data" in res && Array.isArray(res.data)) {
    return res.data;
  }
  return [];
};

export const createAgency = async (payload: {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  default_worker_count?: number | null;
  default_monthly_amount?: number | null;
}) => {
  const raw = await handleApi(api.post("/v1/agencies", payload));
  return unwrapResource<Agency>(raw);
};

export const updateAgency = async (
  id: number,
  payload: Partial<{
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    notes: string | null;
    default_worker_count: number | null;
    default_monthly_amount: number | null;
  }>
) => {
  const raw = await handleApi(api.put(`/v1/agencies/${id}`, payload));
  return unwrapResource<Agency>(raw);
};

export const deleteAgency = (id: number) =>
  handleApi<{ status: string; message: string }>(api.delete(`/v1/agencies/${id}`));

// --- Placements ---

export const fetchPlacements = async (
  agencyId: number,
  page: string,
  perPage: string,
  isActive?: boolean
): Promise<AgencyPlacementPaginatedResponse> => {
  const params = new URLSearchParams({
    page,
    per_page: perPage,
    ...(isActive !== undefined && { is_active: String(isActive) }),
  });
  return paginatedShape<AgencyPlacement>(
    api.get(`/v1/agencies/${agencyId}/placements?${params}`),
    perPage
  ) as Promise<AgencyPlacementPaginatedResponse>;
};

export const createPlacement = async (
  agencyId: number,
  payload: {
    line_of_work: string;
    workers_count: number;
    effective_from: string;
    effective_to?: string | null;
    is_active?: boolean;
  }
) => {
  const raw = await handleApi(
    api.post(`/v1/agencies/${agencyId}/placements`, payload)
  );
  return unwrapResource<AgencyPlacement>(raw);
};

export const updatePlacement = async (
  agencyId: number,
  placementId: number,
  payload: Partial<{
    line_of_work: string;
    workers_count: number;
    effective_from: string;
    effective_to: string | null;
    is_active: boolean;
  }>
) => {
  const raw = await handleApi(
    api.put(`/v1/agencies/${agencyId}/placements/${placementId}`, payload)
  );
  return unwrapResource<AgencyPlacement>(raw);
};

export const deletePlacement = (agencyId: number, placementId: number) =>
  handleApi<{ status: string; message: string }>(
    api.delete(`/v1/agencies/${agencyId}/placements/${placementId}`)
  );

// --- Agency monthly payments ---

export const fetchPlacementSuggestions = async (
  calendarMonthFirstDay: string
): Promise<AgencyPlacement[]> => {
  const params = new URLSearchParams({ calendar_month: calendarMonthFirstDay });
  const res = await handleApi<{ data: AgencyPlacement[] }>(
    api.get(`/v1/agency-monthly-payments/suggestions?${params}`)
  );
  return Array.isArray(res.data) ? res.data : [];
};

export const fetchAgencyMonthlyPayments = async (
  page: string,
  perPage: string,
  filters: {
    calendar_month?: string;
    agency_id?: string;
    status?: string;
  } = {}
): Promise<AgencyMonthlyPaymentPaginatedResponse> => {
  const params = new URLSearchParams({
    page,
    per_page: perPage,
    ...Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== "")
    ),
  });
  return paginatedShape<AgencyMonthlyPayment>(
    api.get(`/v1/agency-monthly-payments?${params}`),
    perPage
  ) as Promise<AgencyMonthlyPaymentPaginatedResponse>;
};

export const createAgencyMonthlyPayment = async (payload: {
  agency_id: number;
  calendar_month: string;
  amount_paid: number;
  worker_count: number;
  placement_id?: number | null;
  reference?: string | null;
  notes?: string | null;
  status?: string;
}) => {
  const raw = await handleApi(api.post("/v1/agency-monthly-payments", payload));
  return unwrapResource<AgencyMonthlyPayment>(raw);
};

export const updateAgencyMonthlyPayment = async (
  id: number,
  payload: Partial<{
    amount_paid: number;
    worker_count: number;
    placement_id: number | null;
    reference: string | null;
    notes: string | null;
  }>
) => {
  const raw = await handleApi(api.put(`/v1/agency-monthly-payments/${id}`, payload));
  return unwrapResource<AgencyMonthlyPayment>(raw);
};

export const markAgencyMonthlyPaid = async (
  id: number,
  payload: { pay_date: string; link_expense?: boolean }
) => {
  const raw = await handleApi(
    api.post(`/v1/agency-monthly-payments/${id}/mark-paid`, payload)
  );
  return unwrapResource<AgencyMonthlyPayment>(raw);
};

export const deleteAgencyMonthlyPayment = (id: number) =>
  handleApi<{ status: string; message: string }>(
    api.delete(`/v1/agency-monthly-payments/${id}`)
  );

export const generateAgencyMonthlyPayments = async (calendarMonthFirstDay: string) => {
  const raw = await handleApi(
    api.post("/v1/agency-monthly-payments/generate", {
      calendar_month: calendarMonthFirstDay,
    })
  );
  const res = raw as { data?: AgencyMonthlyPayment[] };
  return Array.isArray(res.data) ? res.data : [];
};

export const submitAgencyMonthlyForReview = async (id: number) => {
  const raw = await handleApi(
    api.post(`/v1/agency-monthly-payments/${id}/submit-review`)
  );
  return unwrapResource<AgencyMonthlyPayment>(raw);
};

export const approveAgencyMonthlyPayment = async (id: number) => {
  const raw = await handleApi(
    api.post(`/v1/agency-monthly-payments/${id}/approve`)
  );
  return unwrapResource<AgencyMonthlyPayment>(raw);
};
