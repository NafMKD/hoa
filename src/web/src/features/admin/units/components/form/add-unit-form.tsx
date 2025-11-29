import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { ApiError } from "@/types/api-error";
import { createUnit } from "../../lib/units";
import type { IdNamePair } from "@/types/types";
import { Skeleton } from "@/components/ui/skeleton";
import { zodResolver } from "@hookform/resolvers/zod";
import { fetchBuildingNames } from "../../../buildings/lib/buildings";

interface AddUnitFormProps {
  onSuccess?: () => void;
}

export function AddUnitForm({ onSuccess }: AddUnitFormProps) {
  const [buildings, setBuildings] = useState<IdNamePair[]>([]);
  const [unitTypes, setUnitTypes] = useState<string[]>([]);
  const [unitStatuses, setUnitStatuses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [unt] = await Promise.all([
          fetchBuildingNames(),
        ]);
        setBuildings(unt.data);
        setUnitTypes(unt.unit_types as string[]);
        setUnitStatuses(unt.unit_statuses as string[]);
      } catch (err) {
        toast.error("Failed to load form data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const unitSchema = z.object({
    building_id: z.coerce.number().int().positive("Building is required"),
    name: z.string().min(1, "Unit name is required").max(255),
    floor_number: z.coerce
      .number()
      .int()
      .min(-2, "Floor number must be at least -2"),
    unit_type: z
      .enum(
        unitTypes.length > 0
          ? (unitTypes as [string, ...string[]])
          : ([""] as string[])
      )
      .refine((val) => val !== undefined, {
        message: `Unit type is required`,
      }),
    size_m2: z.coerce.number().min(0).optional().nullable(),
    status: z
      .enum(
        unitStatuses.length > 0
          ? (unitStatuses as [string, ...string[]])
          : ([""] as string[])
      )
      .refine((val) => val !== undefined, {
        message: `Status is required`,
      })
      .optional(),
  });

  type FormValues = z.infer<typeof unitSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(unitSchema) as any,
    defaultValues: {
      floor_number: 0,
      size_m2: undefined,
      status: undefined,
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();

      // Append all values (backend will ignore null/undefined)
      formData.append("building_id", values.building_id.toString());
      formData.append("name", values.name);
      formData.append("floor_number", values.floor_number.toString());
      formData.append("unit_type", values.unit_type);
      
      if (values.size_m2 !== null && values.size_m2 !== undefined) {
        formData.append("size_m2", values.size_m2.toString());
      }
      if (values.status) {
        formData.append("status", values.status);
      }

      await createUnit(formData);

      toast.success("Unit added successfully!", { position: "top-right" });
      form.reset();
      onSuccess?.();
    } catch (error) {
      const err = error as ApiError;
      if (err.status === 422 && err.data?.errors) {
        const fieldErrors = err.data.errors;
        Object.entries(fieldErrors).forEach(([field, messages]) => {
          const msg = Array.isArray(messages) ? messages[0] : messages;
          form.setError(field as keyof FormValues, {
            type: "server",
            message: msg as string,
          });
        });
      } else {
        toast.error(err.message || "Failed to add unit");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>

            <div className="space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          <Skeleton className="h-9 w-full rounded-md" />
        </CardContent>

        <CardFooter>
          <Skeleton className="h-3 w-56" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Building Select & Unit Name */}
          <div className="grid grid-cols-2 gap-4">
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

            <div className="flex flex-col gap-2">
              <Label htmlFor="building_id">
                Building <span className="text-red-500">*</span>
              </Label>
              <Controller
                control={form.control}
                name="building_id"
                render={({ field }) => (
                  <Select
                    onValueChange={(v) => field.onChange(parseInt(v))}
                    value={field.value?.toString()}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a building" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">Select a building</SelectItem>
                      {buildings.map((b) => (
                        <SelectItem key={b.id} value={b.id.toString()}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.building_id && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.building_id.message}
                </p>
              )}
            </div>
          </div>

          {/* Floor Number & Unit Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="floor_number">
                Floor Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="floor_number"
                type="number"
                min="-2"
                {...form.register("floor_number", { valueAsNumber: true })}
              />
              {form.formState.errors.floor_number && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.floor_number.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="unit_type">
                Unit Type <span className="text-red-500">*</span>
              </Label>
              <Controller
                control={form.control}
                name="unit_type"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">Select Unit Type</SelectItem>
                      {unitTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.unit_type && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.unit_type.message as string}
                </p>
              )}
            </div>
          </div>

          {/* Size & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="size_m2">Size (m²)</Label>
              <Input
                id="size_m2"
                type="number"
                step="0.01"
                placeholder="e.g. 85.5"
                {...form.register("size_m2", { valueAsNumber: true })}
              />
              {form.formState.errors.size_m2 && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.size_m2.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="status">Status</Label>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">Select Status</SelectItem>
                      {unitStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status
                            .replace(/_/g, " ")
                            .replace(/^\w/, (c) => c.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.status && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.status.message as string}
                </p>
              )}
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Spinner /> Submitting...
              </>
            ) : (
              "Add Unit"
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
