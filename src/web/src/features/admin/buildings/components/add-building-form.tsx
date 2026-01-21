import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createBuilding } from "../lib/buildings";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { ApiError } from "@/types/api-error";

const buildingSchema = z.object({
  name: z.string().min(1, "Building name is required"),
  floors: z
    .number("Floors must be a number")
    .min(1, "There must be at least 1 floor"),
  units_per_floor: z
    .number( "Units per floor must be a number")
    .min(1, "There must be at least 1 unit per floor"),
  notes: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof buildingSchema>;

interface AddBuildingFormProps {
  onSuccess?: () => void;
}

export function AddBuildingForm({ onSuccess }: AddBuildingFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(buildingSchema),
    defaultValues: {
      floors: 1,
      units_per_floor: 1,
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();

      for (const [key, value] of Object.entries(values)) {
        formData.append(key, value.toString());
      }

      await createBuilding(formData);
      toast.success("Building added successfully!");
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
        toast.error(err.message || "Failed to add building");
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
              <p className="text-sm text-red-500">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Floors & Units per Floor */}
          <div className="flex items-start gap-4">
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
                <p className="text-sm text-red-500">
                  {form.formState.errors.floors.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 basis-1/2">
              <Label htmlFor="units_per_floor">
                Units per Floor <span className="text-red-500">*</span>
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
                <Spinner /> Submitting...
              </>
            ) : (
              "Add Building"
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
