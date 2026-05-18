import { getAppModeSnapshot } from "@/lib/config/appMode";
import { LeadsClientCrmProvider } from "./LeadsClientCrmContext";

export default function LeadsLayout({ children }: { children: React.ReactNode }) {
  const { isClientCrm } = getAppModeSnapshot();
  return <LeadsClientCrmProvider isClientCrm={isClientCrm}>{children}</LeadsClientCrmProvider>;
}
