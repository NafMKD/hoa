import React, { useCallback, useEffect, useState } from "react";
import { Main } from "@/components/layout/main";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import type { ApiError } from "@/types/api-error";
import type { PayrollTaxBracket } from "@/types/types";
import {
  createPayrollTaxBracket,
  deletePayrollTaxBracket,
  fetchPayrollSettings,
  fetchPayrollTaxBrackets,
  updatePayrollSettings,
  updatePayrollTaxBracket,
} from "@/features/admin/payroll/lib/payroll";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function apiErrorMessage(err: unknown): string {
  const e = err as ApiError;
  const d = e.data as
    | { message?: string; errors?: Record<string, string[] | string> }
    | undefined;
  if (d?.errors && typeof d.errors === "object") {
    const first = Object.values(d.errors)[0];
    if (Array.isArray(first) && first[0]) return String(first[0]);
    if (typeof first === "string") return first;
  }
  if (d?.message) return d.message;
  return e.message ?? "Request failed";
}

export function PayrollRulesPage() {
  return (
    <Main>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Payroll rules</h2>
        <p className="text-muted-foreground">
          Configure progressive income tax bands and non-tax payroll deductions. When you
          generate payroll, the app saves a snapshot on each row so history stays correct if
          you change these numbers later.
        </p>
      </div>
      <PayrollRulesAdmin />
    </Main>
  );
}

function PayrollRulesAdmin() {
  const [dedFixed, setDedFixed] = useState("");
  const [dedPct, setDedPct] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);

  const [brackets, setBrackets] = useState<PayrollTaxBracket[]>([]);
  const [bracketsLoading, setBracketsLoading] = useState(true);
  const [bracketDialogOpen, setBracketDialogOpen] = useState(false);
  const [editingBracket, setEditingBracket] = useState<PayrollTaxBracket | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const loadSettings = useCallback(() => {
    setSettingsLoading(true);
    fetchPayrollSettings()
      .then((s) => {
        setDedFixed(String(s.deduction_fixed));
        setDedPct(String(s.deduction_percent_of_gross));
      })
      .catch((err) => toast.error(apiErrorMessage(err)))
      .finally(() => setSettingsLoading(false));
  }, []);

  const loadBrackets = useCallback(() => {
    setBracketsLoading(true);
    fetchPayrollTaxBrackets()
      .then(setBrackets)
      .catch((err) => toast.error(apiErrorMessage(err)))
      .finally(() => setBracketsLoading(false));
  }, []);

  useEffect(() => {
    loadSettings();
    loadBrackets();
  }, [loadSettings, loadBrackets]);

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    try {
      await updatePayrollSettings({
        deduction_fixed: parseFloat(dedFixed) || 0,
        deduction_percent_of_gross: parseFloat(dedPct) || 0,
      });
      toast.success("Settings saved");
      loadSettings();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSettingsSaving(false);
    }
  };

  const onDeleteBracket = async () => {
    if (!deleteId) return;
    setDeleteBusy(true);
    try {
      await deletePayrollTaxBracket(deleteId);
      toast.success("Bracket removed");
      setDeleteId(null);
      loadBrackets();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setDeleteBusy(false);
    }
  };

  const openCreateBracket = () => {
    setEditingBracket(null);
    setBracketDialogOpen(true);
  };

  const openEditBracket = (b: PayrollTaxBracket) => {
    setEditingBracket(b);
    setBracketDialogOpen(true);
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <Alert>
        <AlertTitle>Other deductions (not income tax)</AlertTitle>
        <AlertDescription className="text-muted-foreground space-y-2">
          <p>
            These are amounts taken out of pay <strong>after</strong> income tax is
            calculated from your brackets. Together they form the &quot;deductions&quot; line
            on payroll (alongside taxes).
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Fixed deduction (ETB)</strong> — the same flat amount for every employee
              each run (e.g. fixed pension fee, union, or recurring charge).
            </li>
            <li>
              <strong>Percent of gross (%)</strong> — an extra amount equal to gross salary ×
              (percent ÷ 100), e.g. 5% of gross for a pension scheme.
            </li>
          </ul>
          <p className="text-sm">
            Formula used:{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              other_deductions = fixed + (gross × percent ÷ 100)
            </code>
            . Then{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              net = gross − taxes − other_deductions
            </code>
            .
          </p>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Other deductions</CardTitle>
        </CardHeader>
        <CardContent>
          {settingsLoading ? (
            <Spinner className="h-6 w-6" />
          ) : (
            <form onSubmit={saveSettings} className="grid gap-4 max-w-md">
              <div className="grid gap-2">
                <Label htmlFor="ded_fixed">Fixed deduction (ETB)</Label>
                <Input
                  id="ded_fixed"
                  type="number"
                  min="0"
                  step="0.01"
                  value={dedFixed}
                  onChange={(e) => setDedFixed(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ded_pct">Percent of gross (%)</Label>
                <Input
                  id="ded_pct"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={dedPct}
                  onChange={(e) => setDedPct(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={settingsSaving} className="w-fit">
                {settingsSaving ? <Spinner className="h-4 w-4" /> : "Save settings"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Progressive tax brackets</CardTitle>
          <Button type="button" size="sm" onClick={openCreateBracket}>
            Add bracket
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Define bands on <strong>gross salary</strong>. Each row is a slice: from{" "}
            <strong>min</strong> up to <strong>max</strong> (leave max empty for no upper
            limit). The <strong>rate %</strong> applies to the portion of gross that falls
            inside that slice. Existing payroll rows keep a stored snapshot of the rules used
            when they were calculated.
          </p>
          {bracketsLoading ? (
            <Spinner className="h-6 w-6" />
          ) : brackets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No brackets defined.</p>
          ) : (
            <ul className="divide-y rounded-md border text-sm">
              {brackets.map((b) => (
                <li
                  key={b.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                >
                  <span>
                    {Number(b.min_inclusive).toLocaleString()} —{" "}
                    {b.max_inclusive == null
                      ? "∞"
                      : Number(b.max_inclusive).toLocaleString()}{" "}
                    <span className="text-muted-foreground">
                      @ {Number(b.rate_percent)}%
                    </span>
                  </span>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditBracket(b)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setDeleteId(b.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <BracketDialog
        open={bracketDialogOpen}
        onOpenChange={(open) => {
          setBracketDialogOpen(open);
          if (!open) setEditingBracket(null);
        }}
        bracket={editingBracket}
        onSaved={() => {
          setBracketDialogOpen(false);
          setEditingBracket(null);
          loadBrackets();
        }}
      />

      <ConfirmDialog
        open={deleteId != null}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete this tax bracket?"
        desc="Existing payroll records keep their stored calculation snapshot."
        handleConfirm={onDeleteBracket}
        isLoading={deleteBusy}
        destructive
        confirmText="Delete"
      />
    </div>
  );
}

function BracketDialog({
  bracket,
  open,
  onOpenChange,
  onSaved,
}: {
  bracket: PayrollTaxBracket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [minV, setMinV] = useState("");
  const [maxV, setMaxV] = useState("");
  const [rateV, setRateV] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (bracket) {
      setMinV(String(bracket.min_inclusive));
      setMaxV(
        bracket.max_inclusive == null ? "" : String(bracket.max_inclusive)
      );
      setRateV(String(bracket.rate_percent));
    } else {
      setMinV("");
      setMaxV("");
      setRateV("");
    }
  }, [open, bracket]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const min_inclusive = parseFloat(minV);
    const rate_percent = parseFloat(rateV);
    if (Number.isNaN(min_inclusive) || Number.isNaN(rate_percent)) {
      toast.error("Min and rate are required and must be numbers.");
      return;
    }
    const maxRaw = maxV.trim();
    let max_inclusive: number | null = null;
    if (maxRaw !== "") {
      const m = parseFloat(maxRaw);
      if (Number.isNaN(m)) {
        toast.error("Max must be a number or left empty for no upper limit.");
        return;
      }
      max_inclusive = m;
    }

    setBusy(true);
    try {
      if (bracket) {
        await updatePayrollTaxBracket(bracket.id, {
          min_inclusive,
          max_inclusive,
          rate_percent,
        });
        toast.success("Bracket updated");
      } else {
        await createPayrollTaxBracket({
          min_inclusive,
          max_inclusive,
          rate_percent,
        });
        toast.success("Bracket added");
      }
      onSaved();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{bracket ? "Edit bracket" : "New bracket"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-3">
          <div className="grid gap-1">
            <Label>Min (ETB, inclusive)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={minV}
              onChange={(e) => setMinV(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-1">
            <Label>Max (ETB, inclusive, empty = no cap)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={maxV}
              onChange={(e) => setMaxV(e.target.value)}
            />
          </div>
          <div className="grid gap-1">
            <Label>Rate (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={rateV}
              onChange={(e) => setRateV(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? <Spinner className="h-4 w-4" /> : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
