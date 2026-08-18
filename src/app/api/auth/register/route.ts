import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { registerSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid registration details." }, { status: 400 });
  const data = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email: data.email }, select: { id: true } });
  if (existing) return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  const passwordHash = await bcrypt.hash(data.password, 12);
  await prisma.$transaction(async (tx) => {
    const business = await tx.business.create({ data: { businessName: data.businessName, ownerName: data.ownerName, email: data.email, phone: data.phone, businessCategory: data.businessCategory, location: data.location || null, currency: "KES" } });
    await tx.user.create({ data: { name: data.ownerName, email: data.email, passwordHash, role: "OWNER", businessId: business.id } });
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
