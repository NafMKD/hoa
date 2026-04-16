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
  createExpense,
  fetchExpenseCategoriesActive,
  fetchVendorsAll,
} from "../lib/expenses";
import type { ExpenseCategory, ExpenseVendor } from "@/types/types";

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

interface AddExpenseFormProps {
  onSuccess?: () => void;
}

export function AddExpenseForm({ onSuccess }: AddExpenseFormProps) {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [vendors, setVendors] = useState<ExpenseVendor[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      expense_category_id: "",
      vendor_id: "",
      description: "",
      amount: 0,
      invoice_number: "",
      status: "unpaid",
      expense_date: new Date().toISOString().slice(0, 10),
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
      await createExpense({
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
      toast.success("Expense created");
      form.reset({
        ...form.formState.defaultValues,
        expense_date: new Date().toISOString().slice(0, 10),
      });
      onSuccess?.();
    } catch (err) {
      const e = err as ApiError;
      const msg =
        (e.data as { message?: string })?.message ?? "Could not create expense";
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
            {form.formState.errors.expense_category_id && (
              <p className="text-sm text-destructive">
                {form.formState.errors.expense_category_id.message}
              </p>
            )}
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
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...form.register("description")} />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="amount">Amount (ETB)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              {...form.register("amount", { valueAsNumber: true })}
            />
            {form.formState.errors.amount && (
              <p className="text-sm text-destructive">
                {form.formState.errors.amount.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="invoice_number">Invoice # (optional)</Label>
            <Input id="invoice_number" {...form.register("invoice_number")} />
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
            <Label htmlFor="expense_date">Expense date</Label>
            <Input id="expense_date" type="date" {...form.register("expense_date")} />
            {form.formState.errors.expense_date && (
              <p className="text-sm text-destructive">
                {form.formState.errors.expense_date.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? <Spinner className="h-4 w-4" /> : "Save expense"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
