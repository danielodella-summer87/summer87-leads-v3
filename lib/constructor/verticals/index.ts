/**
 * Punto de entrada del catálogo de verticales (CONSTRUCTOR-VERTICALS-1).
 * Reexporta el catálogo, helpers y tipos. Sin efectos secundarios.
 */

export {
  getVerticalDefinition,
  resolveVerticalDefinition,
  getBusinessModulesForVertical,
  getVerticalRequiredFields,
  buildDiscoveryContextInputForVertical,
  VERTICAL_KEYS,
  FALLBACK_VERTICAL_KEY,
  VERTICAL_CATALOG_SCHEMA_VERSION,
} from "./verticalCatalog";

export type {
  VerticalKey,
  VerticalCategory,
  BusinessModulePreset,
  VerticalDefinition,
} from "./verticalCatalog";
