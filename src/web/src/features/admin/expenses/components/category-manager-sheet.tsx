import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  createExpenseCategory,
  deleteExpenseCategory,
  fetchExpenseCategories,
  updateExpenseCategory,
} from "../lib/expenses";
import type { ExpenseCategory } from "@/types/types";
import type { ApiError } from "@/types/api-error";
import { useDebounce } from "use-debounce";
import { Badge } from "@/components/ui/badge";

export function CategoryManagerSheet() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 400);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchExpenseCategories("1", "100", debouncedSearch);
      setRows(res.data);
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const handleCreate = async () => {
    if (!name.trim() || !code.trim()) {
      toast.error("Name and code are required");
      return;
    }
    setSaving(true);
    try {
      await createExpenseCategory({
        name: name.trim(),
        code: code.trim().toLowerCase().replace(/\s+/g, "_"),
        sort_order: rows.length + 1,
        is_active: true,
      });
      toast.success("Category created");
      setName("");
      setCode("");
      await load();
    } catch (err) {
      const e = err as ApiError;
      const msg =
        (e.data as { message?: string })?.message ?? "Could not create category";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (row: ExpenseCategory) => {
    if (row.is_system && !row.is_active) {
      toast.error("Cannot re-activate disabled system categories here");
      return;
    }
    try {
      await updateExpenseCategory(row.id, { is_active: !row.is_active });
      toast.success("Category updated");
      await load();
    } catch (err) {
      const e = err as ApiError;
      toast.error(
        (e.data as { message?: string })?.message ?? "Update failed"
      );
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteExpenseCategory(deleteTarget.id);
      toast.success("Category deleted");
      setDeleteTarget(null);
      await load();
    } catch (err) {
      const e = err as ApiError;
      toast.error(
        (e.data as { message?: string })?.message ?? "Could not delete"
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            Categories
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Expense categories</SheetTitle>
            <SheetDescription>
              Add custom categories. System categories (e.g. Payroll) cannot be
              deleted.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-3">
            <Input
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="grid gap-2 rounded-md border p-3">
              <Label>New category</Label>
              <Input
                placeholder="Display name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                placeholder="Code (e.g. landscaping)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <Button
                type="button"
                size="sm"
                onClick={handleCreate}
                disabled={saving}
              >
                {saving ? <Spinner className="h-4 w-4" /> : "Add category"}
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Spinner className="h-8 w-8" />
              </div>
            ) : (
              <ul className="space-y-2">
                {rows.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                  >
                    <div>
                      <span className="font-medium">{row.name}</span>
                      <span className="ml-2 text-muted-foreground">
                        ({row.code})
                      </span>
                      {row.is_system && (
                        <Badge variant="secondary" className="ml-2">
                          system
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(row)}
                      >
                        {row.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      {!row.is_system && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setDeleteTarget(row)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete category?"
        desc="This cannot be undone if no expenses use this category."
        handleConfirm={confirmDelete}
        isLoading={deleting}
        destructive
        confirmText="Delete"
      />
    </>
  );
}
