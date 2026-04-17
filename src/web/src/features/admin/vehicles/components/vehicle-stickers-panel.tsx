import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  IconBan,
  IconLoader2,
  IconPlus,
  IconPrinter,
  IconSticker,
} from "@tabler/icons-react";
import { toast } from "sonner";
import type { ApiError } from "@/types/api-error";
import type { Fee, StickerIssue, Vehicle } from "@/types/types";
import { fetchAllFees } from "@/features/admin/fees/lib/fees";
import {
  fetchPendingStickerReplacements,
  issueSticker,
  markStickerLost,
  markStickerReturned,
  revokeSticker,
} from "../lib/vehicles";
import { StickerPrintPreview } from "./sticker-print-preview";

function stickerStatusBadgeVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
      return "default";
    case "lost":
      return "destructive";
    case "revoked":
    case "expired":
      return "destructive";
    case "returned":
      return "secondary";
    default:
      return "outline";
  }
}

type Row = { sticker: StickerIssue; vehicle: Vehicle };

type VehicleStickersPanelProps = {
  vehicles: Vehicle[];
  onRefresh: () => Promise<void>;
  showVehicleColumn?: boolean;
};

export function VehicleStickersPanel({
  vehicles,
  onRefresh,
  showVehicleColumn = false,
}: VehicleStickersPanelProps) {
  const [issueOpen, setIssueOpen] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [issueBusy, setIssueBusy] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | number | "">(
    ""
  );
  const [pending, setPending] = useState<StickerIssue[]>([]);
  /** False while the pending-replacements request for the open dialog is in flight. */
  const [pendingReplacementsReady, setPendingReplacementsReady] = useState(false);
  const [supersedesId, setSupersedesId] = useState<string>("");

  const [revokeTarget, setRevokeTarget] = useState<StickerIssue | null>(null);
  const [revokeBusy, setRevokeBusy] = useState(false);
  const [lostMarkContext, setLostMarkContext] = useState<{
    sticker: StickerIssue;
    vehicle: Vehicle;
  } | null>(null);
  const [lostFeeId, setLostFeeId] = useState("");
  const [penaltyFees, setPenaltyFees] = useState<Fee[]>([]);
  const [lostBusy, setLostBusy] = useState(false);
  const [returnedTarget, setReturnedTarget] = useState<StickerIssue | null>(
    null
  );
  const [returnedBusy, setReturnedBusy] = useState(false);
  const [printStickerId, setPrintStickerId] = useState<number | null>(null);
  const [printOpen, setPrintOpen] = useState(false);

  const rows = useMemo(() => {
    const out: Row[] = [];
    for (const v of vehicles) {
      for (const s of v.stickers ?? []) {
        out.push({ sticker: s, vehicle: v });
      }
    }
    out.sort(
      (a, b) =>
        new Date(b.sticker.issued_at ?? 0).getTime() -
        new Date(a.sticker.issued_at ?? 0).getTime()
    );
    return out;
  }, [vehicles]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  useEffect(() => {
    if (!issueOpen || !selectedVehicleId) {
      setPending([]);
      setPendingReplacementsReady(false);
      return;
    }
    let cancelled = false;
    setPendingReplacementsReady(false);
    fetchPendingStickerReplacements(selectedVehicleId)
      .then((p) => {
        if (cancelled) return;
        setPending(p);
        if (p.length === 1) {
          setSupersedesId(String(p[0].id));
        } else if (p.length === 0) {
          setSupersedesId("");
        } else {
          setSupersedesId("");
        }
        setPendingReplacementsReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setPending([]);
        setSupersedesId("");
        setPendingReplacementsReady(true);
        toast.error("Could not load pending sticker replacements. Try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [issueOpen, selectedVehicleId]);

  useEffect(() => {
    if (!issueOpen) {
      setSupersedesId("");
    }
  }, [issueOpen]);

  useEffect(() => {
    if (!lostMarkContext) {
      setPenaltyFees([]);
      setLostFeeId("");
      return;
    }
    fetchAllFees("penalty", "active").then(setPenaltyFees);
    setLostFeeId(
      lostMarkContext.vehicle.lost_sticker_fee_id
        ? String(lostMarkContext.vehicle.lost_sticker_fee_id)
        : ""
    );
  }, [lostMarkContext]);

  const openIssueDialog = () => {
    if (vehicles.length === 0) {
      toast.error("No vehicle selected.");
      return;
    }
    const first = vehicles[0];
    setSelectedVehicleId(first.id);
    setExpiresAt("");
    setSupersedesId("");
    setPendingReplacementsReady(false);
    setIssueOpen(true);
  };

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const selectedHasActive = selectedVehicle
    ? (selectedVehicle.stickers ?? []).some((s) => s.status === "active")
    : false;

  const onIssueSticker = async () => {
    if (!selectedVehicleId) return;
    if (selectedHasActive) {
      toast.error(
        "Mark the active sticker as lost or returned (or revoke it) before issuing a new one."
      );
      return;
    }
    if (!pendingReplacementsReady) {
      toast.error("Still loading replacement options. Please wait.");
      return;
    }
    if (pending.length > 0 && !supersedesId) {
      toast.error("Select which lost or returned sticker you are replacing.");
      return;
    }
    setIssueBusy(true);
    try {
      await issueSticker(selectedVehicleId, {
        expires_at: expiresAt.trim()
          ? new Date(expiresAt).toISOString()
          : undefined,
        supersedes_sticker_issue_id: supersedesId
          ? parseInt(supersedesId, 10)
          : undefined,
      });
      toast.success("Sticker issued.");
      setIssueOpen(false);
      await onRefresh();
    } catch (error) {
      const err = error as ApiError;
      toast.error(err.data?.message || "Could not issue sticker.");
    } finally {
      setIssueBusy(false);
    }
  };

  const onConfirmRevokeSticker = async () => {
    if (!revokeTarget) return;
    setRevokeBusy(true);
    try {
      await revokeSticker(revokeTarget.id);
      toast.success("Sticker revoked.");
      setRevokeTarget(null);
      await onRefresh();
    } catch (error) {
      const err = error as ApiError;
      toast.error(err.data?.message || "Could not revoke sticker.");
    } finally {
      setRevokeBusy(false);
    }
  };

  const onConfirmMarkLost = async () => {
    if (!lostMarkContext) return;
    if (!lostFeeId && !lostMarkContext.vehicle.lost_sticker_fee_id) {
      toast.error(
        "Select a penalty fee or configure a default lost sticker fee on the vehicle."
      );
      return;
    }
    setLostBusy(true);
    try {
      await markStickerLost(
        lostMarkContext.sticker.id,
        lostFeeId ? { fee_id: parseInt(lostFeeId, 10) } : {}
      );
      toast.success("Sticker marked as lost. A penalty invoice was created for the unit.");
      setLostMarkContext(null);
      await onRefresh();
    } catch (error) {
      const err = error as ApiError;
      toast.error(err.data?.message || "Could not update sticker.");
    } finally {
      setLostBusy(false);
    }
  };

  const onConfirmReturned = async () => {
    if (!returnedTarget) return;
    setReturnedBusy(true);
    try {
      await markStickerReturned(returnedTarget.id);
      toast.success("Sticker marked as returned.");
      setReturnedTarget(null);
      await onRefresh();
    } catch (error) {
      const err = error as ApiError;
      toast.error(err.data?.message || "Could not update sticker.");
    } finally {
      setReturnedBusy(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          One active sticker per vehicle. <strong>Lost</strong> creates a penalty
          invoice (configure default fee on each vehicle). You can reissue only after
          that invoice is paid. <strong>Returned</strong> has no invoice.
        </p>
        <Button
          type="button"
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={openIssueDialog}
          disabled={vehicles.length === 0}
        >
          <IconPlus className="h-4 w-4" />
          Issue sticker
        </Button>
      </div>

      <Card className="border-muted shadow-sm overflow-x-auto">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <IconSticker className="h-4 w-4 text-muted-foreground" />
            Sticker history
          </CardTitle>
          <CardDescription>
            {rows.length === 0
              ? "No stickers issued yet."
              : `${rows.length} record(s).`}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              Issue a sticker to generate a code, QR lookup token, and printable label.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {showVehicleColumn ? (
                    <TableHead>Vehicle</TableHead>
                  ) : null}
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Issued by</TableHead>
                  <TableHead>Penalty invoice</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ sticker: s, vehicle: v }) => (
                  <TableRow key={`${v.id}-${s.id}`}>
                    {showVehicleColumn ? (
                      <TableCell className="text-sm">
                        <Link
                          to="/admin/vehicles/$vehicleId"
                          params={{ vehicleId: String(v.id) }}
                          className="font-medium text-primary underline"
                        >
                          {v.make} {v.model}
                        </Link>
                        <div className="text-xs text-muted-foreground font-mono">
                          {v.license_plate}
                        </div>
                      </TableCell>
                    ) : null}
                    <TableCell className="font-mono text-sm">
                      {s.sticker_code}
                    </TableCell>
                    <TableCell>
                      <Badge variant={stickerStatusBadgeVariant(s.status)}>
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(s.issued_at)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(s.expires_at)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {s.issuer?.full_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {s.lost_penalty_invoice ? (
                        <div className="flex flex-col gap-0.5">
                          <Link
                            to="/admin/financials/invoices/$invoiceId"
                            params={{
                              invoiceId: String(s.lost_penalty_invoice.id),
                            }}
                            className="underline text-primary"
                          >
                            {s.lost_penalty_invoice.invoice_number}
                          </Link>
                          <span className="text-xs text-muted-foreground">
                            {s.lost_penalty_invoice?.status}
                          </span>
                        </div>
                      ) : s.replacement_invoice ? (
                        <Link
                          to="/admin/financials/invoices/$invoiceId"
                          params={{
                            invoiceId: String(s.replacement_invoice.id),
                          }}
                          className="underline text-primary"
                        >
                          {s.replacement_invoice.invoice_number}
                        </Link>
                      ) : s.replacement_invoice_id ? (
                        <Link
                          to="/admin/financials/invoices/$invoiceId"
                          params={{
                            invoiceId: String(s.replacement_invoice_id),
                          }}
                          className="underline text-primary"
                        >
                          #{s.replacement_invoice_id}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => {
                          setPrintStickerId(s.id);
                          setPrintOpen(true);
                        }}
                      >
                        <IconPrinter className="h-4 w-4" />
                        Print
                      </Button>
                      {s.status === "active" ? (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => setLostMarkContext({ sticker: s, vehicle: v })}
                          >
                            Lost
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="gap-1"
                            onClick={() => setReturnedTarget(s)}
                          >
                            Returned
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="gap-1"
                            onClick={() => setRevokeTarget(s)}
                          >
                            <IconBan className="h-4 w-4" />
                            Revoke
                          </Button>
                        </>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Issue parking sticker</DialogTitle>
            <DialogDescription>
              You cannot issue while an active sticker exists for that vehicle. If you
              are replacing a lost or returned sticker, select it below. For a lost
              sticker, the penalty invoice must be paid before you can reissue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {vehicles.length > 1 ? (
              <div className="space-y-2">
                <Label>Vehicle</Label>
                <Select
                  value={selectedVehicleId ? String(selectedVehicleId) : ""}
                  onValueChange={(val) => {
                    setSelectedVehicleId(val);
                    setSupersedesId("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((v) => (
                      <SelectItem key={String(v.id)} value={String(v.id)}>
                        {v.make} {v.model} · {v.license_plate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {selectedHasActive ? (
              <p className="text-sm text-destructive">
                This vehicle already has an active sticker. Mark it lost, returned, or
                revoke it first.
              </p>
            ) : null}

            {pending.length > 0 ? (
              <div className="space-y-2">
                <Label>Replacing sticker</Label>
                <Select value={supersedesId} onValueChange={setSupersedesId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select lost or returned sticker" />
                  </SelectTrigger>
                  <SelectContent>
                    {pending.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.sticker_code} ({p.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="sticker-expires-at">Optional expiry</Label>
              <Input
                id="sticker-expires-at"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIssueOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                issueBusy ||
                !selectedVehicleId ||
                !pendingReplacementsReady ||
                selectedHasActive ||
                (pending.length > 0 && !supersedesId)
              }
              onClick={onIssueSticker}
            >
              {issueBusy ? (
                <>
                  <IconLoader2 className="h-4 w-4 animate-spin mr-2" />
                  Issuing…
                </>
              ) : !pendingReplacementsReady ? (
                <>
                  <IconLoader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading…
                </>
              ) : (
                "Issue"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={revokeTarget !== null}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke this sticker?</AlertDialogTitle>
            <AlertDialogDescription>
              {revokeTarget
                ? `Sticker ${revokeTarget.sticker_code} will be marked revoked.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revokeBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmRevokeSticker}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={revokeBusy}
            >
              {revokeBusy ? (
                <>
                  <IconLoader2 className="h-4 w-4 animate-spin mr-2" />
                  Revoking…
                </>
              ) : (
                "Revoke"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={lostMarkContext !== null}
        onOpenChange={(open) => !open && setLostMarkContext(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark sticker as lost</DialogTitle>
            <DialogDescription>
              A penalty invoice will be created for the unit. You can issue a
              replacement only after that invoice is paid. Choose the fee (defaults to
              the vehicle&apos;s configured lost sticker fee if set).
            </DialogDescription>
          </DialogHeader>
          {lostMarkContext ? (
            <div className="space-y-3">
              <p className="text-sm font-mono">{lostMarkContext.sticker.sticker_code}</p>
              <div className="space-y-2">
                <Label>Penalty fee</Label>
                <Select value={lostFeeId} onValueChange={setLostFeeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select penalty fee" />
                  </SelectTrigger>
                  <SelectContent>
                    {penaltyFees.map((f) => (
                      <SelectItem key={f.id} value={String(f.id)}>
                        {f.name} — {Number(f.amount).toLocaleString()} ETB
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {penaltyFees.length === 0 ? (
                  <p className="text-xs text-destructive">
                    No active penalty fees. Create one under Fees or set a default on the
                    vehicle.
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLostMarkContext(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                lostBusy ||
                (!lostFeeId && !lostMarkContext?.vehicle.lost_sticker_fee_id)
              }
              onClick={onConfirmMarkLost}
            >
              {lostBusy ? (
                <>
                  <IconLoader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving…
                </>
              ) : (
                "Create invoice & mark lost"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={returnedTarget !== null}
        onOpenChange={(open) => !open && setReturnedTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark sticker as returned?</AlertDialogTitle>
            <AlertDialogDescription>
              {returnedTarget
                ? `Sticker ${returnedTarget.sticker_code} will be marked returned. Replacing it will not incur a penalty fee.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={returnedBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmReturned} disabled={returnedBusy}>
              {returnedBusy ? (
                <>
                  <IconLoader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving…
                </>
              ) : (
                "Confirm"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <StickerPrintPreview
        stickerIssueId={printStickerId}
        open={printOpen}
        onOpenChange={(open) => {
          setPrintOpen(open);
          if (!open) setPrintStickerId(null);
        }}
      />
    </>
  );
}
