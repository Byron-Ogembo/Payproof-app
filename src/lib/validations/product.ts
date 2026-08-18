import { z } from "zod";

export const ProductSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(200),
  sku: z.string().min(2, "SKU is required").max(100),
  category: z.string().max(100).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  sellingPrice: z.number().min(0, "Selling price must be 0 or greater"),
  costPrice: z.number().min(0, "Cost price must be 0 or greater"),
  stockQuantity: z.number().min(0, "Stock quantity must be 0 or greater").int(),
  reorderLevel: z.number().min(0, "Reorder level must be 0 or greater").int(),
  active: z.boolean(),
});

export type ProductFormValues = z.infer<typeof ProductSchema>;
