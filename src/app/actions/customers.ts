"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { CustomerSchema, CustomerFormValues } from "@/lib/validations/customer";
import { revalidatePath } from "next/cache";
import { CustomerStatus } from "@prisma/client";

async function getSessionBusinessId() {
  const session = await auth();
  if (!session?.user?.businessId) {
    throw new Error("Unauthorized");
  }
  return { businessId: session.user.businessId, userId: session.user.id };
}

export async function getCustomers({
  query = "",
  page = 1,
  limit = 10,
  status,
}: {
  query?: string;
  page?: number;
  limit?: number;
  status?: CustomerStatus;
}) {
  const { businessId } = await getSessionBusinessId();
  const skip = (page - 1) * limit;

  const where = {
    businessId,
    ...(status ? { status } : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { email: { contains: query, mode: "insensitive" as const } },
            { phone: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    customers,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getCustomerById(id: string) {
  const { businessId } = await getSessionBusinessId();
  
  const customer = await prisma.customer.findUnique({
    where: { id, businessId },
  });

  if (!customer) {
    throw new Error("Customer not found");
  }

  return customer;
}

export async function createCustomer(data: CustomerFormValues) {
  const { businessId, userId } = await getSessionBusinessId();
  
  const parsedData = CustomerSchema.parse(data);

  // Remove empty string emails to avoid unique constraint issues if we had them, 
  // though we have a unique constraint on [businessId, email].
  const email = parsedData.email?.trim() || null;

  const customer = await prisma.$transaction(async (tx) => {
    const newCustomer = await tx.customer.create({
      data: {
        ...parsedData,
        email,
        businessId,
      },
    });

    await tx.auditLog.create({
      data: {
        businessId,
        userId: userId || null,
        action: "CREATE",
        entityType: "Customer",
        entityId: newCustomer.id,
        newValue: JSON.parse(JSON.stringify(newCustomer)),
      },
    });

    return newCustomer;
  });

  revalidatePath("/dashboard/customers");
  return { success: true, customerId: customer.id };
}

export async function updateCustomer(id: string, data: CustomerFormValues) {
  const { businessId, userId } = await getSessionBusinessId();
  
  const parsedData = CustomerSchema.parse(data);
  const email = parsedData.email?.trim() || null;

  await prisma.$transaction(async (tx) => {
    const existing = await tx.customer.findUnique({ where: { id, businessId } });
    if (!existing) throw new Error("Customer not found");

    const updated = await tx.customer.update({
      where: { id, businessId },
      data: {
        ...parsedData,
        email,
      },
    });

    await tx.auditLog.create({
      data: {
        businessId,
        userId: userId || null,
        action: "UPDATE",
        entityType: "Customer",
        entityId: updated.id,
        oldValue: JSON.parse(JSON.stringify(existing)),
        newValue: JSON.parse(JSON.stringify(updated)),
      },
    });

    return updated;
  });

  revalidatePath("/dashboard/customers");
  revalidatePath(`/dashboard/customers/${id}`);
  return { success: true };
}

export async function deleteCustomer(id: string) {
  const { businessId, userId } = await getSessionBusinessId();

  await prisma.$transaction(async (tx) => {
    const existing = await tx.customer.findUnique({ where: { id, businessId } });
    if (!existing) throw new Error("Customer not found");

    await tx.customer.delete({
      where: { id, businessId },
    });

    await tx.auditLog.create({
      data: {
        businessId,
        userId: userId || null,
        action: "DELETE",
        entityType: "Customer",
        entityId: id,
        oldValue: JSON.parse(JSON.stringify(existing)),
      },
    });
  });

  revalidatePath("/dashboard/customers");
  return { success: true };
}
