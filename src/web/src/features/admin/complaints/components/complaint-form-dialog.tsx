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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  Complaint,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
} from "@/types/types";
import { createComplaint, updateComplaint } from "../lib/complaints";
import { UserSelect } from "@/features/admin/users/components/user-select";
import { UnitSelect } from "@/features/admin/units/components/unit-select";
import { toast } from "sonner";
import type { ApiError } from "@/types/api-error";
import { IconLoader2 } from "@tabler/icons-react";

const CATEGORIES: { value: ComplaintCategory; label: string }[] = [
  { value: "maintenance", label: "Maintenance" },
  { value: "noise", label: "Noise" },
  { value: "parking", label: "Parking" },
  { value: "security", label: "Security" },
  { value: "billing", label: "Billing" },
  { value: "common_areas", label: "Common areas" },
  { value: "other", label: "Other" },
];

const STATUSES: { value: ComplaintStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const PRIORITIES: { value: ComplaintPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

function formatUnitHint(
  unit: Complaint["unit"] | null | undefined
): string | null {
  if (!unit?.name) return null;
  const b = unit.building?.name;
  return b ? `${unit.name} — ${b}` : unit.name;
}

type ComplaintFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  complaint: Complaint | null;
  onSaved: () => Promise<void>;
};

export function ComplaintFormDialog({
  open,
  onOpenChange,
  complaint,
  onSaved,
}: ComplaintFormDialogProps) {
  const isEdit = Boolean(complaint?.id);
  const formKey = `${complaint?.id ?? "new"}-${open ? "1" : "0"}`;

  const [submitterId, setSubmitterId] = useState<number | null>(null);
  const [unitId, setUnitId] = useState<number | null>(null);
  const [category, setCategory] = useState<string>("other");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<string>("open");
  const [priority, setPriority] = useState<string>("normal");
  const [assigneeId, setAssigneeId] = useState<number | null>(null);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [pendingRemoveDocIds, setPendingRemoveDocIds] = useState<Set<number>>(
    () => new Set()
  );
  const [busy, setBusy] = useState(false);

  const submitterHint = complaint?.submitter?.full_name ?? null;
  const assigneeHint = complaint?.assignee?.full_name ?? null;
  const unitHint = useMemo(
    () => formatUnitHint(complaint?.unit),
    [complaint?.unit]
  );

  useEffect(() => {
    if (!open) return;
    setPendingRemoveDocIds(new Set());
    setNewFiles([]);
    if (complaint) {
      setSubmitterId(Number(complaint.user_id));
      setUnitId(
        complaint.unit_id != null ? Number(complaint.unit_id) : null
      );
      setCategory(String(complaint.category));
      setSubject(complaint.subject);
      setBody(complaint.body);
      setStatus(String(complaint.status));
      setPriority(String(complaint.priority));
      setAssigneeId(
        complaint.assigned_to != null ? Number(complaint.assigned_to) : null
      );
    } else {
      setSubmitterId(null);
      setUnitId(null);
      setCategory("other");
      setSubject("");
      setBody("");
      setStatus("open");
      setPriority("normal");
      setAssigneeId(null);
    }
  }, [open, complaint]);

  const toggleRemoveDoc = (id: number) => {
    setPendingRemoveDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const onSubmit = async () => {
    if (submitterId == null) {
      toast.error("Search and select the submitter (resident).");
      return;
    }
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and description are required.");
      return;
    }

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("user_id", String(submitterId));
      if (unitId != null) {
        fd.append("unit_id", String(unitId));
      }
      fd.append("category", category);
      fd.append("subject", subject.trim());
      fd.append("body", body.trim());
      fd.append("status", status);
      fd.append("priority", priority);
      if (assigneeId != null) {
        fd.append("assigned_to", String(assigneeId));
      }
      newFiles.forEach((file) => {
        fd.append("attachments[]", file);
      });
      if (isEdit && complaint) {
        pendingRemoveDocIds.forEach((id) => {
          fd.append("remove_document_ids[]", String(id));
        });
        await updateComplaint(complaint.id, fd);
        toast.success("Complaint updated.");
      } else {
        await createComplaint(fd);
        toast.success("Complaint created.");
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

  const activeDocuments =
    complaint?.documents?.filter((d) => !pendingRemoveDocIds.has(Number(d.id))) ??
    [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit complaint" : "New complaint"}</DialogTitle>
          <DialogDescription>
            Search for users and units as you type—only matching rows are loaded.
            Attach evidence and assign staff when needed.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Submitter</Label>
            <UserSelect
              key={`submitter-${formKey}`}
              value={submitterId}
              onChange={setSubmitterId}
              scope="residents"
              status="active"
              selectedDisplayName={isEdit ? submitterHint : null}
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
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="complaint-subject">Subject</Label>
            <Input
              id="complaint-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={255}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="complaint-body">Description</Label>
            <Textarea
              id="complaint-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Assign to staff (optional)</Label>
            <UserSelect
              key={`assignee-${formKey}`}
              value={assigneeId}
              onChange={setAssigneeId}
              scope="staff"
              status="active"
              selectedDisplayName={isEdit ? assigneeHint : null}
              allowClear
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="complaint-files">Attachments</Label>
            <Input
              id="complaint-files"
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx"
              onChange={(e) => {
                const list = e.target.files;
                setNewFiles(list ? Array.from(list) : []);
              }}
            />
            {newFiles.length > 0 ? (
              <p className="text-muted-foreground text-xs">
                {newFiles.length} new file(s) will upload on save.
              </p>
            ) : null}
          </div>

          {isEdit && complaint && complaint.documents && complaint.documents.length > 0 ? (
            <div className="grid gap-2">
              <Label>Current files</Label>
              <ul className="space-y-1 text-sm">
                {complaint.documents.map((doc) => {
                  const removed = pendingRemoveDocIds.has(Number(doc.id));
                  return (
                    <li
                      key={doc.id}
                      className={
                        removed
                          ? "text-muted-foreground line-through"
                          : "flex flex-wrap items-center gap-2"
                      }
                    >
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline"
                      >
                        {doc.file_name || `Document ${doc.id}`}
                      </a>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRemoveDoc(Number(doc.id))}
                      >
                        {removed ? "Undo remove" : "Remove"}
                      </Button>
                    </li>
                  );
                })}
              </ul>
              {activeDocuments.length === 0 && pendingRemoveDocIds.size > 0 ? (
                <p className="text-muted-foreground text-xs">
                  All current attachments are marked for removal; add new files if needed.
                </p>
              ) : null}
            </div>
          ) : null}
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
              "Create"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
