import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardCardFrame, DashboardEmptyState, DashboardErrorState, DashboardMetricCard, DashboardTabSkeleton } from "./dashboard-ui";
import { useDashboardTabData } from "./use-dashboard-tab-data";
import {
  financialDashboardQueryOptions,
  formatCompactNumber,
  formatCurrency,
  formatDateTime,
  titleCaseLabel,
} from "../lib/dashboard";
import { getPaymentStatusColor } from "@/features/admin/payments/lib/payments";
import { reportChartFill } from "@/features/admin/reports/lib/chart-colors";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function DashboardFinancialsTab() {
  const { data, isLoading, error, reload } = useDashboardTabData(
    financialDashboardQueryOptions()
  );

  const incomeByBuilding = useMemo(() => {
    if (!data) return [];

    return data.income.by_building
      .slice()
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, 7)
      .map((building) => ({
        name:
          building.building_name.length > 18
            ? `${building.building_name.slice(0, 16)}…`
            : building.building_name,
        amount: building.total_amount,
      }));
  }, [data]);

  const expenseBreakdown = useMemo(() => {
    if (!data) return [];

    return data.expenses.by_category
      .slice()
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, 6)
      .map((category) => ({
        name:
          category.category_name.length > 18
            ? `${category.category_name.slice(0, 16)}…`
            : category.category_name,
        amount: category.total_amount,
      }));
  }, [data]);

  if (isLoading) {
    return <DashboardTabSkeleton />;
  }

  if (error || !data) {
    return (
      <DashboardErrorState
        title="Could not load the financial snapshot"
        message={error ?? "The financial snapshot is unavailable right now."}
        onRetry={reload}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          title="Income"
          value={formatCurrency(data.pnl.totals.total_income)}
          description={`${data.range.label} · confirmed collections`}
          tone="gold"
        />
        <DashboardMetricCard
          title="Expenses"
          value={formatCurrency(data.pnl.totals.total_expenses)}
          description={`${data.range.label} · posted expenses`}
          tone="rose"
        />
        <DashboardMetricCard
          title="Net result"
          value={formatCurrency(data.pnl.totals.net)}
          description={
            data.pnl.totals.net >= 0
              ? "Positive operating position"
              : "Operating costs are ahead of collections"
          }
          tone={data.pnl.totals.net >= 0 ? "teal" : "violet"}
        />
        <DashboardMetricCard
          title="Payment count"
          value={formatCompactNumber(data.income.totals.payment_count)}
          description={`${data.range.label} · recent transaction volume`}
          tone="sky"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <DashboardCardFrame
          title="Income by building"
          description={`${data.range.label} · confirmed payments grouped by building`}
          className="lg:col-span-4"
        >
          {incomeByBuilding.length === 0 ? (
            <DashboardEmptyState
              title="No income to chart"
              description="Once confirmed payments exist in this date range, the building comparison will appear here."
            />
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeByBuilding} margin={{ top: 12, right: 8, left: -12 }}>
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
                    {incomeByBuilding.map((entry, index) => (
                      <Cell key={entry.name} fill={reportChartFill(index)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </DashboardCardFrame>

        <DashboardCardFrame
          title="Expense split"
          description="Top categories based on posted expense amounts"
          className="lg:col-span-3"
        >
          {expenseBreakdown.length === 0 ? (
            <DashboardEmptyState
              title="No expenses to break down"
              description="When expense entries are available, category mix will appear here."
            />
          ) : (
            <div className="space-y-4">
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseBreakdown}
                      dataKey="amount"
                      nameKey="name"
                      innerRadius={54}
                      outerRadius={86}
                      paddingAngle={3}
                    >
                      {expenseBreakdown.map((entry, index) => (
                        <Cell key={entry.name} fill={reportChartFill(index)} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number | string) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2">
                {expenseBreakdown.map((category, index) => (
                  <div
                    key={category.name}
                    className="flex items-center justify-between rounded-xl border px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: reportChartFill(index) }}
                      />
                      <span className="text-sm">{category.name}</span>
                    </div>
                    <span className="text-sm font-medium">
                      {formatCurrency(category.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DashboardCardFrame>
      </div>

      <DashboardCardFrame
        title="Payment snapshot"
        description="Recent transactions with invoice and resident context"
      >
        {data.recentPayments.length === 0 ? (
          <DashboardEmptyState
            title="No payments found"
            description="Payment activity for this dashboard snapshot will show up here once transactions start coming in."
          />
        ) : (
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment</TableHead>
                  <TableHead>Resident</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <Link
                          to="/admin/financials/payments/$paymentId"
                          params={{ paymentId: String(payment.id) }}
                          className="font-medium text-primary hover:underline"
                        >
                          Payment #{payment.id}
                        </Link>
                        <Link
                          to="/admin/financials/invoices/$invoiceId"
                          params={{ invoiceId: String(payment.invoice.id) }}
                          className="text-xs text-muted-foreground hover:underline"
                        >
                          {payment.invoice.invoice_number}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {payment.invoice.user?.full_name ?? "Unknown resident"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {payment.invoice.unit?.name ?? "No unit attached"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{titleCaseLabel(payment.method)}</TableCell>
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
