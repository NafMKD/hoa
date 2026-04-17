import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import type { OutgoingLetter } from "@/types/types";
import {
  createOutgoingLetter,
  updateOutgoingLetter,
} from "../lib/outgoing-letters";
import { UnitSelect } from "@/features/admin/units/components/unit-select";
import { toast } from "sonner";
import type { ApiError } from "@/types/api-error";
import { IconLoader2 } from "@tabler/icons-react";

function formatUnitHint(
  unit: OutgoingLetter["unit"] | null | undefined
): string | null {
  if (!unit?.name) return null;
  const b = unit.building?.name;
  return b ? `${unit.name} — ${b}` : unit.name;
}

type OutgoingLetterFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  letter: OutgoingLetter | null;
  onSaved: () => Promise<void>;
};

export function OutgoingLetterFormDialog({
  open,
  onOpenChange,
  letter,
  onSaved,
}: OutgoingLetterFormDialogProps) {
  const isEdit = Boolean(letter?.id);
  const formKey = `${letter?.id ?? "new"}-${open ? "1" : "0"}`;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [unitId, setUnitId] = useState<number | null>(null);
  const [newScan, setNewScan] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const unitHint = useMemo(
    () => formatUnitHint(letter?.unit),
    [letter?.unit]
  );

  useEffect(() => {
    if (!open) return;
    setNewScan(null);
    if (letter) {
      setTitle(letter.title);
      setDescription(letter.description ?? "");
      setRecipientName(letter.recipient_name ?? "");
      setUnitId(letter.unit_id != null ? Number(letter.unit_id) : null);
    } else {
      setTitle("");
      setDescription("");
      setRecipientName("");
      setUnitId(null);
    }
  }, [open, letter]);

  const onSubmit = async () => {
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("description", description.trim());
      fd.append("recipient_name", recipientName.trim());
      if (unitId != null) {
        fd.append("unit_id", String(unitId));
      } else {
        fd.append("unit_id", "");
      }
      if (newScan) {
        fd.append("scan", newScan);
      }

      if (isEdit && letter) {
        await updateOutgoingLetter(letter.id, fd);
        toast.success("Letter updated.");
      } else {
        await createOutgoingLetter(fd);
        toast.success("Letter registered.");
      }
      await onSaved();
      onOpenChange(false);
    } catch (error) {
      const err = error as ApiError;
      toast.error(
        err.data && typeof err.data === "object" && "message" in err.data
          ? String((err.data as { message?: string }).message)
          : err.message || "Request failed."
      );
    } finally {
      setBusy(false);
    }
  };

  const existingScan = letter?.scan;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit outgoing letter" : "Register outgoing letter"}
          </DialogTitle>
          <DialogDescription>
            The letter number is assigned automatically when you save. You can
            link a unit, add the recipient name, and attach a scanned copy.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {isEdit && letter ? (
            <div className="grid gap-2">
              <Label htmlFor="letter-number">Letter number</Label>
              <Input
                id="letter-number"
                readOnly
                value={letter.letter_number}
                className="font-mono text-sm"
              />
            </div>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="letter-title">Title</Label>
            <Input
              id="letter-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="letter-description">Purpose / notes</Label>
            <Textarea
              id="letter-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Optional context or summary"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="letter-recipient">Recipient name (optional)</Label>
            <Input
              id="letter-recipient"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              maxLength={255}
            />
          </div>

          <div className="grid gap-2">
            <Label>Unit (optional)</Label>
            <UnitSelect
              key={`unit-${formKey}`}
              value={unitId}
              onChange={setUnitId}
              allowClear
              selectedDisplayName={isEdit ? unitHint : null}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="letter-scan">
              Scanned copy (optional)
              {isEdit && existingScan && !newScan ? (
                <span className="text-muted-foreground ml-1 font-normal">
                  — current file linked; upload replaces it.
                </span>
              ) : null}
            </Label>
            <Input
              id="letter-scan"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setNewScan(f ?? null);
              }}
            />
            {isEdit && existingScan ? (
              <p className="text-muted-foreground text-xs">
                Current:{" "}
                <a
                  href={existingScan.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline"
                >
                  {existingScan.file_name || "View scan"}
                </a>
              </p>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void onSubmit()} disabled={busy}>
            {busy ? (
              <>
                <IconLoader2 className="mr-1 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : isEdit ? (
              "Save"
            ) : (
              "Register"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
