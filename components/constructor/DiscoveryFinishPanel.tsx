"use client";

/**
 * DiscoveryFinishPanel — botón "Terminé" del Discovery (CONSTRUCTOR-DISCOVERY-8b).
 *
 * Cierra el Discovery como SNAPSHOT para revisión interna:
 *  - Lee el setup actual (GET /api/admin/constructor/setup).
 *  - Arma el snapshot con buildDiscoverySubmission (helper puro 8a/8b).
 *  - Persiste en crm_setup_config.meta.discovery_submission vía el PATCH meta existente.
 *
 * NO activa motores, NO genera package_payload, NO aprueba paquetes, NO crea el
 * CRM operativo, NO ejecuta SQL ni llama servicios externos.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildDiscoverySubmission,
  type DiscoverySetupInput,
  type DiscoverySubmission,
} from "@/lib/constructor/discovery";
import {
  detectVerticalKey,
  resolveVerticalDefinition,
  buildDiscoveryContextInputForVertical,
  VERTICAL_KEYS,
  type VerticalKey,
} from "@/lib/constructor/verticals";

function readConfirmedVerticalKey(row: SetupRow): VerticalKey | null {
  const meta = (row?.meta as Record<string, unknown> | undefined) ?? {};
  const raw = typeof meta.vertical_key === "string" ? meta.vertical_key.trim() : "";
  return (VERTICAL_KEYS as readonly string[]).includes(raw) ? (raw as VerticalKey) : null;
}

type SetupRow = Record<string, unknown> | null;

function rowToSetupInput(row: SetupRow): DiscoverySetupInput {
  const r = (row ?? {}) as Record<string, unknown>;
  return {
    empresa: (r.empresa as DiscoverySetupInput["empresa"]) ?? null,
    cuestionario: (r.cuestionario as DiscoverySetupInput["cuestionario"]) ?? null,
    documentos: (r.documentos as DiscoverySetupInput["documentos"]) ?? null,
    diagnostico: (r.diagnostico as DiscoverySetupInput["diagnostico"]) ?? null,
    proceso_pipeline: (r.proceso_pipeline as DiscoverySetupInput["proceso_pipeline"]) ?? null,
    motores_ia: (r.motores_ia as DiscoverySetupInput["motores_ia"]) ?? null,
    reportes: (r.reportes as DiscoverySetupInput["reportes"]) ?? null,
    auditoria: (r.auditoria as DiscoverySetupInput["auditoria"]) ?? null,
    meta: (r.meta as DiscoverySetupInput["meta"]) ?? null,
  };
}

function BlockerList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="text-sm">
      <span className="font-medium text-amber-800">{title}:</span>{" "}
      <span className="text-amber-700">{items.join(", ")}</span>
    </div>
  );
}

export function DiscoveryFinishPanel() {
  const [row, setRow] = useState<SetupRow>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  // "" => usar detección automática; un VerticalKey => override manual del instalador.
  const [selectedVertical, setSelectedVertical] = useState<VerticalKey | "">("");
  const [confirmingVertical, setConfirmingVertical] = useState(false);
  const [verticalConfirmed, setVerticalConfirmed] = useState(false);

  const loadSetup = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/constructor/setup", { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as
        | { data?: Record<string, unknown> | null; error?: string | null }
        | null;
      if (!res.ok) {
        setLoadError(json?.error ?? "No se pudo cargar la configuración del Constructor.");
        return;
      }
      const data = json?.data ?? null;
      setRow(data);
      const confirmedKey = readConfirmedVerticalKey(data);
      if (confirmedKey) {
        setSelectedVertical(confirmedKey);
        setVerticalConfirmed(true);
      }
      const existing = (data?.meta as Record<string, unknown> | undefined)?.discovery_submission as
        | DiscoverySubmission
        | undefined;
      if (existing?.submitted_at) setSavedAt(existing.submitted_at);
    } catch {
      setLoadError("No se pudo cargar la configuración del Constructor.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSetup();
  }, [loadSetup]);

  // Vertical efectivo: override manual del instalador si existe, si no detección automática.
  const vertical = useMemo(() => {
    if (!row) return null;
    const base = rowToSetupInput(row);
    // Sugerencia basada en el rubro/giro (sin considerar meta.vertical_key persistido).
    const autoDetected: VerticalKey = detectVerticalKey({
      empresa: (base.empresa as Record<string, unknown> | null) ?? null,
    });
    const verticalKey: VerticalKey = selectedVertical !== "" ? selectedVertical : autoDetected;
    const definition = resolveVerticalDefinition(verticalKey);
    const input = buildDiscoveryContextInputForVertical(base, verticalKey);
    const source: "confirmed" | "manual" | "detected" =
      selectedVertical !== ""
        ? verticalConfirmed && readConfirmedVerticalKey(row) === selectedVertical
          ? "confirmed"
          : "manual"
        : "detected";
    return { verticalKey, autoDetected, definition, input, source };
  }, [row, selectedVertical, verticalConfirmed]);

  // Preview (sin sellar): muestra estado, vertical detectado y blockers antes de cerrar.
  const preview = useMemo<DiscoverySubmission | null>(() => {
    if (!vertical) return null;
    return buildDiscoverySubmission(vertical.input, {});
  }, [vertical]);

  // Persiste meta.vertical_key como decisión explícita del instalador (sin snapshot).
  const handleConfirmVertical = useCallback(async () => {
    if (!row || !vertical) return;
    setConfirmingVertical(true);
    setSaveError(null);
    try {
      const existingMeta = (row.meta as Record<string, unknown> | undefined) ?? {};
      const mergedMeta = { ...existingMeta, vertical_key: vertical.verticalKey };
      const res = await fetch("/api/admin/constructor/setup", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "meta", data: { meta: mergedMeta } }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string | null } | null;
      if (!res.ok) {
        setSaveError(json?.error ?? "No se pudo confirmar el vertical.");
        return;
      }
      setRow((prev) => ({ ...(prev ?? {}), meta: mergedMeta }));
      setSelectedVertical(vertical.verticalKey);
      setVerticalConfirmed(true);
    } catch {
      setSaveError("No se pudo confirmar el vertical.");
    } finally {
      setConfirmingVertical(false);
    }
  }, [row, vertical]);

  const handleFinish = useCallback(async () => {
    if (!row || !vertical) return;
    setSubmitting(true);
    setSaveError(null);
    try {
      const submittedAt = new Date().toISOString();
      const submission = buildDiscoverySubmission(vertical.input, {
        submittedAt,
        generatedAt: submittedAt,
      });

      const existingMeta = (row.meta as Record<string, unknown> | undefined) ?? {};
      // El cierre también deja persistido el vertical_key efectivo como decisión.
      const mergedMeta = {
        ...existingMeta,
        vertical_key: vertical.verticalKey,
        discovery_submission: submission,
      };

      const res = await fetch("/api/admin/constructor/setup", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "meta", data: { meta: mergedMeta } }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string | null } | null;
      if (!res.ok) {
        setSaveError(json?.error ?? "No se pudo guardar el snapshot del Discovery.");
        return;
      }
      setRow((prev) => ({ ...(prev ?? {}), meta: mergedMeta }));
      setSelectedVertical(vertical.verticalKey);
      setVerticalConfirmed(true);
      setSavedAt(submittedAt);
    } catch {
      setSaveError("No se pudo guardar el snapshot del Discovery.");
    } finally {
      setSubmitting(false);
    }
  }, [row, vertical]);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Cerrar Discovery</h2>
          <p className="mt-1 text-sm text-gray-600">
            Esto cierra el Discovery como <strong>snapshot para revisión interna</strong>. No activa
            motores ni crea el CRM operativo todavía.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-gray-500">Cargando estado del Discovery…</p>
      ) : loadError ? (
        <p className="mt-4 text-sm text-red-600">{loadError}</p>
      ) : preview && vertical ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="discovery-vertical" className="text-sm font-medium text-gray-800">
                Vertical:
              </label>
              <select
                id="discovery-vertical"
                value={vertical.verticalKey}
                onChange={(e) => {
                  setSelectedVertical(e.target.value as VerticalKey);
                  setVerticalConfirmed(false);
                }}
                className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-800"
              >
                {VERTICAL_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {resolveVerticalDefinition(k).label} ({k})
                  </option>
                ))}
              </select>
              <span
                className={
                  "rounded-full px-2.5 py-1 text-xs " +
                  (vertical.source === "confirmed"
                    ? "bg-emerald-100 text-emerald-800"
                    : vertical.source === "manual"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-200 text-gray-700")
                }
              >
                {vertical.source === "confirmed"
                  ? "Confirmado"
                  : vertical.source === "manual"
                    ? "Selección manual (sin confirmar)"
                    : "Detectado automáticamente"}
              </span>
              <button
                type="button"
                onClick={handleConfirmVertical}
                disabled={confirmingVertical || vertical.source === "confirmed"}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-100 disabled:opacity-50"
              >
                {confirmingVertical ? "Confirmando…" : "Confirmar vertical"}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Sugerido por el rubro: <code className="text-gray-600">{vertical.autoDetected}</code>. El
              vertical confirmado se guarda en la configuración del Constructor.
            </p>
            <div className="mt-2 text-sm text-gray-700">
              <span className="font-medium text-gray-800">Módulos del vertical:</span>{" "}
              {vertical.definition.business_modules.map((m) => m.key).join(", ")}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Los módulos se derivan del vertical confirmado. Podrán ajustarse luego antes de generar
              el paquete instalable.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-800">
              Estado: {preview.status}
            </span>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-700">
              Completitud: {preview.completion_percent}%
            </span>
            <span
              className={
                "rounded-full px-2.5 py-1 " +
                (preview.human_review_required
                  ? "bg-amber-100 text-amber-800"
                  : "bg-emerald-100 text-emerald-800")
              }
            >
              Revisión humana: {preview.human_review_required ? "sí" : "no"}
            </span>
          </div>

          <div className="space-y-1 rounded-lg bg-amber-50 p-3">
            <BlockerList title="Faltantes críticos" items={preview.missing_critical_fields} />
            <BlockerList title="Bloqueos de motores" items={preview.engine_blockers} />
            <BlockerList title="Bloqueos del vertical" items={preview.vertical_blockers} />
            <BlockerList title="Módulos bloqueados" items={preview.business_module_blockers} />
            {preview.quoting_blockers !== undefined ? (
              <BlockerList title="Costeo/cotización (módulo del vertical)" items={preview.quoting_blockers} />
            ) : null}
            {preview.missing_critical_fields.length === 0 &&
            preview.engine_blockers.length === 0 &&
            preview.vertical_blockers.length === 0 &&
            preview.business_module_blockers.length === 0 ? (
              <p className="text-sm text-emerald-700">Sin bloqueos detectados.</p>
            ) : null}
          </div>

          <pre className="whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
            {preview.summary}
          </pre>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleFinish}
              disabled={submitting}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
            >
              {submitting ? "Guardando snapshot…" : "Terminé — cerrar Discovery (snapshot)"}
            </button>
            {savedAt ? (
              <span className="text-sm text-emerald-700">
                Snapshot guardado ({savedAt}). No se activaron motores ni se creó el CRM operativo.
              </span>
            ) : null}
            {saveError ? <span className="text-sm text-red-600">{saveError}</span> : null}
          </div>

          <p className="text-xs text-gray-400">
            El botón solo guarda un snapshot en la configuración del Constructor. No genera el paquete
            instalable, no aprueba nada y no toca el CRM operativo.
          </p>
        </div>
      ) : null}
    </section>
  );
}

export default DiscoveryFinishPanel;
