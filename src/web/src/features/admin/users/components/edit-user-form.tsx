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
import { updateUser } from "../lib/users";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { ApiError } from "@/types/api-error";
import type { User } from "@/types/types";

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
  city: z.string().optional().or(z.literal("")),
  sub_city: z.string().optional().or(z.literal("")),
  woreda: z.string().optional().or(z.literal("")),
  house_number: z.string().optional().or(z.literal("")),
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

interface EditUserFormProps {
  user: User;
  onSuccess?: () => void;
}

export function EditUserForm({ user, onSuccess }: EditUserFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
        first_name: user.first_name,  
        last_name: user.last_name,  
        phone: user.phone as string,  
        email: user.email ?? "",  
        role: user.role as FormValues["role"],
        city: user.city as string ?? "",
        sub_city: user.sub_city as string ?? "",
        woreda: user.woreda as string ?? "",
        house_number: user.house_number as string ?? "",
      },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("_method", "PUT");

      for (const [key, value] of Object.entries(values)) {
        const originalValue = (user as any)[key];

        if (
          key === "id_file" &&
          value instanceof FileList &&
          value.length > 0
        ) {          
          formData.append("id_file", value[0]);
        } else if (value !== undefined && value !== originalValue) {
            if (key !== "id_file") formData.append(key, value as string);
        }
      }
      
      await updateUser(user.id, formData);

      toast.success("User updated successfully!");
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
        toast.error(err.message || "Failed to update user");
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
            {/* City */}
            <div className="flex flex-col gap-2 basis-1/2">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...form.register("city")} />
              {form.formState.errors.city && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.city.message}
                </p>
              )}
            </div>

            {/* Sub City */}
            <div className="flex flex-col gap-2 basis-1/2">
              <Label htmlFor="sub_city">Sub City</Label>
              <Input id="sub_city" {...form.register("sub_city")} />
              {form.formState.errors.sub_city && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.sub_city.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-4">
            {/* Woreda */}
            <div className="flex flex-col gap-2 basis-1/2">
              <Label htmlFor="woreda">Woreda</Label>
              <Input id="woreda" {...form.register("woreda")} />
              {form.formState.errors.woreda && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.woreda.message}
                </p>
              )}
            </div>

            {/* House Number */}
            <div className="flex flex-col gap-2 basis-1/2">
              <Label htmlFor="house_number">House Number</Label>
              <Input id="house_number" {...form.register("house_number")} />
              {form.formState.errors.house_number && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.house_number.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-4">
            {/* Role */}
            <div className="flex flex-col gap-2 basis-1/2">
              <Label>
                Role <span className="text-red-500">*</span>
              </Label>
              <Select
                defaultValue={user.role}
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
              {form.formState.errors.id_file && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.id_file.message}
                </p>
              )}
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Spinner />
                Updating...
              </>
            ) : (
              "Update User"
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
