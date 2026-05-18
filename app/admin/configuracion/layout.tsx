import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getActiveUserPermissions } from "@/lib/rbac/server";
import { isClientCrmMode } from "@/lib/config/appMode";

/**
 * Layout de /admin/configuracion y todas sus rutas hijas.
 * Bloquea acceso server-side si el usuario no tiene permiso "config.admin":
 * redirige a /admin sin renderizar contenido (no responde 200 con la página).
 *
 * Guard UI por APP_MODE: en client_crm se bloquea configuración interna completa
 * (URL directa). Las APIs ya tienen guards; la configuración operativa cliente
 * se diseñará en fase futura. /admin/personalizacion queda fuera de este segmento.
 */
export default async function ConfiguracionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isClientCrmMode()) {
    redirect("/403");
  }

  const crm = await getSession();
  if (crm && (crm.role === "admin" || crm.role === "superadmin")) {
    return <>{children}</>;
  }

  const permissions = await getActiveUserPermissions();

  if (!permissions.includes("config.admin")) {
    redirect("/admin");
  }

  return <>{children}</>;
}
