import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateBuilding } from "../lib/buildings"; 
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { ApiError } from "@/types/api-error";
import type { Building } from "@/types/types";
import { Textarea } from "@/components/ui/textarea";

const buildingSchema = z.object({
  name: z.string().min(1, "Building name is required"),
  floors: z
    .number("Floors must be a number")
    .min(1, "Building must have at least 1 floor"),
  units_per_floor: z
    .number("Units per floor must be a number")
    .min(1, "There must be at least 1 unit per floor"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof buildingSchema>;

interface EditBuildingFormProps {
  building: Building;
  onSuccess?: () => void;
}

export function EditBuildingForm({ building, onSuccess }: EditBuildingFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(buildingSchema),
    defaultValues: {
      name: building.name,
      floors: building.floors,
      units_per_floor: building.units_per_floor,
      notes: building.notes ?? "",
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();

      for (const [key, value] of Object.entries(values)) {
        const originalValue = (building as any)[key];
        if (value !== undefined && value !== originalValue) {
          formData.append(key, value.toString());
        }
      }

      await updateBuilding(building.id, formData);

      toast.success("Building updated successfully!");
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
        toast.error(err.message || "Failed to update building");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">
              Building Name <span className="text-red-500">*</span>
            </Label>
            <Input id="name" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="flex items-start gap-4">
            {/* Floors */}
            <div className="flex flex-col gap-2 basis-1/2">
              <Label htmlFor="floors">
                Floors <span className="text-red-500">*</span>
              </Label>
              <Input
                id="floors"
                type="number"
                {...form.register("floors", { valueAsNumber: true })}
              />
              {form.formState.errors.floors && (
                <p className="text-sm text-red-500">{form.formState.errors.floors.message}</p>
              )}
            </div>

            {/* Units Per Floor */}
            <div className="flex flex-col gap-2 basis-1/2">
              <Label htmlFor="units_per_floor">
                Units / Floor <span className="text-red-500">*</span>
              </Label>
              <Input
                id="units_per_floor"
                type="number"
                {...form.register("units_per_floor", { valueAsNumber: true })}
              />
              {form.formState.errors.units_per_floor && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.units_per_floor.message}
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...form.register("notes")} />
            {form.formState.errors.notes && (
              <p className="text-sm text-red-500">
                {form.formState.errors.notes.message}
              </p>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Spinner />
                Updating...
              </>
            ) : (
              "Update Building"
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
