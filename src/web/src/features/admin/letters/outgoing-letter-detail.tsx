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
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import type { OutgoingLetter } from "@/types/types";
import {
  deleteOutgoingLetter,
  fetchOutgoingLetter,
} from "./lib/outgoing-letters";
import { OutgoingLetterFormDialog } from "./components/outgoing-letter-form-dialog";
import {
  Link,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import {
  IconArrowLeft,
  IconEdit,
  IconExternalLink,
  IconLoader2,
  IconTrash,
} from "@tabler/icons-react";
import { toast } from "sonner";
import type { ApiError } from "@/types/api-error";
import { useAuthStore } from "@/stores/auth-store";
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

function formatUnit(letter: OutgoingLetter): string {
  const u = letter.unit;
  if (!u?.name) return "—";
  const b = u.building?.name;
  return b ? `${u.name} (${b})` : u.name;
}

function isPdfMime(mime: string | undefined): boolean {
  if (!mime) return false;
  return mime === "application/pdf" || mime.includes("pdf");
}

function isImageMime(mime: string | undefined): boolean {
  if (!mime) return false;
  return mime.startsWith("image/");
}

export function OutgoingLetterDetail() {
  const { letterId } = useParams({
    from: "/_authenticated/admin/letters/$letterId",
  });
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [letter, setLetter] = useState<OutgoingLetter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await fetchOutgoingLetter(letterId);
      setLetter(data);
    } catch (error) {
      const err = error as ApiError;
      setLoadError(
        err.data && typeof err.data === "object" && "message" in err.data
          ? String((err.data as { message?: string }).message)
          : err.message || "Could not load letter."
      );
      setLetter(null);
    } finally {
      setIsLoading(false);
    }
  }, [letterId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onConfirmDelete = async () => {
    if (!letter) return;
    setDeleteBusy(true);
    try {
      await deleteOutgoingLetter(letter.id);
      toast.success("Letter removed.");
      setDeleteOpen(false);
      void navigate({ to: "/admin/letters" });
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

  if (isLoading) {
    return (
      <Main className="container mx-auto max-w-4xl px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-9 w-24" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-full max-w-md mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </Main>
    );
  }

  if (loadError || !letter) {
    return (
      <Main>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4 px-4">
          <p className="text-muted-foreground">
            {loadError ?? "Letter not found."}
          </p>
          <Button variant="outline" asChild>
            <Link to="/admin/letters">
              <IconArrowLeft className="mr-1 h-4 w-4" />
              Back to letters
            </Link>
          </Button>
        </div>
      </Main>
    );
  }

  const scan = letter.scan;

  return (
    <Main className="container mx-auto max-w-4xl px-4 py-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Outgoing letter
          </h1>
          <p className="text-muted-foreground text-sm font-mono mt-1">
            {letter.letter_number}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/admin/letters">
              <IconArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-1"
            onClick={() => setFormOpen(true)}
          >
            <IconEdit className="h-4 w-4" />
            Edit
          </Button>
          {user?.role === "admin" ? (
            <Button
              type="button"
              variant="destructive"
              className="gap-1"
              onClick={() => setDeleteOpen(true)}
            >
              <IconTrash className="h-4 w-4" />
              Delete
            </Button>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{letter.title}</CardTitle>
          <CardDescription>
            Registered{" "}
            {letter.created_at
              ? new Date(letter.created_at).toLocaleString()
              : "—"}
            {letter.creator?.full_name
              ? ` · ${letter.creator.full_name}`
              : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {letter.description ? (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Purpose / notes
              </p>
              <p className="text-sm whitespace-pre-wrap">{letter.description}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No notes added.</p>
          )}

          <Separator />

          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Recipient
              </dt>
              <dd className="text-sm mt-1">{letter.recipient_name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Unit
              </dt>
              <dd className="text-sm mt-1">{formatUnit(letter)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Last updated
              </dt>
              <dd className="text-sm mt-1">
                {letter.updated_at
                  ? new Date(letter.updated_at).toLocaleString()
                  : "—"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scanned copy</CardTitle>
          <CardDescription>
            {scan
              ? "Preview below or open the file in a new tab."
              : "No scan was uploaded for this letter."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {scan ? (
            <>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {scan.file_name || "Attachment"}
                </span>
                <span className="text-xs">({scan.mime_type})</span>
                <Button variant="secondary" size="sm" className="gap-1" asChild>
                  <a href={scan.url} target="_blank" rel="noreferrer">
                    <IconExternalLink className="h-4 w-4" />
                    Open in new tab
                  </a>
                </Button>
              </div>

              {isImageMime(scan.mime_type) ? (
                <div className="rounded-md border bg-muted/30 p-2 overflow-auto">
                  <img
                    src={scan.url}
                    alt={scan.file_name || "Letter scan"}
                    className="max-w-full h-auto mx-auto rounded"
                  />
                </div>
              ) : isPdfMime(scan.mime_type) ? (
                <div className="rounded-md border overflow-hidden bg-muted/20">
                  <iframe
                    title={scan.file_name || "Letter scan"}
                    src={scan.url}
                    className="w-full min-h-[70vh] border-0"
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Inline preview is not available for this file type. Use “Open
                  in new tab” to view it.
                </p>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>

      <OutgoingLetterFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
        }}
        letter={letter}
        onSaved={load}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this letter entry?</AlertDialogTitle>
            <AlertDialogDescription>
              “{letter.letter_number} — {letter.title}” will be removed. This
              cannot be undone.
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
