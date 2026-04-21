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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { useDebounce } from "use-debounce";
import type { Poll, PollResultsResponse } from "@/types/types";
import {
  closePoll,
  deletePoll,
  fetchPollResults,
  fetchPolls,
  openPoll,
} from "./lib/polls";
import { PollFormDialog } from "./components/poll-form-dialog";
import {
  IconEdit,
  IconLoader2,
  IconPlayerPlay,
  IconPlayerStop,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { toast } from "sonner";
import type { ApiError } from "@/types/api-error";

function statusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "open":
      return "default";
    case "closed":
      return "secondary";
    default:
      return "outline";
  }
}

export function CommunityPolls() {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [pageCount, setPageCount] = useState(0);
  const [data, setData] = useState<Poll[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [debouncedSearch] = useDebounce(search, 400);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [results, setResults] = useState<PollResultsResponse | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Poll | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [actionBusyId, setActionBusyId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const page = pagination.pageIndex + 1;
    const res = await fetchPolls(
      String(page),
      String(pagination.pageSize),
      debouncedSearch,
      statusFilter
    );
    setData(res.data);
    setPageCount(res.meta.last_page);
    setIsLoading(false);
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    debouncedSearch,
    statusFilter,
  ]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onOpenResults = async (poll: Poll) => {
    setResultsOpen(true);
    setResultsLoading(true);
    setResults(null);
    try {
      const r = await fetchPollResults(poll.id);
      setResults(r);
    } catch (error) {
      const err = error as ApiError;
      toast.error(err.data?.message || "Could not load results.");
      setResultsOpen(false);
    } finally {
      setResultsLoading(false);
    }
  };

  const onOpenPoll = async (poll: Poll) => {
    setActionBusyId(poll.id);
    try {
      await openPoll(poll.id);
      toast.success("Poll is now open for voting.");
      await refresh();
    } catch (error) {
      const err = error as ApiError;
      toast.error(err.data?.message || "Could not open poll.");
    } finally {
      setActionBusyId(null);
    }
  };

  const onClosePoll = async (poll: Poll) => {
    setActionBusyId(poll.id);
    try {
      await closePoll(poll.id);
      toast.success("Poll closed.");
      await refresh();
    } catch (error) {
      const err = error as ApiError;
      toast.error(err.data?.message || "Could not close poll.");
    } finally {
      setActionBusyId(null);
    }
  };

  const onConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await deletePoll(deleteTarget.id);
      toast.success("Poll deleted.");
      setDeleteTarget(null);
      await refresh();
    } catch (error) {
      const err = error as ApiError;
      toast.error(err.data?.message || "Could not delete poll.");
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <Main>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Community polls</h1>
          <p className="text-muted-foreground text-sm">
            Create polls, set who may vote by unit, then open during the window.
            One vote per unit; owners and active tenants may cast.
          </p>
        </div>
        <Button
          className="gap-1"
          onClick={() => {
            setEditingPoll(null);
            setFormOpen(true);
          }}
        >
          <IconPlus className="h-4 w-4" />
          New poll
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Polls</CardTitle>
          <CardDescription>Search and filter by status.</CardDescription>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              placeholder="Search title or description…"
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
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <DataTableSkeleton columnCount={5} />
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Window</TableHead>
                      <TableHead className="text-right">Votes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No polls yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.map((poll) => (
                        <TableRow key={poll.id}>
                          <TableCell className="font-medium max-w-[220px] truncate">
                            {poll.title}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(poll.status)}>
                              {poll.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {new Date(poll.start_at).toLocaleString()} –{" "}
                            {new Date(poll.end_at).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {poll.votes_count ?? 0}
                          </TableCell>
                          <TableCell className="text-right space-x-1 space-y-1">
                            {poll.status === "draft" ? (
                              <>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="gap-1"
                                  onClick={() => {
                                    setEditingPoll(poll);
                                    setFormOpen(true);
                                  }}
                                >
                                  <IconEdit className="h-4 w-4" />
                                  Edit
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  className="gap-1"
                                  disabled={actionBusyId === poll.id}
                                  onClick={() => onOpenPoll(poll)}
                                >
                                  {actionBusyId === poll.id ? (
                                    <IconLoader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <IconPlayerPlay className="h-4 w-4" />
                                  )}
                                  Open
                                </Button>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="gap-1"
                                  onClick={() => setDeleteTarget(poll)}
                                >
                                  <IconTrash className="h-4 w-4" />
                                  Delete
                                </Button>
                              </>
                            ) : null}
                            {poll.status === "open" ? (
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="gap-1"
                                disabled={actionBusyId === poll.id}
                                onClick={() => onClosePoll(poll)}
                              >
                                {actionBusyId === poll.id ? (
                                  <IconLoader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <IconPlayerStop className="h-4 w-4" />
                                )}
                                Close
                              </Button>
                            ) : null}
                            {poll.status !== "draft" ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => onOpenResults(poll)}
                              >
                                Results
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
                <span className="text-sm text-muted-foreground">
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

      <PollFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditingPoll(null);
        }}
        poll={editingPoll}
        onSaved={refresh}
      />

      <Dialog open={resultsOpen} onOpenChange={setResultsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Results</DialogTitle>
            <DialogDescription>
              Vote counts per option (one vote per unit).
            </DialogDescription>
          </DialogHeader>
          {resultsLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : results ? (
            <div className="space-y-2">
              <p className="text-sm">
                Total votes recorded:{" "}
                <strong>{results.total_votes}</strong>
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Option</TableHead>
                    <TableHead className="text-right">Votes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.options.map((row) => (
                    <TableRow key={row.option_id}>
                      <TableCell>{row.option_text}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.vote_count}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this draft poll?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `“${deleteTarget.title}” will be removed. This cannot be undone.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDelete} disabled={deleteBusy}>
              {deleteBusy ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Main>
  );
}
