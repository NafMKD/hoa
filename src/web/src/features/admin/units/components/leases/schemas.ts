// src/components/lease/schemas.ts

import { z } from "zod";

/* Step 1: Type selection */
export const StepTypeSchema = z.object({
  renterType: z.enum(["existing", "new"]),
  leasingBy: z.enum(["owner", "representative"]),
});

/* Tenant - existing */
export const StepTenantExistingSchema = z.object({
  tenant_id: z.string().min(1, "Select a tenant"),
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
  id_file: z
    .any()
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
  id_file: z.any().optional().nullable(),
});

/* Lease details */
export const StepLeaseSchema = z.object({
  agreement_amount: z.coerce.number().min(0),
  lease_template_id: z.string().min(1),
  lease_start_date: z.string().min(1),
  lease_end_date: z.string().optional().nullable(),
  representative_document: z.any().optional().nullable(),
  witness_1_full_name: z.string().optional().nullable(),
  witness_2_full_name: z.string().optional().nullable(),
  witness_3_full_name: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});