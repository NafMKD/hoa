import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPayment } from "../lib/payments";
import { toast } from "sonner";
import { InvoiceSelect } from "../../invoices/components/invoice-select";
import type { ApiError } from "@/types/api-error";

// Zod schema matching API validation
const formSchema = z.object({
  invoice_id: z.number().min(1, "Invoice ID is required"),
  amount: z.number().min(0, "Amount must be positive"),
  method: z.string().min(1, "Payment method is required"),
  reference: z.string().min(12, "Reference is required, and should be 12 char long.").max(12),
  payment_date: z.string().min(1, "Payment date is required"),
});

interface AddPaymentModalProps {
  onSuccess: () => void;
  invoiceId?: number | null;
  amount?: number;
  paymentDate?: string;
}

type FormValues = z.infer<typeof formSchema>;

export function AddPaymentModal({ onSuccess, invoiceId, amount, paymentDate }: AddPaymentModalProps) {  
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasInvoiceId = typeof invoiceId === "number" && invoiceId > 0;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      method: "bank_transfer",
      reference: "",
      payment_date: paymentDate ?? new Date().toISOString().split("T")[0],
      ...(hasInvoiceId ? { invoice_id: invoiceId } : {}),
    },
  });

  // If invoiceId changes while component is mounted, keep form in sync
  useEffect(() => {
    if (hasInvoiceId) {
      form.setValue("invoice_id", invoiceId!, {
        shouldValidate: true,
        shouldDirty: true,
      });
      form.clearErrors("invoice_id");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasInvoiceId, invoiceId]);

  // When closing, reset but keep invoiceId if provided
  const resetForm = () => {
    form.reset({
      amount: 0,
      method: "bank_transfer",
      reference: "",
      payment_date: paymentDate ?? new Date().toISOString().split("T")[0],
      ...(hasInvoiceId ? { invoice_id: invoiceId! } : {}),
    });
  };

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const payload: FormValues = hasInvoiceId
        ? { ...values, invoice_id: invoiceId! }
        : values;
      await createPayment(payload);
      toast.success("Payment recorded successfully");
      setOpen(false);
      resetForm();
      onSuccess();
    } catch (error) {
      const err = error as ApiError;
      if (err.status === 422 && err.data?.errors) {
        const fieldErrors = err.data.errors;
        Object.entries(fieldErrors).forEach(([field, messages]) => {
          form.setError(field as keyof FormValues, {
            type: "server",
            message: Array.isArray(messages)
              ? messages[0]
              : (messages as string),
          });
        });
      } else {
        toast.error(
          err.data?.message ||
            "Failed to record payment. Please check your inputs."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleAllAmount = () => {
    form.setValue("amount", amount ?? 0);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Fields marked with <span className="text-red-500">*</span> are
            required.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!hasInvoiceId ? (
              <FormField
                control={form.control}
                name="invoice_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Invoice Ref <span className="text-red-500">*</span>
                    </FormLabel>
                    <InvoiceSelect
                      value={field.value ?? null}
                      onChange={field.onChange}
                      status={["issued", "partial", "overdue"]}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="invoice_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Invoice Ref <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value ?? invoiceId ?? ""}
                        disabled
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Amount <span className="text-red-500">*</span> <span className="text-muted-foreground cursor-pointer" onClick={handleAllAmount}>(All)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Method <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="bank_transfer">
                          Bank Transfer
                        </SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Reference / Receipt #{" "}
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="FT88291..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Payment Date <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Payment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
