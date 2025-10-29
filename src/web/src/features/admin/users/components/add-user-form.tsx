import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { createUser } from "../lib/users";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { ApiError } from "@/types/api-error";

const userSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(
      /^0\d{9}$/,
      "Phone number must start with 0 and be exactly 10 digits"
    ),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  role: z.enum([
    "admin",
    "accountant",
    "secretary",
    "tenant",
    "homeowner",
    "representative",
  ]),
  id_file: z.instanceof(FileList).optional(),
});

type FormValues = z.infer<typeof userSchema>;

interface AddUserFormProps {
  onSuccess?: () => void;
}

export function AddUserForm({ onSuccess }: AddUserFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(userSchema),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();

      for (const [key, value] of Object.entries(values)) {
        if (
          key === "id_file" &&
          value instanceof FileList &&
          value.length > 0
        ) {
          formData.append("id_file", value[0]);
        } else if (value !== undefined) {
          formData.append(key, value as string);
        }
      }

      await createUser(formData);
      toast.success("User added successfully!");
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
        toast.error(err.message || "Failed to add user");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-start gap-4">
            {/* First Name */}
            <div className="flex flex-col gap-2 basis-1/2">
              <Label htmlFor="first_name">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input id="first_name" {...form.register("first_name")} />
              {form.formState.errors.first_name && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.first_name.message}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div className="flex flex-col gap-2 basis-1/2">
              <Label htmlFor="last_name">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input id="last_name" {...form.register("last_name")} />
              {form.formState.errors.last_name && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.last_name.message}
                </p>
              )}
            </div>
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">
              Phone <span className="text-red-500">*</span>
            </Label>
            <Input id="phone" {...form.register("phone")} />
            {form.formState.errors.phone && (
              <p className="text-sm text-red-500">
                {form.formState.errors.phone.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register("email")} />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="flex items-start gap-4">
            {/* Role */}
            <div className="flex flex-col gap-2 basis-1/2">
              <Label>
                Role <span className="text-red-500">*</span>
              </Label>
              <Select
                onValueChange={(value) =>
                  form.setValue("role", value as FormValues["role"])
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="accountant">Accountant</SelectItem>
                  <SelectItem value="secretary">Secretary</SelectItem>
                  <SelectItem value="tenant">Tenant</SelectItem>
                  <SelectItem value="homeowner">Homeowner</SelectItem>
                  <SelectItem value="representative">Representative</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.role && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.role.message}
                </p>
              )}
            </div>

            {/* ID File */}
            <div className="flex flex-col gap-2 basis-1/2">
              <Label htmlFor="id_file">ID File</Label>
              <Input
                id="id_file"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                {...form.register("id_file")}
              />
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Spinner />
                Submitting...
              </>
            ) : (
              "Add User"
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
