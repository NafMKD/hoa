import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateUnit } from "../lib/units";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { ApiError } from "@/types/api-error";
import type { Unit } from "@/types/types";

const unitSchema = z.object({
  name: z.string().min(1, "Unit name is required"),
  floor_number: z
    .number("Floor number must be a number")
    .min(0, "Floor number must be at least 0"),
  unit_type: z.string().min(1, "Unit type is required"),
  size_m2: z
    .number("Size must be a number")
    .min(1, "Size must be at least 1 sqm"),
  status: z
    .enum(["vacant", "occupied", "maintenance"])
    .refine((val) => val !== undefined, {
      message: "Status is required",
    }),
});

type FormValues = z.infer<typeof unitSchema>;

interface EditUnitFormProps {
  unit: Unit;
  onSuccess?: () => void;
}

export function EditUnitForm({ unit, onSuccess }: EditUnitFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      name: unit.name,
      floor_number: unit.floor_number as number,
      unit_type: unit.unit_type,
      size_m2: unit.size_m2 as number,
      status: unit.status as FormValues["status"],
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();

      for (const [key, value] of Object.entries(values)) {
        const originalValue = (unit as any)[key];
        if (value !== undefined && value !== originalValue) {
          formData.append(key, value.toString());
        }
      }

      await updateUnit(unit.id, formData);

      toast.success("Unit updated successfully!", { position: "top-right" });
      onSuccess?.();
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
        toast.error(err.message || "Failed to update unit", {
          position: "top-right",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Unit Name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">
              Unit Name <span className="text-red-500">*</span>
            </Label>
            <Input id="name" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Floor Number & Unit Type */}
          <div className="flex items-start gap-4">
            <div className="flex flex-col gap-2 basis-1/2">
              <Label htmlFor="floor_number">
                Floor Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="floor_number"
                type="number"
                {...form.register("floor_number", { valueAsNumber: true })}
              />
              {form.formState.errors.floor_number && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.floor_number.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 basis-1/2">
              <Label htmlFor="unit_type">
                Unit Type <span className="text-red-500">*</span>
              </Label>
              <Input id="unit_type" {...form.register("unit_type")} />
              {form.formState.errors.unit_type && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.unit_type.message}
                </p>
              )}
            </div>
          </div>

          {/* Size & Status */}
          <div className="flex items-start gap-4">
            <div className="flex flex-col gap-2 basis-1/2">
              <Label htmlFor="size_m2">
                Size (m²) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="size_m2"
                type="number"
                {...form.register("size_m2", { valueAsNumber: true })}
              />
              {form.formState.errors.size_m2 && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.size_m2.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 basis-1/2">
              <Label htmlFor="status">
                Status <span className="text-red-500">*</span>
              </Label>
              <Input id="status" {...form.register("status")} />
              {form.formState.errors.status && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.status.message}
                </p>
              )}
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Spinner /> Updating...
              </>
            ) : (
              "Update Unit"
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
