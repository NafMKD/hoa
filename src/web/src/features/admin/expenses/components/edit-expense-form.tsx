import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { ApiError } from "@/types/api-error";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchExpenseCategoriesActive,
  fetchVendorsAll,
  updateExpense,
} from "../lib/expenses";
import type { Expense, ExpenseCategory, ExpenseVendor } from "@/types/types";

const schema = z.object({
  expense_category_id: z.string().min(1, "Category is required"),
  vendor_id: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  invoice_number: z.string().optional(),
  status: z.enum(["unpaid", "partially_paid", "paid"]),
  expense_date: z.string().min(1, "Date is required"),
});

type FormValues = z.infer<typeof schema>;

interface EditExpenseFormProps {
  expense: Expense;
  onSuccess?: () => void;
}

export function EditExpenseForm({ expense, onSuccess }: EditExpenseFormProps) {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [vendors, setVendors] = useState<ExpenseVendor[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      expense_category_id: String(expense.expense_category_id),
      vendor_id: expense.vendor_id ? String(expense.vendor_id) : "",
      description: expense.description,
      amount: expense.amount,
      invoice_number: expense.invoice_number ?? "",
      status: expense.status,
      expense_date: expense.expense_date.slice(0, 10),
    },
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cats, vends] = await Promise.all([
          fetchExpenseCategoriesActive(),
          fetchVendorsAll(),
        ]);
        if (!cancelled) {
          setCategories(cats);
          setVendors(vends);
        }
      } catch {
        toast.error("Failed to load categories or vendors");
      } finally {
        if (!cancelled) setLoadingRefs(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      await updateExpense(expense.id, {
        expense_category_id: parseInt(values.expense_category_id, 10),
        vendor_id: values.vendor_id
          ? parseInt(values.vendor_id, 10)
          : null,
        description: values.description,
        amount: values.amount,
        invoice_number: values.invoice_number || null,
        status: values.status,
        expense_date: values.expense_date,
      });
      toast.success("Expense updated");
      onSuccess?.();
    } catch (err) {
      const e = err as ApiError;
      const msg =
        (e.data as { message?: string })?.message ?? "Could not update expense";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingRefs) {
    return (
      <div className="flex justify-center py-8">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card className="border-0 shadow-none">
        <CardContent className="grid gap-4 pt-2">
          <div className="grid gap-2">
            <Label>Category</Label>
            <Select
              value={form.watch("expense_category_id")}
              onValueChange={(v) => form.setValue("expense_category_id", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                    {c.is_system ? " (system)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Vendor (optional)</Label>
            <Select
              value={form.watch("vendor_id") || "__none__"}
              onValueChange={(v) =>
                form.setValue("vendor_id", v === "__none__" ? "" : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="No vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No vendor</SelectItem>
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={String(v.id)}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea id="edit-description" {...form.register("description")} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-amount">Amount (ETB)</Label>
            <Input
              id="edit-amount"
              type="number"
              step="0.01"
              {...form.register("amount", { valueAsNumber: true })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-invoice_number">Invoice # (optional)</Label>
            <Input id="edit-invoice_number" {...form.register("invoice_number")} />
          </div>

          <div className="grid gap-2">
            <Label>Status</Label>
            <Select
              value={form.watch("status")}
              onValueChange={(v) =>
                form.setValue("status", v as FormValues["status"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="partially_paid">Partially paid</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-expense_date">Expense date</Label>
            <Input
              id="edit-expense_date"
              type="date"
              {...form.register("expense_date")}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? <Spinner className="h-4 w-4" /> : "Update expense"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
