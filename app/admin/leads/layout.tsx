import { getAppModeSnapshot } from "@/lib/config/appMode";
import { getActiveCrmPackageConfigFromEnvironment } from "@/lib/crmPackage/getActiveCrmPackageConfig";
import { packageToLeadDetailVisibility } from "@/lib/crmPackage/adapters/leadDetailVisibility";
import { packageToLeadFields } from "@/lib/crmPackage/adapters/leadFields";
import { packageToPipelineStages } from "@/lib/crmPackage/adapters/pipelineStages";
import { LeadsClientCrmProvider } from "./LeadsClientCrmContext";

export default function LeadsLayout({ children }: { children: React.ReactNode }) {
  const { isClientCrm } = getAppModeSnapshot();
  const packageResult = getActiveCrmPackageConfigFromEnvironment();
  const leadDetailVisibility = packageToLeadDetailVisibility(packageResult.config);
  const leadFields = packageToLeadFields(packageResult.config);
  const pipelineStages = packageToPipelineStages(packageResult.config);

  return (
    <LeadsClientCrmProvider
      isClientCrm={isClientCrm}
      leadDetailVisibility={leadDetailVisibility}
      leadFields={leadFields}
      pipelineStages={pipelineStages}
    >
      {children}
    </LeadsClientCrmProvider>
  );
}
