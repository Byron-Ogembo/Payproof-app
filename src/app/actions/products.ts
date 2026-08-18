"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { ProductSchema, ProductFormValues } from "@/lib/validations/product";
import { revalidatePath } from "next/cache";

async function getSessionBusinessId() {
  const session = await auth();
  if (!session?.user?.businessId) {
    throw new Error("Unauthorized");
  }
  return { businessId: session.user.businessId, userId: session.user.id };
}

export async function getProducts({
  query = "",
  page = 1,
  limit = 10,
  category,
}: {
  query?: string;
  page?: number;
  limit?: number;
  category?: string;
}) {
  const { businessId } = await getSessionBusinessId();
  const skip = (page - 1) * limit;

  const where = {
    businessId,
    ...(category ? { category } : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { sku: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getProductById(id: string) {
  const { businessId } = await getSessionBusinessId();
  
  const product = await prisma.product.findUnique({
    where: { id, businessId },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  return product;
}

export async function createProduct(data: ProductFormValues) {
  const { businessId, userId } = await getSessionBusinessId();
  
  const parsedData = ProductSchema.parse(data);

  // Check for duplicate SKU within the same business
  const existingSku = await prisma.product.findUnique({
    where: {
      businessId_sku: {
        businessId,
        sku: parsedData.sku,
      },
    },
  });

  if (existingSku) {
    throw new Error("A product with this SKU already exists.");
  }

  const product = await prisma.$transaction(async (tx) => {
    const newProduct = await tx.product.create({
      data: {
        ...parsedData,
        businessId,
      },
    });

    await tx.auditLog.create({
      data: {
        businessId,
        userId: userId || null,
        action: "CREATE",
        entityType: "Product",
        entityId: newProduct.id,
        newValue: JSON.parse(JSON.stringify(newProduct)),
      },
    });

    return newProduct;
  });

  revalidatePath("/dashboard/products");
  return { success: true, productId: product.id };
}

export async function updateProduct(id: string, data: ProductFormValues) {
  const { businessId, userId } = await getSessionBusinessId();
  
  const parsedData = ProductSchema.parse(data);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.product.findUnique({ where: { id, businessId } });
    if (!existing) throw new Error("Product not found");

    if (existing.sku !== parsedData.sku) {
      const existingSku = await tx.product.findUnique({
        where: {
          businessId_sku: {
            businessId,
            sku: parsedData.sku,
          },
        },
      });
      if (existingSku) {
        throw new Error("A product with this SKU already exists.");
      }
    }

    const updated = await tx.product.update({
      where: { id, businessId },
      data: parsedData,
    });

    await tx.auditLog.create({
      data: {
        businessId,
        userId: userId || null,
        action: "UPDATE",
        entityType: "Product",
        entityId: updated.id,
        oldValue: JSON.parse(JSON.stringify(existing)),
        newValue: JSON.parse(JSON.stringify(updated)),
      },
    });

    return updated;
  });

  revalidatePath("/dashboard/products");
  revalidatePath(`/dashboard/products/${id}`);
  return { success: true };
}

export async function deleteProduct(id: string) {
  const { businessId, userId } = await getSessionBusinessId();

  await prisma.$transaction(async (tx) => {
    const existing = await tx.product.findUnique({ where: { id, businessId } });
    if (!existing) throw new Error("Product not found");

    await tx.product.delete({
      where: { id, businessId },
    });

    await tx.auditLog.create({
      data: {
        businessId,
        userId: userId || null,
        action: "DELETE",
        entityType: "Product",
        entityId: id,
        oldValue: JSON.parse(JSON.stringify(existing)),
      },
    });
  });

  revalidatePath("/dashboard/products");
  return { success: true };
}
