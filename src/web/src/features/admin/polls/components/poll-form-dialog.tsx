import { useEffect, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Building, Poll, PollEligibleScope } from "@/types/types";
import { createPoll, updatePoll } from "../lib/polls";
import { fetchBuildings } from "@/features/admin/buildings/lib/buildings";
import { toast } from "sonner";
import type { ApiError } from "@/types/api-error";
import { IconLoader2, IconPlus, IconTrash } from "@tabler/icons-react";

type ScopeMode = "all" | "buildings" | "units";

function localDateTimeValue(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIsoFromLocal(v: string): string {
  return new Date(v).toISOString();
}

function scopeToMode(scope: PollEligibleScope | null | undefined): {
  mode: ScopeMode;
  buildingIds: number[];
  unitIdsText: string;
} {
  if (!scope || scope.type === "all") {
    return { mode: "all", buildingIds: [], unitIdsText: "" };
  }
  if (scope.type === "buildings") {
    return {
      mode: "buildings",
      buildingIds: scope.building_ids ?? [],
      unitIdsText: "",
    };
  }
  if (scope.type === "units") {
    return {
      mode: "units",
      buildingIds: [],
      unitIdsText: (scope.unit_ids ?? []).join(", "),
    };
  }
  return { mode: "all", buildingIds: [], unitIdsText: "" };
}

function buildScope(
  mode: ScopeMode,
  buildingIds: number[],
  unitIdsText: string
): PollEligibleScope | null {
  if (mode === "all") {
    return { type: "all" };
  }
  if (mode === "buildings") {
    return { type: "buildings", building_ids: buildingIds };
  }
  const raw = unitIdsText
    .split(/[,\s]+/)
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n));
  const unique = [...new Set(raw)];
  return { type: "units", unit_ids: unique };
}

type PollFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poll: Poll | null;
  onSaved: () => Promise<void>;
};

export function PollFormDialog({
  open,
  onOpenChange,
  poll,
  onSaved,
}: PollFormDialogProps) {
  const isEdit = Boolean(poll?.id);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [scopeMode, setScopeMode] = useState<ScopeMode>("all");
  const [buildingIds, setBuildingIds] = useState<number[]>([]);
  const [unitIdsText, setUnitIdsText] = useState("");
  const [optionTexts, setOptionTexts] = useState<string[]>(["", ""]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetchBuildings("1", "200", "").then((r) => setBuildings(r.data));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (poll) {
      setTitle(poll.title);
      setDescription(poll.description ?? "");
      setStartAt(localDateTimeValue(poll.start_at));
      setEndAt(localDateTimeValue(poll.end_at));
      const s = scopeToMode(poll.eligible_scope);
      setScopeMode(s.mode);
      setBuildingIds(s.buildingIds);
      setUnitIdsText(s.unitIdsText);
      const opts = poll.options?.length
        ? poll.options
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((o) => o.option_text)
        : ["", ""];
      setOptionTexts(opts.length >= 2 ? opts : ["", ""]);
    } else {
      const now = new Date();
      const end = new Date(now);
      end.setDate(end.getDate() + 7);
      setTitle("");
      setDescription("");
      setStartAt(localDateTimeValue(now.toISOString()));
      setEndAt(localDateTimeValue(end.toISOString()));
      setScopeMode("all");
      setBuildingIds([]);
      setUnitIdsText("");
      setOptionTexts(["", ""]);
    }
  }, [open, poll]);

  const toggleBuilding = (id: number) => {
    setBuildingIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const onSubmit = async () => {
    const trimmedOptions = optionTexts.map((t) => t.trim()).filter(Boolean);
    if (trimmedOptions.length < 2) {
      toast.error("Add at least two non-empty options.");
      return;
    }
    if (!title.trim() || !startAt || !endAt) {
      toast.error("Title and schedule are required.");
      return;
    }
    if (scopeMode === "buildings" && buildingIds.length === 0) {
      toast.error("Select at least one building.");
      return;
    }
    if (scopeMode === "units") {
      const scope = buildScope("units", [], unitIdsText);
      if (scope.type !== "units" || scope.unit_ids.length === 0) {
        toast.error("Enter at least one unit id for unit-scoped polls.");
        return;
      }
    }

    const eligible_scope = buildScope(scopeMode, buildingIds, unitIdsText);

    setBusy(true);
    try {
      const body = {
        title: title.trim(),
        description: description.trim() || null,
        eligible_scope,
        start_at: toIsoFromLocal(startAt),
        end_at: toIsoFromLocal(endAt),
        options: trimmedOptions.map((option_text, i) => ({ option_text, order: i })),
      };
      if (isEdit && poll) {
        await updatePoll(poll.id, body);
        toast.success("Poll updated.");
      } else {
        await createPoll(body);
        toast.success("Poll created.");
      }
      onOpenChange(false);
      await onSaved();
    } catch (error) {
      const err = error as ApiError;
      toast.error(err.data?.message || "Could not save poll.");
    } finally {
      setBusy(false);
    }
  };

  const draftOnly = !poll || poll.status === "draft";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit poll (draft)" : "New poll"}</DialogTitle>
          <DialogDescription>
            Draft polls can be edited. Open a poll to allow voting during the
            scheduled window. Votes are one per unit; the voter must be an active
            owner or tenant of that unit.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="poll-title">Title</Label>
            <Input
              id="poll-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!draftOnly}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="poll-desc">Description</Label>
            <Textarea
              id="poll-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!draftOnly}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="poll-start">Start</Label>
              <Input
                id="poll-start"
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                disabled={!draftOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="poll-end">End</Label>
              <Input
                id="poll-end"
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                disabled={!draftOnly}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Eligibility</Label>
            <Select
              value={scopeMode}
              onValueChange={(v) => setScopeMode(v as ScopeMode)}
              disabled={!draftOnly}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All units</SelectItem>
                <SelectItem value="buildings">Selected buildings</SelectItem>
                <SelectItem value="units">Selected unit IDs</SelectItem>
              </SelectContent>
            </Select>
            {scopeMode === "buildings" ? (
              <ScrollArea className="h-36 rounded-md border p-2">
                <div className="space-y-2">
                  {buildings.map((b) => (
                    <label
                      key={b.id}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={buildingIds.includes(Number(b.id))}
                        onCheckedChange={() => toggleBuilding(Number(b.id))}
                        disabled={!draftOnly}
                      />
                      <span>{b.name}</span>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            ) : null}
            {scopeMode === "units" ? (
              <div className="space-y-1">
                <Input
                  placeholder="e.g. 1, 2, 15"
                  value={unitIdsText}
                  onChange={(e) => setUnitIdsText(e.target.value)}
                  disabled={!draftOnly}
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated unit ids.
                </p>
              </div>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>Options</Label>
            <div className="space-y-2">
              {optionTexts.map((text, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={text}
                    onChange={(e) => {
                      const next = [...optionTexts];
                      next[i] = e.target.value;
                      setOptionTexts(next);
                    }}
                    disabled={!draftOnly}
                    placeholder={`Option ${i + 1}`}
                  />
                  {draftOnly && optionTexts.length > 2 ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setOptionTexts(optionTexts.filter((_, j) => j !== i))
                      }
                    >
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
            {draftOnly ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => setOptionTexts([...optionTexts, ""])}
              >
                <IconPlus className="h-4 w-4" />
                Add option
              </Button>
            ) : null}
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          {draftOnly ? (
            <Button type="button" disabled={busy} onClick={onSubmit}>
              {busy ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : isEdit ? (
                "Save changes"
              ) : (
                "Create draft"
              )}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
