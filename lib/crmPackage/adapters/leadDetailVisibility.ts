/**
 * Adapter: visibility_rules.lead_detail → configuración consumible por ficha lead (12W-2).
 * No importar desde app/admin hasta 12W-2b (integración fallback-safe).
 */

import type { CrmPackageConfig } from "../types";

export type LeadDetailTabId = string;
export type LeadDetailBlockId = string;

export type LeadDetailVisibilitySource = "contract" | "legacy";

export type LeadDetailVisibilityConfig = {
  hiddenTabs: string[];
  hiddenBlocks: string[];
  source: LeadDetailVisibilitySource;
};

/** Normaliza lista: trim, sin vacíos, dedupe preservando primer orden. */
function normalizeIdList(values: string[] | undefined): string[] {
  if (!values?.length) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    if (typeof raw !== "string") continue;
    const id = raw.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/**
 * Traduce `visibility_rules.lead_detail` del contrato a reglas de UI.
 * `config` null/undefined → legacy (listas vacías; la ficha sigue con isClientCrmUi hasta 12W-2b).
 */
export function packageToLeadDetailVisibility(
  config: CrmPackageConfig | null | undefined
): LeadDetailVisibilityConfig {
  const leadDetail = config?.visibility_rules?.lead_detail;
  if (!leadDetail) {
    return { hiddenTabs: [], hiddenBlocks: [], source: "legacy" };
  }

  const hiddenTabs = normalizeIdList(leadDetail.hide_tabs);
  const hiddenBlocks = normalizeIdList(leadDetail.hide_blocks);

  if (hiddenTabs.length === 0 && hiddenBlocks.length === 0) {
    return { hiddenTabs: [], hiddenBlocks: [], source: "legacy" };
  }

  return {
    hiddenTabs,
    hiddenBlocks,
    source: "contract",
  };
}

export function isLeadDetailTabHidden(
  visibility: LeadDetailVisibilityConfig,
  tabId: LeadDetailTabId
): boolean {
  const id = tabId.trim();
  if (!id) return false;
  return visibility.hiddenTabs.includes(id);
}

export function isLeadDetailBlockHidden(
  visibility: LeadDetailVisibilityConfig,
  blockId: LeadDetailBlockId
): boolean {
  const id = blockId.trim();
  if (!id) return false;
  return visibility.hiddenBlocks.includes(id);
}
