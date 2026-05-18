import { redirect } from "next/navigation";
import { isClientCrmMode } from "@/lib/config/appMode";

/**
 * Guard UI por APP_MODE. Bloquea el árbol /admin/constructor-crm en client_crm.
 * No reemplaza guards API; /api/admin/constructor/* se bloquearán en fase posterior.
 */
export default function ConstructorCrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isClientCrmMode()) {
    redirect("/403");
  }

  return children;
}
