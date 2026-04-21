import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardCardFrame, DashboardEmptyState, DashboardErrorState, DashboardMetricCard, DashboardMiniStat, DashboardTabSkeleton } from "./dashboard-ui";
import { useDashboardTabData } from "./use-dashboard-tab-data";
import {
  formatCompactNumber,
  formatCurrency,
  formatDateTime,
  overviewDashboardQueryOptions,
  titleCaseLabel,
} from "../lib/dashboard";
import { reportChartFill } from "@/features/admin/reports/lib/chart-colors";
import { getPaymentStatusColor } from "@/features/admin/payments/lib/payments";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function DashboardOverviewTab() {
  const { data, isLoading, error, reload } = useDashboardTabData(
    overviewDashboardQueryOptions()
  );

  const buildingIncomeData = useMemo(() => {
    if (!data) return [];

    return data.income.by_building
      .slice()
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, 6)
      .map((building) => ({
        name:
          building.building_name.length > 18
            ? `${building.building_name.slice(0, 16)}…`
            : building.building_name,
        amount: building.total_amount,
      }));
  }, [data]);

  if (isLoading) {
    return <DashboardTabSkeleton />;
  }

  if (error || !data) {
    return (
      <DashboardErrorState
        title="Could not load the overview"
        message={error ?? "The overview is unavailable right now."}
        onRetry={reload}
      />
    );
  }

  const netPosition = data.income.totals.amount - data.expenses.totals.total_amount;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          title="Income"
          value={formatCurrency(data.income.totals.amount)}
          description={`${data.range.label} · ${formatCompactNumber(
            data.income.totals.payment_count
          )} payments`}
          tone="gold"
        />
        <DashboardMetricCard
          title="Expenses"
          value={formatCurrency(data.expenses.totals.total_amount)}
          description={`${data.range.label} · ${formatCompactNumber(
            data.expenses.totals.line_count
          )} expense lines`}
          tone="rose"
        />
        <DashboardMetricCard
          title="Users"
          value={formatCompactNumber(data.userTotal)}
          description="Registered people in the system"
          tone="sky"
        />
        <DashboardMetricCard
          title="Open complaints"
          value={formatCompactNumber(data.openComplaints)}
          description={`${formatCompactNumber(
            data.inProgressComplaints
          )} more are in progress`}
          tone="teal"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <DashboardCardFrame
          title="Collections by building"
          description={`${data.range.label} · top buildings by confirmed payments`}
          className="lg:col-span-4"
        >
          {buildingIncomeData.length === 0 ? (
            <DashboardEmptyState
              title="No confirmed payments in this range"
              description="When new collections come in, this building comparison will appear here."
            />
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={buildingIncomeData} margin={{ top: 12, right: 8, left: -12 }}>
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis
                    tickFormatter={(value) => formatCompactNumber(Number(value))}
                    tickLine={false}
                    axisLine={false}
                    width={56}
                  />
                  <Tooltip
                    formatter={(value: number | string) => formatCurrency(value)}
                    cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
                  />
                  <Bar dataKey="amount" radius={[12, 12, 0, 0]}>
                    {buildingIncomeData.map((entry, index) => (
                      <Cell key={entry.name} fill={reportChartFill(index)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </DashboardCardFrame>

        <DashboardCardFrame
          title="Operational pulse"
          description="The items that usually need attention first"
          className="lg:col-span-3"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <DashboardMiniStat
              label="Net position"
              value={formatCurrency(netPosition)}
              tone={netPosition >= 0 ? "teal" : "rose"}
            />
            <DashboardMiniStat
              label="Open polls"
              value={formatCompactNumber(data.openPolls)}
              tone="violet"
            />
            <DashboardMiniStat
              label="Draft polls"
              value={formatCompactNumber(data.draftPolls)}
              tone="gold"
            />
            <DashboardMiniStat
              label="In progress complaints"
              value={formatCompactNumber(data.inProgressComplaints)}
              tone="sky"
            />
          </div>
        </DashboardCardFrame>
      </div>

      <DashboardCardFrame
        title="Recent payments"
        description="Latest payment activity across the community"
      >
        {data.recentPayments.length === 0 ? (
          <DashboardEmptyState
            title="No recent payments yet"
            description="New payment activity will show up here as soon as residents start paying."
          />
        ) : (
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Resident</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      <Link
                        to="/admin/financials/payments/$paymentId"
                        params={{ paymentId: String(payment.id) }}
                        className="text-primary hover:underline"
                      >
                        {payment.invoice?.invoice_number ?? `Payment #${payment.id}`}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {payment.invoice?.user?.full_name ?? "Unknown resident"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {payment.invoice?.unit?.name ?? titleCaseLabel(payment.method)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`capitalize border ${getPaymentStatusColor(
                          payment.status
                        )}`}
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatDateTime(payment.payment_date ?? payment.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DashboardCardFrame>
    </div>
  );
}
