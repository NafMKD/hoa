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
import { useAuthStore } from "@/stores/auth-store";
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

export function PayrollRulesPage() {
  const role = useAuthStore((s) => s.user?.role);
  const isAdmin = role === "admin";

  if (!isAdmin) {
    return (
      <Main>
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Payroll rules</h2>
          <p className="text-muted-foreground mt-2">
            Only administrators can edit tax brackets and payroll deduction settings.
          </p>
        </div>
      </Main>
    );
  }

  return (
    <Main>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Payroll rules</h2>
        <p className="text-muted-foreground">
          Progressive tax brackets and other deductions used for new payroll calculations.
          Snapshots are stored on each payroll row so past months stay correct if you change
          these values later.
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
  const [editing, setEditing] = useState<PayrollTaxBracket | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const loadSettings = useCallback(() => {
    setSettingsLoading(true);
    fetchPayrollSettings()
      .then((s) => {
        setDedFixed(String(s.deduction_fixed));
        setDedPct(String(s.deduction_percent_of_gross));
      })
      .catch(() => toast.error("Could not load settings"))
      .finally(() => setSettingsLoading(false));
  }, []);

  const loadBrackets = useCallback(() => {
    setBracketsLoading(true);
    fetchPayrollTaxBrackets()
      .then(setBrackets)
      .catch(() => toast.error("Could not load tax brackets"))
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
      const e = err as ApiError;
      toast.error(
        (e.data as { message?: string })?.message ?? "Could not save settings"
      );
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
      const e = err as ApiError;
      toast.error(
        (e.data as { message?: string })?.message ?? "Could not delete"
      );
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
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
          <Button type="button" size="sm" onClick={() => setCreating(true)}>
            Add bracket
          </Button>
        </CardHeader>
        <CardContent>
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
                      onClick={() => setEditing(b)}
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
        open={creating}
        onOpenChange={setCreating}
        onSaved={() => {
          setCreating(false);
          loadBrackets();
        }}
      />
      <BracketDialog
        bracket={editing ?? undefined}
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        onSaved={() => {
          setEditing(null);
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
  bracket?: PayrollTaxBracket;
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
    setBusy(true);
    try {
      const min_inclusive = parseFloat(minV);
      const rate_percent = parseFloat(rateV);
      if (Number.isNaN(min_inclusive) || Number.isNaN(rate_percent)) {
        toast.error("Min and rate are required");
        return;
      }
      const maxRaw = maxV.trim();
      const max_inclusive =
        maxRaw === "" ? null : parseFloat(maxRaw);

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
      const er = err as ApiError;
      toast.error(
        (er.data as { message?: string })?.message ?? "Could not save bracket"
      );
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
            <Button type="submit" disabled={busy}>
              {busy ? <Spinner className="h-4 w-4" /> : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
