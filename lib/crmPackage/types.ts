/**
 * crm_package_config v1 — contrato tipado para CRM operativo (12V-2).
 * Documento base: docs/constructor-crm/plan-contrato-constructor-crm-operativo-12V.md
 * No consumido por pantallas hasta fase 12W (loader + adapters).
 */

export const CRM_PACKAGE_CONFIG_VERSION = "1.0.0" as const;

export type CrmPackageConfigVersion = typeof CRM_PACKAGE_CONFIG_VERSION | string;

export type CrmPackageActivationStatus = "draft" | "staged" | "active" | "retired";

export type CrmPackageActivationScope = "instance" | "tenant";

export type CrmPackageSourceOrigin =
  | "constructor_draft"
  | "manual_seed"
  | "preset_inline"
  | "local_demo_config";

export type CrmPackageFallbackStrategy = "legacy_first" | "contract_first" | "strict";

export type CrmPackageUnknownSectionsPolicy = "warn" | "ignore" | "reject";

export type CrmPackagePipelineTerminal = "won" | "lost";

export type CrmPackageOwnerType = "lead" | "socio";

export type CrmPackageClient = {
  slug: string;
  name: string;
  businessType?: string;
  country?: string;
  metadata?: Record<string, unknown>;
};

export type CrmPackageSource = {
  origin: CrmPackageSourceOrigin;
  installable_package_draft_id?: string | null;
  preset_key?: string | null;
  generated_at?: string | null;
  metadata?: Record<string, unknown>;
};

export type CrmPackageActivation = {
  status: CrmPackageActivationStatus;
  activated_at?: string | null;
  activated_by?: string | null;
  scope?: CrmPackageActivationScope;
};

export type CrmPackageModule = {
  key: string;
  enabled: boolean;
  label?: string;
  href?: string;
  metadata?: Record<string, unknown>;
};

export type CrmPackageLeadFieldGroup = {
  group: string;
  fields: string[];
  metadata?: Record<string, unknown>;
};

export type CrmPackageLeadFields = {
  groups: CrmPackageLeadFieldGroup[];
};

export type CrmPackagePipelineStage = {
  key: string;
  label: string;
  order: number;
  terminal?: CrmPackagePipelineTerminal;
  metadata?: Record<string, unknown>;
};

export type CrmPackagePipeline = {
  stages: CrmPackagePipelineStage[];
};

export type CrmPackageActivityType = {
  key: string;
  label: string;
  metadata?: Record<string, unknown>;
};

export type CrmPackageDashboardBlock = {
  key: string;
  enabled: boolean;
  order: number;
  metadata?: Record<string, unknown>;
};

export type CrmPackageDashboards = {
  blocks: CrmPackageDashboardBlock[];
};

export type CrmPackageReport = {
  key: string;
  label?: string;
  enabled: boolean;
  reason?: string | null;
  metadata?: Record<string, unknown>;
};

export type CrmPackageReports = {
  catalog: CrmPackageReport[];
};

export type CrmPackageLabels = {
  entity_singular: string;
  entity_plural: string;
  lead_singular?: string;
  lead_plural?: string;
  lead_entity_relation?: string | null;
  owner_types: CrmPackageOwnerType[];
};

export type CrmPackageLeadDetailVisibility = {
  hide_tabs?: string[];
  hide_blocks?: string[];
};

export type CrmPackageSidebarVisibility = {
  hide_modules?: string[];
};

export type CrmPackageVisibilityRules = {
  lead_detail?: CrmPackageLeadDetailVisibility;
  sidebar?: CrmPackageSidebarVisibility;
};

export type CrmPackageRolePermission = {
  role: string;
  label?: string;
  permissions: string[];
};

export type CrmPackageAiRules = {
  allow_send_messages?: boolean;
  allow_external_writes?: boolean;
  allow_price_changes?: boolean;
  allow_document_creation?: boolean;
  notes?: string;
  rules_text?: string[];
};

export type CrmPackageBranding = {
  logo_url?: string | null;
  suite_name?: string | null;
  primary_color?: string | null;
  metadata?: Record<string, unknown>;
};

export type CrmPackageIntegrationMode = "read_only" | "read_write" | "write_only";

export type CrmPackageIntegration = {
  system: string;
  mode: CrmPackageIntegrationMode;
  write_allowed: boolean;
  sync_direction?: string;
  status?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
};

export type CrmPackageDataPolicy = {
  external_system?: string;
  integration_mode?: string;
  write_allowed?: boolean;
  metadata?: Record<string, unknown>;
};

export type CrmPackageLegacyCompatibility = {
  app_mode_required?: string;
  fallback_strategy: CrmPackageFallbackStrategy;
  unknown_sections?: CrmPackageUnknownSectionsPolicy;
};

export type CrmPackageValidation = {
  schema_version: string;
  validated_at?: string | null;
  validator?: string;
  errors?: string[];
};

export type CrmPackageAuditEntry = {
  actor: string;
  action: string;
  at: string;
};

export type CrmPackageAudit = {
  created_by?: string;
  approval_chain?: CrmPackageAuditEntry[];
  notes?: string;
  metadata?: Record<string, unknown>;
};

/** Contrato principal crm_package_config v1. */
export type CrmPackageConfig = {
  version: CrmPackageConfigVersion;
  contract_id: string;
  client: CrmPackageClient;
  source: CrmPackageSource;
  activation: CrmPackageActivation;
  modules: CrmPackageModule[];
  lead_fields: CrmPackageLeadFields;
  pipeline: CrmPackagePipeline;
  activity_types: CrmPackageActivityType[];
  dashboards: CrmPackageDashboards;
  reports: CrmPackageReports;
  labels: CrmPackageLabels;
  visibility_rules: CrmPackageVisibilityRules;
  role_permissions: CrmPackageRolePermission[];
  ai_rules: CrmPackageAiRules;
  branding: CrmPackageBranding;
  integrations: CrmPackageIntegration[];
  data_policy: CrmPackageDataPolicy;
  legacy_compatibility: CrmPackageLegacyCompatibility;
  validation: CrmPackageValidation;
  audit: CrmPackageAudit;
};
