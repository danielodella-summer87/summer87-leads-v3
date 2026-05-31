/**
 * Punto de entrada del módulo Discovery del Constructor (CONSTRUCTOR-DISCOVERY-8a).
 * Reexporta el helper puro y sus tipos. Sin efectos secundarios.
 */

export {
  buildDiscoveryContextFromSetup,
  buildDiscoverySubmission,
  buildDiscoverySubmissionSummary,
  DISCOVERY_CONTEXT_SCHEMA_VERSION,
  DISCOVERY_SUBMISSION_SCHEMA_VERSION,
  READ_ONLY_ENGINES,
  SENSITIVE_ENGINES,
} from "./discoveryContext";

export type {
  DiscoveryDataState,
  DiscoveryFieldSource,
  DiscoveryField,
  DiscoveryStatus,
  DiscoverySourceRef,
  BusinessModuleCategory,
  BusinessModuleInput,
  BusinessModule,
  DiscoveryVerticalFieldInput,
  DiscoverySetupStep,
  DiscoverySetupInput,
  DiscoveryContext,
  DiscoverySubmission,
  BuildDiscoverySubmissionOptions,
} from "./discoveryContext";
