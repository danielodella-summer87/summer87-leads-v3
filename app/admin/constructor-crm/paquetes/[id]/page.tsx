"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";

type DraftMetadata = {
  id: string;
  constructorId: string | null;
  targetClientId: string | null;
  packageVersion: string;
  status: string;
  requiresHumanConfirmation: boolean;
  humanConfirmationStatus: string;
  requestedBy: string | null;
  reviewedBy: string | null;
  approvedBy: string | null;
  rejectedBy: string | null;
  rejectionReason: string | null;
  generatedAt: string;
  reviewedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type DraftDetailResponse = {
  ok: boolean;
  draft?: {
    metadata: DraftMetadata;
    packagePayload: Record<string, unknown>;
    warnings: unknown[];
    blockedActions: unknown[];
    humanConfirmationStatus: string;
  };
  code?: string;
  message?: string;
};

type ApiErrJson = { ok?: boolean; code?: string; message?: string };

const PAYLOAD_SECTION_KEYS: { key: string; label: string }[] = [
  { key: "installation_manifest", label: "Manifest" },
  { key: "client_identity", label: "Identidad cliente" },
  { key: "crm_modules_config", label: "Módulos CRM" },
  { key: "pipeline_config", label: "Pipeline" },
  { key: "lead_fields_config", label: "Campos de leads" },
  { key: "permissions_config", label: "Permisos" },
  { key: "ai_rules_config", label: "Reglas IA" },
  { key: "reports_config", label: "Reportes" },
  { key: "integrations_config", label: "Integraciones" },
  { key: "installer_decisions", label: "Decisiones del instalador" },
  { key: "activation_checklist", label: "Checklist de activación" },
];

const POST_PILOT_PREP_CHECKLIST: string[] = [
  "Validar cliente destino",
  "Revisar configuración mínima del CRM",
  "Confirmar módulos incluidos",
  "Confirmar permisos iniciales",
  "Confirmar integraciones permitidas",
  "Preparar plan de instalación piloto",
  "Registrar aprobación final antes de ejecutar",
];

const POST_PILOT_BLOCKED_IN_UI: string[] = [
  "Crear tenant",
  "Crear usuarios",
  "Enviar invitaciones",
  "Escribir en Zeta",
  "Instalar CRM automáticamente",
  "Publicar en producción",
];

function formatDt(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es-AR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function isDraftHumanActionable(meta: DraftMetadata, humanConfirmationStatus: string): boolean {
  const st = meta.status;
  return (
    (st === "draft_generated" || st === "under_review") && humanConfirmationStatus === "pending"
  );
}

/** UUID en /admin/constructor/paquetes/<uuid> si useParams no entrega id (edge cases App Router). */
function draftIdFromPathname(pathname: string | null): string {
  if (!pathname) return "";
  const m = pathname.match(
    /\/admin\/constructor\/paquetes\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
  );
  return m?.[1] ?? "";
}

function normalizePackagePayload(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

function JsonBlock({ title, value }: { title: string; value: unknown }) {
  const text =
    value === undefined
      ? "// (ausente)"
      : JSON.stringify(value, null, 2);
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/50">
      <div className="border-b border-slate-200 bg-white px-4 py-2">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>
      <pre className="max-h-[min(420px,50vh)] overflow-auto p-4 text-xs leading-relaxed text-slate-700">
        {text}
      </pre>
    </section>
  );
}

export default function PaqueteDraftDetailPage() {
  const params = useParams();
  const pathname = usePathname();
  const rawParamId = params?.id;
  const idFromParams =
    typeof rawParamId === "string"
      ? rawParamId
      : Array.isArray(rawParamId) && typeof rawParamId[0] === "string"
        ? rawParamId[0]
        : "";
  const id = idFromParams || draftIdFromPathname(pathname);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DraftDetailResponse["draft"] | null>(null);
  const [copied, setCopied] = useState(false);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approveAck, setApproveAck] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionKind, setActionKind] = useState<"approve" | "reject" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const successClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/constructor/installable-package/drafts/${encodeURIComponent(id)}`,
        { cache: "no-store", headers: { "Cache-Control": "no-store" } }
      );
      const json = (await res.json()) as DraftDetailResponse;
      if (!res.ok || !json.ok || !json.draft) {
        throw new Error(json?.message ?? json?.code ?? "No se pudo cargar el borrador");
      }
      setData(json.draft);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function copyId() {
    if (!id || !navigator.clipboard?.writeText) return;
    await navigator.clipboard.writeText(id);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function clearSuccessTimer() {
    if (successClearRef.current) {
      clearTimeout(successClearRef.current);
      successClearRef.current = null;
    }
  }

  function flashSuccess(msg: string) {
    clearSuccessTimer();
    setActionSuccess(msg);
    successClearRef.current = setTimeout(() => {
      setActionSuccess(null);
      successClearRef.current = null;
    }, 4500);
  }

  useEffect(() => {
    return () => clearSuccessTimer();
  }, []);

  function closeApproveModal() {
    setShowApproveModal(false);
    setApproveAck(false);
    setActionError(null);
  }

  function closeRejectModal() {
    setShowRejectModal(false);
    setRejectReason("");
    setActionError(null);
  }

  async function submitApprove() {
    if (!id || !approveAck) return;
    setActionKind("approve");
    setActionError(null);
    try {
      const res = await fetch(
        `/api/admin/constructor/installable-package/drafts/${encodeURIComponent(id)}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
          body: JSON.stringify({ confirmationTextAccepted: true }),
        }
      );
      const json = (await res.json()) as ApiErrJson;
      if (!res.ok) {
        const msg = [json?.code, json?.message].filter(Boolean).join(" — ") || "Error al aprobar";
        setActionError(msg);
        return;
      }
      closeApproveModal();
      flashSuccess("Borrador aprobado para piloto. El detalle se actualizó.");
      await load();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Error de red");
    } finally {
      setActionKind(null);
    }
  }

  async function submitReject() {
    const reason = rejectReason.trim();
    if (!id || reason.length === 0) return;
    setActionKind("reject");
    setActionError(null);
    try {
      const res = await fetch(
        `/api/admin/constructor/installable-package/drafts/${encodeURIComponent(id)}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
          body: JSON.stringify({ reason }),
        }
      );
      const json = (await res.json()) as ApiErrJson;
      if (!res.ok) {
        const msg = [json?.code, json?.message].filter(Boolean).join(" — ") || "Error al rechazar";
        setActionError(msg);
        return;
      }
      closeRejectModal();
      flashSuccess("Borrador rechazado. El detalle se actualizó.");
      await load();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Error de red");
    } finally {
      setActionKind(null);
    }
  }

  const meta = data?.metadata;
  const actionable =
    meta && data ? isDraftHumanActionable(meta, data.humanConfirmationStatus) : false;
  const isApprovedState =
    meta &&
    (meta.status === "approved_for_pilot" || data?.humanConfirmationStatus === "approved");
  const isRejectedState =
    meta &&
    (meta.status === "rejected" || data?.humanConfirmationStatus === "rejected");
  const humanSt = data?.humanConfirmationStatus ?? "";
  const showPostApprovalPilotPrep =
    !!meta &&
    !!data &&
    meta.status !== "rejected" &&
    humanSt !== "rejected" &&
    humanSt !== "pending" &&
    (meta.status === "approved_for_pilot" || humanSt === "approved");
  const warningsCount = Array.isArray(data?.warnings) ? data.warnings.length : 0;
  const blockedCount = Array.isArray(data?.blockedActions) ? data.blockedActions.length : 0;
  const busy = actionKind !== null;
  const packagePayload = meta && data ? normalizePackagePayload(data.packagePayload) : {};

  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <Link
            href="/admin/constructor/paquetes"
            className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Borradores de paquete
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Detalle del borrador</h1>
              <p className="mt-1 text-sm text-slate-500">
                Revisión interna. Aprobar o rechazar solo cambia el estado del borrador; no instala CRM,
                no crea tenant ni usuarios y no escribe en Zeta.
              </p>
            </div>
            {id ? (
              <button
                type="button"
                onClick={() => void copyId()}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                Copiar ID
              </button>
            ) : null}
          </div>
          {id ? (
            <p className="mt-2 font-mono text-xs text-slate-500 break-all">{id}</p>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : null}

        {actionSuccess ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {actionSuccess}
          </div>
        ) : null}

        {loading ? (
          <p className="text-sm text-slate-500">Cargando…</p>
        ) : meta && data ? (
          <div className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-800">Resumen del draft</h2>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-slate-400">Estado</dt>
                  <dd className="font-mono text-slate-900">{meta.status}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">package_version</dt>
                  <dd className="text-slate-800">{meta.packageVersion}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Generado</dt>
                  <dd className="text-slate-800">{formatDt(meta.generatedAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Expira</dt>
                  <dd className="text-slate-800">{formatDt(meta.expiresAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">constructor_id</dt>
                  <dd className="break-all font-mono text-xs text-slate-700">{meta.constructorId ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">target_client_id</dt>
                  <dd className="break-all font-mono text-xs text-slate-700">{meta.targetClientId ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">requested_by</dt>
                  <dd className="break-all font-mono text-xs text-slate-700">{meta.requestedBy ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">created_at / updated_at</dt>
                  <dd className="text-xs text-slate-700">
                    {formatDt(meta.createdAt)} · {formatDt(meta.updatedAt)}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-800">Estado humano</h2>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-slate-400">human_confirmation_status</dt>
                  <dd className="font-mono text-slate-900">{data.humanConfirmationStatus}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">requires_human_confirmation</dt>
                  <dd className="text-slate-800">{meta.requiresHumanConfirmation ? "sí" : "no"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">reviewed_by / reviewed_at</dt>
                  <dd className="break-all font-mono text-xs text-slate-700">
                    {meta.reviewedBy ?? "—"} · {formatDt(meta.reviewedAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">approved_by / approved_at</dt>
                  <dd className="break-all font-mono text-xs text-slate-700">
                    {meta.approvedBy ?? "—"} · {formatDt(meta.approvedAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">rejected_by / rejected_at</dt>
                  <dd className="break-all font-mono text-xs text-slate-700">
                    {meta.rejectedBy ?? "—"} · {formatDt(meta.rejectedAt)}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-slate-400">rejection_reason</dt>
                  <dd className="text-slate-800">{meta.rejectionReason ?? "—"}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-800">Confirmación humana</h2>
              <p className="mt-2 text-sm text-slate-600">
                Estas acciones no instalan el CRM, no crean tenant, no crean usuarios y no escriben en Zeta.
                Solo cambian el estado del draft.
              </p>
              <ul className="mt-3 space-y-1.5 border-l-2 border-slate-200 pl-4 text-sm text-slate-700">
                <li>
                  <span className="font-medium text-slate-800">Aprobar para piloto</span> no instala el CRM.
                  Solo habilita el siguiente paso controlado.
                </li>
                <li>
                  <span className="font-medium text-slate-800">Rechazar</span> conserva el borrador como
                  registro histórico y evita avanzar con esta versión.
                </li>
              </ul>
              <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600">
                <p className="font-semibold text-slate-800">Uso / capacitación</p>
                <p className="mt-1">
                  Revisá warnings y acciones bloqueadas antes de decidir. Tras aprobar, el piloto real se
                  dispara en otra fase con permisos y registros aparte. Si dudás, no apruebes: coordiná con
                  quien opera el Constructor.
                </p>
              </div>
              {actionable ? (
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setActionError(null);
                      setApproveAck(false);
                      setShowRejectModal(false);
                      setShowApproveModal(true);
                    }}
                    disabled={busy}
                    className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Aprobar para piloto
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActionError(null);
                      setRejectReason("");
                      setShowApproveModal(false);
                      setShowRejectModal(true);
                    }}
                    disabled={busy}
                    className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-800 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Rechazar draft
                  </button>
                </div>
              ) : isApprovedState ? (
                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  <p className="font-semibold">Borrador aprobado para piloto</p>
                  <p className="mt-1 text-emerald-800">
                    No podés volver a aprobar desde esta pantalla. La aprobación no instaló el CRM: el
                    siguiente paso es otro flujo explícito.
                  </p>
                </div>
              ) : isRejectedState ? (
                <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                  <p className="font-semibold">Borrador rechazado</p>
                  <p className="mt-1 text-rose-800">
                    No se puede aprobar esta versión desde aquí. El registro se mantiene como evidencia.
                    Para avanzar hace falta un borrador nuevo u otro proceso definido por el equipo.
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  Este draft ya no admite confirmación humana directa desde esta pantalla.
                </p>
              )}
            </section>

            {showPostApprovalPilotPrep && meta && data ? (
              <section
                className="rounded-xl border border-slate-200 bg-slate-50/80 p-5"
                aria-labelledby="post-approval-pilot-prep-title"
              >
                <h2
                  id="post-approval-pilot-prep-title"
                  className="text-sm font-semibold text-slate-900"
                >
                  Siguiente paso: preparación de instalación piloto
                </h2>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-700">
                  <p>
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Estado
                    </span>
                    {": "}
                    <span className="font-medium text-slate-800">No ejecutado</span>
                  </p>
                  <p>
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Tipo</span>
                    {": "}
                    <span className="font-medium text-slate-800">Vista previa operativa</span>
                  </p>
                  <p>
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Alcance
                    </span>
                    {": "}
                    <span className="font-medium text-slate-800">preparación controlada</span>
                  </p>
                  <p>
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Riesgo</span>
                    {": "}
                    <span className="font-medium text-slate-800">sin ejecución automática</span>
                  </p>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-700">
                  Este borrador ya fue aprobado para piloto. El siguiente paso será preparar una instalación
                  controlada, pero esta pantalla todavía no crea tenant, usuarios ni CRM. Solo deja visible el
                  camino operativo posterior a la aprobación.
                </p>
                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Checklist visual
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                    {POST_PILOT_PREP_CHECKLIST.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="mt-5 rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Acciones bloqueadas en esta fase
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                    {POST_PILOT_BLOCKED_IN_UI.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="mt-5 flex flex-col items-start gap-2">
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="inline-flex cursor-not-allowed items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-500 opacity-80"
                  >
                    Preparar instalación piloto — Próximamente
                  </button>
                  <p className="text-xs text-slate-500">
                    Botón informativo. No ejecuta acciones en esta fase.
                  </p>
                </div>
              </section>
            ) : null}

            <JsonBlock title="Warnings" value={data.warnings} />
            <JsonBlock title="Acciones bloqueadas (blocked_actions)" value={data.blockedActions} />

            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-800">Contenido del paquete (package_payload)</h2>
              <p className="text-xs text-slate-500">
                JSON solo lectura. Zeta no se edita desde aquí. No hay instalación ni escritura a sistemas
                externos.
              </p>
              <div className="grid gap-4 lg:grid-cols-2">
                {PAYLOAD_SECTION_KEYS.map(({ key, label }) => (
                  <JsonBlock key={key} title={label} value={packagePayload[key]} />
                ))}
              </div>
              <JsonBlock title="package_payload completo" value={packagePayload} />
            </div>
          </div>
        ) : !loading && !error ? (
          <p className="text-sm text-slate-500">Sin datos.</p>
        ) : null}

        {showApproveModal && meta && data ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="approve-modal-title"
          >
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <h3 id="approve-modal-title" className="text-lg font-semibold text-slate-900">
                Confirmar aprobación para piloto
              </h3>
              <p className="mt-3 text-sm text-slate-600">
                Aprobar para piloto no instala el CRM. Solo habilita el siguiente paso controlado.
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
                <li>No se crea tenant.</li>
                <li>No se crean usuarios.</li>
                <li>No se escribe en Zeta.</li>
                <li>No se instala CRM.</li>
              </ul>
              <p className="mt-4 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                Antes de confirmar, revisá también las secciones de abajo:{" "}
                <span className="font-semibold">{warningsCount} advertencia(s)</span> y{" "}
                <span className="font-semibold">{blockedCount} acción(es) bloqueada(s)</span>.
              </p>
              {actionError ? (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {actionError}
                </div>
              ) : null}
              <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300"
                  checked={approveAck}
                  onChange={(e) => setApproveAck(e.target.checked)}
                />
                <span>Entiendo que aprobar este draft no instala el CRM.</span>
              </label>
              <div className="mt-6 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={closeApproveModal}
                  disabled={busy}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void submitApprove()}
                  disabled={busy || !approveAck}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionKind === "approve" ? "Procesando…" : "Confirmar aprobación"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {showRejectModal ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-modal-title"
          >
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <h3 id="reject-modal-title" className="text-lg font-semibold text-slate-900">
                Rechazar draft
              </h3>
              <p className="mt-3 text-sm text-slate-600">
                Rechazar conserva el borrador como registro histórico y evita avanzar con esta versión. No
                borra el registro ni instala nada.
              </p>
              {actionError ? (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {actionError}
                </div>
              ) : null}
              <label className="mt-4 block text-xs font-medium text-slate-500" htmlFor="reject-reason">
                Motivo (obligatorio)
              </label>
              <textarea
                id="reject-reason"
                rows={4}
                placeholder="Motivo del rechazo"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                disabled={busy}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:bg-slate-50"
              />
              <div className="mt-6 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={closeRejectModal}
                  disabled={busy}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void submitReject()}
                  disabled={busy || rejectReason.trim().length === 0}
                  className="rounded-lg border border-rose-300 bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionKind === "reject" ? "Procesando…" : "Confirmar rechazo"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </PageContainer>
  );
}
