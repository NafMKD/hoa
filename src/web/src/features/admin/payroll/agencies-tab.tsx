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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { Agency, AgencyPlacement, AgencyServiceLine } from "@/types/types";
import { useAuthStore } from "@/stores/auth-store";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  createAgency,
  createPlacement,
  deleteAgency,
  deletePlacement,
  fetchAgenciesPaginated,
  fetchPlacements,
  updateAgency,
  updatePlacement,
} from "./lib/payroll";
import { ScrollArea } from "@/components/ui/scroll-area";

const SERVICE_LINES: AgencyServiceLine[] = [
  "security",
  "cleaning",
  "maintenance",
  "other",
];

function lineLabel(code: string) {
  return code.charAt(0).toUpperCase() + code.slice(1);
}

function canEditAgency(role: string | undefined) {
  return role === "admin" || role === "accountant";
}

export function AgenciesTab() {
  const user = useAuthStore((s) => s.user);
  const canEdit = canEditAgency(user?.role);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [pageCount, setPageCount] = useState(0);
  const [data, setData] = useState<Agency[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 500);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [editAgency, setEditAgency] = useState<Agency | null>(null);
  const [deleteAgencyRow, setDeleteAgencyRow] = useState<Agency | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [placementAgency, setPlacementAgency] = useState<Agency | null>(null);
  const [placements, setPlacements] = useState<AgencyPlacement[]>([]);
  const [placementsLoading, setPlacementsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setTableLoading(true);
    const page = pagination.pageIndex + 1;
    const res = await fetchAgenciesPaginated(
      page.toString(),
      pagination.pageSize.toString(),
      debouncedSearch
    );
    setData(res.data);
    setPageCount(res.meta.last_page);
    setTableLoading(false);
    setLoading(false);
  }, [pagination.pageIndex, pagination.pageSize, debouncedSearch]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const loadPlacements = useCallback(async (agency: Agency) => {
    setPlacementsLoading(true);
    try {
      const res = await fetchPlacements(agency.id, "1", "100");
      setPlacements(res.data);
    } catch {
      toast.error("Could not load placements");
      setPlacements([]);
    } finally {
      setPlacementsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (placementAgency) void loadPlacements(placementAgency);
  }, [placementAgency, loadPlacements]);

  const columns = useMemo<ColumnDef<Agency>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Agency" />
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.phone ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground truncate max-w-[180px] block">
            {row.original.email ?? "—"}
          </span>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const a = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setPlacementAgency(a)}>
                  Placements
                </DropdownMenuItem>
                {canEdit && (
                  <>
                    <DropdownMenuItem onClick={() => setEditAgency(a)}>
                      Edit agency
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteAgencyRow(a)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [canEdit]
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

  const onDeleteAgency = async () => {
    if (!deleteAgencyRow) return;
    setDeleting(true);
    try {
      await deleteAgency(deleteAgencyRow.id);
      toast.success("Agency deleted");
      setDeleteAgencyRow(null);
      await refresh();
    } catch (err) {
      const e = err as ApiError;
      toast.error(
        (e.data as { message?: string })?.message ?? "Could not delete"
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground max-w-xl">
          Third-party staffing companies. Placements define line of work, headcount,
          and the active contract window used for monthly payroll.
        </p>
        {canEdit && (
          <Sheet open={addOpen} onOpenChange={setAddOpen}>
            <SheetTrigger asChild>
              <Button className="gap-2">
                <IconPlus className="h-4 w-4" />
                Add agency
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle>New agency</SheetTitle>
                <SheetDescription>Company contact details for outsourced staff.</SheetDescription>
              </SheetHeader>
              <AgencyForm
                onSuccess={() => {
                  setAddOpen(false);
                  void refresh();
                }}
              />
            </SheetContent>
          </Sheet>
        )}
      </div>

      <div className="-mx-4 flex-1 overflow-auto px-4 py-1">
        {loading ? (
          <DataTableSkeleton
            columnCount={4}
            filterCount={0}
            cellWidths={["14rem", "10rem", "12rem", "3rem"]}
            shrinkZero
          />
        ) : (
          <DataTable table={table} onChange={setSearch} searchValue={search} />
        )}
      </div>

      <Dialog
        open={!!editAgency}
        onOpenChange={(o) => !o && setEditAgency(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit agency</DialogTitle>
          </DialogHeader>
          {editAgency && (
            <AgencyForm
              agency={editAgency}
              onSuccess={() => {
                setEditAgency(null);
                void refresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!placementAgency}
        onOpenChange={(o) => {
          if (!o) setPlacementAgency(null);
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Placements — {placementAgency?.name}
            </DialogTitle>
          </DialogHeader>
          {placementAgency && (
            <PlacementsPanel
              agency={placementAgency}
              canEdit={canEdit}
              placements={placements}
              loading={placementsLoading}
              onRefresh={() => loadPlacements(placementAgency)}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteAgencyRow}
        onOpenChange={(o) => !o && setDeleteAgencyRow(null)}
        title="Delete this agency?"
        desc="Placements must be removed first if they block deletion."
        handleConfirm={onDeleteAgency}
        isLoading={deleting}
        destructive
        confirmText="Delete"
      />
    </div>
  );
}

function AgencyForm({
  agency,
  onSuccess,
}: {
  agency?: Agency;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(agency?.name ?? "");
  const [phone, setPhone] = useState(agency?.phone ?? "");
  const [email, setEmail] = useState(agency?.email ?? "");
  const [address, setAddress] = useState(agency?.address ?? "");
  const [notes, setNotes] = useState(agency?.notes ?? "");
  const [defaultWorkers, setDefaultWorkers] = useState(
    agency?.default_worker_count != null ? String(agency.default_worker_count) : ""
  );
  const [defaultAmount, setDefaultAmount] = useState(
    agency?.default_monthly_amount != null ? String(agency.default_monthly_amount) : ""
  );
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (agency) {
        await updateAgency(agency.id, {
          name,
          phone: phone || null,
          email: email || null,
          address: address || null,
          notes: notes || null,
          default_worker_count: defaultWorkers ? parseInt(defaultWorkers, 10) : null,
          default_monthly_amount: defaultAmount ? parseFloat(defaultAmount) : null,
        });
        toast.success("Agency updated");
      } else {
        await createAgency({
          name,
          phone: phone || null,
          email: email || null,
          address: address || null,
          notes: notes || null,
          default_worker_count: defaultWorkers ? parseInt(defaultWorkers, 10) : null,
          default_monthly_amount: defaultAmount ? parseFloat(defaultAmount) : null,
        });
        toast.success("Agency created");
      }
      onSuccess();
    } catch (err) {
      const e = err as ApiError;
      toast.error(
        (e.data as { message?: string })?.message ?? "Could not save"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="mt-4 grid gap-3">
      <div className="grid gap-2">
        <Label>Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="grid gap-2">
        <Label>Phone</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label>Email</Label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label>Address</Label>
        <Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} />
      </div>
      <div className="grid gap-2">
        <Label>Notes</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-1">
          <Label className="text-xs">Default workers (monthly gen.)</Label>
          <Input
            type="number"
            min={1}
            value={defaultWorkers}
            onChange={(e) => setDefaultWorkers(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">Default monthly amount (ETB)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={defaultAmount}
            onChange={(e) => setDefaultAmount(e.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>
      <Button type="submit" disabled={busy}>
        {busy ? <Spinner className="h-4 w-4" /> : agency ? "Save" : "Create"}
      </Button>
    </form>
  );
}

function PlacementsPanel({
  agency,
  canEdit,
  placements,
  loading,
  onRefresh,
}: {
  agency: Agency;
  canEdit: boolean;
  placements: AgencyPlacement[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editP, setEditP] = useState<AgencyPlacement | null>(null);
  const [delP, setDelP] = useState<AgencyPlacement | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="flex flex-col gap-3 min-h-0 flex-1">
      {canEdit && (
        <div className="flex justify-end">
          <Button size="sm" className="gap-1" onClick={() => setAddOpen(true)}>
            <IconPlus className="h-4 w-4" />
            Add placement
          </Button>
        </div>
      )}
      <ScrollArea className="h-[min(420px,50vh)] border rounded-md">
        {loading ? (
          <div className="p-6 flex justify-center">
            <Spinner className="h-8 w-8" />
          </div>
        ) : placements.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No placements yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr className="text-left border-b">
                <th className="p-2">Line</th>
                <th className="p-2">Workers</th>
                <th className="p-2">Effective</th>
                <th className="p-2">Active</th>
                <th className="p-2 w-8" />
              </tr>
            </thead>
            <tbody>
              {placements.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="p-2">{lineLabel(p.line_of_work)}</td>
                  <td className="p-2">{p.workers_count}</td>
                  <td className="p-2 whitespace-nowrap text-muted-foreground">
                    {p.effective_from}
                    {p.effective_to ? ` → ${p.effective_to}` : " → open"}
                  </td>
                  <td className="p-2">
                    <Badge variant={p.is_active ? "default" : "secondary"}>
                      {p.is_active ? "yes" : "no"}
                    </Badge>
                  </td>
                  <td className="p-2">
                    {canEdit && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditP(p)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDelP(p)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ScrollArea>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New placement</DialogTitle>
          </DialogHeader>
          <PlacementForm
            agencyId={agency.id}
            onSuccess={() => {
              setAddOpen(false);
              onRefresh();
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editP} onOpenChange={(o) => !o && setEditP(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit placement</DialogTitle>
          </DialogHeader>
          {editP && (
            <PlacementForm
              agencyId={agency.id}
              placement={editP}
              onSuccess={() => {
                setEditP(null);
                onRefresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!delP}
        onOpenChange={(o) => !o && setDelP(null)}
        title="Delete placement?"
        desc="Monthly payments referencing this placement may need review."
        handleConfirm={async () => {
          if (!delP) return;
          setBusy(true);
          try {
            await deletePlacement(agency.id, delP.id);
            toast.success("Placement deleted");
            setDelP(null);
            onRefresh();
          } catch (err) {
            const e = err as ApiError;
            toast.error(
              (e.data as { message?: string })?.message ?? "Could not delete"
            );
          } finally {
            setBusy(false);
          }
        }}
        isLoading={busy}
        destructive
        confirmText="Delete"
      />
    </div>
  );
}

function PlacementForm({
  agencyId,
  placement,
  onSuccess,
}: {
  agencyId: number;
  placement?: AgencyPlacement;
  onSuccess: () => void;
}) {
  const [line, setLine] = useState<AgencyServiceLine>(
    (placement?.line_of_work as AgencyServiceLine) ?? "security"
  );
  const [workers, setWorkers] = useState(String(placement?.workers_count ?? 1));
  const [from, setFrom] = useState(placement?.effective_from ?? "");
  const [to, setTo] = useState(placement?.effective_to ?? "");
  const [active, setActive] = useState(placement?.is_active ?? true);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (placement) {
        await updatePlacement(agencyId, placement.id, {
          line_of_work: line,
          workers_count: parseInt(workers, 10),
          effective_from: from,
          effective_to: to || null,
          is_active: active,
        });
        toast.success("Placement updated");
      } else {
        await createPlacement(agencyId, {
          line_of_work: line,
          workers_count: parseInt(workers, 10),
          effective_from: from,
          effective_to: to || null,
          is_active: active,
        });
        toast.success("Placement created");
      }
      onSuccess();
    } catch (err) {
      const e = err as ApiError;
      toast.error(
        (e.data as { message?: string })?.message ?? "Could not save"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <div className="grid gap-2">
        <Label>Line of work</Label>
        <Select value={line} onValueChange={(v) => setLine(v as AgencyServiceLine)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SERVICE_LINES.map((l) => (
              <SelectItem key={l} value={l}>
                {lineLabel(l)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label>Workers (headcount)</Label>
        <Input
          type="number"
          min={1}
          value={workers}
          onChange={(e) => setWorkers(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-1">
          <Label>From</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} required />
        </div>
        <div className="grid gap-1">
          <Label>To (optional)</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="pl_active"
          checked={active}
          onCheckedChange={(v) => setActive(!!v)}
        />
        <Label htmlFor="pl_active" className="font-normal cursor-pointer">
          Active
        </Label>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={busy}>
          {busy ? <Spinner className="h-4 w-4" /> : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}
