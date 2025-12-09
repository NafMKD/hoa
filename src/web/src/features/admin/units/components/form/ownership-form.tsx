import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import type { ApiError } from "@/types/api-error";
import { UserSelect } from "@/features/admin/users/components/user-select";
import { createOwnership } from "../../lib/ownerships";

interface OwnershipFormProps {
  unitId: number;
  onSuccess?: () => void;
}

const ownershipSchema = z.object({
  user_id: z.coerce.number().positive("User is required"),
  start_date: z.string().min(1, "Start date is required"),
  ownership_file: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, "Ownership file is required")
    .refine(
      (files) => {
        const ext = files[0]?.name.split(".").pop()?.toLowerCase();
        return !!ext && ["pdf", "jpg", "jpeg", "png"].includes(ext);
      },
      "File must be a PDF or image (jpg, jpeg, png)"
    ),
});

type FormValues = z.infer<typeof ownershipSchema>;

export function OwnershipForm({ unitId, onSuccess }: OwnershipFormProps) {
  const {
    handleSubmit,
    control,
    register,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(ownershipSchema as any),
    defaultValues: {
      start_date: new Date().toISOString().split("T")[0],
    }
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const formData = new FormData();
      formData.append("user_id", values.user_id.toString());
      formData.append("start_date", values.start_date);
      formData.append("ownership_file", values.ownership_file[0]);

      await createOwnership(unitId, formData);

      toast.success("Ownership created successfully");
      reset();
      onSuccess?.();
    } catch (error) {
      const err = error as ApiError;

      if (err.status === 422 && err.data?.errors) {
        Object.entries(err.data.errors).forEach(([field, messages]) => {
          const msg = Array.isArray(messages) ? messages[0] : messages;
          setError(field as keyof FormValues, {
            type: "server",
            message: msg as string,
          });
        });
      } else {
        toast.error(err.message || "Failed to create ownership");
      }
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* User search select */}
          <div className="flex flex-col gap-2">
            <Label>
              Owner (User) <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="user_id"
              control={control}
              render={({ field }) => (
                <UserSelect
                  value={field.value}
                  onChange={(val) => field.onChange(val)}
                  error={errors.user_id?.message}
                  status="active"
                />
              )}
            />
          </div>

          {/* Start date */}
          <div className="flex flex-col gap-2">
            <Label>
              Start Date <span className="text-red-500">*</span>
            </Label>
            <Input type="date" {...register("start_date")} />
            {errors.start_date && (
              <p className="text-sm text-red-500">{errors.start_date.message}</p>
            )}
          </div>

          {/* Ownership file */}
          <div className="flex flex-col gap-2">
            <Label>
              Ownership File <span className="text-red-500">*</span>
            </Label>
            <Input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              {...register("ownership_file")}
            />
            {errors.ownership_file && (
              <p className="text-sm text-red-500">
                {errors.ownership_file.message?.toString()}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner /> Submitting...
              </>
            ) : (
              "Add Ownership"
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
