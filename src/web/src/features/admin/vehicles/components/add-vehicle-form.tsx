import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createVehicle } from "../lib/vehicles";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { ApiError } from "@/types/api-error";
import { UnitSelect } from "../../units/components/unit-select";

const vehicleSchema = z.object({
  unit_id: z
    .number("Unit is required")
    .min(1, "Unit is required"),
  make: z.string().min(1, "Make is required").max(255),
  model: z.string().min(1, "Model is required").max(255),
  year: z
    .number("Year must be a number")
    .min(1900, "Year must be >= 1900")
    .max(new Date().getFullYear() + 1, "Year is too large"),
  license_plate: z
    .string()
    .min(8, "License plate must be at least 8 characters")
    .max(9, "License plate must be at most 9 characters"),
  color: z.string().max(255).optional().or(z.literal("")),
  vehicle_document: z
    .any()
    .refine((file) => file instanceof File, "Vehicle document is required")
    .refine(
      (file) =>
        !file ||
        ["image/jpeg", "image/jpg", "image/png", "application/pdf"].includes(
          (file as File).type
        ),
      "Document must be jpg, jpeg, png, or pdf"
    ),
});

type FormValues = z.infer<typeof vehicleSchema>;

interface AddVehicleFormProps {
  onSuccess?: () => void;
}

export function AddVehicleForm({ onSuccess}: AddVehicleFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      unit_id: undefined as unknown as number,
      make: "",
      model: "",
      year: new Date().getFullYear(),
      license_plate: "",
      color: "",
      vehicle_document: undefined,
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();

      formData.append("unit_id", values.unit_id.toString());
      formData.append("make", values.make);
      formData.append("model", values.model);
      formData.append("year", values.year.toString());
      formData.append("license_plate", values.license_plate);

      if (values.color) formData.append("color", values.color);

      // required file
      formData.append("vehicle_document", values.vehicle_document as File);

      await createVehicle(formData);
      toast.success("Vehicle added successfully!");
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
        toast.error(err.message || "Failed to add vehicle");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const accept = ".jpg,.jpeg,.png,.pdf";

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Unit */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="unit_id">
              Unit <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="unit_id"
              control={form.control}
              render={({ field }) => (
                <UnitSelect
                  value={field.value}
                  onChange={(val) => field.onChange(val)}
                  error={form.formState.errors.unit_id?.message}

                />
              )}
            />

            {form.formState.errors.unit_id && (
              <p className="text-sm text-red-500">
                {form.formState.errors.unit_id.message}
              </p>
            )}
          </div>

          {/* Make & Model */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col gap-2 flex-1">
              <Label htmlFor="make">
                Make <span className="text-red-500">*</span>
              </Label>
              <Input
                id="make"
                placeholder="e.g. Toyota"
                {...form.register("make")}
              />
              {form.formState.errors.make && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.make.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 flex-1">
              <Label htmlFor="model">
                Model <span className="text-red-500">*</span>
              </Label>
              <Input
                id="model"
                placeholder="e.g. Corolla"
                {...form.register("model")}
              />
              {form.formState.errors.model && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.model.message}
                </p>
              )}
            </div>
          </div>

          {/* Year & License Plate */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col gap-2 flex-1">
              <Label htmlFor="year">
                Year <span className="text-red-500">*</span>
              </Label>
              <Input
                id="year"
                type="number"
                min={1900}
                max={new Date().getFullYear() + 1}
                {...form.register("year", { valueAsNumber: true })}
              />
              {form.formState.errors.year && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.year.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 flex-1">
              <Label htmlFor="license_plate">
                License Plate <span className="text-red-500">*</span>
              </Label>
              <Input
                id="license_plate"
                placeholder="e.g. 3AAB12345"
                {...form.register("license_plate")}
              />
              {form.formState.errors.license_plate && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.license_plate.message}
                </p>
              )}
            </div>
          </div>

          {/* Color */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="color">Color</Label>
            <Input
              id="color"
              placeholder="e.g. White"
              {...form.register("color")}
            />
            {form.formState.errors.color && (
              <p className="text-sm text-red-500">
                {form.formState.errors.color.message}
              </p>
            )}
          </div>

          {/* Document Upload */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="vehicle_document">
              Vehicle Document <span className="text-red-500">*</span>
            </Label>
            <Input
              id="vehicle_document"
              type="file"
              accept={accept}
              onChange={(e) => {
                const file = e.target.files?.[0];
                form.setValue("vehicle_document", file as unknown as File, {
                  shouldValidate: true,
                });
              }}
            />
            <p className="text-xs text-muted-foreground">
              Accepted: JPG/JPEG/PNG/PDF. Max size enforced by server.
            </p>
            {form.formState.errors.vehicle_document && (
              <p className="text-sm text-red-500">
                {form.formState.errors.vehicle_document.message as string}
              </p>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full mt-4">
            {isSubmitting ? (
              <>
                <Spinner className="mr-2" /> Submitting...
              </>
            ) : (
              "Add Vehicle"
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
