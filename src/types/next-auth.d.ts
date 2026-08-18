import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User { role: string; businessId: string; }
  interface Session { user: { id: string; role: string; businessId: string } & NonNullable<Session["user"]>; }
}

declare module "next-auth/jwt" { interface JWT { role?: string; businessId?: string; } }
