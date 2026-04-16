import api, { handleApi } from "@/lib/api";
import type {
  Expense,
  ExpenseCategory,
  ExpenseCategoryPaginatedResponse,
  ExpensePaginatedResponse,
  ExpenseVendor,
  VendorPaginatedResponse,
} from "@/types/types";

export const fetchExpenses = async (
  page: string,
  perPage: string,
  search = "",
  filters: {
    expense_category_id?: string;
    vendor_id?: string;
    status?: string;
    expense_date_from?: string;
    expense_date_to?: string;
  } = {}
): Promise<ExpensePaginatedResponse> => {
  const params = new URLSearchParams({
    page,
    per_page: perPage,
    ...(search && { search }),
    ...Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== "")
    ),
  });
  const res = await handleApi<ExpensePaginatedResponse>(
    api.get(`/v1/expenses?${params.toString()}`)
  );
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

export const createExpense = (payload: {
  expense_category_id: number;
  vendor_id?: number | null;
  description: string;
  amount: number;
  invoice_number?: string | null;
  status: string;
  expense_date: string;
}) => handleApi<Expense>(api.post("/v1/expenses", payload));

export const updateExpense = (
  expenseId: string | number,
  payload: Partial<{
    expense_category_id: number;
    vendor_id: number | null;
    description: string;
    amount: number;
    invoice_number: string | null;
    status: string;
    expense_date: string;
  }>
) => handleApi<Expense>(api.put(`/v1/expenses/${expenseId}`, payload));

export const deleteExpense = (expenseId: string | number) =>
  handleApi<{ status: string; message: string }>(
    api.delete(`/v1/expenses/${expenseId}`)
  );

export const fetchExpenseCategories = async (
  page: string,
  perPage: string,
  search = ""
): Promise<ExpenseCategoryPaginatedResponse> => {
  const res = await handleApi<ExpenseCategoryPaginatedResponse>(
    api.get(
      `/v1/expense-categories?page=${page}&per_page=${perPage}&search=${encodeURIComponent(search)}`
    )
  );
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

export const fetchExpenseCategoriesActive = async (): Promise<
  ExpenseCategory[]
> => {
  const res = await handleApi<{ data: ExpenseCategory[] }>(
    api.get("/v1/expense-categories/all?is_active=1")
  );
  return res.data ?? [];
};

export const createExpenseCategory = (payload: {
  name: string;
  code: string;
  parent_id?: number | null;
  sort_order?: number;
  is_active?: boolean;
}) => handleApi<ExpenseCategory>(api.post("/v1/expense-categories", payload));

export const updateExpenseCategory = (
  id: number,
  payload: Partial<{
    name: string;
    code: string;
    parent_id: number | null;
    sort_order: number;
    is_active: boolean;
  }>
) =>
  handleApi<ExpenseCategory>(api.put(`/v1/expense-categories/${id}`, payload));

export const deleteExpenseCategory = (id: number) =>
  handleApi<{ status: string; message: string }>(
    api.delete(`/v1/expense-categories/${id}`)
  );

export const fetchVendorsPage = async (
  page: string,
  perPage: string,
  search = ""
): Promise<VendorPaginatedResponse> => {
  const res = await handleApi<VendorPaginatedResponse>(
    api.get(
      `/v1/vendors?page=${page}&per_page=${perPage}&search=${encodeURIComponent(search)}`
    )
  );
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

export const fetchVendorsAll = async (): Promise<ExpenseVendor[]> => {
  const res = await handleApi<{ data: ExpenseVendor[] }>(
    api.get("/v1/vendors/all")
  );
  return res.data ?? [];
};

export const createVendor = (payload: {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}) => handleApi<ExpenseVendor>(api.post("/v1/vendors", payload));

export const updateVendor = (
  id: number,
  payload: Partial<{
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
  }>
) => handleApi<ExpenseVendor>(api.put(`/v1/vendors/${id}`, payload));

export const deleteVendor = (id: number) =>
  handleApi<{ status: string; message: string }>(api.delete(`/v1/vendors/${id}`));

export const getExpenseStatusStyle = (status: string) => {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
    case "partially_paid":
      return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
    case "unpaid":
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
  }
};
