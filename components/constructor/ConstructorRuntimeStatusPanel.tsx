"use client";

/**
 * ConstructorRuntimeStatusPanel — primer consumo READ-ONLY del runtime
 * (CONSTRUCTOR-RUNTIME-2).
 *
 * Muestra, como información de gobierno interno, qué PODRÍA consumir el CRM
 * operativo según el Discovery confirmado. Es estrictamente read-only:
 *  - Solo hace GET /api/admin/constructor/setup.
 *  - Lee meta.discovery_submission y meta.vertical_key.
 *  - Construye ConstructorRuntimeConfig con buildConstructorRuntimeConfig.
 *
 * NO hace PATCH, NO escribe datos, NO genera package_payload, NO activa motores,
 * NO crea el CRM operativo, NO llama servicios externos, NO toca SQL.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildConstructorRuntimeConfig,
  type ConstructorRuntimeConfig,
} from "@/lib/constructor/runtime";
import type { DiscoverySubmission } from "@/lib/constructor/discovery";

type SetupRow = Record<string, unknown> | null;

const STATUS_STYLES: Record<ConstructorRuntimeConfig["status"], string> = {
  unavailable: "bg-slate-100 text-slate-600",
  draft: "bg-slate-100 text-slate-700",
  blocked: "bg-red-100 text-red-800",
  review_required: "bg-amber-100 text-amber-800",
  ready_readonly: "bg-emerald-100 text-emerald-800",
};

const STATUS_LABELS: Record<ConstructorRuntimeConfig["status"], string> = {
  unavailable: "No disponible",
  draft: "Borrador",
  blocked: "Bloqueado",
  review_required: "Requiere revisión",
  ready_readonly: "Listo (read-only)",
};

function Chips({ title, items, tone }: { title: string; items: string[]; tone: "ok" | "warn" }) {
  if (items.length === 0) return null;
  return (
    <div className="text-sm">
      <span className="font-medium text-gray-800">{title}:</span>{" "}
      <span className={tone === "ok" ? "text-emerald-700" : "text-amber-700"}>{items.join(", ")}</span>
    </div>
  );
}

export function ConstructorRuntimeStatusPanel() {
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
        // 404 (sin fila de setup) se trata como "sin snapshot", no como error duro.
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

  const config = useMemo<ConstructorRuntimeConfig>(() => {
    const meta = (row?.meta as Record<string, unknown> | undefined) ?? {};
    const discoverySubmission = (meta.discovery_submission as DiscoverySubmission | undefined) ?? null;
    const verticalKey = typeof meta.vertical_key === "string" ? meta.vertical_key : null;
    return buildConstructorRuntimeConfig({ discoverySubmission, verticalKey });
  }, [row]);

  const noSnapshot = config.status === "unavailable";

  return (
    <section className="mt-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">Runtime read-only del Constructor</h2>
      <p className="mt-1 text-sm text-gray-600">
        Esto muestra qué podría consumir el CRM operativo según el Discovery confirmado. No genera
        paquete, no activa motores y no crea el CRM operativo.
      </p>

      {loading ? (
        <p className="mt-4 text-sm text-gray-500">Cargando estado del runtime…</p>
      ) : loadError ? (
        <p className="mt-4 text-sm text-red-600">{loadError}</p>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className={"rounded-full px-2.5 py-1 font-medium " + STATUS_STYLES[config.status]}>
              Estado runtime: {STATUS_LABELS[config.status]}
            </span>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-700">
              Vertical: {config.vertical_label ?? "—"}
              {config.vertical_key ? (
                <code className="ml-1 text-xs text-gray-500">({config.vertical_key})</code>
              ) : null}
            </span>
            {config.vertical_key && !config.vertical_in_catalog ? (
              <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs text-red-800">
                vertical fuera de catálogo
              </span>
            ) : null}
          </div>

          {noSnapshot ? (
            <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              Todavía no hay Discovery cerrado. Primero confirmá el vertical y cerrá el Discovery con
              el botón <strong>“Terminé”</strong> en el cuestionario.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-700">
                  Discovery: {config.discovery_status ?? "—"}
                </span>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-700">
                  Completitud: {config.discovery_completion_percent}%
                </span>
                <span
                  className={
                    "rounded-full px-2.5 py-1 text-xs " +
                    (config.human_review_required
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800")
                  }
                >
                  Revisión humana: {config.human_review_required ? "sí" : "no"}
                </span>
              </div>

              <div className="space-y-1 rounded-lg bg-slate-50 p-3">
                <Chips title="Módulos habilitados" items={config.enabled_modules} tone="ok" />
                <Chips title="Módulos bloqueados" items={config.blocked_modules} tone="warn" />
                <Chips title="Faltantes críticos" items={config.missing_critical_fields} tone="warn" />
                <Chips title="Bloqueos de motores" items={config.engine_blockers} tone="warn" />
                <Chips title="Bloqueos del vertical" items={config.vertical_blockers} tone="warn" />
                <Chips title="Módulos bloqueados (detalle)" items={config.business_module_blockers} tone="warn" />
                {config.quoting_blockers !== undefined ? (
                  <Chips title="Costeo/cotización (módulo del vertical)" items={config.quoting_blockers} tone="warn" />
                ) : null}
                {config.status === "ready_readonly" ? (
                  <p className="text-sm text-emerald-700">
                    Discovery confirmado sin bloqueos. Sigue siendo <strong>read-only</strong>; los
                    próximos pasos (paquete, motores, CRM operativo) requieren una fase específica.
                  </p>
                ) : null}
              </div>
            </>
          )}

          {/* Compuertas de seguridad — informativas, siempre off en esta fase */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">
              Generar paquete: {config.can_generate_package_payload ? "sí" : "no"}
            </span>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">
              Activar motores: {config.can_activate_engines ? "sí" : "no"}
            </span>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">
              Crear CRM operativo: {config.can_create_operational_crm ? "sí" : "no"}
            </span>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">
              Consumo read-only: {config.can_use_readonly_runtime ? "sí" : "no"}
            </span>
          </div>

          <p className="text-xs text-gray-400">
            Panel informativo de gobierno. Solo lectura: no escribe datos, no ejecuta acciones y no
            toca el CRM operativo.
          </p>
        </div>
      )}
    </section>
  );
}

export default ConstructorRuntimeStatusPanel;
