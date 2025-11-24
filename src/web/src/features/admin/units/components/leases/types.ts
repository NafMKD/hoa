// src/components/lease/types.ts

import { z } from "zod";
import {
  StepLeaseSchema,
  StepRepresentativeSchema,
  StepTenantExistingSchema,
  StepTenantNewSchema,
  StepTypeSchema,
} from "./schemas";

/**
 * Types for step keys
 */
export type StepKey = "type" | "tenant" | "representative" | "lease" | "review";
export const STEP_ORDER: StepKey[] = ["type", "tenant", "representative", "lease", "review"];

// Combined (for typing)
export type StepTypeValues = z.infer<typeof StepTypeSchema>;
export type StepTenantExistingValues = z.infer<typeof StepTenantExistingSchema>;
export type StepTenantNewValues = z.infer<typeof StepTenantNewSchema>;
export type StepRepresentativeValues = z.infer<typeof StepRepresentativeSchema>;
export type StepLeaseValues = z.infer<typeof StepLeaseSchema>;

// Global state values type for the Leases component
export interface LeaseFormState {
  typeValues: StepTypeValues | null;
  tenantExistingValues: StepTenantExistingValues | null;
  tenantNewValues: StepTenantNewValues | null;
  representativeValues: StepRepresentativeValues | null;
  leaseValues: StepLeaseValues | null;
}