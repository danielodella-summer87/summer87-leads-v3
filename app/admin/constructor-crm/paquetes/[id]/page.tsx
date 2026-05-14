"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Copy, Check, Loader2 } from "lucide-react";
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

/** Resumen de fila devuelto por GET simulation-snapshots (defensivo en UI). */
type SimulationSnapshotRow = {
  id: string;
  draftId: string;
  snapshotType: string;
  contractVersion: string;
  simulationStatus: string;
  readinessScore: number | null;
  finalGoNoGo: string | null;
  riskLevel: string | null;
  canProceedToPilotPreparation: boolean;
  createdBy: string | null;
  createdAt: string;
};

type SimulatePreinstallCheck = {
  key: string;
  label: string;
  status: "passed" | "warning" | "blocked" | "failed";
  message: string;
};

type SimulatePreinstallResponse = {
  ok: boolean;
  packageId: string;
  mode: string;
  simulationStatus: string;
  canProceedToPilotPreparation: boolean;
  riskLevel: string;
  summary: string;
  checks: SimulatePreinstallCheck[];
  missingInputs: string[];
  simulatedActions: string[];
  blockedActions: string[];
  nextRecommendedAction: string;
  technicalPreinstallContract?: Record<string, unknown>;
};

/** Extrae el contrato aunque venga en camelCase o snake_case (defensa en runtime). */
function extractTechnicalPreinstallContract(raw: unknown): Record<string, unknown> | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const c = o.technicalPreinstallContract ?? o.technical_preinstall_contract;
  if (c && typeof c === "object" && !Array.isArray(c)) return c as Record<string, unknown>;
  return undefined;
}

/** Reconstruye el estado con todas las claves del JSON (evita pérdida del contrato al tipar/castear). */
function normalizeSimulateResponse(raw: unknown): SimulatePreinstallResponse {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    ok: o.ok === true,
    packageId: String(o.packageId ?? ""),
    mode: String(o.mode ?? ""),
    simulationStatus: String(o.simulationStatus ?? ""),
    canProceedToPilotPreparation: Boolean(o.canProceedToPilotPreparation),
    riskLevel: String(o.riskLevel ?? ""),
    summary: String(o.summary ?? ""),
    checks: (Array.isArray(o.checks) ? o.checks : []) as SimulatePreinstallCheck[],
    missingInputs: (Array.isArray(o.missingInputs) ? o.missingInputs : []) as string[],
    simulatedActions: (Array.isArray(o.simulatedActions) ? o.simulatedActions : []) as string[],
    blockedActions: (Array.isArray(o.blockedActions) ? o.blockedActions : []) as string[],
    nextRecommendedAction: String(o.nextRecommendedAction ?? ""),
    technicalPreinstallContract: extractTechnicalPreinstallContract(raw),
  };
}

function simulateCheckBadgeClass(status: string): string {
  switch (status) {
    case "passed":
      return "border border-emerald-200 bg-emerald-50 text-emerald-900";
    case "warning":
      return "border border-amber-200 bg-amber-50 text-amber-900";
    case "failed":
      return "border border-rose-200 bg-rose-50 text-rose-900";
    case "blocked":
    default:
      return "border border-slate-200 bg-slate-100 text-slate-800";
  }
}

function riskBadgeClass(level: string): string {
  switch (level) {
    case "high":
      return "border border-rose-200 bg-rose-50 text-rose-900";
    case "medium":
      return "border border-amber-200 bg-amber-50 text-amber-900";
    case "low":
    default:
      return "border border-slate-200 bg-slate-100 text-slate-800";
  }
}

function shortSnapshotId(uuid: string): string {
  const t = uuid.trim();
  if (!t) return "—";
  if (t.length <= 10) return t;
  return `${t.slice(0, 8)}…`;
}

function snapshotGoNoGoBadgeClass(v: string | null): string {
  switch (v) {
    case "no_go":
      return "border border-rose-200/80 bg-rose-50 text-rose-900";
    case "pending_inputs":
      return "border border-amber-200/80 bg-amber-50 text-amber-950";
    case "ready_for_manual_install":
      return "border border-emerald-200/70 bg-emerald-50/90 text-emerald-900";
    default:
      return "border border-slate-200 bg-slate-100 text-slate-700";
  }
}

function snapshotRiskBadgeClass(v: string | null): string {
  switch (v) {
    case "high":
      return "border border-rose-200/80 bg-rose-50 text-rose-900";
    case "medium":
      return "border border-amber-200/80 bg-amber-50 text-amber-950";
    case "low":
      return "border border-slate-200 bg-slate-100 text-slate-700";
    default:
      return "border border-slate-200 bg-slate-100 text-slate-600";
  }
}

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

  const [simulateLoading, setSimulateLoading] = useState(false);
  const [simulateResult, setSimulateResult] = useState<SimulatePreinstallResponse | null>(null);
  const [simulateError, setSimulateError] = useState<string | null>(null);
  const [contractJsonCopied, setContractJsonCopied] = useState(false);
  const [snapshotSaving, setSnapshotSaving] = useState(false);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [snapshotSuccess, setSnapshotSuccess] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<SimulationSnapshotRow[]>([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(false);
  const [snapshotsError, setSnapshotsError] = useState<string | null>(null);

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

  useEffect(() => {
    setSimulateResult(null);
    setSimulateError(null);
    setContractJsonCopied(false);
    setSnapshotError(null);
    setSnapshotSuccess(null);
    setSnapshots([]);
    setSnapshotsError(null);
    setSnapshotsLoading(false);
  }, [id]);

  const loadSimulationSnapshots = useCallback(async () => {
    if (!id) return;
    setSnapshotsLoading(true);
    setSnapshotsError(null);
    try {
      const res = await fetch(
        `/api/admin/constructor/installable-package/drafts/${encodeURIComponent(id)}/simulation-snapshots`,
        { cache: "no-store", headers: { "Cache-Control": "no-store" } }
      );
      const raw: unknown = await res.json();
      const j = raw as {
        ok?: boolean;
        code?: string;
        message?: string;
        snapshots?: unknown;
      };

      if (res.status === 503 && j.code === "SNAPSHOT_TABLE_NOT_FOUND") {
        setSnapshots([]);
        setSnapshotsError(
          "La tabla de snapshots no existe. Aplicá la migración antes de ver evidencias."
        );
        return;
      }

      if (!res.ok || j.ok !== true) {
        setSnapshots([]);
        setSnapshotsError(
          [j.code, j.message].filter(Boolean).join(" — ") ||
            `No se pudo cargar el historial de evidencias (HTTP ${res.status}).`
        );
        return;
      }

      const list = Array.isArray(j.snapshots) ? j.snapshots : [];
      const parsed: SimulationSnapshotRow[] = list.map((row) => {
        const r = row as Record<string, unknown>;
        const rs = r.readinessScore;
        const n =
          rs === null || rs === undefined || Number.isNaN(Number(rs)) ? null : Math.round(Number(rs));
        return {
          id: String(r.id ?? ""),
          draftId: String(r.draftId ?? ""),
          snapshotType: String(r.snapshotType ?? ""),
          contractVersion: String(r.contractVersion ?? ""),
          simulationStatus: String(r.simulationStatus ?? ""),
          readinessScore: n,
          finalGoNoGo: r.finalGoNoGo == null || r.finalGoNoGo === undefined ? null : String(r.finalGoNoGo),
          riskLevel: r.riskLevel == null || r.riskLevel === undefined ? null : String(r.riskLevel),
          canProceedToPilotPreparation: Boolean(r.canProceedToPilotPreparation),
          createdBy: r.createdBy == null || r.createdBy === undefined ? null : String(r.createdBy),
          createdAt: String(r.createdAt ?? ""),
        };
      });
      setSnapshots(parsed);
    } catch (e: unknown) {
      setSnapshots([]);
      setSnapshotsError(e instanceof Error ? e.message : "Error de red al cargar evidencias.");
    } finally {
      setSnapshotsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id || !data) return;
    void loadSimulationSnapshots();
  }, [id, data, loadSimulationSnapshots]);

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

  async function runSimulatePreinstall() {
    if (!id || simulateLoading) return;
    setSimulateLoading(true);
    setSimulateError(null);
    setContractJsonCopied(false);
    setSnapshotError(null);
    setSnapshotSuccess(null);
    try {
      const res = await fetch(
        `/api/admin/constructor/installable-package/drafts/${encodeURIComponent(id)}/simulate-preinstall`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
          body: JSON.stringify({}),
        }
      );
      const raw: unknown = await res.json();
      const body = raw as Record<string, unknown>;
      if (!res.ok || body.ok !== true) {
        const msg = [body?.code, body?.message].filter(Boolean).join(" — ") || `Error HTTP ${res.status}`;
        setSimulateError(msg);
        setSimulateResult(null);
        return;
      }
      setSimulateResult(normalizeSimulateResponse(raw));
    } catch (e: unknown) {
      setSimulateError(e instanceof Error ? e.message : "Error de red");
      setSimulateResult(null);
    } finally {
      setSimulateLoading(false);
    }
  }

  async function saveSimulationSnapshot() {
    if (!id || !simulateResult || snapshotSaving) return;
    const contract =
      simulateResult.technicalPreinstallContract ??
      extractTechnicalPreinstallContract(simulateResult as unknown);
    if (!contract) return;

    setSnapshotSaving(true);
    setSnapshotError(null);
    setSnapshotSuccess(null);
    try {
      const payload = {
        ...simulateResult,
        technicalPreinstallContract: contract,
        packageId: simulateResult.packageId || id,
      };
      const res = await fetch(
        `/api/admin/constructor/installable-package/drafts/${encodeURIComponent(id)}/simulation-snapshots`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
          body: JSON.stringify(payload),
        }
      );
      const raw: unknown = await res.json();
      const body = raw as { ok?: boolean; code?: string; message?: string; snapshotId?: string; createdAt?: string };
      if (!res.ok || body.ok !== true) {
        const code = body.code;
        let msg = [code, body.message].filter(Boolean).join(" — ") || `Error HTTP ${res.status}`;
        if (code === "SNAPSHOT_TABLE_NOT_FOUND") {
          msg =
            "La tabla de snapshots no existe. Aplicá la migración antes de guardar evidencia.";
        }
        setSnapshotError(msg);
        return;
      }
      const sid = body.snapshotId ?? "";
      const cat = body.createdAt ?? "";
      setSnapshotSuccess(
        sid
          ? `Evidencia guardada. snapshotId: ${sid}${cat ? ` · ${formatDt(cat)}` : ""}`
          : "Evidencia guardada."
      );
      await loadSimulationSnapshots();
    } catch (e: unknown) {
      setSnapshotError(e instanceof Error ? e.message : "Error de red");
    } finally {
      setSnapshotSaving(false);
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

  const simulationContract = useMemo(() => {
    if (!simulateResult) return null;
    return (
      simulateResult.technicalPreinstallContract ??
      extractTechnicalPreinstallContract(simulateResult as unknown)
    );
  }, [simulateResult]);

  const latestSnapshot = snapshots.length > 0 ? snapshots[0] : null;

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
              <>
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
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Tipo
                      </span>
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
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Riesgo
                      </span>
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
                  <p className="mt-5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-600">
                    <span className="font-semibold text-slate-800">Simulación (solo lectura). </span>
                    Esta simulación no crea tenant, no crea usuarios, no instala CRM y no escribe en Zeta.
                  </p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <button
                      type="button"
                      onClick={() => void runSimulatePreinstall()}
                      disabled={simulateLoading || !id}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-400 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {simulateLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                          Simulando…
                        </>
                      ) : (
                        "Simular preinstalación"
                      )}
                    </button>
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      className="inline-flex cursor-not-allowed items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-500 opacity-80"
                    >
                      Preparar instalación piloto — Próximamente
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Botón &quot;Próximamente&quot; informativo. &quot;Simular preinstalación&quot; solo consulta el
                    servidor en modo simulación; no modifica el borrador.
                  </p>
                </section>

                {simulateError ? (
                  <div
                    className={`rounded-xl border p-4 text-sm ${
                      simulateError.includes("DRAFT_NOT_FOUND")
                        ? "border-red-200 bg-red-50 text-red-800"
                        : "border-amber-200 bg-amber-50 text-amber-950"
                    }`}
                    role="alert"
                  >
                    {simulateError}
                  </div>
                ) : null}

                {simulateResult ? (
                  <section
                    className="rounded-xl border border-slate-200 bg-white p-5"
                    aria-labelledby="simulate-result-title"
                  >
                    <h2 id="simulate-result-title" className="text-sm font-semibold text-slate-900">
                      Resultado de simulación
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Modo: {simulateResult.mode} · Estado: {simulateResult.simulationStatus}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-700">
                      <p>
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Puede avanzar a preparación piloto
                        </span>
                        {": "}
                        <span className="font-semibold text-slate-900">
                          {simulateResult.canProceedToPilotPreparation ? "Sí" : "No"}
                        </span>
                      </p>
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Nivel de riesgo
                        </span>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${riskBadgeClass(simulateResult.riskLevel)}`}
                        >
                          {simulateResult.riskLevel}
                        </span>
                      </p>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-slate-700">{simulateResult.summary}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Esta simulación no crea tenant, no crea usuarios, no instala CRM y no escribe en Zeta.
                    </p>

                    <div className="mt-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Checks</p>
                      <ul className="mt-2 space-y-2">
                        {simulateResult.checks.map((c) => (
                          <li
                            key={c.key}
                            className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 sm:flex-row sm:items-start sm:justify-between"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-900">{c.label}</p>
                              <p className="mt-0.5 text-xs text-slate-600">{c.message}</p>
                            </div>
                            <span
                              className={`shrink-0 self-start rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${simulateCheckBadgeClass(c.status)}`}
                            >
                              {c.status}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Faltantes / revisión
                        </p>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                          {simulateResult.missingInputs.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Acciones simuladas (futuro)
                        </p>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                          {simulateResult.simulatedActions.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Acciones bloqueadas (simulación)
                      </p>
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {simulateResult.blockedActions.map((code) => (
                          <li
                            key={code}
                            className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-800"
                          >
                            {code}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <p className="mt-5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                      <span className="font-semibold text-slate-900">Próximo paso sugerido: </span>
                      {simulateResult.nextRecommendedAction}
                    </p>

                    <div className="mt-6 border-t border-slate-100 pt-5">
                      <h3 className="text-sm font-semibold text-slate-900">Contrato técnico de preinstalación</h3>
                      {simulationContract ? (
                        <div className="mt-3 space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs text-slate-500">
                              Solo lectura. No ejecuta instalación ni escribe en sistemas externos.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                void (async () => {
                                  if (!simulationContract || !navigator.clipboard?.writeText) return;
                                  await navigator.clipboard.writeText(
                                    JSON.stringify(simulationContract, null, 2)
                                  );
                                  setContractJsonCopied(true);
                                  window.setTimeout(() => setContractJsonCopied(false), 2000);
                                })();
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              {contractJsonCopied ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
                              ) : (
                                <Copy className="h-3.5 w-3.5 opacity-70" aria-hidden />
                              )}
                              Copiar contrato JSON
                            </button>
                          </div>
                          <div className="space-y-3 rounded-lg border border-slate-200 bg-white px-3 py-3">
                            <p className="text-xs leading-relaxed text-slate-600">
                              <span className="font-semibold text-slate-800">Importante: </span>
                              Guardar este snapshot no instala el CRM ni ejecuta acciones externas. Solo
                              registra evidencia auditable del resultado de simulación ya generado.
                            </p>
                            {latestSnapshot ? (
                              <p className="text-xs text-slate-500">
                                Último snapshot guardado:{" "}
                                <span className="font-mono text-slate-800">{latestSnapshot.id}</span>
                                {" · "}
                                <span className="text-slate-700">{formatDt(latestSnapshot.createdAt)}</span>
                              </p>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => void saveSimulationSnapshot()}
                              disabled={snapshotSaving || !id}
                              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-400 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {snapshotSaving ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
                                  Guardando evidencia…
                                </>
                              ) : (
                                "Guardar snapshot de evidencia"
                              )}
                            </button>
                            {snapshotError ? (
                              <p
                                className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-950"
                                role="alert"
                              >
                                {snapshotError}
                              </p>
                            ) : null}
                            {snapshotSuccess ? (
                              <p className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-800">
                                {snapshotSuccess}
                              </p>
                            ) : null}
                          </div>
                          {(() => {
                            const tc = simulationContract;
                            const ep = tc.executionPolicy as Record<string, unknown> | undefined;
                            const rd = tc.readiness as Record<string, unknown> | undefined;
                            const tr = tc.tenantResolution as Record<string, unknown> | undefined;
                            const zp = tc.zetaPolicy as Record<string, unknown> | undefined;
                            const bpa = Array.isArray(tc.blockedProductionActions)
                              ? (tc.blockedProductionActions as string[])
                              : [];
                            const audit = Array.isArray(tc.auditNotes) ? (tc.auditNotes as string[]) : [];
                            return (
                              <>
                                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                                  <div>
                                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                      contractVersion
                                    </dt>
                                    <dd className="font-mono text-slate-900">{String(tc.contractVersion ?? "—")}</dd>
                                  </div>
                                  <div>
                                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                      readinessScore
                                    </dt>
                                    <dd className="font-mono font-semibold text-slate-900">
                                      {String(rd?.readinessScore ?? "—")}
                                    </dd>
                                  </div>
                                  <div>
                                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                      finalGoNoGo
                                    </dt>
                                    <dd className="font-mono text-slate-900">{String(rd?.finalGoNoGo ?? "—")}</dd>
                                  </div>
                                  <div>
                                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                      executionPolicy.mode
                                    </dt>
                                    <dd className="font-mono text-slate-900">{String(ep?.mode ?? "—")}</dd>
                                  </div>
                                  <div>
                                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                      executionPolicy.canExecuteInstallation
                                    </dt>
                                    <dd className="font-mono text-slate-900">
                                      {String(ep?.canExecuteInstallation ?? "—")}
                                    </dd>
                                  </div>
                                  <div>
                                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                      tenantResolution.status
                                    </dt>
                                    <dd className="font-mono text-slate-900">{String(tr?.status ?? "—")}</dd>
                                  </div>
                                  <div>
                                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                      zetaPolicy.mode
                                    </dt>
                                    <dd className="font-mono text-slate-900">{String(zp?.mode ?? "—")}</dd>
                                  </div>
                                  <div>
                                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                      zetaPolicy.writeAllowed
                                    </dt>
                                    <dd className="font-mono text-slate-900">{String(zp?.writeAllowed ?? "—")}</dd>
                                  </div>
                                </dl>
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    blockedProductionActions
                                  </p>
                                  <ul className="mt-2 flex flex-wrap gap-1.5">
                                    {bpa.map((code) => (
                                      <li
                                        key={code}
                                        className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-800"
                                      >
                                        {code}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    auditNotes
                                  </p>
                                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                                    {audit.map((n) => (
                                      <li key={n}>{n}</li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    JSON completo (technicalPreinstallContract)
                                  </p>
                                  <pre className="mt-2 max-h-[min(360px,45vh)] overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-[11px] leading-relaxed text-slate-800">
                                    {JSON.stringify(tc, null, 2)}
                                  </pre>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <p className="mt-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                          Contrato técnico no disponible en esta respuesta.
                        </p>
                      )}
                    </div>
                  </section>
                ) : null}
              </>
            ) : null}

            <section className="rounded-xl border border-slate-200 bg-white p-5" aria-labelledby="snapshots-history-title">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 id="snapshots-history-title" className="text-sm font-semibold text-slate-900">
                    Historial de evidencias guardadas
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Solo lectura de registros ya persistidos. No modifica el borrador ni ejecuta instalación.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void loadSimulationSnapshots()}
                  disabled={snapshotsLoading || !id}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-400 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {snapshotsLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
                      Actualizando…
                    </>
                  ) : (
                    "Actualizar historial"
                  )}
                </button>
              </div>

              {snapshotsError ? (
                <div
                  className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
                  role="alert"
                >
                  {snapshotsError}
                </div>
              ) : null}

              {snapshotsLoading && snapshots.length === 0 && !snapshotsError ? (
                <p className="mt-4 text-sm text-slate-500">Cargando historial…</p>
              ) : null}

              {!snapshotsLoading && !snapshotsError && snapshots.length === 0 ? (
                <p className="mt-4 text-sm text-slate-600">
                  Todavía no hay evidencias guardadas para este borrador.
                </p>
              ) : null}

              {snapshots.length > 0 ? (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-[720px] w-full text-left text-sm text-slate-800">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <th className="whitespace-nowrap py-2 pr-3">Fecha</th>
                        <th className="whitespace-nowrap py-2 pr-3">ID</th>
                        <th className="whitespace-nowrap py-2 pr-3">Tipo</th>
                        <th className="whitespace-nowrap py-2 pr-3">Versión contrato</th>
                        <th className="whitespace-nowrap py-2 pr-3">Score</th>
                        <th className="whitespace-nowrap py-2 pr-3">Go / No-Go</th>
                        <th className="whitespace-nowrap py-2 pr-3">Riesgo</th>
                        <th className="whitespace-nowrap py-2 pr-3">Prep. piloto</th>
                        <th className="whitespace-nowrap py-2 pr-3">Creado por</th>
                      </tr>
                    </thead>
                    <tbody>
                      {snapshots.map((s) => (
                        <tr key={s.id} className="border-b border-slate-100 last:border-0">
                          <td className="whitespace-nowrap py-2 pr-3 align-top text-xs text-slate-600">
                            {formatDt(s.createdAt)}
                          </td>
                          <td
                            className="py-2 pr-3 align-top font-mono text-[11px] text-slate-700"
                            title={s.id}
                          >
                            {shortSnapshotId(s.id)}
                          </td>
                          <td className="py-2 pr-3 align-top font-mono text-[11px]">{s.snapshotType || "—"}</td>
                          <td className="py-2 pr-3 align-top font-mono text-[11px]">{s.contractVersion || "—"}</td>
                          <td className="py-2 pr-3 align-top tabular-nums">
                            {s.readinessScore ?? "—"}
                          </td>
                          <td className="py-2 pr-3 align-top">
                            {s.finalGoNoGo ? (
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${snapshotGoNoGoBadgeClass(s.finalGoNoGo)}`}
                              >
                                {s.finalGoNoGo.replace(/_/g, " ")}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="py-2 pr-3 align-top">
                            {s.riskLevel ? (
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${snapshotRiskBadgeClass(s.riskLevel)}`}
                              >
                                {s.riskLevel}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="py-2 pr-3 align-top text-xs">
                            {s.canProceedToPilotPreparation ? "Sí" : "No"}
                          </td>
                          <td className="max-w-[140px] truncate py-2 pr-3 align-top font-mono text-[11px] text-slate-600" title={s.createdBy ?? undefined}>
                            {s.createdBy ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </section>

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
