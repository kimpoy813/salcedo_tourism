import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminConsolePage() {
  const principal = await getAdminSession();
  if (!principal) {
    redirect("/admin/login");
  }

  return <AdminDashboardClient principal={principal} />;
}
