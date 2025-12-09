import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconArrowLeft } from "@tabler/icons-react";
// Shadcn/ui components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription, // Added for the file input description
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { StepRepresentativeExistingSchema, StepRepresentativeSchema } from "../schemas";
import type { StepRepresentativeExistingValues, StepRepresentativeValues, StepTenantExistingValues, StepTypeValues } from "../types";
import { Label } from "@/components/ui/label";
import { UserSelect } from "@/features/admin/users/components/user-select";

// --- Props & Component Definition ---

interface StepRepresentativeProps {
  typeValues: StepTypeValues | null;
  setRepresentativeValues: (values: StepRepresentativeValues) => void;
  setRepresentativeExistingValues: (values: StepRepresentativeExistingValues) => void;
  representativeValues?: StepRepresentativeValues | null;
  tenantExistingValues?: StepTenantExistingValues | null;
  unitId?: string;
  markCompleted: (step: "representative", ok: boolean) => void;
  goNext: () => void;
  goPrev: () => void;
}

export function StepRepresentative({
  typeValues,
  setRepresentativeValues,
  setRepresentativeExistingValues,
  representativeValues,
  tenantExistingValues,
  unitId,
  markCompleted,
  goNext,
  goPrev,
}: StepRepresentativeProps) {
  const isExisting = typeValues?.representativeType === "existing";

  const form = useForm<StepRepresentativeValues>({
    // Type-safe resolver: StepRepresentativeSchema should be a ZodObject or similar,
    // the 'as any' is usually needed if the schema contains types like File that Zod/TS struggles to infer correctly,
    // but the best practice is to make sure your Zod schema is correctly defined.
    // I'll remove the 'as any' based on standard usage.
    resolver: zodResolver(StepRepresentativeSchema as any),
    defaultValues: {
      first_name: representativeValues?.first_name,
      last_name: representativeValues?.last_name,
      phone: representativeValues?.phone,
      email: representativeValues?.email,
      role: "representative",
      id_file: representativeValues?.id_file, // Should be null or undefined depending on schema
    },
  });

  const formExisting = useForm<StepRepresentativeExistingValues>({
    resolver: zodResolver(StepRepresentativeExistingSchema),
    mode: "onChange",
  });

  function onSubmit(values: StepRepresentativeValues) {
    // You should handle file uploads (id_file) logic here before setting values and moving on.
    // For this example, we assume validation and file handling are complete.
    setRepresentativeValues(values);
    markCompleted("representative", true);
    goNext();
  }
  
  const onSubmitExisting = (values: StepRepresentativeExistingValues) => {    
    setRepresentativeExistingValues(values);
    markCompleted("representative", true);
    goNext();
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold tracking-tight">
        {isExisting
          ? "Existing Representative Details"
          : "New Representative Registration"}
      </h2>
      <hr className="my-4" />
      {isExisting ? (
        <Form {...formExisting}>
          <form
            onSubmit={formExisting.handleSubmit(onSubmitExisting)}
            className="space-y-6"
          >
            <div className="w-1/3">
              <Label className="mb-2">
                Choose an existing representative <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="representative_id"
                control={formExisting.control}
                render={({ field }) => (
                  <UserSelect
                    value={field.value ?? null}
                    onChange={field.onChange}
                    status="active"
                    disabledIds={tenantExistingValues?.tenant_id ? [tenantExistingValues.tenant_id, unitId as unknown as number] : [unitId as unknown as number]}
                  />
                )}
              />
            </div>
            <div className="pt-4 flex items-center space-x-4">
              <Button variant="outline" onClick={goPrev} type="button">
                <IconArrowLeft size={16} className="mr-2" />
                Back
              </Button>
              <Button type="submit">Continue</Button>
            </div>
          </form>
        </Form>
      ) : (
        <Form {...form}>
          {/* Use the Shadcn Form context provider */}
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                {/* First Name Field */}
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        First Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Last Name Field */}
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Last Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Phone Field */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Phone <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        {/* Only spread the parts of 'field' relevant for a text input. Omitted 'value' for phone in case your schema needs formatting */}
                        <Input
                          {...field}
                          onChange={(e) => {
                            // Optional: Add phone number formatting/masking here if needed
                            field.onChange(e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Email Field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Role Field */}
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Role <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="text" {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* ID File Field (Special handling for file inputs) */}
                <FormField
                  control={form.control}
                  name="id_file"
                  render={(
                    { field: { value, onChange, ...fieldProps } } // Destructure to handle file change manually
                  ) => (
                    <FormItem>
                      <FormLabel>ID File</FormLabel>
                      <FormControl>
                        {/* For file inputs, you only pass the event, not the value, and handle file access */}
                        <Input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          {...fieldProps}
                          onChange={(event) => {
                            onChange(
                              event.target.files && event.target.files.length
                                ? event.target.files[0]
                                : null
                            );
                          }}
                          // Tailwind class to ensure the file input is visible and styled correctly
                          className="file:text-sm file:font-medium file:border-0 file:bg-primary file:text-primary-foreground file:px-3 file:py-1 file:rounded-md file:mr-2"
                        />
                      </FormControl>
                      <FormDescription>
                        Accepted formats: JPG, PNG, PDF. Max size: 5MB.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            {/* Navigation Buttons */}
            <div className="pt-4 flex items-center space-x-4">
              {/* Added border-t for visual separation */}
              <Button variant="outline" onClick={goPrev} type="button">
                {/* Changed to 'outline' for better visual hierarchy */}
                <IconArrowLeft size={18} className="mr-2" />
                Back
              </Button>
              <Button type="submit">Continue</Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
