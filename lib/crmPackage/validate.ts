/**
 * Validación ligera de forma para crm_package_config v1 (sin Zod — 12V-2).
 * Para runtime/activación usar schema Zod en fase posterior si se instala la dependencia.
 */

import type { CrmPackageConfig } from "./types";

export type CrmPackageValidationResult = {
  ok: boolean;
  errors: string[];
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function assertUniqueKeys(
  items: { key: string }[],
  path: string,
  errors: string[]
): void {
  const seen = new Set<string>();
  for (const item of items) {
    if (!isNonEmptyString(item.key)) {
      errors.push(`${path}: cada ítem debe tener key no vacía`);
      continue;
    }
    if (seen.has(item.key)) {
      errors.push(`${path}: key duplicada "${item.key}"`);
    }
    seen.add(item.key);
  }
}

function assertUniqueOrders(
  stages: { order: number; key: string }[],
  errors: string[]
): void {
  const seen = new Set<number>();
  for (const stage of stages) {
    if (typeof stage.order !== "number" || !Number.isFinite(stage.order)) {
      errors.push(`pipeline.stages: order inválido en "${stage.key}"`);
      continue;
    }
    if (seen.has(stage.order)) {
      errors.push(`pipeline.stages: order duplicado ${stage.order}`);
    }
    seen.add(stage.order);
  }
}

/** Comprueba invariantes mínimas del contrato antes de loader/adapters (12W). */
export function validateCrmPackageConfigShape(
  config: CrmPackageConfig
): CrmPackageValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(config.version)) {
    errors.push("version: requerida");
  }
  if (!isNonEmptyString(config.contract_id)) {
    errors.push("contract_id: requerido");
  }
  if (!config.client || !isNonEmptyString(config.client.slug)) {
    errors.push("client.slug: requerido");
  }
  if (!isNonEmptyString(config.activation?.status)) {
    errors.push("activation.status: requerido");
  }
  if (!Array.isArray(config.modules) || config.modules.length === 0) {
    errors.push("modules: debe ser array no vacío");
  } else {
    assertUniqueKeys(config.modules, "modules", errors);
  }
  if (!Array.isArray(config.lead_fields?.groups) || config.lead_fields.groups.length === 0) {
    errors.push("lead_fields.groups: debe existir con al menos un grupo");
  }
  if (!Array.isArray(config.pipeline?.stages) || config.pipeline.stages.length === 0) {
    errors.push("pipeline.stages: debe existir con al menos una etapa");
  } else {
    assertUniqueKeys(config.pipeline.stages, "pipeline.stages", errors);
    assertUniqueOrders(config.pipeline.stages, errors);
  }
  if (!Array.isArray(config.labels?.owner_types) || config.labels.owner_types.length === 0) {
    errors.push("labels.owner_types: no puede estar vacío");
  }

  return { ok: errors.length === 0, errors };
}
