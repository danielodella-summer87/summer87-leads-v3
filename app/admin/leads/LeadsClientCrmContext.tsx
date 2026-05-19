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

type LeadsClientCrmContextValue = {
  isClientCrm: boolean;
  leadDetailVisibility: LeadDetailVisibilitySnapshot;
};

const LeadsClientCrmContext = createContext<LeadsClientCrmContextValue>({
  isClientCrm: false,
  leadDetailVisibility: LEGACY_LEAD_DETAIL_VISIBILITY,
});

export function LeadsClientCrmProvider({
  isClientCrm,
  leadDetailVisibility,
  children,
}: {
  isClientCrm: boolean;
  leadDetailVisibility?: LeadDetailVisibilitySnapshot;
  children: React.ReactNode;
}) {
  return (
    <LeadsClientCrmContext.Provider
      value={{
        isClientCrm,
        leadDetailVisibility: leadDetailVisibility ?? LEGACY_LEAD_DETAIL_VISIBILITY,
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
