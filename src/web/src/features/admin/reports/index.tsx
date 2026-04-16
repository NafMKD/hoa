import { Main } from "@/components/layout/main";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { fetchBuildings } from "@/features/admin/buildings/lib/buildings";
import type { Building } from "@/types/types";
import type { ApiError } from "@/types/api-error";
import { IconDownload } from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { reportChartFill } from "./lib/chart-colors";
import {
  downloadFinancialReportCsv,
  ETB,
  fetchExpensesByCategory,
  fetchIncomeSummary,
  fetchPayrollAgencies,
  fetchPayrollDirect,
  fetchProfitAndLoss,
  type ExpensesByCategoryData,
  type IncomeSummaryData,
  type PayrollAgencyData,
  type PayrollDirectData,
  type ProfitAndLossData,
} from "./lib/reports";

function defaultDateRange(): { dateFrom: string; dateTo: string } {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 1);
  return {
    dateFrom: from.toISOString().slice(0, 10),
    dateTo: to.toISOString().slice(0, 10),
  };
}

function apiErrorMessage(err: unknown): string {
  const e = err as ApiError;
  const d = e?.data as { message?: string } | undefined;
  return d?.message ?? e?.message ?? "Request failed";
}

export function Reports() {
  const defaults = useMemo(() => defaultDateRange(), []);
  const [dateFrom, setDateFrom] = useState(defaults.dateFrom);
  const [dateTo, setDateTo] = useState(defaults.dateTo);
  const [buildingId, setBuildingId] = useState<string>("");

  const [buildings, setBuildings] = useState<Building[]>([]);

  const [income, setIncome] = useState<IncomeSummaryData | null>(null);
  const [expenses, setExpenses] = useState<ExpensesByCategoryData | null>(null);
  const [direct, setDirect] = useState<PayrollDirectData | null>(null);
  const [agency, setAgency] = useState<PayrollAgencyData | null>(null);
  const [pnl, setPnl] = useState<ProfitAndLossData | null>(null);

  const [loadingTab, setLoadingTab] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetchBuildings("1", "200", "");
        if (!cancelled) setBuildings(res.data ?? []);
      } catch {
        if (!cancelled) setBuildings([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const buildingFilter = buildingId ? parseInt(buildingId, 10) : null;

  const loadIncome = useCallback(async () => {
    setLoadingTab("income");
    setError(null);
    try {
      const data = await fetchIncomeSummary({
        date_from: dateFrom,
        date_to: dateTo,
        building_id: buildingFilter,
      });
      setIncome(data);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoadingTab(null);
    }
  }, [dateFrom, dateTo, buildingFilter]);

  const loadExpenses = useCallback(async () => {
    setLoadingTab("expenses");
    setError(null);
    try {
      const data = await fetchExpensesByCategory({
        date_from: dateFrom,
        date_to: dateTo,
      });
      setExpenses(data);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoadingTab(null);
    }
  }, [dateFrom, dateTo]);

  const loadDirect = useCallback(async () => {
    setLoadingTab("direct");
    setError(null);
    try {
      const data = await fetchPayrollDirect({
        date_from: dateFrom,
        date_to: dateTo,
      });
      setDirect(data);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoadingTab(null);
    }
  }, [dateFrom, dateTo]);

  const loadAgency = useCallback(async () => {
    setLoadingTab("agency");
    setError(null);
    try {
      const data = await fetchPayrollAgencies({
        date_from: dateFrom,
        date_to: dateTo,
      });
      setAgency(data);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoadingTab(null);
    }
  }, [dateFrom, dateTo]);

  const loadPnl = useCallback(async () => {
    setLoadingTab("pnl");
    setError(null);
    try {
      const data = await fetchProfitAndLoss({
        date_from: dateFrom,
        date_to: dateTo,
        building_id: buildingFilter,
      });
      setPnl(data);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoadingTab(null);
    }
  }, [dateFrom, dateTo, buildingFilter]);

  const incomeChartData = useMemo(() => {
    if (!income?.by_building?.length) return [];
    return income.by_building.map((b) => ({
      name:
        b.building_name.length > 16
          ? `${b.building_name.slice(0, 14)}…`
          : b.building_name,
      amount: b.total_amount,
    }));
  }, [income]);

  const expenseChartData = useMemo(() => {
    if (!expenses?.by_category?.length) return [];
    return expenses.by_category.map((c) => ({
      name:
        c.category_name.length > 16
          ? `${c.category_name.slice(0, 14)}…`
          : c.category_name,
      amount: c.total_amount,
    }));
  }, [expenses]);

  return (
    <Main>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Financial reports</h2>
        <p className="text-muted-foreground">
          Read-only summaries for income (confirmed payments), expenses, payroll, and agency
          monthly payouts. Dates use the Gregorian calendar (stored values); export to CSV for
          offline analysis.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Report period</CardTitle>
          <CardDescription>
            Choose a date range. Income and P&amp;L can optionally filter by building (via
            invoice unit).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label htmlFor="rep-from">From</Label>
            <Input
              id="rep-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rep-to">To</Label>
            <Input
              id="rep-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div className="space-y-2 min-w-[200px]">
            <Label>Building (optional)</Label>
            <Select value={buildingId || "__all"} onValueChange={(v) => setBuildingId(v === "__all" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="All buildings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All buildings</SelectItem>
                {buildings.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Tabs defaultValue="income" className="gap-6">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expenses">Expenses by category</TabsTrigger>
          <TabsTrigger value="direct">Direct payroll</TabsTrigger>
          <TabsTrigger value="agency">Agency payroll</TabsTrigger>
          <TabsTrigger value="pnl">P&amp;L</TabsTrigger>
        </TabsList>

        <TabsContent value="income" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void loadIncome()} disabled={loadingTab === "income"}>
              {loadingTab === "income" ? <Spinner className="size-4" /> : null}
              Run report
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                void downloadFinancialReportCsv({
                  report: "income-summary",
                  date_from: dateFrom,
                  date_to: dateTo,
                  building_id: buildingFilter,
                })
              }
            >
              <IconDownload className="size-4 mr-1" />
              CSV
            </Button>
          </div>
          {income ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Confirmed payment total
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold">{ETB(income.totals.amount)}</p>
                    <p className="text-sm text-muted-foreground">
                      {income.totals.payment_count} payment(s) · {income.basis} basis
                    </p>
                  </CardContent>
                </Card>
              </div>
              {incomeChartData.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">By building</CardTitle>
                    <CardDescription>
                      Confirmed payment amounts grouped by unit building
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={incomeChartData} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                          stroke="var(--border)"
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                          stroke="var(--border)"
                          tickLine={false}
                          tickFormatter={(v) =>
                            v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
                          }
                        />
                        <Tooltip
                          formatter={(v: number) => ETB(v)}
                          contentStyle={{
                            background: "var(--card)",
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                          }}
                          labelStyle={{ color: "var(--foreground)" }}
                        />
                        <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={56}>
                          {incomeChartData.map((_, i) => (
                            <Cell key={`income-${i}`} fill={reportChartFill(i)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              ) : null}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Detail</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Building</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Payments</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {income.by_building.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-muted-foreground">
                            No confirmed payments in this period.
                          </TableCell>
                        </TableRow>
                      ) : (
                        income.by_building.map((r) => (
                          <TableRow key={r.building_id}>
                            <TableCell>{r.building_name}</TableCell>
                            <TableCell className="text-right">{ETB(r.total_amount)}</TableCell>
                            <TableCell className="text-right">{r.payment_count}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Run the report to load data.</p>
          )}
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void loadExpenses()} disabled={loadingTab === "expenses"}>
              {loadingTab === "expenses" ? <Spinner className="size-4" /> : null}
              Run report
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                void downloadFinancialReportCsv({
                  report: "expenses-by-category",
                  date_from: dateFrom,
                  date_to: dateTo,
                })
              }
            >
              <IconDownload className="size-4 mr-1" />
              CSV
            </Button>
          </div>
          {expenses ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total expenses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold">{ETB(expenses.totals.total_amount)}</p>
                    <p className="text-sm text-muted-foreground">
                      {expenses.totals.line_count} line(s) · {expenses.basis} basis
                    </p>
                  </CardContent>
                </Card>
              </div>
              {expenseChartData.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">By category</CardTitle>
                    <CardDescription>Expense amounts by category for the selected period</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={expenseChartData} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                          stroke="var(--border)"
                          tickLine={false}
                          interval={0}
                          angle={-28}
                          textAnchor="end"
                          height={56}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                          stroke="var(--border)"
                          tickLine={false}
                          tickFormatter={(v) =>
                            v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
                          }
                        />
                        <Tooltip
                          formatter={(v: number) => ETB(v)}
                          contentStyle={{
                            background: "var(--card)",
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                          }}
                          labelStyle={{ color: "var(--foreground)" }}
                        />
                        <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={48}>
                          {expenseChartData.map((_, i) => (
                            <Cell key={`exp-${i}`} fill={reportChartFill(i)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              ) : null}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Detail</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead className="text-right">Lines</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.by_category.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-muted-foreground">
                            No expenses in this period.
                          </TableCell>
                        </TableRow>
                      ) : (
                        expenses.by_category.map((r) => (
                          <TableRow key={r.expense_category_id}>
                            <TableCell>{r.category_name}</TableCell>
                            <TableCell>{r.category_code}</TableCell>
                            <TableCell className="text-right">{r.line_count}</TableCell>
                            <TableCell className="text-right">{ETB(r.total_amount)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Run the report to load data.</p>
          )}
        </TabsContent>

        <TabsContent value="direct" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void loadDirect()} disabled={loadingTab === "direct"}>
              {loadingTab === "direct" ? <Spinner className="size-4" /> : null}
              Run report
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                void downloadFinancialReportCsv({
                  report: "payroll-direct",
                  date_from: dateFrom,
                  date_to: dateTo,
                })
              }
            >
              <IconDownload className="size-4 mr-1" />
              CSV
            </Button>
          </div>
          {direct ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryMini label="Gross" value={ETB(direct.totals.gross_salary)} />
                <SummaryMini label="Taxes" value={ETB(direct.totals.taxes)} />
                <SummaryMini label="Deductions" value={ETB(direct.totals.deductions)} />
                <SummaryMini label="Net" value={ETB(direct.totals.net_salary)} />
              </div>
              <p className="text-sm text-muted-foreground">
                {direct.totals.payroll_count} payroll row(s) · {direct.basis}
              </p>
              <Card>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Net</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {direct.by_employee.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-muted-foreground">
                            No payroll rows overlapping this period.
                          </TableCell>
                        </TableRow>
                      ) : (
                        direct.by_employee.map((r) => (
                          <TableRow key={r.payroll_id}>
                            <TableCell>{r.employee_name ?? `#${r.employee_id}`}</TableCell>
                            <TableCell>{r.status}</TableCell>
                            <TableCell className="text-right">{ETB(r.net_salary)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Run the report to load data.</p>
          )}
        </TabsContent>

        <TabsContent value="agency" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void loadAgency()} disabled={loadingTab === "agency"}>
              {loadingTab === "agency" ? <Spinner className="size-4" /> : null}
              Run report
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                void downloadFinancialReportCsv({
                  report: "payroll-agencies",
                  date_from: dateFrom,
                  date_to: dateTo,
                })
              }
            >
              <IconDownload className="size-4 mr-1" />
              CSV
            </Button>
          </div>
          {agency ? (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <SummaryMini label="Amount paid" value={ETB(agency.totals.amount_paid)} />
                <SummaryMini label="Workers (sum)" value={String(agency.totals.worker_count)} />
                <SummaryMini label="Rows" value={String(agency.totals.payment_count)} />
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">By agency</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agency</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Workers</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agency.by_agency.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-muted-foreground">
                            No agency monthly payments in this period.
                          </TableCell>
                        </TableRow>
                      ) : (
                        agency.by_agency.map((r) => (
                          <TableRow key={r.agency_id}>
                            <TableCell>{r.agency_name}</TableCell>
                            <TableCell className="text-right">
                              {ETB(r.total_amount_paid)}
                            </TableCell>
                            <TableCell className="text-right">{r.total_worker_count}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">By line of work</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Line</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Workers</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agency.by_line_of_work.map((r) => (
                        <TableRow key={r.line_of_work}>
                          <TableCell>{r.line_of_work}</TableCell>
                          <TableCell className="text-right">
                            {ETB(r.total_amount_paid)}
                          </TableCell>
                          <TableCell className="text-right">{r.total_worker_count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Run the report to load data.</p>
          )}
        </TabsContent>

        <TabsContent value="pnl" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void loadPnl()} disabled={loadingTab === "pnl"}>
              {loadingTab === "pnl" ? <Spinner className="size-4" /> : null}
              Run report
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                void downloadFinancialReportCsv({
                  report: "profit-and-loss",
                  date_from: dateFrom,
                  date_to: dateTo,
                  building_id: buildingFilter,
                })
              }
            >
              <IconDownload className="size-4 mr-1" />
              CSV
            </Button>
          </div>
          {pnl ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total income
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-semibold">{ETB(pnl.totals.total_income)}</p>
                  <p className="text-xs text-muted-foreground">Confirmed payments</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total expenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-semibold">{ETB(pnl.totals.total_expenses)}</p>
                  <p className="text-xs text-muted-foreground">By expense date</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Net</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-semibold">{ETB(pnl.totals.net)}</p>
                  <p className="text-xs text-muted-foreground">{pnl.basis}</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Run the report to load data.</p>
          )}
        </TabsContent>
      </Tabs>
    </Main>
  );
}

function SummaryMini({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
