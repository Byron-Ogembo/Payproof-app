import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const session = await auth();
  if (!session?.user?.businessId) redirect("/login");
  return children;
}
