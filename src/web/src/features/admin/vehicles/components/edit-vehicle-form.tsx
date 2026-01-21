import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateVehicle } from "../lib/vehicles";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { ApiError } from "@/types/api-error";
import type { Vehicle } from "@/types/types";

const vehicleSchema = z.object({
  unit_id: z.number().optional(), 
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
  vehicle_document: z.any().optional(), 
});

type FormValues = z.infer<typeof vehicleSchema>;

interface EditVehicleFormProps {
  vehicle: Vehicle;
  unitName: string;
  onSuccess?: () => void;
}

export function EditVehicleForm({ vehicle, unitName, onSuccess }: EditVehicleFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      unit_id: vehicle.unit?.id as number,
      make: vehicle.make,
      model: vehicle.model,
      year: Number(vehicle.year),
      license_plate: vehicle.license_plate,
      color: vehicle.color ?? "",
      vehicle_document: undefined,
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();

      formData.append("_method", "PUT");

      formData.append("make", values.make);
      formData.append("model", values.model);
      formData.append("year", values.year.toString());
      formData.append("license_plate", values.license_plate);

      if (values.color !== undefined) {
        formData.append("color", values.color || "");
      }

      if (values.vehicle_document instanceof File) {
        formData.append("vehicle_document", values.vehicle_document);
      }

      await updateVehicle(vehicle.id, formData);

      toast.success("Vehicle updated successfully!");
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
        toast.error(err.message || "Failed to update vehicle");
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
          <div className="flex flex-col gap-2">
            <Label>Unit</Label>
            <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground bg-muted/30">
              {unitName}
            </div>
          </div>

          {/* Make & Model */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col gap-2 flex-1">
              <Label htmlFor="make">
                Make <span className="text-red-500">*</span>
              </Label>
              <Input id="make" {...form.register("make")} />
              {form.formState.errors.make && (
                <p className="text-sm text-red-500">{form.formState.errors.make.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2 flex-1">
              <Label htmlFor="model">
                Model <span className="text-red-500">*</span>
              </Label>
              <Input id="model" {...form.register("model")} />
              {form.formState.errors.model && (
                <p className="text-sm text-red-500">{form.formState.errors.model.message}</p>
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
                <p className="text-sm text-red-500">{form.formState.errors.year.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2 flex-1">
              <Label htmlFor="license_plate">
                License Plate <span className="text-red-500">*</span>
              </Label>
              <Input id="license_plate" {...form.register("license_plate")} />
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
            <Input id="color" {...form.register("color")} />
            {form.formState.errors.color && (
              <p className="text-sm text-red-500">{form.formState.errors.color.message}</p>
            )}
          </div>

          {/* Replace Document (optional) */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="vehicle_document">Replace Vehicle Document (optional)</Label>
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
              Accepted: JPG/JPEG/PNG/PDF. Leave empty to keep current document.
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
                <Spinner className="mr-2" /> Updating...
              </>
            ) : (
              "Update Vehicle"
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
