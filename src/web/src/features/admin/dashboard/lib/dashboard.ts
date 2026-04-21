import queryClient from "@/QueryClient";
import { fetchBuildings } from "@/features/admin/buildings/lib/buildings";
import { fetchComplaints } from "@/features/admin/complaints/lib/complaints";
import { fetchPayments } from "@/features/admin/payments/lib/payments";
import { fetchPolls } from "@/features/admin/polls/lib/polls";
import {
  ETB,
  fetchProfitAndLoss,
  type ExpensesByCategoryData,
  type IncomeSummaryData,
  type ProfitAndLossData,
} from "@/features/admin/reports/lib/reports";
import { fetchUnits } from "@/features/admin/units/lib/units";
import { fetchUsers } from "@/features/admin/users/lib/users";
import { fetchVehicles } from "@/features/admin/vehicles/lib/vehicles";
import type { ApiError } from "@/types/api-error";
import type {
  BuildingPaginatedResponse,
  Complaint,
  Payment,
  UnitPaginatedResponse,
  User,
  UserPaginatedResponse,
  VehiclePaginatedResponse,
} from "@/types/types";
import { queryOptions, type QueryKey } from "@tanstack/react-query";

export type DashboardRange = {
  dateFrom: string;
  dateTo: string;
  label: string;
};

export type DashboardCount = {
  key: string;
  label: string;
  count: number;
};

export type OverviewDashboardData = {
  range: DashboardRange;
  income: IncomeSummaryData;
  expenses: ExpensesByCategoryData;
  userTotal: number;
  openComplaints: number;
  inProgressComplaints: number;
  openPolls: number;
  draftPolls: number;
  recentPayments: Payment[];
};

export type FinancialDashboardData = {
  range: DashboardRange;
  income: IncomeSummaryData;
  expenses: ExpensesByCategoryData;
  pnl: ProfitAndLossData;
  recentPayments: Payment[];
};

export type CommunityDashboardData = {
  users: UserPaginatedResponse;
  units: UnitPaginatedResponse;
  buildings: BuildingPaginatedResponse;
  vehicles: VehiclePaginatedResponse;
  recentUsers: User[];
};

export type OperationsDashboardData = {
  recentComplaints: Complaint[];
  complaintStatusCounts: DashboardCount[];
  pollStatusCounts: DashboardCount[];
  totalComplaints: number;
  openComplaints: number;
  inProgressComplaints: number;
  resolvedComplaints: number;
  closedComplaints: number;
  openPolls: number;
  draftPolls: number;
  closedPolls: number;
};

export const DASHBOARD_STALE_TIME = 5 * 60 * 1000;
export const DASHBOARD_GC_TIME = 30 * 60 * 1000;

const COMMUNITY_SAMPLE_PAGE_SIZE = "1000";

function createDashboardQueryOptions<T>(
  queryKey: QueryKey,
  queryFn: () => Promise<T>
) {
  return queryOptions({
    queryKey,
    queryFn,
    staleTime: DASHBOARD_STALE_TIME,
    gcTime: DASHBOARD_GC_TIME,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function getRelativeDateRange(days: number): DashboardRange {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - Math.max(days - 1, 0));

  return {
    dateFrom: from.toISOString().slice(0, 10),
    dateTo: to.toISOString().slice(0, 10),
    label: `Last ${days} days`,
  };
}

export function formatCurrency(value: number | string): string {
  return ETB(Number(value));
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function titleCaseLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function apiErrorMessage(error: unknown): string {
  const err = error as ApiError;
  const data = err?.data as { message?: string } | undefined;

  return data?.message ?? err?.message ?? "Could not load dashboard data.";
}

export function sortByNewest<T>(
  rows: T[],
  getDate: (row: T) => string | null | undefined
): T[] {
  return rows.slice().sort((a, b) => {
    const aTime = Date.parse(getDate(a) ?? "");
    const bTime = Date.parse(getDate(b) ?? "");

    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
  });
}

export function isSampled(total: number, loadedCount: number): boolean {
  return loadedCount > 0 && loadedCount < total;
}

export function hasAnyCounts(rows: DashboardCount[]): boolean {
  return rows.some((row) => row.count > 0);
}

function profitAndLossQueryOptions(range: DashboardRange) {
  return createDashboardQueryOptions(
    ["dashboard", "reports", "pnl", range.dateFrom, range.dateTo],
    () =>
      fetchProfitAndLoss({
        date_from: range.dateFrom,
        date_to: range.dateTo,
      })
  );
}

function recentPaymentsQueryOptions(limit: number) {
  return createDashboardQueryOptions(
    ["dashboard", "payments", "recent", limit],
    async () => {
      const payments = await fetchPayments("1", String(limit), "", "all");
      return sortByNewest(
        payments.data,
        (payment) => payment.payment_date ?? payment.created_at
      ).slice(0, limit);
    }
  );
}

function userTotalQueryOptions() {
  return createDashboardQueryOptions(["dashboard", "users", "total"], async () => {
    const users = await fetchUsers("1", "1", "");
    return users.meta.total;
  });
}

function complaintCountQueryOptions(status: string) {
  return createDashboardQueryOptions(
    ["dashboard", "complaints", "count", status],
    async () => {
      const complaints = await fetchComplaints("1", "1", "", status, "");
      return complaints.meta.total;
    }
  );
}

function pollCountQueryOptions(status: string) {
  return createDashboardQueryOptions(["dashboard", "polls", "count", status], async () => {
    const polls = await fetchPolls("1", "1", "", status);
    return polls.meta.total;
  });
}

function communityUsersQueryOptions() {
  return createDashboardQueryOptions(
    ["dashboard", "community", "users", COMMUNITY_SAMPLE_PAGE_SIZE],
    () => fetchUsers("1", COMMUNITY_SAMPLE_PAGE_SIZE, "")
  );
}

function communityUnitsQueryOptions() {
  return createDashboardQueryOptions(
    ["dashboard", "community", "units", COMMUNITY_SAMPLE_PAGE_SIZE],
    () => fetchUnits("1", COMMUNITY_SAMPLE_PAGE_SIZE, "")
  );
}

function communityBuildingsCountQueryOptions() {
  return createDashboardQueryOptions(
    ["dashboard", "community", "buildings", "count"],
    () => fetchBuildings("1", "1", "")
  );
}

function communityVehiclesCountQueryOptions() {
  return createDashboardQueryOptions(
    ["dashboard", "community", "vehicles", "count"],
    () => fetchVehicles("1", "1", "")
  );
}

function recentComplaintsQueryOptions(limit: number) {
  return createDashboardQueryOptions(
    ["dashboard", "complaints", "recent", limit],
    async () => {
      const complaints = await fetchComplaints("1", String(limit), "", "", "");
      return sortByNewest(complaints.data, (complaint) => complaint.created_at).slice(
        0,
        limit
      );
    }
  );
}

async function fetchOverviewDashboardData(): Promise<OverviewDashboardData> {
  const range = getRelativeDateRange(30);

  const [
    pnl,
    userTotal,
    openComplaints,
    inProgressComplaints,
    openPolls,
    draftPolls,
    recentPayments,
  ] = await Promise.all([
    queryClient.ensureQueryData(profitAndLossQueryOptions(range)),
    queryClient.ensureQueryData(userTotalQueryOptions()),
    queryClient.ensureQueryData(complaintCountQueryOptions("open")),
    queryClient.ensureQueryData(complaintCountQueryOptions("in_progress")),
    queryClient.ensureQueryData(pollCountQueryOptions("open")),
    queryClient.ensureQueryData(pollCountQueryOptions("draft")),
    queryClient.ensureQueryData(recentPaymentsQueryOptions(5)),
  ]);

  return {
    range,
    income: pnl.income,
    expenses: pnl.expenses,
    userTotal,
    openComplaints,
    inProgressComplaints,
    openPolls,
    draftPolls,
    recentPayments,
  };
}

async function fetchFinancialDashboardData(): Promise<FinancialDashboardData> {
  const range = getRelativeDateRange(90);

  const [pnl, recentPayments] = await Promise.all([
    queryClient.ensureQueryData(profitAndLossQueryOptions(range)),
    queryClient.ensureQueryData(recentPaymentsQueryOptions(8)),
  ]);

  return {
    range,
    income: pnl.income,
    expenses: pnl.expenses,
    pnl,
    recentPayments,
  };
}

async function fetchCommunityDashboardData(): Promise<CommunityDashboardData> {
  const [users, units, buildings, vehicles] = await Promise.all([
    queryClient.ensureQueryData(communityUsersQueryOptions()),
    queryClient.ensureQueryData(communityUnitsQueryOptions()),
    queryClient.ensureQueryData(communityBuildingsCountQueryOptions()),
    queryClient.ensureQueryData(communityVehiclesCountQueryOptions()),
  ]);

  return {
    users,
    units,
    buildings,
    vehicles,
    recentUsers: sortByNewest(users.data, (user) => user.created_at).slice(0, 8),
  };
}

async function fetchOperationsDashboardData(): Promise<OperationsDashboardData> {
  const [
    recentComplaints,
    openComplaints,
    inProgressComplaints,
    resolvedComplaints,
    closedComplaints,
    openPolls,
    draftPolls,
    closedPolls,
  ] = await Promise.all([
    queryClient.ensureQueryData(recentComplaintsQueryOptions(8)),
    queryClient.ensureQueryData(complaintCountQueryOptions("open")),
    queryClient.ensureQueryData(complaintCountQueryOptions("in_progress")),
    queryClient.ensureQueryData(complaintCountQueryOptions("resolved")),
    queryClient.ensureQueryData(complaintCountQueryOptions("closed")),
    queryClient.ensureQueryData(pollCountQueryOptions("open")),
    queryClient.ensureQueryData(pollCountQueryOptions("draft")),
    queryClient.ensureQueryData(pollCountQueryOptions("closed")),
  ]);

  const complaintStatusCounts = [
    { key: "open", label: "Open", count: openComplaints },
    { key: "in_progress", label: "In progress", count: inProgressComplaints },
    { key: "resolved", label: "Resolved", count: resolvedComplaints },
    { key: "closed", label: "Closed", count: closedComplaints },
  ];

  const pollStatusCounts = [
    { key: "open", label: "Open", count: openPolls },
    { key: "draft", label: "Draft", count: draftPolls },
    { key: "closed", label: "Closed", count: closedPolls },
  ];

  return {
    recentComplaints,
    complaintStatusCounts,
    pollStatusCounts,
    totalComplaints: complaintStatusCounts.reduce(
      (sum, status) => sum + status.count,
      0
    ),
    openComplaints,
    inProgressComplaints,
    resolvedComplaints,
    closedComplaints,
    openPolls,
    draftPolls,
    closedPolls,
  };
}

export function overviewDashboardQueryOptions() {
  return createDashboardQueryOptions(["dashboard", "tab", "overview"], () =>
    fetchOverviewDashboardData()
  );
}

export function financialDashboardQueryOptions() {
  return createDashboardQueryOptions(["dashboard", "tab", "financials"], () =>
    fetchFinancialDashboardData()
  );
}

export function communityDashboardQueryOptions() {
  return createDashboardQueryOptions(["dashboard", "tab", "community"], () =>
    fetchCommunityDashboardData()
  );
}

export function operationsDashboardQueryOptions() {
  return createDashboardQueryOptions(["dashboard", "tab", "operations"], () =>
    fetchOperationsDashboardData()
  );
}
