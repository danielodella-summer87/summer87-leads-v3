"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, Copy, Check } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";

type EvidenceSummary = {
  snapshotCount: number;
  latestSnapshotId: string | null;
  latestSnapshotCreatedAt: string | null;
  latestContractVersion: string | null;
  latestReadinessScore: number | null;
  latestFinalGoNoGo: string | null;
  latestRiskLevel: string | null;
  hasEvidence: boolean;
};

type DraftListItem = {
  id: string;
  status: string;
  packageVersion: string;
  constructorId: string | null;
  targetClientId: string | null;
  requestedBy: string | null;
  generatedAt: string;
  expiresAt: string | null;
  warningsCount: number;
  blockedActionsCount: number;
  humanConfirmationStatus: string;
  createdAt: string;
  updatedAt: string;
  evidenceSummary: EvidenceSummary;
};

type FilterTab = "all" | "pending" | "approved" | "rejected" | "expired";

type EvidenceFilterTab =
  | "all"
  | "with"
  | "without"
  | "pending_inputs"
  | "no_go"
  | "ready_manual"
  | "risk_low"
  | "risk_medium"
  | "risk_high";

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

function shortId(uuid: string): string {
  const t = uuid.trim();
  if (t.length < 8) return t;
  return `${t.slice(0, 8)}…`;
}

function isExpiredAt(iso: string | null): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return t < Date.now();
}

function isRejectedRow(row: DraftListItem): boolean {
  return row.status === "rejected" || row.humanConfirmationStatus === "rejected";
}

function isApprovedRow(row: DraftListItem): boolean {
  return row.status === "approved_for_pilot" || row.humanConfirmationStatus === "approved";
}

function isPendingReviewRow(row: DraftListItem): boolean {
  if (isRejectedRow(row)) return false;
  if (row.status === "expired") return false;
  return row.humanConfirmationStatus === "pending";
}

function simulationAvailable(row: DraftListItem): boolean {
  if (isRejectedRow(row)) return false;
  if (row.humanConfirmationStatus === "pending") return false;
  return row.status === "approved_for_pilot" || row.humanConfirmationStatus === "approved";
}

function filterRow(tab: FilterTab, row: DraftListItem): boolean {
  const expired = isExpiredAt(row.expiresAt);
  switch (tab) {
    case "all":
      return true;
    case "pending":
      return isPendingReviewRow(row);
    case "approved":
      return isApprovedRow(row);
    case "rejected":
      return isRejectedRow(row);
    case "expired":
      return expired;
    default:
      return true;
  }
}

function evidenceSummaryForRow(row: DraftListItem): EvidenceSummary {
  return row.evidenceSummary ?? defaultEvidenceSummary();
}

/** Filtro client-side por evidencia; se combina con el filtro de estado. */
function filterEvidenceRow(tab: EvidenceFilterTab, row: DraftListItem): boolean {
  const es = evidenceSummaryForRow(row);
  switch (tab) {
    case "all":
      return true;
    case "with":
      return es.hasEvidence === true || es.snapshotCount > 0;
    case "without":
      return !es.hasEvidence || es.snapshotCount === 0;
    case "pending_inputs":
      return es.latestFinalGoNoGo === "pending_inputs";
    case "no_go":
      return es.latestFinalGoNoGo === "no_go";
    case "ready_manual":
      return es.latestFinalGoNoGo === "ready_for_manual_install";
    case "risk_low":
      return es.latestRiskLevel === "low";
    case "risk_medium":
      return es.latestRiskLevel === "medium";
    case "risk_high":
      return es.latestRiskLevel === "high";
    default:
      return true;
  }
}

function passesCombinedFilters(
  row: DraftListItem,
  stateTab: FilterTab,
  evidenceTab: EvidenceFilterTab
): boolean {
  return filterRow(stateTab, row) && filterEvidenceRow(evidenceTab, row);
}

const TAB_LABELS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "pending", label: "Pendientes" },
  { id: "approved", label: "Aprobados" },
  { id: "rejected", label: "Rechazados" },
  { id: "expired", label: "Expirados" },
];

const EVIDENCE_TAB_LABELS: { id: EvidenceFilterTab; label: string }[] = [
  { id: "all", label: "Toda evidencia" },
  { id: "with", label: "Con evidencia" },
  { id: "without", label: "Sin evidencia" },
  { id: "pending_inputs", label: "Pending inputs" },
  { id: "no_go", label: "No-go" },
  { id: "ready_manual", label: "Ready manual" },
  { id: "risk_low", label: "Riesgo bajo" },
  { id: "risk_medium", label: "Riesgo medio" },
  { id: "risk_high", label: "Riesgo alto" },
];

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function defaultEvidenceSummary(): EvidenceSummary {
  return {
    snapshotCount: 0,
    latestSnapshotId: null,
    latestSnapshotCreatedAt: null,
    latestContractVersion: null,
    latestReadinessScore: null,
    latestFinalGoNoGo: null,
    latestRiskLevel: null,
    hasEvidence: false,
  };
}

function parseEvidenceSummary(raw: unknown): EvidenceSummary {
  const d = defaultEvidenceSummary();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return d;
  const e = raw as Record<string, unknown>;
  const countRaw = e.snapshotCount ?? e.snapshot_count;
  const n = typeof countRaw === "number" ? countRaw : Number(countRaw);
  const scoreRaw = e.latestReadinessScore ?? e.latest_readiness_score;
  const score =
    scoreRaw === null || scoreRaw === undefined || Number.isNaN(Number(scoreRaw))
      ? null
      : Math.round(Number(scoreRaw));
  const snapCount = Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  const sid = e.latestSnapshotId ?? e.latest_snapshot_id;
  const sca = e.latestSnapshotCreatedAt ?? e.latest_snapshot_created_at;
  const lcv = e.latestContractVersion ?? e.latest_contract_version;
  const fg = e.latestFinalGoNoGo ?? e.latest_final_go_no_go;
  const rl = e.latestRiskLevel ?? e.latest_risk_level;
  const str = (v: unknown) => {
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    return s.length ? s : null;
  };
  return {
    snapshotCount: snapCount,
    latestSnapshotId: str(sid),
    latestSnapshotCreatedAt: str(sca),
    latestContractVersion: str(lcv),
    latestReadinessScore: score,
    latestFinalGoNoGo: str(fg),
    latestRiskLevel: str(rl),
    hasEvidence: Boolean(e.hasEvidence ?? e.has_evidence ?? snapCount > 0),
  };
}

function evidenceCountLabel(n: number): string {
  if (n <= 0) return "Sin evidencia";
  if (n === 1) return "1 snapshot";
  return `${n} snapshots`;
}

function goNoGoBadgeClass(v: string | null): string {
  switch (v) {
    case "no_go":
      return "border border-rose-200/80 bg-rose-50 text-rose-900";
    case "pending_inputs":
      return "border border-amber-200/80 bg-amber-50 text-amber-950";
    case "ready_for_manual_install":
      return "border border-emerald-200/70 bg-emerald-50/90 text-emerald-900";
    default:
      return "border border-slate-200 bg-slate-100 text-slate-600";
  }
}

function riskListBadgeClass(v: string | null): string {
  switch (v) {
    case "high":
      return "border border-rose-200/80 bg-rose-50 text-rose-900";
    case "medium":
      return "border border-amber-200/80 bg-amber-50 text-amber-950";
    case "low":
      return "border border-slate-200 bg-slate-100 text-slate-700";
    default:
      return "border border-slate-200 bg-slate-100 text-slate-500";
  }
}

/** Badge ejecutivo derivado del último snapshot (resumen ya agregado en el listado). */
function consolidatedEvidenceRowBadge(es: EvidenceSummary): {
  label: string;
  helper: string;
  pillClass: string;
} {
  if (es.snapshotCount === 0) {
    return {
      label: "Sin evidencia",
      helper: "Todavía no hay snapshots guardados.",
      pillClass: "border border-slate-200 bg-slate-100 text-slate-700",
    };
  }
  const go = (es.latestFinalGoNoGo ?? "").trim();
  switch (go) {
    case "pending_inputs":
      return {
        label: "Pendiente de insumos",
        helper: "Requiere completar configuración antes de avanzar.",
        pillClass: "border border-amber-200 bg-amber-50 text-amber-950",
      };
    case "no_go":
      return {
        label: "No avanzar",
        helper: "No conviene avanzar sin correcciones.",
        pillClass: "border border-rose-200 bg-rose-50 text-rose-900",
      };
    case "ready_for_manual_install":
      return {
        label: "Lista para revisión manual",
        helper: "Requiere aprobación humana final antes de ejecutar.",
        pillClass: "border border-emerald-200/80 bg-emerald-50/90 text-emerald-900",
      };
    default:
      return {
        label: "Evidencia incompleta",
        helper: "Snapshot guardado sin dictamen final.",
        pillClass: "border border-slate-200 bg-slate-100 text-slate-600",
      };
  }
}

/** Texto alineado al badge para la línea de filtros combinados (sin cambiar la lógica de filtro). */
function evidenceFilterDisplayLabel(tab: EvidenceFilterTab): string {
  switch (tab) {
    case "pending_inputs":
      return "Pendiente de insumos";
    case "no_go":
      return "No avanzar";
    case "ready_manual":
      return "Lista para revisión manual";
    default:
      return EVIDENCE_TAB_LABELS.find((x) => x.id === tab)?.label ?? tab;
  }
}

type ListExecutiveRollup = {
  total: number;
  pendingHuman: number;
  approved: number;
  rejected: number;
  withEvidence: number;
  withoutEvidence: number;
  pendingInputs: number;
  noGo: number;
  readyManual: number;
  riskMedHigh: number;
  approvedWithoutEvidence: number;
  dictamen: string;
  operativa: string;
  chips: { key: string; label: string; className: string }[];
};

/** Resumen ejecutivo global sobre `items` (ignora filtros de bandeja). */
function computeListExecutiveRollup(items: DraftListItem[]): ListExecutiveRollup {
  const emptyChips: ListExecutiveRollup["chips"] = [];
  const total = items.length;
  if (total === 0) {
    return {
      total: 0,
      pendingHuman: 0,
      approved: 0,
      rejected: 0,
      withEvidence: 0,
      withoutEvidence: 0,
      pendingInputs: 0,
      noGo: 0,
      readyManual: 0,
      riskMedHigh: 0,
      approvedWithoutEvidence: 0,
      dictamen: "",
      operativa: "",
      chips: emptyChips,
    };
  }

  let pendingHuman = 0;
  let approved = 0;
  let rejected = 0;
  let withEvidence = 0;
  let pendingInputs = 0;
  let noGo = 0;
  let readyManual = 0;
  let riskMedHigh = 0;
  let approvedWithoutEvidence = 0;

  for (const row of items) {
    if (isPendingReviewRow(row)) pendingHuman++;
    if (isApprovedRow(row)) approved++;
    if (isRejectedRow(row)) rejected++;
    const es = evidenceSummaryForRow(row);
    const hasEv = es.hasEvidence === true || es.snapshotCount > 0;
    if (hasEv) withEvidence++;
    const go = (es.latestFinalGoNoGo ?? "").trim();
    if (go === "pending_inputs") pendingInputs++;
    else if (go === "no_go") noGo++;
    else if (go === "ready_for_manual_install") readyManual++;
    const rl = (es.latestRiskLevel ?? "").trim();
    if (rl === "medium" || rl === "high") riskMedHigh++;
    if (isApprovedRow(row) && !hasEv) approvedWithoutEvidence++;
  }

  const withoutEvidence = total - withEvidence;

  let dictamen = "";
  if (noGo > 0) {
    dictamen = "Hay evidencia con no-go. No conviene avanzar sin correcciones.";
  } else if (rejected > 0) {
    dictamen =
      "Hay borradores rechazados que deben quedar como evidencia histórica o ser reemplazados por una nueva versión.";
  } else if (approvedWithoutEvidence > 0) {
    dictamen =
      "Hay borradores aprobados sin evidencia técnica. Conviene simular y guardar snapshot antes de avanzar.";
  } else if (pendingInputs > 0) {
    dictamen =
      "Hay evidencia pendiente de insumos. Conviene completar configuración mínima antes de cualquier instalación.";
  } else if (readyManual > 0) {
    dictamen =
      "Hay borradores listos para revisión manual final. Aun así, no deben instalarse sin aprobación explícita.";
  } else if (withEvidence === 0) {
    dictamen =
      "Todavía no hay evidencia técnica guardada. El próximo paso recomendado es simular preinstalación en los borradores aprobados.";
  } else {
    dictamen =
      "El conjunto cargado no muestra señales críticas prioritarias. Continuar seguimiento operativo habitual.";
  }

  let operativa = "";
  if (noGo > 0) {
    operativa = "Priorizar corrección de borradores con evidencia en no-go antes de planificar instalación.";
  } else if (approvedWithoutEvidence > 0) {
    operativa = "Simular preinstalación y guardar evidencia.";
  } else if (pendingInputs > 0) {
    operativa = "Completar módulos, pipeline, campos y permisos antes de instalar.";
  } else if (rejected > 0) {
    operativa = "Mantener rechazados como historial; generar nuevo borrador si corresponde.";
  } else if (readyManual > 0) {
    operativa = "Solicitar aprobación humana final antes de ejecución.";
  } else if (approved === 0) {
    operativa = "Revisar o generar borradores aprobables.";
  } else {
    operativa = "Mantener disciplina de evidencias y revisión humana antes de cualquier ejecución.";
  }

  const chips: ListExecutiveRollup["chips"] = [
    { key: "tot", label: `Total ${total}`, className: "border-slate-200 bg-white text-slate-800" },
    {
      key: "ph",
      label: `Pend. humano ${pendingHuman}`,
      className:
        pendingHuman > 0
          ? "border-amber-200 bg-amber-50 text-amber-950"
          : "border-slate-200 bg-slate-50 text-slate-600",
    },
    {
      key: "ap",
      label: `Aprobados ${approved}`,
      className:
        approved > 0
          ? "border-emerald-200/80 bg-emerald-50/90 text-emerald-900"
          : "border-slate-200 bg-slate-50 text-slate-600",
    },
    {
      key: "rj",
      label: `Rechazados ${rejected}`,
      className:
        rejected > 0
          ? "border-rose-200 bg-rose-50 text-rose-900"
          : "border-slate-200 bg-slate-50 text-slate-600",
    },
    {
      key: "ev",
      label: `Evid. sí ${withEvidence} · no ${withoutEvidence}`,
      className: "border-slate-200 bg-slate-50 text-slate-700",
    },
    noGo > 0
      ? {
          key: "ng",
          label: `No-go ${noGo}`,
          className: "border-rose-200 bg-rose-50 text-rose-900",
        }
      : pendingInputs > 0
        ? {
            key: "pi",
            label: `Pend. insumos ${pendingInputs}`,
            className: "border-amber-200 bg-amber-50 text-amber-950",
          }
        : readyManual > 0
          ? {
              key: "rm",
              label: `Ready manual ${readyManual}`,
              className: "border-emerald-200/80 bg-emerald-50/90 text-emerald-900",
            }
          : {
              key: "rh",
              label: `Riesgo med./alto ${riskMedHigh}`,
              className:
                riskMedHigh > 0
                  ? "border-amber-200 bg-amber-50 text-amber-950"
                  : "border-slate-200 bg-slate-50 text-slate-500",
            },
  ];

  return {
    total,
    pendingHuman,
    approved,
    rejected,
    withEvidence,
    withoutEvidence,
    pendingInputs,
    noGo,
    readyManual,
    riskMedHigh,
    approvedWithoutEvidence,
    dictamen,
    operativa,
    chips,
  };
}

export default function PaquetesDraftsListPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<DraftListItem[]>([]);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [evidenceFilter, setEvidenceFilter] = useState<EvidenceFilterTab>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [evidenceSummaryUnavailable, setEvidenceSummaryUnavailable] = useState(false);
  const [evidenceSummaryMessage, setEvidenceSummaryMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/constructor/installable-package/drafts?limit=100", {
        cache: "no-store",
        headers: { "Cache-Control": "no-store" },
      });
      const json = (await res.json()) as {
        ok?: boolean;
        items?: unknown;
        message?: string;
        code?: string;
        evidenceSummaryUnavailable?: boolean;
        evidenceSummaryMessage?: string;
      };
      if (!res.ok) {
        throw new Error(json?.message ?? json?.code ?? "Error al cargar borradores");
      }
      setEvidenceSummaryUnavailable(Boolean(json.evidenceSummaryUnavailable));
      setEvidenceSummaryMessage(
        typeof json.evidenceSummaryMessage === "string" && json.evidenceSummaryMessage.trim()
          ? json.evidenceSummaryMessage.trim()
          : null
      );
      const raw = Array.isArray(json?.items) ? json.items : [];
      const normalized: DraftListItem[] = raw.map((x) => {
        const o = x as Record<string, unknown>;
        return {
          id: String(o.id ?? ""),
          status: String(o.status ?? ""),
          packageVersion: String(o.packageVersion ?? o.package_version ?? ""),
          constructorId: (o.constructorId ?? o.constructor_id) as string | null,
          targetClientId: (o.targetClientId ?? o.target_client_id) as string | null,
          requestedBy: (o.requestedBy ?? o.requested_by) as string | null,
          generatedAt: String(o.generatedAt ?? o.generated_at ?? ""),
          expiresAt: (o.expiresAt ?? o.expires_at) as string | null,
          warningsCount: typeof o.warningsCount === "number" ? o.warningsCount : Number(o.warnings_count) || 0,
          blockedActionsCount:
            typeof o.blockedActionsCount === "number"
              ? o.blockedActionsCount
              : Number(o.blocked_actions_count) || 0,
          humanConfirmationStatus: String(
            o.humanConfirmationStatus ?? o.human_confirmation_status ?? ""
          ),
          createdAt: String(o.createdAt ?? o.created_at ?? ""),
          updatedAt: String(o.updatedAt ?? o.updated_at ?? o.createdAt ?? o.created_at ?? ""),
          evidenceSummary: parseEvidenceSummary(o.evidenceSummary ?? o.evidence_summary),
        };
      });
      setItems(normalized.filter((r) => r.id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
      setItems([]);
      setEvidenceSummaryUnavailable(false);
      setEvidenceSummaryMessage(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const total = items.length;
    const pending = items.filter((r) => isPendingReviewRow(r)).length;
    const approved = items.filter((r) => isApprovedRow(r)).length;
    const rejected = items.filter((r) => isRejectedRow(r)).length;
    const expired = items.filter((r) => isExpiredAt(r.expiresAt)).length;
    const withEvidence = items.filter((r) => {
      const es = evidenceSummaryForRow(r);
      return es.hasEvidence === true || es.snapshotCount > 0;
    }).length;
    const withoutEvidence = total - withEvidence;
    return { total, pending, approved, rejected, expired, withEvidence, withoutEvidence };
  }, [items]);

  const filteredItems = useMemo(
    () => items.filter((row) => passesCombinedFilters(row, filter, evidenceFilter)),
    [items, filter, evidenceFilter]
  );

  const listExecutiveRollup = useMemo(() => computeListExecutiveRollup(items), [items]);

  async function copyFullId(uuid: string) {
    if (!uuid || !navigator.clipboard?.writeText) return;
    await navigator.clipboard.writeText(uuid);
    setCopiedId(uuid);
    window.setTimeout(() => setCopiedId((cur) => (cur === uuid ? null : cur)), 2000);
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/admin/constructor"
              className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Constructor CRM
            </Link>
            <h1 className="text-xl font-semibold text-slate-900">Borradores de paquete instalable</h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-500">
              Vista interna solo lectura. Inspección de filas en{" "}
              <code className="rounded bg-slate-100 px-1">installer_package_drafts</code>.
            </p>
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
              <p className="font-medium text-slate-900">Capacitación</p>
              <p className="mt-1">
                Esta bandeja muestra borradores de paquetes instalables. Revisar, aprobar o rechazar un
                borrador no instala CRM, no crea tenant, no crea usuarios y no escribe en Zeta. La instalación
                real requiere una fase posterior explícita.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-7">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Total</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{stats.total}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Pendientes</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-amber-700">{stats.pending}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Aprobados</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{stats.approved}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Rechazados</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{stats.rejected}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Expirados</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{stats.expired}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Con evidencia</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{stats.withEvidence}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Sin evidencia</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-600">{stats.withoutEvidence}</p>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Estado</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {TAB_LABELS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFilter(t.id)}
                  className={cx(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    filter === t.id
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Evidencia</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {EVIDENCE_TAB_LABELS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setEvidenceFilter(t.id)}
                  className={cx(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    evidenceFilter === t.id
                      ? "border-slate-800 bg-slate-800 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Filtros combinados:{" "}
            <span className="font-medium text-slate-700">
              {TAB_LABELS.find((x) => x.id === filter)?.label} · {evidenceFilterDisplayLabel(evidenceFilter)}
            </span>
          </p>
        </div>

        <section
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          aria-labelledby="list-executive-summary-title"
        >
          <h2 id="list-executive-summary-title" className="text-sm font-semibold text-slate-900">
            Resumen ejecutivo del listado
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Métricas globales sobre los borradores cargados (no cambian al filtrar la bandeja).
          </p>
          {loading ? (
            <p className="mt-3 text-sm text-slate-500">Cargando resumen ejecutivo…</p>
          ) : listExecutiveRollup.total === 0 ? (
            <p className="mt-3 text-sm text-slate-600">No hay borradores cargados para resumir.</p>
          ) : (
            <>
              <div className="mt-3 flex flex-wrap gap-2">
                {listExecutiveRollup.chips.map((c) => (
                  <span
                    key={c.key}
                    className={cx(
                      "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold tabular-nums",
                      c.className
                    )}
                  >
                    {c.label}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-slate-500 tabular-nums">
                Pend. insumos: {listExecutiveRollup.pendingInputs} · No-go: {listExecutiveRollup.noGo} · Ready
                manual: {listExecutiveRollup.readyManual} · Riesgo med./alto: {listExecutiveRollup.riskMedHigh} ·
                Aprob. sin evidencia: {listExecutiveRollup.approvedWithoutEvidence}
              </p>
              <p className="mt-4 text-sm font-medium leading-snug text-slate-900">
                {listExecutiveRollup.dictamen}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                <span className="font-semibold text-slate-700">Recomendación operativa: </span>
                {listExecutiveRollup.operativa}
              </p>
            </>
          )}
        </section>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Bandeja</p>
            <p className="text-xs text-slate-500">
              Mostrando{" "}
              <span className="font-semibold text-slate-800">{filteredItems.length}</span> de {items.length}
            </p>
          </div>
          {evidenceSummaryUnavailable ? (
            <div
              className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-950"
              role="status"
            >
              <p className="font-medium">
                No se pudo cargar el resumen de evidencias. El listado de borradores sigue disponible.
              </p>
              {evidenceSummaryMessage ? (
                <p className="mt-1 text-xs text-amber-900/90">{evidenceSummaryMessage}</p>
              ) : null}
            </div>
          ) : null}
          {loading ? (
            <p className="p-6 text-sm text-slate-500">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No hay borradores registrados.</p>
          ) : filteredItems.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">
              No hay borradores para esta combinación de filtros.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1280px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium text-slate-500">
                  <tr>
                    <th className="px-3 py-2.5">ID</th>
                    <th className="px-3 py-2.5">Estado draft</th>
                    <th className="px-3 py-2.5">Estado humano</th>
                    <th className="px-3 py-2.5">Creado</th>
                    <th className="px-3 py-2.5">Actualizado</th>
                    <th className="px-3 py-2.5">Expira</th>
                    <th className="px-3 py-2.5">constructor_id</th>
                    <th className="px-3 py-2.5">target_client_id</th>
                    <th className="px-3 py-2.5">Versión</th>
                    <th className="min-w-[200px] px-3 py-2.5">Evidencia</th>
                    <th className="px-3 py-2.5">Señal</th>
                    <th className="px-3 py-2.5">Simulación</th>
                    <th className="px-3 py-2.5">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((row) => {
                    const expired = isExpiredAt(row.expiresAt);
                    const pendingReview = isPendingReviewRow(row);
                    const approved = isApprovedRow(row);
                    const rejected = isRejectedRow(row);
                    const simOk = simulationAvailable(row);

                    const ev = evidenceSummaryForRow(row);
                    const scoreLabel =
                      ev.latestReadinessScore !== null && ev.latestReadinessScore !== undefined
                        ? `${ev.latestReadinessScore}/100`
                        : "—";
                    const consolidated = consolidatedEvidenceRowBadge(ev);

                    return (
                      <tr key={row.id} className="align-top hover:bg-slate-50/80">
                        <td className="px-3 py-2.5">
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-xs text-slate-800" title={row.id}>
                              {shortId(row.id)}
                            </span>
                            <button
                              type="button"
                              onClick={() => void copyFullId(row.id)}
                              className="inline-flex w-fit items-center gap-1 rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                            >
                              {copiedId === row.id ? (
                                <Check className="h-3 w-3 text-emerald-600" aria-hidden />
                              ) : (
                                <Copy className="h-3 w-3 opacity-70" aria-hidden />
                              )}
                              Copiar UUID
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs text-slate-800">{row.status}</td>
                        <td className="px-3 py-2.5 font-mono text-xs text-slate-800">
                          {row.humanConfirmationStatus}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-xs text-slate-700">
                          {formatDt(row.createdAt)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-xs text-slate-700">
                          {formatDt(row.updatedAt)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-xs text-slate-700">
                          {formatDt(row.expiresAt)}
                        </td>
                        <td className="max-w-[120px] truncate px-3 py-2.5 font-mono text-[11px] text-slate-600">
                          {row.constructorId ?? "—"}
                        </td>
                        <td className="max-w-[120px] truncate px-3 py-2.5 font-mono text-[11px] text-slate-600">
                          {row.targetClientId ?? "—"}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-slate-700">{row.packageVersion}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex max-w-[220px] flex-col gap-1.5 text-[11px] leading-snug text-slate-700">
                            <div>
                              <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                                Evidencia consolidada
                              </p>
                              <span
                                className={cx(
                                  "mt-0.5 inline-flex max-w-full rounded-md px-2 py-0.5 text-[10px] font-semibold leading-tight",
                                  consolidated.pillClass
                                )}
                              >
                                {consolidated.label}
                              </span>
                              <p className="mt-0.5 text-[10px] leading-snug text-slate-500">
                                {consolidated.helper}
                              </p>
                            </div>
                            <span className="font-medium text-slate-800">{evidenceCountLabel(ev.snapshotCount)}</span>
                            <span>
                              <span className="text-slate-500">Score:</span>{" "}
                              <span className="font-mono tabular-nums text-slate-900">{scoreLabel}</span>
                            </span>
                            <span className="flex flex-wrap items-center gap-1">
                              <span className="text-slate-500">Go/No-Go:</span>
                              {ev.latestFinalGoNoGo ? (
                                <span
                                  className={cx(
                                    "inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                                    goNoGoBadgeClass(ev.latestFinalGoNoGo)
                                  )}
                                >
                                  {ev.latestFinalGoNoGo.replace(/_/g, " ")}
                                </span>
                              ) : (
                                <span className="text-slate-500">—</span>
                              )}
                            </span>
                            <span className="flex flex-wrap items-center gap-1">
                              <span className="text-slate-500">Riesgo:</span>
                              {ev.latestRiskLevel ? (
                                <span
                                  className={cx(
                                    "inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                                    riskListBadgeClass(ev.latestRiskLevel)
                                  )}
                                >
                                  {ev.latestRiskLevel}
                                </span>
                              ) : (
                                <span className="text-slate-500">—</span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {rejected ? (
                              <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-800">
                                Rechazado
                              </span>
                            ) : approved ? (
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-900">
                                Aprobado para piloto
                              </span>
                            ) : pendingReview ? (
                              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                                Pendiente de revisión
                              </span>
                            ) : (
                              <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                                Otro estado
                              </span>
                            )}
                            {expired ? (
                              <span className="rounded-full border border-slate-300 bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-800">
                                Expirado
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-xs">
                          {simOk ? (
                            <span className="text-slate-700">Simulación disponible</span>
                          ) : (
                            <span className="text-slate-500">No disponible</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <Link
                            href={`/admin/constructor/paquetes/${row.id}`}
                            className="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
                          >
                            Ver detalle
                            <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
