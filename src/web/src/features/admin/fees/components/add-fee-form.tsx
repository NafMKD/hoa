import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox"; // Ensure you have this component
import { toast } from "sonner";
import { createFee } from "../lib/fees";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { ApiError } from "@/types/api-error";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// 1. Define Schema
const feeSchema = z.object({
  name: z.string().min(1, "Fee name is required"),
  description: z.string().optional().or(z.literal("")),
  category: z.string().min(1, "Category is required"),
  amount: z
    .number("Amount must be a number")
    .min(0, "Amount must be positive"),
  is_recurring: z.boolean().optional(),
  recurring_period_months: z.number().optional(),
  is_penalizable: z.boolean().optional(),
})
.superRefine((data, ctx) => {
  // 2. Conditional Validation: If recurring, months are required
  if (data.is_recurring) {
    if (!data.recurring_period_months || data.recurring_period_months < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Period is required for recurring fees (min 1)",
        path: ["recurring_period_months"],
      });
    }
  }
});

type FormValues = z.infer<typeof feeSchema>;

interface AddFeeFormProps {
  onSuccess?: () => void;
}

export function AddFeeForm({ onSuccess }: AddFeeFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(feeSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      amount: 0,
      is_recurring: false,
      recurring_period_months: 1,
      is_penalizable: false,
    },
  });

  // Watch the recurring field to toggle the months input visibility
  const isRecurring = form.watch("is_recurring");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();

      // 3. Construct FormData manually to handle Booleans correctly for PHP/Laravel
      formData.append("name", values.name);
      formData.append("category", values.category);
      formData.append("amount", values.amount.toString());
      
      // Handle optional description
      if (values.description) formData.append("description", values.description);

      // Handle Booleans (Convert to 1 or 0)
      formData.append("is_recurring", values.is_recurring ? "1" : "0");
      formData.append("is_penalizable", values.is_penalizable ? "1" : "0");

      // Handle Conditional Number
      if (values.is_recurring && values.recurring_period_months) {
        formData.append("recurring_period_months", values.recurring_period_months.toString());
      }

      await createFee(formData);
      toast.success("Fee added successfully!");
      onSuccess?.();
    } catch (error) {
      const err = error as ApiError;
      if (err.status === 422 && err.data?.errors) {
        const fieldErrors = err.data.errors;
        Object.entries(fieldErrors).forEach(([field, messages]) => {
          // Map server errors to form fields
          // Note: ensure server field names match schema keys
          form.setError(field as keyof FormValues, {
            type: "server",
            message: Array.isArray(messages)
              ? messages[0]
              : (messages as string),
          });
        });
      } else {
        toast.error(err.message || "Failed to add fee");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Name & Category Row */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col gap-2 flex-1">
              <Label htmlFor="name">
                Fee Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g. Monthly Maintenance"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 flex-1">
              <Label htmlFor="category">
                Category <span className="text-red-500">*</span>
              </Label>
              <Controller
                control={form.control}
                name="category"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-full cursor-pointer">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={"monthly"}>Monthly</SelectItem>
                        <SelectItem value={"administrational"}>Administrational</SelectItem>
                        <SelectItem value={"special_assessment"}>Special Assessment</SelectItem>
                        <SelectItem value={"fine"}>Fine</SelectItem>
                        <SelectItem value={"other"}>Other</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.category && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.category.message}
                </p>
              )}
            </div>
          </div>

          {/* Amount */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="amount">
              Amount <span className="text-red-500">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...form.register("amount", { valueAsNumber: true })}
            />
            {form.formState.errors.amount && (
              <p className="text-sm text-red-500">
                {form.formState.errors.amount.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Details about this fee..."
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-500">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Recurring Logic */}
            <div className="space-y-3 rounded-md border p-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_recurring"
                  checked={isRecurring}
                  onCheckedChange={(checked) =>
                    form.setValue("is_recurring", checked as boolean)
                  }
                />
                <Label htmlFor="is_recurring" className="cursor-pointer">
                  Is this a recurring fee?
                </Label>
              </div>

              {isRecurring && (
                <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
                  <Label
                    htmlFor="recurring_period_months"
                    className="text-xs text-muted-foreground"
                  >
                    Repeat every (Months){" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="recurring_period_months"
                    type="number"
                    min="1"
                    {...form.register("recurring_period_months", {
                      valueAsNumber: true,
                    })}
                  />
                  {form.formState.errors.recurring_period_months && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.recurring_period_months.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Penalizable Logic */}
            <div className="space-y-3 rounded-md border p-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_penalizable"
                  checked={form.watch("is_penalizable")}
                  onCheckedChange={(checked) =>
                    form.setValue("is_penalizable", checked as boolean)
                  }
                />
                <Label htmlFor="is_penalizable" className="cursor-pointer">
                  Can this fee incur penalties?
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                If checked, late payments for this fee may generate automatic
                penalty records based on system settings.
              </p>
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full mt-4">
            {isSubmitting ? (
              <>
                <Spinner className="mr-2" /> Submitting...
              </>
            ) : (
              "Add Fee"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground">
          Fields marked with <span className="text-red-500">*</span> are
          required.
        </p>
      </CardFooter>
    </Card>
  );
}