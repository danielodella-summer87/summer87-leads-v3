/**
 * Adapter: lead_fields.groups[] → configuración consumible por formularios (12W-3).
 * Consumido vía snapshot en LeadsClientCrmContext (12W-3b); sin render de campos en formulario hasta 12W-3c+.
 */

import type { CrmPackageConfig } from "../types";

/** Claves de campo documentadas en contrato Pickup; el adapter acepta cualquier string. */
export type KnownLeadFieldKey =
  | "nombre"
  | "telefono"
  | "email"
  | "localidad"
  | "tipo_cliente"
  | "origen"
  | "estado_comercial"
  | "marca"
  | "modelo"
  | "año"
  | "matricula"
  | "tipo_uso"
  | "accesorios_interes"
  | "producto_servicio"
  | "presupuesto_estimado"
  | "vendedor_responsable"
  | "etapa"
  | "proxima_accion"
  | "fecha_limite"
  | "observaciones"
  | "kore_cliente_id"
  | "kore_documento_id"
  | "ultima_sincronizacion"
  | "fuente_dato"
  | "confianza_dato";

export type LeadFieldKey = KnownLeadFieldKey | (string & {});

export type LeadFieldGroupConfig = {
  group: string;
  fields: string[];
};

export type LeadFieldsAdapterSource = "contract" | "legacy";

export type LeadFieldsAdapterConfig = {
  groups: LeadFieldGroupConfig[];
  allFields: string[];
  source: LeadFieldsAdapterSource;
};

const LEGACY_ADAPTER_CONFIG: LeadFieldsAdapterConfig = {
  groups: [],
  allFields: [],
  source: "legacy",
};

/** Normaliza lista de campos: trim, sin vacíos, dedupe preservando primer orden. */
function normalizeFieldList(values: string[] | undefined): string[] {
  if (!values?.length) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    if (typeof raw !== "string") continue;
    const field = raw.trim();
    if (!field || seen.has(field)) continue;
    seen.add(field);
    out.push(field);
  }
  return out;
}

/**
 * Traduce `lead_fields.groups` del contrato a grupos/campos normalizados.
 * `config` null/undefined o sin grupos válidos → legacy (listas vacías; el formulario sigue hardcodeado hasta 12W-3b).
 */
export function packageToLeadFields(
  config: CrmPackageConfig | null | undefined
): LeadFieldsAdapterConfig {
  const rawGroups = config?.lead_fields?.groups;
  if (!rawGroups?.length) {
    return LEGACY_ADAPTER_CONFIG;
  }

  const groups: LeadFieldGroupConfig[] = [];
  const globalSeen = new Set<string>();
  const allFields: string[] = [];

  for (const raw of rawGroups) {
    if (!raw || typeof raw.group !== "string") continue;
    const group = raw.group.trim();
    if (!group) continue;

    const fields = normalizeFieldList(raw.fields);
    if (fields.length === 0) continue;

    groups.push({ group, fields });

    for (const field of fields) {
      if (globalSeen.has(field)) continue;
      globalSeen.add(field);
      allFields.push(field);
    }
  }

  if (groups.length === 0) {
    return LEGACY_ADAPTER_CONFIG;
  }

  return {
    groups,
    allFields,
    source: "contract",
  };
}

/** Grupos normalizados del contrato (atajo sobre `packageToLeadFields`). */
export function getLeadFieldGroups(
  config: CrmPackageConfig | null | undefined
): LeadFieldGroupConfig[] {
  return packageToLeadFields(config).groups;
}

/** Indica si un campo del contrato está habilitado en el adapter (solo `source: contract`). */
export function isLeadFieldEnabled(
  adapterConfig: LeadFieldsAdapterConfig,
  fieldKey: LeadFieldKey
): boolean {
  if (adapterConfig.source !== "contract") return false;
  const key = fieldKey.trim();
  if (!key) return false;
  return adapterConfig.allFields.includes(key);
}

/** Atajo: campo presente en el contrato activo. */
export function hasLeadField(
  config: CrmPackageConfig | null | undefined,
  fieldKey: LeadFieldKey
): boolean {
  return isLeadFieldEnabled(packageToLeadFields(config), fieldKey);
}
