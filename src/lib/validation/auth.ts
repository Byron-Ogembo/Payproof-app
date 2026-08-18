import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  password: z.string().min(1, "Enter your password.").max(128),
});

export const registerSchema = z.object({
  ownerName: z.string().trim().min(2, "Enter your name.").max(100),
  businessName: z.string().trim().min(2, "Enter a business name.").max(150),
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  phone: z.string().trim().min(7, "Enter a valid phone number.").max(30),
  businessCategory: z.enum(["RETAIL", "RESTAURANT", "CLOTHING", "ELECTRONICS", "COSMETICS", "SERVICES", "ONLINE_SELLER", "WHOLESALE", "OTHER"]),
  location: z.string().trim().max(150).optional(),
  password: z.string().min(8, "Use at least 8 characters.").max(128),
});
