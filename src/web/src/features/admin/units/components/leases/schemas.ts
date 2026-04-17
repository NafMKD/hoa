// src/components/lease/schemas.ts

import { z } from "zod";

/* Step 1: Type selection */
export const StepTypeSchema = z.object({
  renterType: z.enum(["existing", "new"]),
  leasingBy: z.enum(["owner", "representative"]),
  representativeType: z.enum(["existing", "new"]).optional(),
}).refine(
  (data) =>
    data.leasingBy !== "representative" ||
    (data.leasingBy === "representative" && !!data.representativeType),
  {
    path: ["representativeType"],
    message: "Please select representative type.",
  }
);

/* Tenant - existing */
export const StepTenantExistingSchema = z.object({
  tenant_id: z.number().min(1, "Select a tenant"),
});

/* Tenant - new (same validation as backend expects for users) */
export const StepTenantNewSchema = z.object({
  first_name: z.string().min(1).max(255),
  last_name: z.string().min(1).max(255),
  phone: z
    .string()
    .regex(/^0\d{9}$/, "Phone must be a 10 digit Ethiopian number starting with 0")
    .max(255),
  email: z.string().email().optional().or(z.literal("")).transform((v) => (v === "" ? null : v)).nullable(),
  role: z.enum(["tenant"]).optional(),
  city: z.string().optional().or(z.literal("")),
  sub_city: z.string().optional().or(z.literal("")),
  woreda: z.string().optional().or(z.literal("")),
  house_number: z.string().optional().or(z.literal("")),
  id_file: z
    .instanceof(File)
    .optional()
    .nullable(), // will be handled in formData upload
});

/* Representative */
export const StepRepresentativeSchema = z.object({
  first_name: z.string().min(1).max(255),
  last_name: z.string().min(1).max(255),
  phone: z
    .string()
    .regex(/^0\d{9}$/, "Phone must be a 10 digit Ethiopian number starting with 0")
    .max(255),
  email: z.string().email().optional().or(z.literal("")).transform((v) => (v === "" ? null : v)).nullable(),
  role: z.enum(["representative"]).optional(),
  city: z.string().optional().or(z.literal("")),
  sub_city: z.string().optional().or(z.literal("")),
  woreda: z.string().optional().or(z.literal("")),
  house_number: z.string().optional().or(z.literal("")),
  id_file: z.instanceof(File).optional().nullable(),
});

/* Representative - existing */
export const StepRepresentativeExistingSchema = z.object({
  representative_id: z.number().min(1, "Select a representative"),
});

/* Lease details */
export const StepLeaseSchema = z.object({
  agreement_amount: z
    .string()
    .trim()
    .min(1, "Agreement amount is required")
    .refine((s) => {
      const n = parseFloat(String(s).replace(/,/g, ""));
      return !Number.isNaN(n);
    }, "Enter a valid number")
    .transform((s) => parseFloat(String(s).replace(/,/g, "")))
    .pipe(z.number().min(0, "Must be at least 0")),
  lease_start_date: z.string().min(1),
  lease_end_date: z.string().optional().nullable(),
  representative_document: z.instanceof(File).optional().nullable(),
  witness_1_full_name: z.string().optional().nullable(),
  witness_2_full_name: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});