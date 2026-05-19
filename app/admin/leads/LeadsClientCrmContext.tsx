"use client";

import { createContext, useContext } from "react";

/** Snapshot serializable de visibilidad ficha (12W-2b); calculado en layout server. */
export type LeadDetailVisibilitySnapshot = {
  hiddenTabs: string[];
  hiddenBlocks: string[];
  source: "contract" | "legacy";
};

const LEGACY_LEAD_DETAIL_VISIBILITY: LeadDetailVisibilitySnapshot = {
  hiddenTabs: [],
  hiddenBlocks: [],
  source: "legacy",
};

/** Snapshot serializable de lead_fields (12W-3b); calculado en layout server. */
export type LeadFieldsSnapshot = {
  groups: {
    group: string;
    fields: string[];
  }[];
  allFields: string[];
  source: "contract" | "legacy";
};

export const LEGACY_LEAD_FIELDS: LeadFieldsSnapshot = {
  groups: [],
  allFields: [],
  source: "legacy",
};

type LeadsClientCrmContextValue = {
  isClientCrm: boolean;
  leadDetailVisibility: LeadDetailVisibilitySnapshot;
  leadFields: LeadFieldsSnapshot;
};

const LeadsClientCrmContext = createContext<LeadsClientCrmContextValue>({
  isClientCrm: false,
  leadDetailVisibility: LEGACY_LEAD_DETAIL_VISIBILITY,
  leadFields: LEGACY_LEAD_FIELDS,
});

export function LeadsClientCrmProvider({
  isClientCrm,
  leadDetailVisibility,
  leadFields,
  children,
}: {
  isClientCrm: boolean;
  leadDetailVisibility?: LeadDetailVisibilitySnapshot;
  leadFields?: LeadFieldsSnapshot;
  children: React.ReactNode;
}) {
  return (
    <LeadsClientCrmContext.Provider
      value={{
        isClientCrm,
        leadDetailVisibility: leadDetailVisibility ?? LEGACY_LEAD_DETAIL_VISIBILITY,
        leadFields: leadFields ?? LEGACY_LEAD_FIELDS,
      }}
    >
      {children}
    </LeadsClientCrmContext.Provider>
  );
}

/** Snapshot de APP_MODE desde layout server (client_crm vs modos internos). */
export function useLeadsClientCrmMode(): boolean {
  return useContext(LeadsClientCrmContext).isClientCrm;
}

/** Reglas de visibilidad ficha desde contrato activo o legacy (12W-2b). */
export function useLeadDetailVisibility(): LeadDetailVisibilitySnapshot {
  return useContext(LeadsClientCrmContext).leadDetailVisibility;
}

/** Grupos/campos lead_fields desde contrato activo o legacy (12W-3b). */
export function useLeadFieldsConfig(): LeadFieldsSnapshot {
  return useContext(LeadsClientCrmContext).leadFields;
}
