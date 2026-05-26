/**
 * Sanitización y whitelist de contract_fields_json (12W-5e).
 * Funciones puras — sin Supabase.
 */

import type { CrmPackageConfig } from "../types";
import type { LeadFieldsAdapterConfig } from "./leadFields";
import { packageToLeadFields } from "./leadFields";

export type ContractFieldValue = string | number | boolean | string[];

export type ContractFieldsInput = Record<string, unknown>;

/** Claves de contrato que persisten en columnas core (no en JSONB). */
export const CORE_CONTRACT_FIELD_KEYS = new Set([
  "nombre",
  "telefono",
  "email",
  "origen",
  "producto_servicio",
  "vendedor_responsable",
  "etapa",
  "proxima_accion",
  "fecha_limite",
  "observaciones",
]);

/** Alias de columnas BD / payload legacy — nunca en contract_fields_json. */
export const CORE_LEAD_COLUMN_KEYS = new Set([
  "contacto",
  "pipeline",
  "oferta",
  "notas",
  "next_activity_type",
  "next_activity_at",
  "comercial_id",
  "direccion",
  "rubro_id",
  "cantidad_personal",
  "superficie_m2",
  "visita_scheduled_at",
  "estado",
  "website",
  "instagram",
  "empresa_id",
  "rating",
  "score",
  "meet_url",
]);

export const ALL_CORE_FIELD_KEYS = new Set([
  ...CORE_CONTRACT_FIELD_KEYS,
  ...CORE_LEAD_COLUMN_KEYS,
]);

const MAX_KEYS = 50;
const MAX_STRING_LENGTH = 500;
const MAX_ARRAY_ITEMS = 20;
const MAX_ARRAY_ITEM_LENGTH = 100;

export type SanitizeContractFieldsOptions = {
  /** Si se omite o vacío, no filtra por contrato (solo forma + core + kore). */
  whitelist?: Set<string> | null;
  /** Ignorar claves `kore_*` (default true en create manual). */
  rejectKore?: boolean;
  /** Ignorar claves reservadas `_…` (default true). */
  rejectSystemKeys?: boolean;
};

export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/** Whitelist = campos del contrato menos core y kore (para JSONB). */
export function getContractFieldWhitelistFromLeadFields(
  leadFieldsConfig: LeadFieldsAdapterConfig
): Set<string> {
  const out = new Set<string>();
  for (const raw of leadFieldsConfig.allFields) {
    if (typeof raw !== "string") continue;
    const key = raw.trim();
    if (!key) continue;
    if (ALL_CORE_FIELD_KEYS.has(key)) continue;
    if (key.startsWith("kore_")) continue;
    if (key.startsWith("_")) continue;
    out.add(key);
  }
  return out;
}

/** Elimina claves core del objeto (mutación sobre copia). */
export function stripCoreLeadFieldKeys(
  input: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof key !== "string") continue;
    const k = key.trim();
    if (!k || ALL_CORE_FIELD_KEYS.has(k)) continue;
    out[k] = value;
  }
  return out;
}

function sanitizeString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const s = value.trim();
  if (!s.length) return null;
  return s.length > MAX_STRING_LENGTH ? s.slice(0, MAX_STRING_LENGTH) : s;
}

function sanitizeStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const out: string[] = [];
  for (const item of value) {
    if (out.length >= MAX_ARRAY_ITEMS) break;
    const s = sanitizeString(item);
    if (!s) continue;
    const clipped =
      s.length > MAX_ARRAY_ITEM_LENGTH ? s.slice(0, MAX_ARRAY_ITEM_LENGTH) : s;
    out.push(clipped);
  }
  return out.length ? out : null;
}

function sanitizeScalar(value: unknown): ContractFieldValue | null {
  const str = sanitizeString(value);
  if (str !== null) return str;

  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "boolean") return value;

  const arr = sanitizeStringArray(value);
  if (arr !== null) return arr;

  return null;
}

/**
 * Normaliza entrada a objeto plano de valores permitidos (sin whitelist de contrato).
 */
export function normalizeContractFieldsJson(
  input: unknown
): Record<string, ContractFieldValue> {
  if (input === undefined || input === null) return {};
  if (!isPlainRecord(input)) return {};

  const stripped = stripCoreLeadFieldKeys(input);
  const out: Record<string, ContractFieldValue> = {};
  let count = 0;

  for (const [rawKey, rawValue] of Object.entries(stripped)) {
    if (count >= MAX_KEYS) break;
    const key = rawKey.trim();
    if (!key || key.startsWith("_")) continue;
    if (rawValue === null || rawValue === undefined) continue;

    const scalar = sanitizeScalar(rawValue);
    if (scalar === null) continue;

    out[key] = scalar;
    count += 1;
  }

  return out;
}

/**
 * Sanitiza y filtra por whitelist de contrato; ignora core y (opcional) kore.
 */
export function sanitizeContractFields(
  input: unknown,
  options: SanitizeContractFieldsOptions = {}
): Record<string, ContractFieldValue> {
  const {
    whitelist = null,
    rejectKore = true,
    rejectSystemKeys = true,
  } = options;

  const normalized = normalizeContractFieldsJson(input);
  const out: Record<string, ContractFieldValue> = {};

  for (const [key, value] of Object.entries(normalized)) {
    if (rejectSystemKeys && key.startsWith("_")) continue;
    if (rejectKore && key.startsWith("kore_")) continue;
    if (ALL_CORE_FIELD_KEYS.has(key)) continue;
    if (whitelist && whitelist.size > 0 && !whitelist.has(key)) continue;
    out[key] = value;
  }

  return out;
}

/**
 * Adapter de lead_fields: contrato activo o adapter legacy neutro.
 */
export function resolveLeadFieldsAdapterForPersistence(
  config: CrmPackageConfig | null | undefined
): LeadFieldsAdapterConfig {
  return packageToLeadFields(config);
}

/** Whitelist JSONB lista para persistencia en API; vacía = modo neutro sin contrato activo. */
export function resolveContractFieldWhitelist(
  config: CrmPackageConfig | null | undefined
): Set<string> {
  return getContractFieldWhitelistFromLeadFields(
    resolveLeadFieldsAdapterForPersistence(config)
  );
}

function isExplicitlyEmptyContractFieldValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" && !value.trim()) return true;
  return false;
}

/**
 * Merge seguro para PATCH: actualiza solo claves whitelist presentes en `incoming`;
 * vacíos explícitos eliminan la clave; claves futuras/no whitelist se preservan.
 */
export function mergeContractFieldsPatch(
  current: unknown,
  incoming: unknown,
  options: SanitizeContractFieldsOptions = {}
): Record<string, ContractFieldValue> {
  const currentObj: Record<string, unknown> = isPlainRecord(current) ? { ...current } : {};
  const whitelist =
    options.whitelist === undefined
      ? resolveContractFieldWhitelist(undefined)
      : options.whitelist;
  const hasActiveWhitelist = Boolean(whitelist && whitelist.size > 0);

  const preservedFuture = (): Record<string, unknown> =>
    hasActiveWhitelist
      ? Object.fromEntries(
          Object.entries(currentObj).filter(
            ([key]) => !ALL_CORE_FIELD_KEYS.has(key) && !whitelist!.has(key)
          )
        )
      : {};

  const sanitizeWhitelisted = (
    source: Record<string, unknown>
  ): Record<string, ContractFieldValue> =>
    hasActiveWhitelist
      ? sanitizeContractFields(
          Object.fromEntries(
            Object.entries(source).filter(([key]) => whitelist!.has(key))
          ),
          { ...options, whitelist }
        )
      : sanitizeContractFields(source, { ...options, whitelist: null });

  const combinePreservedFutureWithWhitelisted = (
    future: Record<string, unknown>,
    whitelisted: Record<string, ContractFieldValue>
  ): Record<string, ContractFieldValue> => {
    if (!hasActiveWhitelist) {
      return whitelisted;
    }
    const out: Record<string, ContractFieldValue> = { ...whitelisted };
    for (const [key, value] of Object.entries(future)) {
      if (key in out) continue;
      const scalar = sanitizeScalar(value);
      if (scalar !== null) out[key] = scalar;
    }
    return out;
  };

  if (incoming === undefined) {
    return combinePreservedFutureWithWhitelisted(
      preservedFuture(),
      sanitizeWhitelisted(currentObj)
    );
  }

  if (!isPlainRecord(incoming)) {
    return combinePreservedFutureWithWhitelisted(
      preservedFuture(),
      sanitizeWhitelisted(currentObj)
    );
  }

  const merged: Record<string, unknown> = { ...currentObj };

  for (const [rawKey, rawValue] of Object.entries(incoming)) {
    const key = rawKey.trim();
    if (!key) continue;
    if (hasActiveWhitelist && !whitelist!.has(key)) continue;
    if (ALL_CORE_FIELD_KEYS.has(key)) continue;

    if (isExplicitlyEmptyContractFieldValue(rawValue)) {
      delete merged[key];
      continue;
    }

    const single = sanitizeContractFields({ [key]: rawValue }, {
      ...options,
      whitelist,
    });
    if (single[key] !== undefined) {
      merged[key] = single[key];
    } else {
      delete merged[key];
    }
  }

  return combinePreservedFutureWithWhitelisted(
    preservedFuture(),
    sanitizeWhitelisted(merged)
  );
}
