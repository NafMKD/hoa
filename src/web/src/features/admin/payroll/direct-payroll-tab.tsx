import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
} from "@tanstack/react-table";
import { useDebounce } from "use-debounce";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { IconPlus } from "@tabler/icons-react";
import { toast } from "sonner";
import type { ApiError } from "@/types/api-error";
import type { Employee, Payroll, PayrollStatus } from "@/types/types";
import { useAuthStore } from "@/stores/auth-store";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  approvePayroll,
  deletePayroll,
  fetchEmployeesAll,
  fetchPayrolls,
  generateDirectPayrolls,
  markPayrollPaid,
  submitPayrollForReview,
  updatePayrollJson,
} from "./lib/payroll";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const ETB = (n: number | string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(
    Number(n)
  );

const round2 = (a: number, b: number, c: number) =>
  Math.round((a - b - c + Number.EPSILON) * 100) / 100;

function canManagePayroll(role: string | undefined) {
  return role === "admin" || role === "accountant";
}

function statusBadgeVariant(
  s: PayrollStatus
): React.ComponentProps<typeof Badge>["variant"] {
  if (s === "paid") return "default";
  if (s === "approved") return "secondary";
  return "outline";
}

function defaultMonthPicker(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function DirectPayrollTab() {
  const user = useAuthStore((s) => s.user);
  const canEdit = canManagePayroll(user?.role);
  const isAdmin = user?.role === "admin";

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [pageCount, setPageCount] = useState(0);
  const [data, setData] = useState<Payroll[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 500);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [employees, setEmployees] = useState<Employee[]>([]);

  const [genOpen, setGenOpen] = useState(false);
  const [genMonth, setGenMonth] = useState(defaultMonthPicker);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [genBusy, setGenBusy] = useState(false);

  const [markRow, setMarkRow] = useState<Payroll | null>(null);
  const [markPayDate, setMarkPayDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [markFile, setMarkFile] = useState<File | null>(null);
  const [markLinkExpense, setMarkLinkExpense] = useState(true);
  const [markSubmitting, setMarkSubmitting] = useState(false);

  const [deleteRow, setDeleteRow] = useState<Payroll | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [editRow, setEditRow] = useState<Payroll | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const page = pagination.pageIndex + 1;
    const res = await fetchPayrolls(
      page.toString(),
      pagination.pageSize.toString(),
      {
        status: statusFilter || undefined,
        search: debouncedSearch.trim() || undefined,
      }
    );
    setData(res.data);
    setPageCount(res.meta.last_page);
    setIsLoading(false);
    setIsInitialLoading(false);
  }, [pagination.pageIndex, pagination.pageSize, statusFilter, debouncedSearch]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    let c = false;
    fetchEmployeesAll()
      .then((list) => {
        if (!c) setEmployees(list);
      })
      .catch(() => {});
    return () => {
      c = true;
    };
  }, [genOpen]);

  const toggleId = (id: number) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(employees.map((e) => e.id)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const runGenerate = async () => {
    if (selectedIds.size === 0) {
      toast.error("Select at least one employee");
      return;
    }
    const [y, m] = genMonth.split("-").map((x) => parseInt(x, 10));
    if (!y || !m) {
      toast.error("Pick a valid month");
      return;
    }
    setGenBusy(true);
    try {
      const created = await generateDirectPayrolls({
        year: y,
        month: m,
        employee_ids: Array.from(selectedIds),
      });
      toast.success(
        created.length
          ? `Created ${created.length} payroll row(s)`
          : "No new rows (may already exist for that period)"
      );
      setGenOpen(false);
      clearSelection();
      await refresh();
    } catch (err) {
      const e = err as ApiError;
      toast.error(
        (e.data as { message?: string })?.message ?? "Could not generate payroll"
      );
    } finally {
      setGenBusy(false);
    }
  };

  const columns = useMemo<ColumnDef<Payroll>[]>(
    () => [
      {
        accessorKey: "employee_id",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Employee" />
        ),
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.employee?.full_name ?? `#${row.original.employee_id}`}
          </span>
        ),
      },
      {
        id: "period",
        header: "Period",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {row.original.payroll_period_start} → {row.original.payroll_period_end}
          </span>
        ),
      },
      {
        accessorKey: "net_salary",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Net" />
        ),
        cell: ({ row }) => <span>{ETB(row.original.net_salary)}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={statusBadgeVariant(row.original.status)}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: "pay_date",
        header: "Pay date",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.pay_date ?? "—"}</span>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const p = row.original;
          if (!canEdit) return null;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {p.status === "draft" && (
                  <>
                    <DropdownMenuItem onClick={() => setEditRow(p)}>
                      Edit amounts / period
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={async () => {
                        try {
                          await submitPayrollForReview(p.id);
                          toast.success("Submitted for review");
                          await refresh();
                        } catch (err) {
                          const e = err as ApiError;
                          toast.error(
                            (e.data as { message?: string })?.message ??
                              "Could not submit"
                          );
                        }
                      }}
                    >
                      Submit for review
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteRow(p)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
                {p.status === "pending" && (
                  <>
                    <DropdownMenuItem onClick={() => setEditRow(p)}>
                      Edit amounts / period
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem
                        onClick={async () => {
                          try {
                            await approvePayroll(p.id);
                            toast.success("Approved");
                            await refresh();
                          } catch (err) {
                            const e = err as ApiError;
                            toast.error(
                              (e.data as { message?: string })?.message ??
                                "Could not approve"
                            );
                          }
                        }}
                      >
                        Approve
                      </DropdownMenuItem>
                    )}
                  </>
                )}
                {p.status === "approved" && (
                  <DropdownMenuItem
                    onClick={() => {
                      setMarkRow(p);
                      setMarkPayDate(new Date().toISOString().slice(0, 10));
                      setMarkFile(null);
                      setMarkLinkExpense(true);
                    }}
                  >
                    Mark paid
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [canEdit, isAdmin, refresh]
  );

  const table = useReactTable({
    data,
    columns,
    pageCount,
    manualPagination: true,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    meta: { isLoading },
  });

  const onConfirmDelete = async () => {
    if (!deleteRow) return;
    setDeleting(true);
    try {
      await deletePayroll(deleteRow.id);
      toast.success("Payroll deleted");
      setDeleteRow(null);
      await refresh();
    } catch (err) {
      const e = err as ApiError;
      toast.error(
        (e.data as { message?: string })?.message ?? "Could not delete payroll"
      );
    } finally {
      setDeleting(false);
    }
  };

  const submitMarkPaid = async () => {
    if (!markRow) return;
    setMarkSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("pay_date", markPayDate);
      fd.append("link_expense", markLinkExpense ? "1" : "0");
      if (markFile) fd.append("payslip", markFile);
      await markPayrollPaid(markRow.id, fd);
      toast.success("Payroll marked paid");
      setMarkRow(null);
      await refresh();
    } catch (err) {
      const e = err as ApiError;
      toast.error(
        (e.data as { message?: string })?.message ?? "Could not mark paid"
      );
    } finally {
      setMarkSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground max-w-xl">
          Gross salary lives on each employee. Generate payroll for a calendar month;
          taxes and deductions use current rules and are snapshotted on each row. Workflow:{" "}
          <span className="font-medium">draft → pending → approved → paid</span>.
        </p>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <Sheet
              open={genOpen}
              onOpenChange={(o) => {
                setGenOpen(o);
                if (o) setGenMonth(defaultMonthPicker());
              }}
            >
              <SheetTrigger asChild>
                <Button className="gap-2">
                  <IconPlus className="h-4 w-4" />
                  Generate payroll
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Generate direct payroll</SheetTitle>
                  <SheetDescription>
                    Creates draft rows for the selected month (first–last day). Employees
                    already having a row for that period are skipped.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <div className="grid gap-1">
                    <Label htmlFor="gen-month">Month</Label>
                    <Input
                      id="gen-month"
                      type="month"
                      value={genMonth}
                      onChange={(e) => setGenMonth(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={selectAll}>
                      Select all
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={clearSelection}>
                      Clear
                    </Button>
                  </div>
                  <ScrollArea className="h-[280px] rounded-md border p-2">
                    <div className="space-y-2 pr-2">
                      {employees.map((emp) => (
                        <label
                          key={emp.id}
                          className="flex items-center gap-2 text-sm cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedIds.has(emp.id)}
                            onCheckedChange={() => toggleId(emp.id)}
                          />
                          <span>
                            {emp.full_name}{" "}
                            <span className="text-muted-foreground">
                              ({ETB(emp.gross_salary)} gross)
                            </span>
                          </span>
                        </label>
                      ))}
                      {employees.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          No employees. Add them under Employees in the sidebar.
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                  <Button
                    type="button"
                    className="w-full"
                    onClick={runGenerate}
                    disabled={genBusy}
                  >
                    {genBusy ? <Spinner className="h-4 w-4" /> : "Generate drafts"}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select
          value={statusFilter || "__all__"}
          onValueChange={(v) => setStatusFilter(v === "__all__" ? "" : v)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="-mx-4 flex-1 overflow-auto px-4 py-1">
        {isInitialLoading ? (
          <DataTableSkeleton
            columnCount={6}
            filterCount={0}
            cellWidths={["10rem", "14rem", "8rem", "8rem", "8rem", "3rem"]}
            shrinkZero
          />
        ) : (
          <DataTable table={table} onChange={setSearch} searchValue={search} />
        )}
      </div>

      <Dialog open={!!editRow} onOpenChange={(o) => !o && setEditRow(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit payroll</DialogTitle>
          </DialogHeader>
          {editRow && (
            <EditPayrollForm
              payroll={editRow}
              onSuccess={() => {
                setEditRow(null);
                void refresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!markRow} onOpenChange={(o) => !o && setMarkRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark payroll paid</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label htmlFor="pay_date">Payment date</Label>
              <Input
                id="pay_date"
                type="date"
                value={markPayDate}
                onChange={(e) => setMarkPayDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="payslip_mp">Payslip (optional)</Label>
              <Input
                id="payslip_mp"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setMarkFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="link_exp"
                checked={markLinkExpense}
                onCheckedChange={(v) => setMarkLinkExpense(!!v)}
              />
              <Label htmlFor="link_exp" className="font-normal cursor-pointer">
                Post to Payroll expense category
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkRow(null)}>
              Cancel
            </Button>
            <Button onClick={submitMarkPaid} disabled={markSubmitting}>
              {markSubmitting ? <Spinner className="h-4 w-4" /> : "Mark paid"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteRow}
        onOpenChange={(o) => !o && setDeleteRow(null)}
        title="Delete this payroll?"
        desc="Only draft payrolls can be deleted."
        handleConfirm={onConfirmDelete}
        isLoading={deleting}
        destructive
        confirmText="Delete"
      />
    </div>
  );
}

function EditPayrollForm({
  payroll,
  onSuccess,
}: {
  payroll: Payroll;
  onSuccess: () => void;
}) {
  const [start, setStart] = useState(payroll.payroll_period_start);
  const [end, setEnd] = useState(payroll.payroll_period_end);
  const [gross, setGross] = useState(String(payroll.gross_salary));
  const [taxes, setTaxes] = useState(String(payroll.taxes));
  const [deductions, setDeductions] = useState(String(payroll.deductions));
  const [net, setNet] = useState(String(payroll.net_salary));
  const [submitting, setSubmitting] = useState(false);

  const syncNet = (g: string, t: string, d: string) => {
    const gg = parseFloat(g) || 0;
    const tt = parseFloat(t) || 0;
    const dd = parseFloat(d) || 0;
    setNet(String(round2(gg, tt, dd)));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updatePayrollJson(payroll.id, {
        payroll_period_start: start,
        payroll_period_end: end,
        gross_salary: parseFloat(gross),
        taxes: parseFloat(taxes),
        deductions: parseFloat(deductions),
        net_salary: parseFloat(net),
      });
      toast.success("Payroll updated");
      onSuccess();
    } catch (err) {
      const er = err as ApiError;
      toast.error(
        (er.data as { message?: string })?.message ?? "Could not update"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-1">
          <Label>Start</Label>
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <Label>End</Label>
          <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>
      <div className="grid gap-1">
        <Label>Gross</Label>
        <Input
          type="number"
          step="0.01"
          value={gross}
          onChange={(e) => {
            const v = e.target.value;
            setGross(v);
            syncNet(v, taxes, deductions);
          }}
        />
      </div>
      <div className="grid gap-1">
        <Label>Taxes</Label>
        <Input
          type="number"
          step="0.01"
          value={taxes}
          onChange={(e) => {
            const v = e.target.value;
            setTaxes(v);
            syncNet(gross, v, deductions);
          }}
        />
      </div>
      <div className="grid gap-1">
        <Label>Deductions</Label>
        <Input
          type="number"
          step="0.01"
          value={deductions}
          onChange={(e) => {
            const v = e.target.value;
            setDeductions(v);
            syncNet(gross, taxes, v);
          }}
        />
      </div>
      <div className="grid gap-1">
        <Label>Net</Label>
        <Input
          type="number"
          step="0.01"
          value={net}
          onChange={(e) => setNet(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? <Spinner className="h-4 w-4" /> : "Save"}
      </Button>
    </form>
  );
}
