import { z } from 'zod'

const userStatusSchema = z.union([
  z.literal('active'),
  z.literal('inactive'),
  z.literal('invited'),
  z.literal('suspended'),
])
export type UserStatus = z.infer<typeof userStatusSchema>

const userRoleSchema = z.union([
  z.literal('admin'),
  z.literal('accountant'),
  z.literal('secretary'),
  z.literal('homeowner'),
  z.literal('tenant'),
  z.literal('representative'),
])

export const userSchema = z.object({
  id: z.string().or(z.number()),
  first_name: z.string(),
  last_name: z.string(),
  phone: z.string(),
  email: z.string().nullable(),
  role: userRoleSchema, 
  status: userStatusSchema, 
  // id_file: documentResourceSchema.nullable().optional(),

  // owned_units: z.array(unitResourceSchema).optional(),
  // rented_units: z.array(unitResourceSchema).optional(),
  // leases: z.array(tenantLeaseResourceSchema).optional(),
  // created_leases: z.array(tenantLeaseResourceSchema).optional(),
  // created_templates: z.array(documentResourceSchema).optional(),
  // updated_templates: z.array(documentResourceSchema).optional(),
  // representative_leases: z.array(tenantLeaseResourceSchema).optional(),

  // last_login_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type User = z.infer<typeof userSchema>

export const userListSchema = z.array(userSchema)
