import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getAppUserFromRequest } from "@/lib/auth/server";
import type { AdminSidebarModeFilterOptions } from "@/lib/admin/adminSidebarModules";
import { getAppModeSnapshot } from "@/lib/config/appMode";
import AdminShell from "./AdminShell";

function getSidebarModeFilterFromEnv(): AdminSidebarModeFilterOptions {
  const snap = getAppModeSnapshot();
  return {
    appMode: snap.appMode,
    constructorEnabled: snap.constructorEnabled,
    installerEnabled: snap.installerEnabled,
    bcrEnabled: snap.bcrEnabled,
    showInternalMenus: snap.showInternalMenus,
    clientVisibleModules: snap.clientVisibleModules,
  };
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sidebarModeFilter = getSidebarModeFilterFromEnv();
  const crm = await getSession();
  if (crm) {
    return (
      <AdminShell sidebarModeFilter={sidebarModeFilter}>{children}</AdminShell>
    );
  }

  const appUser = await getAppUserFromRequest();
  if (!appUser) {
    redirect("/login?next=/admin");
  }

  return (
    <AdminShell sidebarModeFilter={sidebarModeFilter}>{children}</AdminShell>
  );
}
