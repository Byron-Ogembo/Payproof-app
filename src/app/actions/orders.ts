"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { OrderSchema, OrderFormValues } from "@/lib/validations/order";
import { revalidatePath } from "next/cache";
import { OrderStatus } from "@prisma/client";

async function getSessionBusinessId() {
  const session = await auth();
  if (!session?.user?.businessId) {
    throw new Error("Unauthorized");
  }
  return { businessId: session.user.businessId, userId: session.user.id };
}

function generateOrderNumber() {
  return `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

export async function getOrders({
  query = "",
  page = 1,
  limit = 10,
  status,
}: {
  query?: string;
  page?: number;
  limit?: number;
  status?: OrderStatus;
}) {
  const { businessId } = await getSessionBusinessId();
  const skip = (page - 1) * limit;

  const where = {
    businessId,
    ...(status ? { status } : {}),
    ...(query
      ? {
          OR: [
            { orderNumber: { contains: query, mode: "insensitive" as const } },
            { customer: { name: { contains: query, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        customer: { select: { name: true, email: true } },
        _count: { select: { items: true } }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getOrderById(id: string) {
  const { businessId } = await getSessionBusinessId();
  
  const order = await prisma.order.findUnique({
    where: { id, businessId },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  return order;
}

export async function createOrder(data: OrderFormValues) {
  const { businessId, userId } = await getSessionBusinessId();
  const parsedData = OrderSchema.parse(data);

  const order = await prisma.$transaction(async (tx) => {
    // 1. Fetch all product details to calculate accurate server-side totals
    const productIds = parsedData.items.map((i) => i.productId);
    const products = await tx.product.findMany({
      where: {
        id: { in: productIds },
        businessId,
        active: true,
      },
    });

    if (products.length !== productIds.length) {
      throw new Error("One or more products are invalid or inactive.");
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    let subtotal = 0;
    const orderItemsData = [];

    // 2. Validate stock and build order items
    for (const item of parsedData.items) {
      const product = productMap.get(item.productId)!;
      if (product.stockQuantity < item.quantity) {
        throw new Error(`Insufficient stock for product: ${product.name}`);
      }

      const itemTotal = product.sellingPrice * item.quantity;
      subtotal += itemTotal;

      orderItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.sellingPrice,
        total: itemTotal,
      });
    }

    // 3. Calculate final totals
    // Tax and discount are treated as flat amounts here, but could easily be percentages
    // by changing the logic here. We use flat amounts to avoid rounding errors.
    const discount = parsedData.discount;
    const tax = parsedData.tax;
    const total = subtotal - discount + tax;

    if (total < 0) {
      throw new Error("Total cannot be negative");
    }

    // 4. Create Order
    const newOrder = await tx.order.create({
      data: {
        businessId,
        customerId: parsedData.customerId,
        orderNumber: generateOrderNumber(),
        status: OrderStatus.DRAFT,
        subtotal,
        discount,
        tax,
        total,
        notes: parsedData.notes,
        items: {
          create: orderItemsData,
        },
      },
      include: { items: true },
    });

    // 5. Audit Log
    await tx.auditLog.create({
      data: {
        businessId,
        userId: userId || null,
        action: "CREATE",
        entityType: "Order",
        entityId: newOrder.id,
        newValue: JSON.parse(JSON.stringify(newOrder)),
      },
    });

    return newOrder;
  });

  revalidatePath("/dashboard/orders");
  return { success: true, orderId: order.id };
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const { businessId, userId } = await getSessionBusinessId();

  await prisma.$transaction(async (tx) => {
    const existing = await tx.order.findUnique({
      where: { id, businessId },
      include: { items: true },
    });

    if (!existing) throw new Error("Order not found");

    if (existing.status === status) return; // No change

    // If order is transitioning to PAID, deduct inventory
    // To be safer, we can also check if we previously deducted it to prevent double-deduction
    // Simple logic: If moving from DRAFT/PENDING -> PAID/SHIPPED, deduct.
    const requiresDeduction = (status === OrderStatus.PAID || status === OrderStatus.PROCESSING || status === OrderStatus.SHIPPED);
    const wasDeducted = (existing.status === OrderStatus.PAID || existing.status === OrderStatus.PROCESSING || existing.status === OrderStatus.SHIPPED || existing.status === OrderStatus.DELIVERED);

    if (requiresDeduction && !wasDeducted) {
      for (const item of existing.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });
      }
    } else if (!requiresDeduction && wasDeducted) {
      // Revert deduction if order is cancelled
      if (status === OrderStatus.CANCELLED || status === OrderStatus.REFUNDED || status === OrderStatus.DRAFT) {
        for (const item of existing.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                increment: item.quantity,
              },
            },
          });
        }
      }
    }

    const updated = await tx.order.update({
      where: { id, businessId },
      data: { status },
    });

    await tx.auditLog.create({
      data: {
        businessId,
        userId: userId || null,
        action: "UPDATE_STATUS",
        entityType: "Order",
        entityId: id,
        oldValue: JSON.parse(JSON.stringify({ status: existing.status })),
        newValue: JSON.parse(JSON.stringify({ status: updated.status })),
      },
    });
  });

  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${id}`);
  return { success: true };
}
