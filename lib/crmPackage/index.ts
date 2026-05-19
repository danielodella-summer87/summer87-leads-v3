/**
 * Paquete crm_package_config v1 — tipos, demo local (12V-2) y loader (12W-1).
 * Adapters y provider UI: fases 12W-2+ (no conectar pantallas desde aquí).
 */

export type {
  CrmPackageConfig,
  CrmPackageClient,
  CrmPackageSource,
  CrmPackageActivation,
  CrmPackageModule,
  CrmPackageLeadFields,
  CrmPackageLeadFieldGroup,
  CrmPackagePipeline,
  CrmPackagePipelineStage,
  CrmPackageActivityType,
  CrmPackageDashboardBlock,
  CrmPackageDashboards,
  CrmPackageReport,
  CrmPackageReports,
  CrmPackageLabels,
  CrmPackageVisibilityRules,
  CrmPackageRolePermission,
  CrmPackageAiRules,
  CrmPackageBranding,
  CrmPackageIntegration,
  CrmPackageDataPolicy,
  CrmPackageLegacyCompatibility,
  CrmPackageValidation,
  CrmPackageAudit,
} from "./types";

export { CRM_PACKAGE_CONFIG_VERSION } from "./types";

export { pickup4x4CrmPackageConfig } from "./configs/pickup4x4.config";

export {
  validateCrmPackageConfigShape,
  type CrmPackageValidationResult,
} from "./validate";

export {
  getActiveCrmPackageConfig,
  getActiveCrmPackageConfigFromEnvironment,
  type GetActiveCrmPackageConfigOptions,
  type ActiveCrmPackageConfigResult,
  type ActiveCrmPackageConfigSource,
} from "./getActiveCrmPackageConfig";
