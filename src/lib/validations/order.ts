import { z } from "zod";

export const OrderItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().min(1, "Quantity must be at least 1").int(),
});

export const OrderSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  notes: z.string().max(1000).optional().nullable(),
  discount: z.number().min(0, "Discount cannot be negative"),
  tax: z.number().min(0, "Tax cannot be negative"),
  items: z.array(OrderItemSchema).min(1, "Order must have at least one item"),
});

export type OrderFormValues = z.infer<typeof OrderSchema>;
export type OrderItemFormValues = z.infer<typeof OrderItemSchema>;
