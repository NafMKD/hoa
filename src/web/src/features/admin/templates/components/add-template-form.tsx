import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import type { ApiError } from "@/types/api-error";
import { createDocumentTemplate } from "../lib/templates";

// Expected categories from backend
const allowedCategories = ["lease_agreement", "letter", "reminder", "other"];

const schema = z.object({
  category: z.enum(allowedCategories),
  sub_category: z.string().min(1, "Sub-category is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().or(z.literal("")),
  version: z
    .number("Version must be a number")
    .min(1, "Version must be at least 1"),
  file: z
    .instanceof(File, { message: "File is required" })
    .refine(
      (file) =>
        file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      {
        message: "File must be a .docx document",
      }
    ),
});

type FormValues = z.infer<typeof schema>;

export function AddDocumentTemplateForm({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      version: 1,
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);

      const formData = new FormData();

      Object.entries(values).forEach(([key, value]) => {
        if (key === "file") formData.append("file", value as File);
        else formData.append(key, value?.toString() ?? "");
      });

      await createDocumentTemplate(formData);

      toast.success("Document Template created successfully!", {
        position: "top-right",
      });

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
        toast.error(err.message || "Failed to create template", {
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
          {/* Category */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="category">
              Category <span className="text-red-500">*</span>
            </Label>
            <select
              id="category"
              className="border rounded-md p-2"
              {...form.register("category")}
            >
              <option value="">Select a category</option>
              {allowedCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {form.formState.errors.category && (
              <p className="text-sm text-red-500">
                {form.formState.errors.category.message}
              </p>
            )}
          </div>

          {/* Sub Category */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="sub_category">
              Sub Category <span className="text-red-500">*</span>
            </Label>
            <Input id="sub_category" {...form.register("sub_category")} />
            {form.formState.errors.sub_category && (
              <p className="text-sm text-red-500">
                {form.formState.errors.sub_category.message}
              </p>
            )}
          </div>

          {/* Name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Template Name <span className="text-red-500">*</span></Label>
            <Input id="name" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Version */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="version">
              Version <span className="text-red-500">*</span>
            </Label>
            <Input
              id="version"
              type="number"
              {...form.register("version", { valueAsNumber: true })}
            />
            {form.formState.errors.version && (
              <p className="text-sm text-red-500">
                {form.formState.errors.version.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...form.register("description")} />
          </div>

          {/* File */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="file">
              Upload File (.docx) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="file"
              type="file"
              accept=".docx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                form.setValue("file", file as File);
              }}
            />
            {form.formState.errors.file && (
              <p className="text-sm text-red-500">
                {form.formState.errors.file.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Spinner /> Submitting...
              </>
            ) : (
              "Create Template"
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter>
        <p className="text-sm text-muted-foreground">
          Fields with <span className="text-red-500">*</span> are required.
        </p>
      </CardFooter>
    </Card>
  );
}
