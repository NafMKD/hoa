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
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { IconPlus } from "@tabler/icons-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import type { ApiError } from "@/types/api-error";
import type {
  Agency,
  AgencyMonthlyPayment,
  AgencyMonthlyPaymentStatus,
  AgencyPlacement,
} from "@/types/types";
import { useAuthStore } from "@/stores/auth-store";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  approveAgencyMonthlyPayment,
  createAgencyMonthlyPayment,
  deleteAgencyMonthlyPayment,
  fetchAgencyMonthlyPayments,
  fetchAgenciesAll,
  fetchPlacementSuggestions,
  fetchPlacements,
  generateAgencyMonthlyPayments,
  markAgencyMonthlyPaid,
  submitAgencyMonthlyForReview,
  updateAgencyMonthlyPayment,
} from "./lib/payroll";

const ETB = (n: number | string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(
    Number(n)
  );

function monthPickerToFirstDay(ym: string): string {
  if (!ym || ym.length < 7) {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}-01`;
  }
  const [y, m] = ym.split("-");
  return `${y}-${m}-01`;
}

function defaultMonthPicker(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function canEdit(role: string | undefined) {
  return role === "admin" || role === "accountant";
}

function statusBadgeVariant(
  s: AgencyMonthlyPaymentStatus
): React.ComponentProps<typeof Badge>["variant"] {
  if (s === "paid") return "default";
  if (s === "approved") return "secondary";
  return "outline";
}

export function AgencyMonthlyTab() {
  const user = useAuthStore((s) => s.user);
  const canManage = canEdit(user?.role);
  const isAdmin = user?.role === "admin";

  const [monthPicker, setMonthPicker] = useState(defaultMonthPicker);
  const calendarMonth = useMemo(
    () => monthPickerToFirstDay(monthPicker),
    [monthPicker]
  );

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [pageCount, setPageCount] = useState(0);
  const [data, setData] = useState<AgencyMonthlyPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);

  const [suggestions, setSuggestions] = useState<AgencyPlacement[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [genBusy, setGenBusy] = useState(false);

  const [markRow, setMarkRow] = useState<AgencyMonthlyPayment | null>(null);
  const [markDate, setMarkDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [markLink, setMarkLink] = useState(true);
  const [markBusy, setMarkBusy] = useState(false);

  const [editRow, setEditRow] = useState<AgencyMonthlyPayment | null>(null);
  const [deleteRow, setDeleteRow] = useState<AgencyMonthlyPayment | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const refresh = useCallback(async () => {
    setTableLoading(true);
    const page = pagination.pageIndex + 1;
    const res = await fetchAgencyMonthlyPayments(
      page.toString(),
      String(pagination.pageSize),
      {
        calendar_month: calendarMonth,
        status: statusFilter || undefined,
      }
    );
    setData(res.data);
    setPageCount(res.meta.last_page);
    setTableLoading(false);
    setLoading(false);
  }, [pagination.pageIndex, pagination.pageSize, calendarMonth, statusFilter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    let c = false;
    fetchPlacementSuggestions(calendarMonth)
      .then((list) => {
        if (!c) setSuggestions(list);
      })
      .catch(() => {
        if (!c) setSuggestions([]);
      });
    return () => {
      c = true;
    };
  }, [calendarMonth]);

  const columns = useMemo<ColumnDef<AgencyMonthlyPayment>[]>(
    () => [
      {
        id: "agency",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Agency" />
        ),
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.agency?.name ?? `#${row.original.agency_id}`}
          </span>
        ),
      },
      {
        accessorKey: "amount_paid",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Amount" />
        ),
        cell: ({ row }) => <span>{ETB(row.original.amount_paid)}</span>,
      },
      {
        accessorKey: "worker_count",
        header: "Workers",
        cell: ({ row }) => {
          const p = row.original;
          const pc = p.placement?.workers_count;
          const warn =
            pc != null && pc !== p.worker_count;
          return (
            <span className={warn ? "text-amber-600 font-medium" : ""}>
              {p.worker_count}
              {warn && (
                <span className="ml-1 text-xs">(placement: {pc})</span>
              )}
            </span>
          );
        },
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
          if (!canManage) return null;
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
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={async () => {
                        try {
                          await submitAgencyMonthlyForReview(p.id);
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
                      Edit
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem
                        onClick={async () => {
                          try {
                            await approveAgencyMonthlyPayment(p.id);
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
                      setMarkDate(new Date().toISOString().slice(0, 10));
                      setMarkLink(true);
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
    [canManage, isAdmin, refresh]
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
    meta: { isLoading: tableLoading },
  });

  const submitMarkPaid = async () => {
    if (!markRow) return;
    setMarkBusy(true);
    try {
      await markAgencyMonthlyPaid(markRow.id, {
        pay_date: markDate,
        link_expense: markLink,
      });
      toast.success("Marked paid");
      setMarkRow(null);
      await refresh();
    } catch (err) {
      const e = err as ApiError;
      toast.error(
        (e.data as { message?: string })?.message ?? "Could not mark paid"
      );
    } finally {
      setMarkBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteRow) return;
    setDeleteBusy(true);
    try {
      await deleteAgencyMonthlyPayment(deleteRow.id);
      toast.success("Deleted");
      setDeleteRow(null);
      await refresh();
    } catch (err) {
      const e = err as ApiError;
      toast.error(
        (e.data as { message?: string })?.message ?? "Could not delete"
      );
    } finally {
      setDeleteBusy(false);
    }
  };

  const runGenerate = async () => {
    setGenBusy(true);
    try {
      const created = await generateAgencyMonthlyPayments(calendarMonth);
      toast.success(
        created.length
          ? `Created ${created.length} draft row(s) for active agencies`
          : "No new rows (drafts may already exist for each agency)"
      );
      await refresh();
    } catch (err) {
      const e = err as ApiError;
      toast.error(
        (e.data as { message?: string })?.message ?? "Could not generate"
      );
    } finally {
      setGenBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground max-w-xl">
            Lump-sum payments to agencies for the calendar month. Generate drafts from
            agency defaults, then submit, approve (admin), and mark paid. Only headcounts
            are stored — no individual worker names.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="grid gap-1">
              <Label htmlFor="cal-month">Calendar month</Label>
              <Input
                id="cal-month"
                type="month"
                value={monthPicker}
                onChange={(e) => {
                  setMonthPicker(e.target.value);
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
                className="w-[180px]"
              />
            </div>
            <div className="grid gap-1">
              <Label>Status</Label>
              <Select
                value={statusFilter || "__all__"}
                onValueChange={(v) => {
                  setStatusFilter(v === "__all__" ? "" : v);
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All statuses" />
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
          </div>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              type="button"
              variant="secondary"
              className="gap-2"
              onClick={runGenerate}
              disabled={genBusy}
            >
              {genBusy ? <Spinner className="h-4 w-4" /> : null}
              {genBusy ? "Generating…" : "Generate from agencies"}
            </Button>
            <Sheet open={addOpen} onOpenChange={setAddOpen}>
            <SheetTrigger asChild>
              <Button className="gap-2 shrink-0">
                <IconPlus className="h-4 w-4" />
                Add payment
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Agency monthly payment</SheetTitle>
                <SheetDescription>
                  For {calendarMonth}. One row per agency per month (enforced server-side).
                </SheetDescription>
              </SheetHeader>
              <MonthlyPaymentForm
                calendarMonth={calendarMonth}
                onSuccess={() => {
                  setAddOpen(false);
                  void refresh();
                }}
              />
            </SheetContent>
          </Sheet>
          </div>
        )}
      </div>

      {suggestions.length > 0 && (
        <Alert>
          <AlertTitle>Active placements this month</AlertTitle>
          <AlertDescription>
            {suggestions.length} placement
            {suggestions.length === 1 ? "" : "s"} overlap this month — add amounts
            and headcounts for agencies you pay.
          </AlertDescription>
        </Alert>
      )}

      <div className="-mx-4 flex-1 overflow-auto px-4 py-1">
        {loading ? (
          <DataTableSkeleton
            columnCount={6}
            filterCount={0}
            cellWidths={["12rem", "8rem", "6rem", "6rem", "8rem", "3rem"]}
            shrinkZero
          />
        ) : (
          <DataTable
            table={table}
            onChange={() => {}}
            searchValue=""
          />
        )}
      </div>

      <Dialog open={!!editRow} onOpenChange={(o) => !o && setEditRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit monthly payment</DialogTitle>
          </DialogHeader>
          {editRow && (
            <EditMonthlyForm
              row={editRow}
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
            <DialogTitle>Mark agency payment paid</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label htmlFor="amd_pay">Payment date</Label>
              <Input
                id="amd_pay"
                type="date"
                value={markDate}
                onChange={(e) => setMarkDate(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="amd_link"
                checked={markLink}
                onCheckedChange={(v) => setMarkLink(!!v)}
              />
              <Label htmlFor="amd_link" className="font-normal cursor-pointer">
                Post to Payroll expense category
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkRow(null)}>
              Cancel
            </Button>
            <Button onClick={submitMarkPaid} disabled={markBusy}>
              {markBusy ? <Spinner className="h-4 w-4" /> : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteRow}
        onOpenChange={(o) => !o && setDeleteRow(null)}
        title="Delete this payment row?"
        desc="This removes the monthly payment record."
        handleConfirm={confirmDelete}
        isLoading={deleteBusy}
        destructive
        confirmText="Delete"
      />
    </div>
  );
}

function MonthlyPaymentForm({
  calendarMonth,
  onSuccess,
}: {
  calendarMonth: string;
  onSuccess: () => void;
}) {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [agencyId, setAgencyId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [workers, setWorkers] = useState("1");
  const [placementId, setPlacementId] = useState<string>("__none__");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [placements, setPlacements] = useState<AgencyPlacement[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchAgenciesAll().then(setAgencies).catch(() => {});
  }, []);

  useEffect(() => {
    if (!agencyId) {
      setPlacements([]);
      return;
    }
    fetchPlacements(parseInt(agencyId, 10), "1", "200")
      .then((res) => setPlacements(res.data))
      .catch(() => setPlacements([]));
  }, [agencyId]);

  const selectedPlacement = placements.find(
    (p) => String(p.id) === placementId
  );
  const workersInt = parseInt(workers, 10) || 0;
  const headcountMismatch =
    selectedPlacement != null &&
    selectedPlacement.workers_count !== workersInt;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyId) {
      toast.error("Select an agency");
      return;
    }
    setBusy(true);
    try {
      await createAgencyMonthlyPayment({
        agency_id: parseInt(agencyId, 10),
        calendar_month: calendarMonth,
        amount_paid: parseFloat(amount) || 0,
        worker_count: workersInt,
        placement_id:
          placementId && placementId !== "__none__"
            ? parseInt(placementId, 10)
            : null,
        reference: reference || null,
        notes: notes || null,
      });
      toast.success("Payment recorded");
      onSuccess();
    } catch (err) {
      const er = err as ApiError;
      toast.error(
        (er.data as { message?: string })?.message ?? "Could not save"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="mt-6 grid gap-4">
      <div className="grid gap-2">
        <Label>Agency</Label>
        <Select value={agencyId} onValueChange={setAgencyId}>
          <SelectTrigger>
            <SelectValue placeholder="Select agency" />
          </SelectTrigger>
          <SelectContent>
            {agencies.map((a) => (
              <SelectItem key={a.id} value={String(a.id)}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label>Placement (optional)</Label>
        <Select value={placementId} onValueChange={setPlacementId}>
          <SelectTrigger>
            <SelectValue placeholder="Link to placement" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">None</SelectItem>
            {placements.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.line_of_work} ({p.workers_count} workers)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label>Amount paid (ETB)</Label>
        <Input
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label>Worker count (invoice)</Label>
        <Input
          type="number"
          min={1}
          value={workers}
          onChange={(e) => setWorkers(e.target.value)}
          required
        />
        {headcountMismatch && (
          <p className="text-xs text-amber-600">
            Differs from selected placement headcount ({selectedPlacement?.workers_count}).
            You can still save if billing does not match the contract.
          </p>
        )}
      </div>
      <div className="grid gap-2">
        <Label>Reference / invoice #</Label>
        <Input value={reference} onChange={(e) => setReference(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label>Notes</Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <Button type="submit" disabled={busy}>
        {busy ? <Spinner className="h-4 w-4" /> : "Save"}
      </Button>
    </form>
  );
}

function EditMonthlyForm({
  row,
  onSuccess,
}: {
  row: AgencyMonthlyPayment;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState(String(row.amount_paid));
  const [workers, setWorkers] = useState(String(row.worker_count));
  const [placementId, setPlacementId] = useState(
    row.placement_id ? String(row.placement_id) : "__none__"
  );
  const [reference, setReference] = useState(row.reference ?? "");
  const [notes, setNotes] = useState(row.notes ?? "");
  const [placements, setPlacements] = useState<AgencyPlacement[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchPlacements(row.agency_id, "1", "200")
      .then((res) => setPlacements(res.data))
      .catch(() => setPlacements([]));
  }, [row.agency_id]);

  const selectedPlacement = placements.find(
    (p) => String(p.id) === placementId
  );
  const workersInt = parseInt(workers, 10) || 0;
  const headcountMismatch =
    selectedPlacement != null &&
    selectedPlacement.workers_count !== workersInt;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await updateAgencyMonthlyPayment(row.id, {
        amount_paid: parseFloat(amount) || 0,
        worker_count: workersInt,
        placement_id:
          placementId && placementId !== "__none__"
            ? parseInt(placementId, 10)
            : null,
        reference: reference || null,
        notes: notes || null,
      });
      toast.success("Updated");
      onSuccess();
    } catch (err) {
      const er = err as ApiError;
      toast.error(
        (er.data as { message?: string })?.message ?? "Could not save"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <div className="grid gap-2">
        <Label>Amount</Label>
        <Input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label>Workers</Label>
        <Input
          type="number"
          min={1}
          value={workers}
          onChange={(e) => setWorkers(e.target.value)}
        />
        {headcountMismatch && (
          <p className="text-xs text-amber-600">
            Differs from placement ({selectedPlacement?.workers_count}).
          </p>
        )}
      </div>
      <div className="grid gap-2">
        <Label>Placement</Label>
        <Select value={placementId} onValueChange={setPlacementId}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">None</SelectItem>
            {placements.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.line_of_work}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label>Reference</Label>
        <Input value={reference} onChange={(e) => setReference(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label>Notes</Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <Button type="submit" disabled={busy}>
        {busy ? <Spinner className="h-4 w-4" /> : "Save"}
      </Button>
    </form>
  );
}
