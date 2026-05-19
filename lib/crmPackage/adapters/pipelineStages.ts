/**
 * Adapter: pipeline.stages[] → etapas normalizadas (12W-4).
 * Consumido vía snapshot en LeadsClientCrmContext (12W-4b); select Pipeline legacy hasta materialización DB.
 */

import type { CrmPackageConfig } from "../types";

export type PipelineStageTerminal = "won" | "lost";

export type PipelineStageConfig = {
  key: string;
  label: string;
  order: number;
  terminal?: PipelineStageTerminal;
};

export type PipelineStagesAdapterSource = "contract" | "legacy";

export type PipelineStagesAdapterConfig = {
  stages: PipelineStageConfig[];
  stageKeys: string[];
  source: PipelineStagesAdapterSource;
};

const LEGACY_ADAPTER_CONFIG: PipelineStagesAdapterConfig = {
  stages: [],
  stageKeys: [],
  source: "legacy",
};

const TERMINAL_VALUES = new Set<PipelineStageTerminal>(["won", "lost"]);

function normalizeTerminal(value: unknown): PipelineStageTerminal | undefined {
  if (typeof value !== "string") return undefined;
  const terminal = value.trim() as PipelineStageTerminal;
  return TERMINAL_VALUES.has(terminal) ? terminal : undefined;
}

function parseContractStages(
  rawStages: CrmPackageConfig["pipeline"]["stages"]
): PipelineStageConfig[] {
  const seen = new Set<string>();
  const parsed: Array<PipelineStageConfig & { _index: number }> = [];

  for (let index = 0; index < rawStages.length; index++) {
    const raw = rawStages[index];
    if (!raw || typeof raw.key !== "string" || typeof raw.label !== "string") continue;

    const key = raw.key.trim();
    const label = raw.label.trim();
    if (!key || !label) continue;

    const order = typeof raw.order === "number" ? raw.order : Number(raw.order);
    if (!Number.isFinite(order)) continue;

    if (seen.has(key)) continue;
    seen.add(key);

    const terminal = normalizeTerminal(raw.terminal);
    const stage: PipelineStageConfig & { _index: number } = {
      key,
      label,
      order,
      _index: index,
    };
    if (terminal) stage.terminal = terminal;
    parsed.push(stage);
  }

  parsed.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a._index - b._index;
  });

  return parsed.map(({ _index: _ignored, ...stage }) => stage);
}

/**
 * Traduce `pipeline.stages` del contrato a etapas ordenadas y claves deduplicadas.
 * `config` null/undefined o sin etapas válidas → legacy (listas vacías).
 */
export function packageToPipelineStages(
  config: CrmPackageConfig | null | undefined
): PipelineStagesAdapterConfig {
  const rawStages = config?.pipeline?.stages;
  if (!rawStages?.length) {
    return LEGACY_ADAPTER_CONFIG;
  }

  const stages = parseContractStages(rawStages);
  if (stages.length === 0) {
    return LEGACY_ADAPTER_CONFIG;
  }

  return {
    stages,
    stageKeys: stages.map((s) => s.key),
    source: "contract",
  };
}

/** Claves de etapa del contrato activo (atajo sobre `packageToPipelineStages`). */
export function getPipelineStageKeys(
  config: CrmPackageConfig | null | undefined
): string[] {
  return packageToPipelineStages(config).stageKeys;
}

/** Indica si una etapa del contrato está habilitada (solo `source: contract`). */
export function isPipelineStageEnabled(
  adapterConfig: PipelineStagesAdapterConfig,
  stageKey: string
): boolean {
  if (adapterConfig.source !== "contract") return false;
  const key = stageKey.trim();
  if (!key) return false;
  return adapterConfig.stageKeys.includes(key);
}

/** Devuelve la etapa normalizada por `key`, o `undefined`. */
export function getPipelineStageByKey(
  adapterConfig: PipelineStagesAdapterConfig,
  stageKey: string
): PipelineStageConfig | undefined {
  const key = stageKey.trim();
  if (!key) return undefined;
  return adapterConfig.stages.find((s) => s.key === key);
}

/** Etapas terminales (`won` / `lost`) del adapter. */
export function getTerminalPipelineStages(
  adapterConfig: PipelineStagesAdapterConfig
): PipelineStageConfig[] {
  return adapterConfig.stages.filter(
    (s): s is PipelineStageConfig & { terminal: PipelineStageTerminal } =>
      s.terminal === "won" || s.terminal === "lost"
  );
}
