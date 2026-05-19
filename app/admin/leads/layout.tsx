import { getAppModeSnapshot } from "@/lib/config/appMode";
import { getActiveCrmPackageConfigFromEnvironment } from "@/lib/crmPackage/getActiveCrmPackageConfig";
import { packageToLeadDetailVisibility } from "@/lib/crmPackage/adapters/leadDetailVisibility";
import { LeadsClientCrmProvider } from "./LeadsClientCrmContext";

export default function LeadsLayout({ children }: { children: React.ReactNode }) {
  const { isClientCrm } = getAppModeSnapshot();
  const packageResult = getActiveCrmPackageConfigFromEnvironment();
  const leadDetailVisibility = packageToLeadDetailVisibility(packageResult.config);

  return (
    <LeadsClientCrmProvider isClientCrm={isClientCrm} leadDetailVisibility={leadDetailVisibility}>
      {children}
    </LeadsClientCrmProvider>
  );
}
