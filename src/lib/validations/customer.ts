import { z } from "zod";
import { CustomerStatus } from "@prisma/client";

export const CustomerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email("Invalid email address").optional().nullable().or(z.literal("")),
  address: z.string().max(255).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  status: z.nativeEnum(CustomerStatus),
});

export type CustomerFormValues = z.infer<typeof CustomerSchema>;
