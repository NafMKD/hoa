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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import type { OutgoingLetter } from "@/types/types";
import {
  deleteOutgoingLetter,
  fetchOutgoingLetters,
} from "./lib/outgoing-letters";
import { OutgoingLetterFormDialog } from "./components/outgoing-letter-form-dialog";
import {
  IconEdit,
  IconExternalLink,
  IconEye,
  IconLoader2,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { toast } from "sonner";
import type { ApiError } from "@/types/api-error";
import { useAuthStore } from "@/stores/auth-store";
import { Link } from "@tanstack/react-router";

function formatUnit(row: OutgoingLetter): string {
  const u = row.unit;
  if (!u?.name) return "—";
  const b = u.building?.name;
  return b ? `${u.name} (${b})` : u.name;
}

export function CommunityOutgoingLetters() {
  const user = useAuthStore((s) => s.user);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [pageCount, setPageCount] = useState(0);
  const [data, setData] = useState<OutgoingLetter[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 400);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingLetter, setEditingLetter] = useState<OutgoingLetter | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<OutgoingLetter | null>(
    null
  );
  const [deleteBusy, setDeleteBusy] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const page = pagination.pageIndex + 1;
    const res = await fetchOutgoingLetters(
      String(page),
      String(pagination.pageSize),
      debouncedSearch
    );
    setData(res.data);
    setPageCount(res.meta.last_page);
    setIsLoading(false);
  }, [pagination.pageIndex, pagination.pageSize, debouncedSearch]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await deleteOutgoingLetter(deleteTarget.id);
      toast.success("Letter removed.");
      setDeleteTarget(null);
      await refresh();
    } catch (error) {
      const err = error as ApiError;
      toast.error(
        err.data && typeof err.data === "object" && "message" in err.data
          ? String((err.data as { message?: string }).message)
          : err.message || "Could not delete letter."
      );
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <Main>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Outgoing letters
          </h1>
          <p className="text-muted-foreground text-sm">
            Registry of correspondence with server-assigned numbers and optional
            scans.
          </p>
        </div>
        <Button
          className="gap-1"
          onClick={() => {
            setEditingLetter(null);
            setFormOpen(true);
          }}
        >
          <IconPlus className="h-4 w-4" />
          Register letter
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Archive</CardTitle>
          <CardDescription>
            Search by number, title, recipient, or notes; newest first.
          </CardDescription>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Input
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
            />
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
                      <TableHead>Number</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Recorded by</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right w-[1%] whitespace-nowrap">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-muted-foreground"
                        >
                          No letters yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-mono text-sm whitespace-nowrap">
                            <Link
                              to="/admin/letters/$letterId"
                              params={{ letterId: String(row.id) }}
                              className="text-primary underline-offset-4 hover:underline"
                            >
                              {row.letter_number}
                            </Link>
                          </TableCell>
                          <TableCell className="font-medium max-w-[200px] truncate">
                            <Link
                              to="/admin/letters/$letterId"
                              params={{ letterId: String(row.id) }}
                              className="hover:underline"
                            >
                              {row.title}
                            </Link>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm max-w-[140px] truncate">
                            {row.recipient_name ?? "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm max-w-[160px] truncate">
                            {formatUnit(row)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {row.creator?.full_name ?? "—"}
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
                              asChild
                            >
                              <Link
                                to="/admin/letters/$letterId"
                                params={{ letterId: String(row.id) }}
                              >
                                <IconEye className="h-4 w-4" />
                                View
                              </Link>
                            </Button>
                            {row.scan?.url ? (
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="gap-1"
                                asChild
                              >
                                <a
                                  href={row.scan.url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <IconExternalLink className="h-4 w-4" />
                                  Preview
                                </a>
                              </Button>
                            ) : null}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() => {
                                setEditingLetter(row);
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

      <OutgoingLetterFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditingLetter(null);
        }}
        letter={editingLetter}
        onSaved={refresh}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this letter entry?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `“${deleteTarget.letter_number} — ${deleteTarget.title}” will be removed. This cannot be undone.`
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
