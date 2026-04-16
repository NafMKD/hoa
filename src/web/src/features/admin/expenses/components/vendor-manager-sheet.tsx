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
  createVendor,
  deleteVendor,
  fetchVendorsPage,
  updateVendor,
} from "../lib/expenses";
import type { ExpenseVendor } from "@/types/types";
import type { ApiError } from "@/types/api-error";
import { useDebounce } from "use-debounce";
import { useAuthStore } from "@/stores/auth-store";

export function VendorManagerSheet() {
  const userRole = useAuthStore((s) => s.user?.role);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ExpenseVendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 400);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<ExpenseVendor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseVendor | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchVendorsPage("1", "100", debouncedSearch);
      setRows(res.data);
    } catch {
      toast.error("Failed to load vendors");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const startEdit = (v: ExpenseVendor) => {
    setEditing(v);
    setName(v.name);
    setPhone(v.phone ?? "");
    setEmail(v.email ?? "");
    setAddress(v.address ?? "");
  };

  const cancelEdit = () => {
    setEditing(null);
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateVendor(editing.id, {
          name: name.trim(),
          phone: phone || null,
          email: email || null,
          address: address || null,
        });
        toast.success("Vendor updated");
      } else {
        await createVendor({
          name: name.trim(),
          phone: phone || null,
          email: email || null,
          address: address || null,
        });
        toast.success("Vendor created");
      }
      cancelEdit();
      await load();
    } catch (err) {
      const e = err as ApiError;
      toast.error(
        (e.data as { message?: string })?.message ?? "Could not save vendor"
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteVendor(deleteTarget.id);
      toast.success("Vendor deleted");
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
            Vendors
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Vendors</SheetTitle>
            <SheetDescription>
              Vendor directory for expense lines. Names must be unique.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-3">
            <Input
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="grid gap-2 rounded-md border p-3">
              <Label>{editing ? "Edit vendor" : "New vendor"}</Label>
              <Input
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                placeholder="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Input
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                placeholder="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? <Spinner className="h-4 w-4" /> : editing ? "Update" : "Add"}
                </Button>
                {editing && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={cancelEdit}
                  >
                    Cancel
                  </Button>
                )}
              </div>
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
                      <div className="font-medium">{row.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {[row.phone, row.email].filter(Boolean).join(" · ") ||
                          "—"}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(row)}
                      >
                        Edit
                      </Button>
                      {userRole === "admin" && (
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
        title="Delete vendor?"
        desc="Only allowed when no expenses reference this vendor."
        handleConfirm={confirmDelete}
        isLoading={deleting}
        destructive
        confirmText="Delete"
      />
    </>
  );
}
