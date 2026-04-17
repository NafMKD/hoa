import { useCallback, useEffect, useState } from "react";
import { Main } from "@/components/layout/main";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { useDebounce } from "use-debounce";
import type { Complaint } from "@/types/types";
import {
  deleteComplaint,
  fetchComplaints,
} from "./lib/complaints";
import { ComplaintFormDialog } from "./components/complaint-form-dialog";
import {
  IconEdit,
  IconLoader2,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { toast } from "sonner";
import type { ApiError } from "@/types/api-error";
import { useAuthStore } from "@/stores/auth-store";

function statusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "open":
      return "destructive";
    case "in_progress":
      return "default";
    case "resolved":
      return "secondary";
    case "closed":
      return "outline";
    default:
      return "outline";
  }
}

function priorityVariant(
  p: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (p) {
    case "urgent":
    case "high":
      return "destructive";
    case "normal":
      return "default";
    default:
      return "secondary";
  }
}

export function CommunityComplaints() {
  const user = useAuthStore((s) => s.user);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [pageCount, setPageCount] = useState(0);
  const [data, setData] = useState<Complaint[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [debouncedSearch] = useDebounce(search, 400);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<Complaint | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const page = pagination.pageIndex + 1;
    const res = await fetchComplaints(
      String(page),
      String(pagination.pageSize),
      debouncedSearch,
      statusFilter,
      categoryFilter
    );
    setData(res.data);
    setPageCount(res.meta.last_page);
    setIsLoading(false);
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    debouncedSearch,
    statusFilter,
    categoryFilter,
  ]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await deleteComplaint(deleteTarget.id);
      toast.success("Complaint deleted.");
      setDeleteTarget(null);
      await refresh();
    } catch (error) {
      const err = error as ApiError;
      toast.error(
        err.data && typeof err.data === "object" && "message" in err.data
          ? String((err.data as { message?: string }).message)
          : err.message || "Could not delete complaint."
      );
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <Main>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Complaints</h1>
          <p className="text-muted-foreground text-sm">
            Track resident issues, attachments, assignment, and resolution status.
          </p>
        </div>
        <Button
          className="gap-1"
          onClick={() => {
            setEditingComplaint(null);
            setFormOpen(true);
          }}
        >
          <IconPlus className="h-4 w-4" />
          New complaint
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Issues</CardTitle>
          <CardDescription>
            Filter by status and category; newest first.
          </CardDescription>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Input
              placeholder="Search subject or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
            />
            <Select
              value={statusFilter || "__all__"}
              onValueChange={(v) => setStatusFilter(v === "__all__" ? "" : v)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={categoryFilter || "__all__"}
              onValueChange={(v) => setCategoryFilter(v === "__all__" ? "" : v)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All categories</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="noise">Noise</SelectItem>
                <SelectItem value="parking">Parking</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="common_areas">Common areas</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <DataTableSkeleton columnCount={7} withViewOptions={false} />
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Submitter</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-muted-foreground"
                        >
                          No complaints yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium max-w-[200px] truncate">
                            {row.subject}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {row.category}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(row.status)}>
                              {row.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={priorityVariant(row.priority)}>
                              {row.priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {row.submitter?.full_name ?? `#${row.user_id}`}
                          </TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                            {row.created_at
                              ? new Date(row.created_at).toLocaleString()
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() => {
                                setEditingComplaint(row);
                                setFormOpen(true);
                              }}
                            >
                              <IconEdit className="h-4 w-4" />
                              Edit
                            </Button>
                            {user?.role === "admin" ? (
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="gap-1"
                                onClick={() => setDeleteTarget(row)}
                              >
                                <IconTrash className="h-4 w-4" />
                                Delete
                              </Button>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-end gap-2 py-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pagination.pageIndex === 0}
                  onClick={() =>
                    setPagination((p) => ({ ...p, pageIndex: p.pageIndex - 1 }))
                  }
                >
                  Previous
                </Button>
                <span className="text-muted-foreground text-sm">
                  Page {pagination.pageIndex + 1} of {Math.max(pageCount, 1)}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pagination.pageIndex + 1 >= pageCount}
                  onClick={() =>
                    setPagination((p) => ({ ...p, pageIndex: p.pageIndex + 1 }))
                  }
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ComplaintFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditingComplaint(null);
        }}
        complaint={editingComplaint}
        onSaved={refresh}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this complaint?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `“${deleteTarget.subject}” will be removed. This cannot be undone.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDelete} disabled={deleteBusy}>
              {deleteBusy ? (
                <>
                  <IconLoader2 className="mr-1 h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Main>
  );
}
