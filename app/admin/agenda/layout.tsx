import { getAppModeSnapshot } from "@/lib/config/appMode";
import { LeadsClientCrmProvider } from "@/app/admin/leads/LeadsClientCrmContext";

/** Expone APP_MODE a Agenda (client) vía el mismo provider que leads — 12U-3. */
export default function AgendaLayout({ children }: { children: React.ReactNode }) {
  const { isClientCrm } = getAppModeSnapshot();
  return <LeadsClientCrmProvider isClientCrm={isClientCrm}>{children}</LeadsClientCrmProvider>;
}
