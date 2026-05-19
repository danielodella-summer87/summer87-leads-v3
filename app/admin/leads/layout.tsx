import { getAppModeSnapshot } from "@/lib/config/appMode";
import { getActiveCrmPackageConfigFromEnvironment } from "@/lib/crmPackage/getActiveCrmPackageConfig";
import { packageToLeadDetailVisibility } from "@/lib/crmPackage/adapters/leadDetailVisibility";
import { packageToLeadFields } from "@/lib/crmPackage/adapters/leadFields";
import { LeadsClientCrmProvider } from "./LeadsClientCrmContext";

export default function LeadsLayout({ children }: { children: React.ReactNode }) {
  const { isClientCrm } = getAppModeSnapshot();
  const packageResult = getActiveCrmPackageConfigFromEnvironment();
  const leadDetailVisibility = packageToLeadDetailVisibility(packageResult.config);
  const leadFields = packageToLeadFields(packageResult.config);

  return (
    <LeadsClientCrmProvider
      isClientCrm={isClientCrm}
      leadDetailVisibility={leadDetailVisibility}
      leadFields={leadFields}
    >
      {children}
    </LeadsClientCrmProvider>
  );
}
