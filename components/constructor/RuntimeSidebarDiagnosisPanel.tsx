"use client";

/**
 * RuntimeSidebarDiagnosisPanel — diagnóstico VISUAL del impacto del runtime sobre
 * la navegación (CONSTRUCTOR-RUNTIME-4).
 *
 * Muestra, como información de gobierno interno, qué SUGERIRÍA el runtime para el
 * sidebar según el vertical confirmado. Es estrictamente diagnóstico:
 *  - Solo GET /api/admin/constructor/setup.
 *  - Construye runtime con buildConstructorRuntimeConfig.
 *  - Evalúa sugerencias con suggestRuntimeSidebarVisibility.
 *  - NO oculta módulos reales, NO toca el sidebar real, NO afecta client_crm.
 *
 * Fail-open: sin runtime listo, todo queda en "keep" (no se sugiere ocultar nada).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildConstructorRuntimeConfig,
  suggestRuntimeSidebarVisibility,
  type ConstructorRuntimeConfig,
  type SidebarItemLite,
  type SidebarVisibilityResult,
  type SidebarVisibilitySuggestion,
} from "@/lib/constructor/runtime";
import type { DiscoverySubmission } from "@/lib/constructor/discovery";

type SetupRow = Record<string, unknown> | null;

/**
 * Lista representativa (mirror read-only) de los módulos del sidebar + ejemplos
 * vertical-scoped. NO se importa la config real del sidebar para no acoplar ni
 * arriesgar la navegación; esto es solo para el diagnóstico.
 */
const DIAGNOSIS_ITEMS: SidebarItemLite[] = [
  { key: "dashboard_comercial" },
  { key: "leads87" },
  { key: "entidades" },
  { key: "socios" },
  { key: "agenda" },
  { key: "reportes" },
  { key: "ia" },
  { key: "mesa_ayuda" },
  { key: "neuroventas" },
  { key: "personalizacion" },
  { key: "configuracion" },
  { key: "constructor_manual_cliente", category: "internal_constructor" },
  // Ejemplos vertical-scoped (ilustran cómo se comportaría el scoping por vertical):
  { key: "ej_costing", vertical: "cleaning_services" },
  { key: "ej_vehicle_fitment", vertical: "pickup_4x4" },
  { key: "ej_campaign_planning", vertical: "marketing_agency" },
];

const SUGGESTION_STYLES: Record<SidebarVisibilitySuggestion, string> = {
  keep: "bg-emerald-100 text-emerald-800",
  vertical_specific: "bg-blue-100 text-blue-800",
  internal_only: "bg-slate-200 text-slate-700",
  suggest_hide: "bg-amber-100 text-amber-800",
};

const SUGGESTION_LABELS: Record<SidebarVisibilitySuggestion, string> = {
  keep: "Mantener",
  vertical_specific: "Del vertical",
  internal_only: "Interno",
  suggest_hide: "Sugerir ocultar",
};

export function RuntimeSidebarDiagnosisPanel() {
  const [row, setRow] = useState<SetupRow>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadSetup = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/constructor/setup", { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as
        | { data?: Record<string, unknown> | null; error?: string | null }
        | null;
      if (!res.ok) {
        if (res.status === 404) {
          setRow(null);
          return;
        }
        setLoadError(json?.error ?? "No se pudo cargar la configuración del Constructor.");
        return;
      }
      setRow(json?.data ?? null);
    } catch {
      setLoadError("No se pudo cargar la configuración del Constructor.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSetup();
  }, [loadSetup]);

  const { runtime, results } = useMemo<{
    runtime: ConstructorRuntimeConfig;
    results: SidebarVisibilityResult[];
  }>(() => {
    const meta = (row?.meta as Record<string, unknown> | undefined) ?? {};
    const discoverySubmission = (meta.discovery_submission as DiscoverySubmission | undefined) ?? null;
    const verticalKey = typeof meta.vertical_key === "string" ? meta.vertical_key : null;
    const rt = buildConstructorRuntimeConfig({ discoverySubmission, verticalKey });
    return { runtime: rt, results: suggestRuntimeSidebarVisibility(rt, DIAGNOSIS_ITEMS) };
  }, [row]);

  return (
    <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">
        Diagnóstico de navegación por vertical (runtime)
      </h2>
      <p className="mt-1 text-sm text-gray-600">
        Muestra qué <strong>sugeriría</strong> el runtime para el sidebar según el vertical
        confirmado. <strong>Diagnóstico interno: no oculta módulos todavía</strong> ni cambia la
        navegación real.
      </p>

      {loading ? (
        <p className="mt-4 text-sm text-gray-500">Cargando diagnóstico…</p>
      ) : loadError ? (
        <p className="mt-4 text-sm text-red-600">{loadError}</p>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-700">
              Estado runtime: {runtime.status}
            </span>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-700">
              Vertical: {runtime.vertical_label ?? "—"}
              {runtime.vertical_key ? (
                <code className="ml-1 text-xs text-gray-500">({runtime.vertical_key})</code>
              ) : null}
            </span>
            <span
              className={
                "rounded-full px-2.5 py-1 text-xs " +
                (runtime.status === "ready_readonly"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-100 text-slate-600")
              }
            >
              {runtime.status === "ready_readonly"
                ? "Sugerencias activas (solo diagnóstico)"
                : "Fail-open: todo se mantiene"}
            </span>
          </div>

          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100">
            {results.map((r) => (
              <li key={r.key} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span className="font-mono text-xs text-gray-700">{r.key}</span>
                <span className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{r.reason}</span>
                  <span className={"rounded-full px-2.5 py-1 text-xs " + SUGGESTION_STYLES[r.suggestion]}>
                    {SUGGESTION_LABELS[r.suggestion]}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <p className="text-xs text-gray-400">
            Lista representativa con fines de diagnóstico. No refleja ni altera el filtrado real del
            sidebar; el CRM operativo (client_crm) no se ve afectado por este panel.
          </p>
        </div>
      )}
    </section>
  );
}

export default RuntimeSidebarDiagnosisPanel;
