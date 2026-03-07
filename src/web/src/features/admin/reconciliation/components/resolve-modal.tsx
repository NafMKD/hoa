import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Link2 } from "lucide-react";
import { resolveEscalation } from "../lib/reconciliation";
import type { ReconciliationEscalation } from "@/types/types";

interface Props {
  escalation: ReconciliationEscalation;
  onResolved: () => void;
}

export function ResolveModal({ escalation, onResolved }: Props) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<"confirm" | "fail" | "link">("confirm");
  const [paymentId, setPaymentId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (action === "link" && !paymentId) {
      setError("Payment ID is required for linking.");
      return;
    }
    setLoading(true);
    try {
      await resolveEscalation(escalation.id, {
        action,
        payment_id: action === "link" ? Number(paymentId) : undefined,
        resolution_notes: notes || undefined,
      });
      setOpen(false);
      onResolved();
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      setError(e.data?.message ?? "Failed to resolve escalation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Resolve
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Resolve Escalation #{escalation.id}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            {escalation.reason.replace(/_/g, " ")}
          </p>

          <div className="flex gap-2">
            {[
              { value: "confirm" as const, label: "Confirm", icon: CheckCircle, color: "text-green-600" },
              { value: "fail" as const, label: "Fail", icon: XCircle, color: "text-red-600" },
              { value: "link" as const, label: "Link", icon: Link2, color: "text-blue-600" },
            ].map(({ value, label, icon: Icon, color }) => (
              <Button
                key={value}
                variant={action === value ? "default" : "outline"}
                size="sm"
                onClick={() => setAction(value)}
                className="flex-1"
              >
                <Icon className={`mr-1 h-4 w-4 ${action === value ? "" : color}`} />
                {label}
              </Button>
            ))}
          </div>

          {action === "link" && (
            <div>
              <label className="text-sm font-medium">Payment ID</label>
              <Input
                type="number"
                value={paymentId}
                onChange={(e) => setPaymentId(e.target.value)}
                placeholder="Enter payment ID to link"
                className="mt-1"
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Notes (optional)</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Resolution notes..."
              className="mt-1"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Resolving..." : "Submit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
