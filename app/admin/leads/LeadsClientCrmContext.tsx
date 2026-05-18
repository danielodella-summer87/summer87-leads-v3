"use client";

import { createContext, useContext } from "react";

const LeadsClientCrmContext = createContext(false);

export function LeadsClientCrmProvider({
  isClientCrm,
  children,
}: {
  isClientCrm: boolean;
  children: React.ReactNode;
}) {
  return (
    <LeadsClientCrmContext.Provider value={isClientCrm}>{children}</LeadsClientCrmContext.Provider>
  );
}

/** Snapshot de APP_MODE desde layout server (client_crm vs modos internos). */
export function useLeadsClientCrmMode(): boolean {
  return useContext(LeadsClientCrmContext);
}
