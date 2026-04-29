/**
 * Flujo del proceso del lead — lógica compartida entre ficha y listado.
 * Usa solo datos ya disponibles (lead, ai_report, cantidad de servicios).
 */

import {
  isOfficialCrmPersistedDocumentUrl,
  isOfficialPresentationDocumentUrl,
  isTransientGammaExportPdfUrl,
} from "@/lib/leads/gammaDocumentPolicy";
import { isCommercialStrategyApproved } from "@/lib/crm/commercialStrategyFlow";

export type LeadFlowStep = {
  id:
    | "lead"
    | "datos"
    | "investigacion"
    | "diagnostico"
    | "acciones"
    | "servicios"
    | "propuesta"
    | "presentacion";
  label: string;
  status: "done" | "current" | "pending";
  description: string;
};

export const LEAD_FLOW_STEP_IDS: LeadFlowStep["id"][] = [
  "lead",
  "datos",
  "investigacion",
  "diagnostico",
  "acciones",
  "servicios",
  "propuesta",
  "presentacion",
];

export const LEAD_FLOW_LABELS: Record<LeadFlowStep["id"], string> = {
  lead: "Lead",
  datos: "Datos del prospecto",
  investigacion: "Visita",
  diagnostico: "Evaluación",
  acciones: "Servicios",
  servicios: "Costeo",
  propuesta: "Cotización / Propuesta",
  presentacion: "Presentación",
};

export const LEAD_FLOW_DESCRIPTIONS: Record<LeadFlowStep["id"], string> = {
  lead: "El prospecto ya fue dado de alta dentro del CRM.",
  datos: "Se cuenta con la información mínima del prospecto y su instalación para avanzar.",
  investigacion: "La visita técnica ya fue realizada y el relevamiento del lugar quedó registrado.",
  diagnostico: "Ya existe una evaluación de necesidades, riesgos y oportunidades del servicio.",
  acciones: "Ya fueron definidos los servicios de limpieza o facility services a cotizar.",
  servicios: "Ya existe una base para estimar alcance, frecuencia y costo del servicio.",
  propuesta: "La cotización o propuesta comercial ya está preparada para revisión.",
  presentacion: "Ya existe una salida lista para compartir, presentar o exportar.",
};

/** Lead mínimo para calcular el flujo (ficha o listado). */
export type LeadFlowLead = {
  id?: string | null;
  nombre?: string | null;
  contacto?: string | null;
  telefono?: string | null;
  email?: string | null;
  website?: string | null;
  objetivos?: string | null;
  audiencia?: string | null;
  linkedin_empresa?: string | null;
  rubro_id?: string | null;
  direccion?: string | null;
  superficie_m2?: number | string | null;
  cantidad_personal?: number | string | null;
  notas_instalacion?: string | null;
  visita_scheduled_at?: string | null;
  visita_completed_at?: string | null;
  visita_relevamiento_json?: unknown | null;
  ai_report?: string | null;
  empresas?: { instagram?: string | null; facebook?: string | null; rubro_id?: string | null } | null;
  /** Draft de propuesta (matriz servicio × mes). Si existe y tiene rows, servicios puede considerarse hecho. */
  proposal_draft_json?: string | null;
  /** Si está definido, la propuesta comercial está confirmada → propuesta = done. */
  proposal_confirmed_at?: string | null;
  proposal_reviewed?: boolean | null;
  proposal_doc_url?: string | null;
  presentation_doc_url?: string | null;
  strategy_approved_at?: string | null;
  commercial_strategy_json?: unknown;
};

function hasProposalDraftWithRows(draftJson: unknown): boolean {
  if (draftJson === null || draftJson === undefined) return false;
  const raw = typeof draftJson === "string" ? draftJson.trim() : "";
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as { rows?: unknown[] };
    return Array.isArray(parsed?.rows) && parsed.rows.length > 0;
  } catch {
    return false;
  }
}

/** Señales opcionales de presentación (Gamma/PDF). Solo pdfUrl estable cuenta para “material listo”. */
export type PresentationSignals = {
  gammaUrl?: string | null;
  pdfUrl?: string | null;
};

function parseReportTabsLocal(report: string): Record<string, string> {
  const tabs: Record<string, string> = {};
  if (!report || !report.trim()) return tabs;
  const tabPattern = /###\s+TAB:\s*(\w+)\s*\n/gi;
  const matches: Array<{ tabId: string; startIndex: number }> = [];
  let match;
  while ((match = tabPattern.exec(report)) !== null) {
    matches.push({ tabId: match[1], startIndex: match.index + match[0].length });
  }
  for (let i = 0; i < matches.length; i++) {
    const startIndex = matches[i].startIndex;
    const remaining = report.slice(startIndex);
    const nextTabMatch = remaining.match(/###\s+TAB:\s*\w+\s*\n/i);
    const endIndex = nextTabMatch && typeof nextTabMatch.index === "number" ? startIndex + nextTabMatch.index : report.length;
    const content = report.slice(startIndex, endIndex).trim();
    if (content) tabs[matches[i].tabId] = content;
  }
  return tabs;
}

function getServicesCount(leadServicesOrCount: { length: number } | number): number {
  return typeof leadServicesOrCount === "number" ? leadServicesOrCount : leadServicesOrCount.length;
}

// ─── Casalimpia flow helpers ──────────────────────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getVisitaRelevamiento(lead: LeadFlowLead | null): Record<string, unknown> | null {
  if (!lead) return null;
  return isRecord(lead.visita_relevamiento_json) ? lead.visita_relevamiento_json : null;
}

function hasCompletedVisit(lead: LeadFlowLead | null): boolean {
  return typeof lead?.visita_completed_at === "string" && lead.visita_completed_at.trim().length > 0;
}

const RELEVAMIENTO_KEY_FIELDS = [
  "tipo_servicio",
  "superficie_m2",
  "cantidad_puestos_trabajo",
  "numero_operarios",
  "horarios",
  "insumos_requeridos",
  "maquinaria_necesaria",
  "observaciones",
] as const;

const RELEVAMIENTO_KEY_FIELDS_MIN = 3;

/** Visita completada + al menos 3 campos clave del relevamiento cargados. */
function hasRelevamientoKeyFields(lead: LeadFlowLead | null): boolean {
  if (!hasCompletedVisit(lead)) return false;
  const r = getVisitaRelevamiento(lead);
  if (!r) return false;
  let filled = 0;
  for (const field of RELEVAMIENTO_KEY_FIELDS) {
    const val = r[field];
    if (val === null || val === undefined || val === "" || val === false) continue;
    if (Array.isArray(val) && val.length === 0) continue;
    filled++;
    if (filled >= RELEVAMIENTO_KEY_FIELDS_MIN) return true;
  }
  return false;
}

const SERVICIOS_ESPECIALES_FLAT = [
  "servicio_lavado_alfombras",
  "servicio_limpieza_paneles",
  "servicio_lavado_sillas",
  "servicio_cisternas",
  "servicio_fumigacion",
  "servicio_desratizacion",
  "servicio_jardineria",
  "servicio_limpieza_vidrios",
  "servicio_sanitizacion",
] as const;

const SERVICIOS_ESPECIALES_GROUPED = [
  "lavado_alfombras",
  "limpieza_paneles",
  "lavado_sillas",
  "cisterna_aguas_blancas",
  "cisterna_aguas_negras",
  "fumigacion",
  "desratizacion",
  "jardineria",
  "limpieza_vidrios",
  "sanitizacion",
] as const;

/** tipo_servicio definido (permanente/especial) o al menos un servicio especial marcado. */
function hasServiciosDefinidos(lead: LeadFlowLead | null): boolean {
  const r = getVisitaRelevamiento(lead);
  if (!r) return false;
  const tipoServicio = r["tipo_servicio"];
  if (
    typeof tipoServicio === "string" &&
    ["permanente", "especial", "PERMANENTE", "ESPECIAL"].includes(tipoServicio.trim())
  ) {
    return true;
  }
  for (const key of SERVICIOS_ESPECIALES_FLAT) {
    if (r[key] === true) return true;
  }
  const grouped = r["servicios_especiales"];
  if (isRecord(grouped)) {
    for (const key of SERVICIOS_ESPECIALES_GROUPED) {
      if (grouped[key] === true) return true;
    }
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────

export function getPresentationReadySignal(
  lead: LeadFlowLead | null,
  _leadServicesOrCount: { length: number } | number,
  signals?: PresentationSignals,
  documents?: { presentation?: string | null } | null
): boolean {
  if (!lead) return false;
  const pdfUrl = signals?.pdfUrl ?? null;
  if (typeof pdfUrl === "string" && pdfUrl.trim().length > 0) {
    if (!isTransientGammaExportPdfUrl(pdfUrl) && isOfficialPresentationDocumentUrl(pdfUrl)) return true;
  }
  const fromLead = typeof lead.presentation_doc_url === "string" ? lead.presentation_doc_url.trim() : "";
  const fromDocs = typeof documents?.presentation === "string" ? documents.presentation.trim() : "";
  const merged = fromLead || fromDocs;
  if (merged && isOfficialPresentationDocumentUrl(merged)) return true;
  // No marcar presentación “lista” por heurísticas (p. ej. servicios + informe): solo URL oficial archivada.
  return false;
}

export type LeadFlowDocumentsMerge = {
  diagnostic?: string | null;
  strategy?: string | null;
  proposal?: string | null;
  presentation?: string | null;
} | null;

export function getLeadFlowSignals(
  lead: LeadFlowLead | null,
  leadServicesOrCount: { length: number } | number,
  presentationSignals?: PresentationSignals,
  documents?: LeadFlowDocumentsMerge
): Record<LeadFlowStep["id"], boolean> {
  const count = getServicesCount(leadServicesOrCount);
  const rawReport = typeof lead?.ai_report === "string" ? lead.ai_report : "";
  const entity = lead?.empresas;
  const datosCount = [
    lead?.nombre?.trim(),
    lead?.contacto?.trim() || lead?.telefono?.trim() || lead?.email?.trim(),
    lead?.rubro_id?.trim() || entity?.rubro_id?.trim(),
    lead?.superficie_m2 != null || lead?.direccion?.trim(),
    lead?.cantidad_personal != null || lead?.notas_instalacion?.trim(),
  ].filter(Boolean).length;
  const presentationReady = getPresentationReadySignal(lead, leadServicesOrCount, presentationSignals, documents);
  const proposalConfirmedAt = (lead as LeadFlowLead & { proposal_confirmed_at?: string | null })?.proposal_confirmed_at;
  const hasProposalConfirmed = typeof proposalConfirmedAt === "string" && proposalConfirmedAt.trim().length > 0;
  const draftWithRows = hasProposalDraftWithRows((lead as LeadFlowLead & { proposal_draft_json?: string | null })?.proposal_draft_json);

  const serviciosDone = count > 0 || draftWithRows;
  const propuestaLegacyDone = hasProposalConfirmed || count >= 2 || (count > 0 && rawReport.trim().length > 0);

  const proposalFromLead = typeof lead?.proposal_doc_url === "string" ? lead.proposal_doc_url.trim() : "";
  const proposalFromDocs = typeof documents?.proposal === "string" ? documents.proposal.trim() : "";
  const proposalMerged = proposalFromLead || proposalFromDocs;
  const proposalOfficial =
    Boolean(proposalMerged) && isOfficialCrmPersistedDocumentUrl(proposalMerged);
  const proposalReviewed = lead?.proposal_reviewed === true;

  let propuestaDoneFinal: boolean;
  if (hasProposalConfirmed) {
    propuestaDoneFinal = true;
  } else if (proposalOfficial) {
    propuestaDoneFinal = proposalReviewed;
  } else {
    propuestaDoneFinal = propuestaLegacyDone;
  }

  const strategyApproved = isCommercialStrategyApproved(lead, documents);

  const diagnosticDocUrl = typeof documents?.diagnostic === "string" ? documents.diagnostic.trim() : "";
  const diagnosticFromDocuments =
    Boolean(diagnosticDocUrl) && isOfficialCrmPersistedDocumentUrl(diagnosticDocUrl);

  // Una vez confirmada la propuesta económica, forzar etapas previas como done.
  const accionesDone = hasProposalConfirmed ? true : strategyApproved ? true : hasServiciosDefinidos(lead);
  const serviciosDoneFinal = hasProposalConfirmed ? true : serviciosDone;

  return {
    lead: !!lead?.id,
    datos: datosCount >= 3,
    investigacion: typeof lead?.visita_completed_at === "string" && lead.visita_completed_at.trim().length > 0,
    // Documento diagnostic archivado o relevamiento completado con campos clave.
    diagnostico: diagnosticFromDocuments || hasRelevamientoKeyFields(lead),
    acciones: accionesDone,
    servicios: serviciosDoneFinal,
    propuesta: propuestaDoneFinal,
    presentacion: presentationReady,
  };
}

export function getLeadFlowSteps(
  lead: LeadFlowLead | null,
  leadServicesOrCount: { length: number } | number,
  presentationSignals?: PresentationSignals,
  documents?: LeadFlowDocumentsMerge
): LeadFlowStep[] {
  const signals = getLeadFlowSignals(lead, leadServicesOrCount, presentationSignals, documents);
  const steps: LeadFlowStep[] = [];
  let currentAssigned = false;
  for (const stepId of LEAD_FLOW_STEP_IDS) {
    const done = signals[stepId];
    let status: "done" | "current" | "pending" = "pending";
    if (done) {
      status = "done";
    } else if (!currentAssigned) {
      status = "current";
      currentAssigned = true;
    }
    steps.push({
      id: stepId,
      label: LEAD_FLOW_LABELS[stepId],
      status,
      description: LEAD_FLOW_DESCRIPTIONS[stepId],
    });
  }
  return steps;
}

export function getCurrentFlowStep(steps: LeadFlowStep[]): LeadFlowStep | null {
  return steps.find((s) => s.status === "current") ?? null;
}

const TOTAL_FLOW_STEPS = LEAD_FLOW_STEP_IDS.length;

/** Porcentaje de avance del flujo (0–100): solo estaciones con status === "done". */
export function getLeadFlowProgressPercent(steps: LeadFlowStep[]): number {
  const doneCount = steps.filter((s) => s.status === "done").length;
  return Math.round((doneCount / TOTAL_FLOW_STEPS) * 100);
}

/** Texto corto y accionable para el siguiente paso del flujo. */
export function getLeadNextAction(step: LeadFlowStep | null): string {
  if (step === null) return "Flujo completo";
  switch (step.id) {
    case "lead":
      return "Crear lead correctamente";
    case "datos":
      return "Completar datos del prospecto e instalación";
    case "investigacion":
      return "Completar relevamiento de visita";
    case "diagnostico":
      return "Completar evaluación de necesidades";
    case "acciones":
      return "Definir servicios de limpieza requeridos";
    case "servicios":
      return "Preparar base de costeo";
    case "propuesta":
      return "Preparar cotización / propuesta";
    case "presentacion":
      return "Preparar presentación comercial";
    default:
      return "Flujo completo";
  }
}
