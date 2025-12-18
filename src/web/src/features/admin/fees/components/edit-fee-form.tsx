import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { updateFee } from "../lib/fees";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { ApiError } from "@/types/api-error";
import type { Fee } from "@/types/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// 1. Define Schema (Same as Add Form)
const feeSchema = z.object({
  name: z.string().min(1, "Fee name is required"),
  description: z.string().optional().or(z.literal("")),
  category: z.string().min(1, "Category is required"),
  amount: z
    .number("Amount must be a number")
    .min(0, "Amount must be positive"),
  is_recurring: z.boolean(),
  recurring_period_months: z.number().optional(),
  is_penalizable: z.boolean(),
})
.superRefine((data, ctx) => {
  if (data.is_recurring) {
    if (!data.recurring_period_months || data.recurring_period_months < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Period is required for recurring fees",
        path: ["recurring_period_months"],
      });
    }
  }
});

type FormValues = z.infer<typeof feeSchema>;

interface EditFeeFormProps {
  fee: Fee;
  onSuccess?: () => void;
}

export function EditFeeForm({ fee, onSuccess }: EditFeeFormProps) {
  // 2. Initialize form with existing data
  const form = useForm<FormValues>({
    resolver: zodResolver(feeSchema),
    defaultValues: {
      name: fee.name,
      category: fee.category,
      amount: Number(fee.amount), 
      description: fee.description ?? "",
      is_recurring: !!fee.is_recurring, 
      recurring_period_months: fee.recurring_period_months ?? 1,
      is_penalizable: !!fee.is_penalizable,
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Watch recurring state for conditional UI
  const isRecurring = form.watch("is_recurring");

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();

      // 3. Explicitly construct FormData to handle Boolean -> "1"/"0" conversion
      // and PUT/PATCH specific logic
      formData.append("_method", "PUT"); // Often helpful for Laravel FormData updates
      formData.append("name", values.name);
      formData.append("category", values.category);
      formData.append("amount", values.amount.toString());
      
      if (values.description) {
        formData.append("description", values.description);
      } else {
         // If user cleared description, send empty string to update DB
        formData.append("description", "");
      }

      // Handle Booleans
      formData.append("is_recurring", values.is_recurring ? "1" : "0");
      formData.append("is_penalizable", values.is_penalizable ? "1" : "0");

      // Handle Conditional Logic
      if (values.is_recurring && values.recurring_period_months) {
        formData.append("recurring_period_months", values.recurring_period_months.toString());
      } else {
        // If switched to non-recurring, you might want to nullify this in DB
        // Check your API requirement, usually sending null or excluding works
        formData.append("recurring_period_months", ""); 
      }

      await updateFee(fee.id, formData);

      toast.success("Fee updated successfully!");
      onSuccess?.();
    } catch (error) {
      const err = error as ApiError;
      if (err.status === 422 && err.data?.errors) {
        const fieldErrors = err.data.errors;
        Object.entries(fieldErrors).forEach(([field, messages]) => {
          form.setError(field as keyof FormValues, {
            type: "server",
            message: Array.isArray(messages) ? messages[0] : (messages as string),
          });
        });
      } else {
        toast.error(err.message || "Failed to update fee");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Name & Category */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col gap-2 flex-1">
              <Label htmlFor="name">
                Fee Name <span className="text-red-500">*</span>
              </Label>
              <Input id="name" {...form.register("name")} />
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
                        <SelectItem value={"administrational"}>Administrational</SelectItem>
                        <SelectItem value={"special_assessment"}>Special Assessment</SelectItem>
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
            <Textarea id="description" {...form.register("description")} />
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
                  onCheckedChange={(checked) => form.setValue("is_recurring", checked as boolean)}
                />
                <Label htmlFor="is_recurring" className="cursor-pointer">
                  Is recurring?
                </Label>
              </div>

              {isRecurring && (
                <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
                  <Label htmlFor="recurring_period_months" className="text-xs text-muted-foreground">
                    Repeat every (Months)
                  </Label>
                  <Input
                    id="recurring_period_months"
                    type="number"
                    min="1"
                    {...form.register("recurring_period_months", { valueAsNumber: true })}
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
                  onCheckedChange={(checked) => form.setValue("is_penalizable", checked as boolean)}
                />
                <Label htmlFor="is_penalizable" className="cursor-pointer">
                  Is penalizable?
                </Label>
              </div>
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full mt-4">
            {isSubmitting ? (
              <>
                <Spinner className="mr-2" /> Updating...
              </>
            ) : (
              "Update Fee"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground">
          Fields marked with <span className="text-red-500">*</span> are required.
        </p>
      </CardFooter>
    </Card>
  );
}