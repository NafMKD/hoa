import api, { handleApi } from "@/lib/api";

const ETB = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(
    Number(n)
  );

export { ETB };

export type FinancialReportPeriod = {
  date_from: string;
  date_to: string;
};

export type IncomeSummaryData = {
  period: FinancialReportPeriod;
  basis: string;
  payment_status: string;
  totals: { amount: number; payment_count: number };
  by_building: Array<{
    building_id: number;
    building_name: string;
    total_amount: number;
    payment_count: number;
  }>;
};

export type ExpensesByCategoryData = {
  period: FinancialReportPeriod;
  basis: string;
  totals: { total_amount: number; line_count: number };
  by_category: Array<{
    expense_category_id: number;
    category_name: string;
    category_code: string;
    line_count: number;
    total_amount: number;
  }>;
};

export type PayrollDirectData = {
  period: FinancialReportPeriod;
  basis: string;
  totals: {
    gross_salary: number;
    taxes: number;
    deductions: number;
    net_salary: number;
    payroll_count: number;
  };
  by_employee: Array<{
    payroll_id: number;
    employee_id: number;
    employee_name: string | null;
    status: string;
    payroll_period_start: string | null;
    payroll_period_end: string | null;
    gross_salary: number;
    taxes: number;
    deductions: number;
    net_salary: number;
  }>;
};

export type PayrollAgencyData = {
  period: FinancialReportPeriod;
  calendar_month_bounds: { first_month: string; last_month: string };
  basis: string;
  totals: {
    amount_paid: number;
    worker_count: number;
    payment_count: number;
  };
  by_agency: Array<{
    agency_id: number;
    agency_name: string;
    total_amount_paid: number;
    total_worker_count: number;
    row_count: number;
  }>;
  by_line_of_work: Array<{
    line_of_work: string;
    total_amount_paid: number;
    total_worker_count: number;
    row_count: number;
  }>;
  by_calendar_month: Array<{
    calendar_month: string;
    total_amount_paid: number;
    total_worker_count: number;
    row_count: number;
  }>;
};

export type ProfitAndLossData = {
  period: FinancialReportPeriod;
  basis: string;
  totals: {
    total_income: number;
    total_expenses: number;
    net: number;
  };
  income: IncomeSummaryData;
  expenses: ExpensesByCategoryData;
};

type ApiEnvelope<T> = { status: string; data: T };

function unwrap<T>(body: unknown): T {
  if (
    body &&
    typeof body === "object" &&
    "data" in body &&
    (body as ApiEnvelope<T>).data !== undefined
  ) {
    return (body as ApiEnvelope<T>).data;
  }
  throw new Error("Unexpected API response shape");
}

export async function fetchIncomeSummary(params: {
  date_from: string;
  date_to: string;
  building_id?: number | null;
}): Promise<IncomeSummaryData> {
  const qs = new URLSearchParams({
    date_from: params.date_from,
    date_to: params.date_to,
  });
  if (params.building_id != null && params.building_id > 0) {
    qs.set("building_id", String(params.building_id));
  }
  const body = await handleApi(
    api.get(`/v1/financial-reports/income-summary?${qs.toString()}`)
  );
  return unwrap<IncomeSummaryData>(body);
}

export async function fetchExpensesByCategory(params: {
  date_from: string;
  date_to: string;
}): Promise<ExpensesByCategoryData> {
  const qs = new URLSearchParams({
    date_from: params.date_from,
    date_to: params.date_to,
  });
  const body = await handleApi(
    api.get(`/v1/financial-reports/expenses-by-category?${qs.toString()}`)
  );
  return unwrap<ExpensesByCategoryData>(body);
}

export async function fetchPayrollDirect(params: {
  date_from: string;
  date_to: string;
}): Promise<PayrollDirectData> {
  const qs = new URLSearchParams({
    date_from: params.date_from,
    date_to: params.date_to,
  });
  const body = await handleApi(
    api.get(`/v1/financial-reports/payroll-direct?${qs.toString()}`)
  );
  return unwrap<PayrollDirectData>(body);
}

export async function fetchPayrollAgencies(params: {
  date_from: string;
  date_to: string;
}): Promise<PayrollAgencyData> {
  const qs = new URLSearchParams({
    date_from: params.date_from,
    date_to: params.date_to,
  });
  const body = await handleApi(
    api.get(`/v1/financial-reports/payroll-agencies?${qs.toString()}`)
  );
  return unwrap<PayrollAgencyData>(body);
}

export async function fetchProfitAndLoss(params: {
  date_from: string;
  date_to: string;
  building_id?: number | null;
}): Promise<ProfitAndLossData> {
  const qs = new URLSearchParams({
    date_from: params.date_from,
    date_to: params.date_to,
  });
  if (params.building_id != null && params.building_id > 0) {
    qs.set("building_id", String(params.building_id));
  }
  const body = await handleApi(
    api.get(`/v1/financial-reports/profit-and-loss?${qs.toString()}`)
  );
  return unwrap<ProfitAndLossData>(body);
}

export type FinancialReportExport =
  | "income-summary"
  | "expenses-by-category"
  | "payroll-direct"
  | "payroll-agencies"
  | "profit-and-loss";

export async function downloadFinancialReportCsv(params: {
  report: FinancialReportExport;
  date_from: string;
  date_to: string;
  building_id?: number | null;
}): Promise<void> {
  const qs = new URLSearchParams({
    report: params.report,
    date_from: params.date_from,
    date_to: params.date_to,
  });
  if (params.building_id != null && params.building_id > 0) {
    qs.set("building_id", String(params.building_id));
  }
  const response = await api.get(`/v1/financial-reports/export?${qs.toString()}`, {
    responseType: "blob",
  });
  const blob = new Blob([response.data], {
    type: "text/csv;charset=utf-8",
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `financial-report-${params.report}-${params.date_from}-${params.date_to}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}
