"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
  hasExecutiveSummary: boolean;
  executiveSummaryPreview: string | null;
  executiveSummaryText: string | null;
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

/** Deriva campos de resumen ejecutivo desde la fila del GET (con o sin campos explícitos del backend). */
function parseSnapshotExecutiveFields(r: Record<string, unknown>): {
  hasExecutiveSummary: boolean;
  executiveSummaryPreview: string | null;
  executiveSummaryText: string | null;
} {
  const sp = r.simulation_payload ?? r.simulationPayload;
  const nested =
    sp && typeof sp === "object" && !Array.isArray(sp)
      ? (sp as Record<string, unknown>).executiveSummaryText ??
        (sp as Record<string, unknown>).executive_summary_text
      : undefined;
  const fullRaw = r.executiveSummaryText ?? r.executive_summary_text ?? nested;
  const full = typeof fullRaw === "string" && fullRaw.trim() ? fullRaw.trim() : null;
  const prevRaw = r.executiveSummaryPreview ?? r.executive_summary_preview;
  const preview =
    typeof prevRaw === "string" && prevRaw.trim()
      ? prevRaw.trim()
      : full && full.length > 240
        ? `${full.slice(0, 240)}…`
        : full;
  return {
    hasExecutiveSummary: Boolean(full),
    executiveSummaryPreview: full ? preview : null,
    executiveSummaryText: full,
  };
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

/** Recomendación ejecutiva según el último Go/No-Go persistido en evidencia. */
function consolidatedEvidenceGoRecommendation(go: string | null): string {
  const v = (go ?? "").trim();
  switch (v) {
    case "pending_inputs":
      return "Completar configuración mínima y volver a simular antes de instalar.";
    case "no_go":
      return "No avanzar. Corregir faltantes críticos antes de continuar.";
    case "ready_for_manual_install":
      return "Solicitar aprobación humana final antes de cualquier ejecución.";
    default:
      return "Sin recomendación disponible.";
  }
}

function isManualInstallPayloadSectionEmpty(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === "string" && !v.trim()) return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "object") return Object.keys(v as object).length === 0;
  return false;
}

function payloadCfg(pp: Record<string, unknown>, snake: string, camel: string): unknown {
  return pp[snake] ?? pp[camel];
}

function isPackagePayloadPopulated(pp: Record<string, unknown>): boolean {
  if (Object.keys(pp).length === 0) return false;
  const keys = [
    "installation_manifest",
    "installationManifest",
    "client_identity",
    "clientIdentity",
    "crm_modules_config",
    "crmModulesConfig",
    "pipeline_config",
    "pipelineConfig",
    "lead_fields_config",
    "leadFieldsConfig",
    "permissions_config",
    "permissionsConfig",
  ];
  return keys.some((k) => !isManualInstallPayloadSectionEmpty(pp[k]));
}

function isKoreReadOnlyIntegration(pp: Record<string, unknown>): boolean {
  const raw = payloadCfg(pp, "integrations_config", "integrationsConfig");
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
  const rec = raw as Record<string, unknown>;
  const list = rec.integrations;
  if (!Array.isArray(list)) return false;
  for (const item of list) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const o = item as Record<string, unknown>;
    const sys = String(o.system ?? "").toLowerCase();
    const mode = String(o.mode ?? "")
      .toLowerCase()
      .replaceAll("-", "_");
    if (!sys.includes("kore")) continue;
    if ((mode === "read_only" || mode === "readonly") && o.writeAllowed === false) return true;
  }
  return false;
}

function clientIdentityOperationalName(pp: Record<string, unknown>): string | null {
  const raw = payloadCfg(pp, "client_identity", "clientIdentity");
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const n = o.clientName ?? o.client_name;
  if (typeof n === "string" && n.trim()) return n.trim();
  return null;
}

function integrationsConfigHasEntries(pp: Record<string, unknown>): boolean {
  const raw = payloadCfg(pp, "integrations_config", "integrationsConfig");
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
  const list = (raw as Record<string, unknown>).integrations;
  return Array.isArray(list) && list.length > 0;
}

type ManualCheckStatus = "cumplido" | "pendiente" | "bloqueado";

function manualChecklistStatusBadgeClass(s: ManualCheckStatus): string {
  switch (s) {
    case "cumplido":
      return "border border-emerald-200/80 bg-emerald-50/90 text-emerald-900";
    case "bloqueado":
      return "border border-rose-200 bg-rose-50 text-rose-900";
    case "pendiente":
    default:
      return "border border-amber-200 bg-amber-50 text-amber-950";
  }
}

/** Badges discretos para preparación manual (sin énfasis verde tipo CTA). */
function prepReadinessBadgeClass(s: ManualCheckStatus): string {
  if (s === "cumplido") return "border border-slate-300 bg-slate-100 text-slate-800";
  return "border border-amber-200 bg-amber-50 text-amber-950";
}

type FutureExecutableUnlockBadge = "pendiente" | "antecedente" | "requerido";

function futureUnlockBadgeClass(b: FutureExecutableUnlockBadge): string {
  switch (b) {
    case "antecedente":
      return "border border-slate-300 bg-slate-100 text-slate-800";
    case "requerido":
      return "border border-violet-200 bg-violet-50/90 text-violet-950";
    case "pendiente":
    default:
      return "border border-amber-200 bg-amber-50 text-amber-950";
  }
}

function futureUnlockBadgeLabel(b: FutureExecutableUnlockBadge): string {
  switch (b) {
    case "antecedente":
      return "Con antecedente";
    case "requerido":
      return "Requerido";
    case "pendiente":
    default:
      return "Pendiente";
  }
}

type ReunionChecklistBadgeKind = "pendiente" | "obligatorio" | "seguridad";

function reunionChecklistBadgeClass(b: ReunionChecklistBadgeKind): string {
  switch (b) {
    case "obligatorio":
      return "border border-amber-200 bg-amber-50 text-amber-950";
    case "seguridad":
      return "border border-rose-200/90 bg-rose-50/90 text-rose-900";
    case "pendiente":
    default:
      return "border border-slate-200 bg-slate-100 text-slate-700";
  }
}

function reunionChecklistBadgeLabel(b: ReunionChecklistBadgeKind): string {
  switch (b) {
    case "obligatorio":
      return "Obligatorio";
    case "seguridad":
      return "Seguridad";
    case "pendiente":
    default:
      return "Pendiente de reunión";
  }
}

type ReunionChecklistGroupDef = { title: string; items: { text: string; badge: ReunionChecklistBadgeKind }[] };

const PICKUP_REUNION_PREVIA_CHECKLIST: ReunionChecklistGroupDef[] = [
  {
    title: "1. Decisiones de negocio",
    items: [
      { text: "Confirmar responsable operativo Pickup 4x4", badge: "obligatorio" },
      { text: "Confirmar objetivo del piloto", badge: "obligatorio" },
      { text: "Definir alcance del primer CRM", badge: "obligatorio" },
      { text: "Definir criterio de éxito del piloto", badge: "obligatorio" },
      { text: "Confirmar fecha tentativa de instalación manual", badge: "pendiente" },
      { text: "Confirmar quién aprueba el avance", badge: "obligatorio" },
    ],
  },
  {
    title: "2. Usuarios y permisos",
    items: [
      { text: "Listar usuarios reales del piloto", badge: "obligatorio" },
      { text: "Definir rol de cada usuario", badge: "obligatorio" },
      { text: "Confirmar responsable comercial", badge: "obligatorio" },
      { text: "Confirmar usuarios de solo lectura", badge: "pendiente" },
      { text: "Confirmar si habrá usuario técnico de integración", badge: "pendiente" },
      { text: "Validar política de acceso inicial", badge: "seguridad" },
    ],
  },
  {
    title: "3. Kore / área técnica",
    items: [
      { text: "Confirmar credenciales o acceso técnico", badge: "obligatorio" },
      { text: "Confirmar endpoints disponibles", badge: "obligatorio" },
      { text: "Confirmar campos disponibles", badge: "obligatorio" },
      { text: "Confirmar modo read-only", badge: "seguridad" },
      { text: "Confirmar frecuencia de sincronización", badge: "pendiente" },
      { text: "Confirmar ambiente: sandbox / demo / producción", badge: "obligatorio" },
      { text: "Confirmar límites de API", badge: "pendiente" },
      { text: "Confirmar responsable técnico de Kore", badge: "obligatorio" },
    ],
  },
  {
    title: "4. Bloqueos antes de instalar",
    items: [
      { text: "No crear tenant sin aprobación final", badge: "seguridad" },
      { text: "No crear usuarios sin lista validada", badge: "seguridad" },
      { text: "No enviar invitaciones antes de validar permisos", badge: "seguridad" },
      { text: "No escribir en Kore", badge: "seguridad" },
      { text: "No escribir en Zeta", badge: "seguridad" },
      { text: "No publicar en producción", badge: "seguridad" },
      { text: "No activar automatizaciones sensibles", badge: "seguridad" },
    ],
  },
];

function buildPickup4x4MeetingChecklistPlainText(p: {
  meta: DraftMetadata;
  latestSnapshot: SimulationSnapshotRow;
}): string {
  const { meta, latestSnapshot } = p;
  const goRaw = (latestSnapshot.finalGoNoGo ?? "").trim();
  const goLabel = goRaw ? goRaw.replace(/_/g, " ") : "—";
  const score =
    latestSnapshot.readinessScore != null && !Number.isNaN(Number(latestSnapshot.readinessScore))
      ? `${String(latestSnapshot.readinessScore)}/100`
      : "—/100";
  const risk = latestSnapshot.riskLevel?.trim() || "—";
  const snapShort = shortSnapshotId(latestSnapshot.id);

  const lines: string[] = [];
  lines.push("SUMMER87 — CHECKLIST DE REUNIÓN PREVIA");
  lines.push("Pickup 4x4 · Instalación manual controlada");
  lines.push("");
  lines.push(`Draft ID: ${meta.id}`);
  lines.push(`Snapshot base: ${latestSnapshot.id} (${snapShort})`);
  lines.push(`Score: ${score}`);
  lines.push(`Go / No-Go: ${goLabel}`);
  lines.push(`Riesgo: ${risk}`);
  for (const g of PICKUP_REUNION_PREVIA_CHECKLIST) {
    lines.push("");
    lines.push(g.title);
    for (const it of g.items) {
      lines.push(`- [${reunionChecklistBadgeLabel(it.badge)}] ${it.text}`);
    }
  }
  lines.push("");
  lines.push(
    "Esta checklist no ejecuta acciones. Sirve para preparar la decisión manual antes de crear recursos, usuarios o integraciones reales."
  );
  return lines.join("\n");
}

const PICKUP_REUNION_MINUTA_OBJETIVO =
  "Validar si Pickup 4x4 está en condiciones de avanzar a una preparación manual controlada del CRM, confirmando usuarios, permisos, acceso Kore, alcance del piloto y criterios de éxito.";

const PICKUP_REUNION_MINUTA_AGENDA: string[] = [
  "Contexto del proyecto Pickup 4x4",
  "Estado del paquete CRM preparado por Summer87",
  "Alcance inicial del piloto",
  "Usuarios y permisos",
  "Datos disponibles en Kore",
  "Restricciones de seguridad: solo lectura / sin escrituras externas",
  "Próximos pasos y responsables",
];

const PICKUP_REUNION_MINUTA_PREGUNTAS_PICKUP: string[] = [
  "¿Quién será el responsable operativo del piloto?",
  "¿Qué usuarios deberían ingresar al primer CRM?",
  "¿Qué permisos necesita cada usuario?",
  "¿Qué proceso comercial debe cubrir primero el CRM?",
  "¿Qué datos necesitan ver desde Kore?",
  "¿Qué reportes consideran críticos?",
  "¿Cuál sería un piloto exitoso en 30 días?",
];

const PICKUP_REUNION_MINUTA_PREGUNTAS_KORE: string[] = [
  "¿Qué endpoints están disponibles?",
  "¿Existe ambiente sandbox o demo?",
  "¿Qué autenticación requiere la API?",
  "¿Qué campos de clientes, vehículos, ventas o presupuestos están disponibles?",
  "¿Hay límites de uso o rate limits?",
  "¿La integración puede mantenerse estrictamente read-only?",
  "¿Quién será el contacto técnico?",
];

const PICKUP_REUNION_MINUTA_DECISIONES: string[] = [
  "Responsable operativo definido",
  "Usuarios piloto definidos",
  "Roles/permisos iniciales definidos",
  "Alcance piloto confirmado",
  "Acceso Kore read-only confirmado o pendiente",
  "Fecha tentativa de preparación manual",
  "Decisión: avanzar / esperar / ajustar alcance",
];

const PICKUP_REUNION_MINUTA_CIERRE =
  "Al finalizar la reunión, Summer87 debería tener condiciones suficientes para preparar la instalación manual controlada o, en caso contrario, una lista clara de faltantes.";

const PICKUP_REUNION_MINUTA_NOTA_SEGURIDAD =
  "Esta minuta no autoriza instalación. Solo ordena la reunión previa para definir condiciones de una futura preparación manual controlada.";

function buildPickup4x4MeetingMinutaPlainText(p: {
  meta: DraftMetadata;
  latestSnapshot: SimulationSnapshotRow;
}): string {
  const { meta, latestSnapshot } = p;
  const goRaw = (latestSnapshot.finalGoNoGo ?? "").trim();
  const goLabel = goRaw ? goRaw.replace(/_/g, " ") : "—";
  const score =
    latestSnapshot.readinessScore != null && !Number.isNaN(Number(latestSnapshot.readinessScore))
      ? `${String(latestSnapshot.readinessScore)}/100`
      : "—/100";
  const risk = latestSnapshot.riskLevel?.trim() || "—";
  const snapShort = shortSnapshotId(latestSnapshot.id);

  const lines: string[] = [];
  lines.push("SUMMER87 — MINUTA COMERCIAL/TÉCNICA DE REUNIÓN");
  lines.push("Pickup 4x4 · Preparación CRM e integración Kore");
  lines.push("");
  lines.push(`Draft ID: ${meta.id}`);
  lines.push(`Snapshot base: ${latestSnapshot.id} (${snapShort})`);
  lines.push(`Score: ${score}`);
  lines.push(`Go / No-Go: ${goLabel}`);
  lines.push(`Riesgo: ${risk}`);
  lines.push("");
  lines.push("OBJETIVO DE LA REUNIÓN");
  lines.push(PICKUP_REUNION_MINUTA_OBJETIVO);
  lines.push("");
  lines.push("AGENDA SUGERIDA");
  for (const a of PICKUP_REUNION_MINUTA_AGENDA) {
    lines.push(`- ${a}`);
  }
  lines.push("");
  lines.push("PREGUNTAS PARA PICKUP 4X4");
  for (const q of PICKUP_REUNION_MINUTA_PREGUNTAS_PICKUP) {
    lines.push(`- ${q}`);
  }
  lines.push("");
  lines.push("PREGUNTAS PARA KORE / ÁREA TÉCNICA");
  for (const q of PICKUP_REUNION_MINUTA_PREGUNTAS_KORE) {
    lines.push(`- ${q}`);
  }
  lines.push("");
  lines.push("DECISIONES QUE DEBEN SALIR DE LA REUNIÓN");
  for (const d of PICKUP_REUNION_MINUTA_DECISIONES) {
    lines.push(`- ${d}`);
  }
  lines.push("");
  lines.push("CIERRE ESPERADO");
  lines.push(PICKUP_REUNION_MINUTA_CIERRE);
  lines.push("");
  lines.push("NOTA DE SEGURIDAD");
  lines.push(PICKUP_REUNION_MINUTA_NOTA_SEGURIDAD);
  return lines.join("\n");
}

/** Mensaje B2B para enviar a Pickup 4x4; sin IDs ni términos internos. */
function buildPickup4x4ExternalCommercialMessagePlainText(): string {
  return [
    "Hola [Nombre],",
    "",
    "Avanzamos con la preparación inicial del CRM inteligente para Pickup 4x4.",
    "",
    "Ya dejamos armado un primer modelo de trabajo orientado a centralizar clientes, vehículos, oportunidades comerciales, seguimiento, reportes e integración con Kore en modo solo lectura.",
    "",
    "Antes de avanzar hacia una instalación manual controlada, nos gustaría coordinar una reunión breve para validar algunos puntos clave:",
    "",
    "1. Objetivo y alcance del primer piloto.",
    "2. Usuarios que deberían participar.",
    "3. Roles y permisos iniciales.",
    "4. Datos que necesitan visualizar desde Kore.",
    "5. Acceso técnico disponible para trabajar en modo solo lectura.",
    "6. Criterios para considerar exitoso el piloto.",
    "",
    "La idea de esta etapa no es modificar Kore ni automatizar acciones sensibles, sino validar juntos el alcance y preparar una base segura para el primer CRM operativo.",
    "",
    "Si te parece, coordinamos una reunión de 30 a 45 minutos con la persona responsable del proceso comercial y, si corresponde, alguien del área técnica o del proveedor Kore.",
    "",
    "Quedo atento para coordinar día y horario.",
    "",
    "Saludos,",
    "Daniel",
  ].join("\n");
}

type MeetingFinalDecisionValue =
  | "advance_manual_preparation"
  | "wait_kore_technical_info"
  | "adjust_scope"
  | "pause_project";

type MeetingDecisionListItem = {
  id: string;
  draftId: string;
  decision: string;
  decisionLabel: string;
  decisionReason: string | null;
  meetingNotes: string | null;
  pendingItems: string[];
  decidedBy: string | null;
  createdAt: string;
};

type PilotEnvEntityKind = "core" | "restricted_access" | "users_late";

const PILOT_ENV_CREATION_PLAN_ENTITY_DEFS: { label: string; kind: PilotEnvEntityKind }[] = [
  { label: "Entorno / tenant piloto Pickup 4x4", kind: "core" },
  { label: "Configuración base del CRM", kind: "core" },
  { label: "Módulos CRM", kind: "core" },
  { label: "Pipeline comercial", kind: "core" },
  { label: "Campos de clientes, vehículos y oportunidades", kind: "core" },
  { label: "Reportes iniciales", kind: "core" },
  { label: "Conector Kore read-only", kind: "core" },
  { label: "Auditoría de instalación", kind: "core" },
  { label: "Acceso restringido para propietarios + Daniel / Summer87", kind: "restricted_access" },
  { label: "Usuarios operativos y permisos: fase posterior", kind: "users_late" },
];

const PILOT_ENV_CREATION_PLAN_ORDER_STEPS: string[] = [
  "Confirmar aprobación final.",
  "Preparar entorno piloto.",
  "Cargar configuración base.",
  "Configurar módulos CRM.",
  "Configurar pipeline.",
  "Configurar campos.",
  "Configurar reportes iniciales.",
  "Configurar Kore read-only.",
  "Validar estructura con propietarios.",
  "Validar datos de prueba o datos read-only disponibles.",
  "Registrar auditoría de instalación.",
  "Coordinar acceso restringido propietarios + Daniel / Summer87.",
  "Recién después definir usuarios operativos.",
  "Recién después definir permisos individuales.",
  "Recién después enviar invitaciones controladas.",
  "Habilitar acceso operativo controlado en fase posterior.",
];

const PILOT_ENV_CREATION_PLAN_RISKS: string[] = [
  "No tener propietarios participantes confirmados.",
  "No tener canal de coordinación claro.",
  "Conectar Kore sin documentación suficiente.",
  "Ampliar demasiado el alcance del piloto.",
  "Confundir piloto con producción.",
  "Activar automatizaciones antes de validar datos.",
  "Incorporar empleados antes de validar estructura y alcance.",
  "Definir permisos individuales antes de tener clara la operación real.",
];

const PILOT_ENV_CREATION_PLAN_BLOCKED_CODES: string[] = [
  "create_tenant",
  "create_users",
  "send_invites",
  "write_kore",
  "write_zeta",
  "publish_production",
  "install_crm_automatically",
  "enable_sensitive_automations",
];

const PILOT_ENV_CREATION_PLAN_OBJECTIVE_TEXT =
  "Definir la estructura mínima que debería prepararse para un primer entorno piloto de Pickup 4x4, manteniendo Kore en modo solo lectura. En esta primera etapa, el trabajo será coordinado únicamente entre los propietarios de Pickup 4x4 y Daniel / Summer87. Los empleados operativos, permisos individuales e invitaciones se definirán en una fase posterior.";

const PILOT_ENV_CREATION_PLAN_SECURITY_NOTE =
  "El plan de creación de entorno piloto no crea recursos. Solo documenta qué habría que preparar cuando exista aprobación final y datos operativos completos. En esta primera etapa, el acceso queda restringido a propietarios de Pickup 4x4 y Daniel / Summer87. Los usuarios operativos se definirán al final del proceso.";

const PILOT_ENV_CONTROLLED_ACCESS_INTRO =
  "En esta primera etapa, el entorno piloto no será utilizado por empleados operativos de Pickup 4x4. El trabajo será coordinado entre los propietarios y Daniel / Summer87. Los usuarios del equipo, permisos individuales e invitaciones se definirán más adelante, cuando la estructura base esté validada.";

const PILOT_ENV_CONTROLLED_ACCESS_ROWS: { label: string; badgeGroup: "etapa1" | "posterior" }[] = [
  { label: "Propietarios de Pickup 4x4", badgeGroup: "etapa1" },
  { label: "Daniel / Summer87", badgeGroup: "etapa1" },
  { label: "Acceso restringido", badgeGroup: "etapa1" },
  { label: "Sin empleados operativos en esta etapa", badgeGroup: "etapa1" },
  { label: "Sin invitaciones masivas", badgeGroup: "etapa1" },
  { label: "Usuarios del equipo: fase posterior", badgeGroup: "posterior" },
  { label: "Permisos individuales: fase posterior", badgeGroup: "posterior" },
  { label: "Invitaciones: fase posterior", badgeGroup: "posterior" },
];

const PILOT_ENV_OPERATIVE_DEFERRED_COPY_LINES: string[] = [
  "Lista de empleados / usuarios operativos: fuera del foco de la primera etapa; fase posterior.",
  "Emails de empleados e invitaciones masivas: fase posterior.",
  "Roles por usuario operativo y permisos complejos como requisito inicial: no aplica en esta etapa.",
];

const PICKUP_FINAL_CASE_SYNTHESIS_PARAGRAPH =
  "Pickup 4x4 cuenta con un paquete CRM preparado, aprobado, simulado y respaldado con evidencia técnica. El caso está listo para revisión manual y planificación controlada, pero no ejecuta instalación ni crea recursos.";

const PICKUP_FINAL_CASE_NEXT_STEP_PARAGRAPH =
  "Realizar revisión final con propietarios de Pickup 4x4 y confirmar alcance, canal de coordinación, Kore read-only y criterio de éxito antes de diseñar cualquier SQL o crear recursos.";

const PICKUP_FINAL_CASE_SECURITY_NOTE =
  "Este resumen no instala CRM, no crea tenant, no crea usuarios y no escribe en Kore ni en Zeta.";

const PICKUP_FINAL_CASE_MEETING_PENDING_NOTE =
  "Falta decisión de reunión para cerrar el resumen final.";

const PICKUP_FINAL_CASE_PREPARED_BULLETS: string[] = [
  "Modelo CRM inicial",
  "Módulos",
  "Pipeline",
  "Campos comerciales",
  "Reportes iniciales",
  "Kore read-only definido",
  "Evidencia técnica",
  "Decisión de avance manual",
  "Plan técnico futuro",
];

const PICKUP_FINAL_CASE_BLOCKED_BULLETS: string[] = [
  "Crear tenant",
  "Crear usuarios",
  "Enviar invitaciones",
  "Escribir en Kore",
  "Escribir en Zeta",
  "Publicar producción",
  "Ejecutar SQL",
  "Instalar automáticamente",
];

const PILOT_DOC_CLOSURE_PARTIAL_NOTE =
  "Cierre parcial: falta decisión de reunión para cerrar el piloto documentalmente.";

const PILOT_DOC_CLOSURE_SYNTHESIS_PARAGRAPH =
  "El caso Pickup 4x4 queda documentado como piloto técnicamente preparado para revisión y planificación controlada. La ejecución real continúa bloqueada hasta una fase posterior explícita.";

const PILOT_DOC_CLOSURE_PREPARED_BULLETS: string[] = [
  "Package CRM Pickup 4x4",
  "Evidencia técnica",
  "Snapshot de simulación",
  "Resumen ejecutivo",
  "Decisión de reunión, si existe",
  "Plan de entorno piloto",
  "Plan ejecutable bloqueado",
  "Diseño técnico",
  "Blueprint de configuración",
  "Especificación de migración futura",
  "Auditoría pre-SQL",
];

const PILOT_DOC_CLOSURE_PENDING_BULLETS: string[] = [
  "Confirmar alcance final con propietarios",
  "Confirmar canal de coordinación",
  "Confirmar Kore read-only y documentación técnica",
  "Confirmar criterio de éxito",
  "Confirmar decisión explícita de pasar a ejecución real",
  "Revisar estructuras existentes antes de SQL",
  "Diseñar SQL real solo si corresponde",
  "Mantener usuarios operativos para fase posterior",
];

const PILOT_DOC_CLOSURE_BLOCKED_BULLETS: string[] = [
  "Crear tenant",
  "Crear usuarios",
  "Enviar invitaciones",
  "Escribir en Kore",
  "Escribir en Zeta",
  "Publicar producción",
  "Ejecutar SQL",
  "Aplicar configuración real",
  "Instalar automáticamente",
];

const PILOT_DOC_CLOSURE_NEXT_STEP_PARAGRAPH =
  "Antes de avanzar a una fase real, se recomienda realizar una revisión de cierre con propietarios de Pickup 4x4 para confirmar alcance, coordinación, criterio de éxito, disponibilidad técnica de Kore y decisión explícita sobre el modelo de aislamiento.";

const PILOT_DOC_CLOSURE_RECOMMENDED_STATE_LINE =
  "Listo para revisión pre-ejecución, no listo para ejecución automática.";

const PILOT_DOC_CLOSURE_SECURITY_NOTE =
  "Este cierre documental no instala CRM, no crea tenant, no crea usuarios, no ejecuta SQL y no escribe en Kore ni en Zeta.";

type PilotPlanDataRow = { label: string; status: ManualCheckStatus };

function computePilotEnvironmentPlanDataRows(p: {
  packagePayload: Record<string, unknown>;
  meta: DraftMetadata;
  humanConfirmationStatus: string;
  latestAdvanceMeetingDecision: MeetingDecisionListItem;
}): PilotPlanDataRow[] {
  const { packagePayload: pp, meta, humanConfirmationStatus: humanSt, latestAdvanceMeetingDecision: adv } = p;
  const idName = clientIdentityOperationalName(pp);
  const modulesOk = !isManualInstallPayloadSectionEmpty(
    payloadCfg(pp, "crm_modules_config", "crmModulesConfig")
  );
  const pipelineOk = !isManualInstallPayloadSectionEmpty(payloadCfg(pp, "pipeline_config", "pipelineConfig"));
  const fieldsOk = !isManualInstallPayloadSectionEmpty(payloadCfg(pp, "lead_fields_config", "leadFieldsConfig"));
  const reportsOk = !isManualInstallPayloadSectionEmpty(payloadCfg(pp, "reports_config", "reportsConfig"));
  const critOk =
    typeof adv.decisionReason === "string" && adv.decisionReason.trim().length >= 20;
  const summer87PilotOk = meta.status === "approved_for_pilot";
  const pickupHumanOk = humanSt === "approved";
  const alcanceAprobado = summer87PilotOk && pickupHumanOk && modulesOk && pipelineOk;
  return [
    { label: "Nombre comercial confirmado", status: idName ? "cumplido" : "pendiente" },
    { label: "Propietarios participantes confirmados", status: "pendiente" },
    { label: "Daniel / Summer87 como operador del armado", status: "pendiente" },
    { label: "Canal de coordinación definido", status: "pendiente" },
    { label: "Alcance piloto aprobado", status: alcanceAprobado ? "cumplido" : "pendiente" },
    { label: "Módulos iniciales confirmados", status: modulesOk ? "cumplido" : "pendiente" },
    { label: "Pipeline inicial confirmado", status: pipelineOk ? "cumplido" : "pendiente" },
    { label: "Campos mínimos confirmados", status: fieldsOk ? "cumplido" : "pendiente" },
    { label: "Reportes iniciales confirmados", status: reportsOk ? "cumplido" : "pendiente" },
    { label: "Acceso Kore read-only confirmado", status: isKoreReadOnlyIntegration(pp) ? "cumplido" : "pendiente" },
    {
      label: "Documentación API Kore",
      status: integrationsConfigHasEntries(pp) ? "cumplido" : "pendiente",
    },
    { label: "Criterio de éxito definido", status: critOk ? "cumplido" : "pendiente" },
    { label: "Aprobación final Summer87", status: summer87PilotOk ? "cumplido" : "pendiente" },
    { label: "Aprobación final Pickup 4x4", status: pickupHumanOk ? "cumplido" : "pendiente" },
  ];
}

function buildPilotEnvCreationPlanPlainText(p: {
  meta: DraftMetadata;
  humanConfirmationStatus: string;
  latestSnapshot: SimulationSnapshotRow;
  latestAdvanceMeetingDecision: MeetingDecisionListItem;
  packagePayload: Record<string, unknown>;
}): string {
  const { meta, humanConfirmationStatus, latestSnapshot, latestAdvanceMeetingDecision, packagePayload } = p;
  const goRaw = (latestSnapshot.finalGoNoGo ?? "").trim();
  const goLabel = goRaw ? goRaw.replace(/_/g, " ") : "—";
  const score =
    latestSnapshot.readinessScore != null && !Number.isNaN(Number(latestSnapshot.readinessScore))
      ? `${String(latestSnapshot.readinessScore)}/100`
      : "—/100";
  const risk = latestSnapshot.riskLevel?.trim() || "—";
  const snapShort = shortSnapshotId(latestSnapshot.id);
  const dataRows = computePilotEnvironmentPlanDataRows({
    packagePayload,
    meta,
    humanConfirmationStatus,
    latestAdvanceMeetingDecision,
  });

  const lines: string[] = [];
  lines.push("SUMMER87 — PLAN DE CREACIÓN DE ENTORNO PILOTO (Pickup 4x4)");
  lines.push("Documento informativo. Ninguna acción se ejecuta desde Constructor CRM.");
  lines.push("");
  lines.push("ESTADO ACTUAL (referencia)");
  lines.push(`- Draft ID: ${meta.id}`);
  lines.push(`- Estado draft: ${meta.status}`);
  lines.push(`- Confirmación humana: ${humanConfirmationStatus}`);
  lines.push(`- Snapshot: ${latestSnapshot.id} (${snapShort})`);
  lines.push(`- Fecha snapshot: ${formatDt(latestSnapshot.createdAt)}`);
  lines.push(`- Score: ${score}`);
  lines.push(`- Go / No-Go: ${goLabel}`);
  lines.push(`- Riesgo: ${risk}`);
  lines.push(`- Decisión reunión (última avance preparación manual): ${latestAdvanceMeetingDecision.decisionLabel}`);
  lines.push(`- Fecha decisión: ${formatDt(latestAdvanceMeetingDecision.createdAt)}`);
  lines.push(`- Registró: ${latestAdvanceMeetingDecision.decidedBy ?? "—"}`);
  lines.push("");
  lines.push("OBJETIVO DEL ENTORNO PILOTO");
  lines.push(PILOT_ENV_CREATION_PLAN_OBJECTIVE_TEXT);
  lines.push("");
  lines.push("ENTIDADES FUTURAS A PREPARAR");
  for (const e of PILOT_ENV_CREATION_PLAN_ENTITY_DEFS) {
    const tag =
      e.kind === "users_late"
        ? "Futuro · Al final"
        : e.kind === "restricted_access"
          ? "Futuro · Primera etapa"
          : "Futuro · no creado";
    lines.push(`- ${e.label} [${tag}]`);
  }
  lines.push("");
  lines.push("DATOS REQUERIDOS ANTES DE PREPARAR ENTORNO");
  for (const r of dataRows) {
    const tag = r.status === "cumplido" ? "Con antecedente" : "Pendiente";
    lines.push(`- [${tag}] ${r.label}`);
  }
  lines.push("");
  lines.push("ACCESOS CONTROLADOS — PRIMERA ETAPA RESTRINGIDA");
  lines.push(PILOT_ENV_CONTROLLED_ACCESS_INTRO);
  for (const row of PILOT_ENV_CONTROLLED_ACCESS_ROWS) {
    const tag =
      row.badgeGroup === "etapa1" ? "Primera etapa · Restringido" : "Fase posterior · Restringido";
    lines.push(`- [${tag}] ${row.label}`);
  }
  lines.push("");
  lines.push("USUARIOS OPERATIVOS — FASE POSTERIOR (resumen)");
  for (const line of PILOT_ENV_OPERATIVE_DEFERRED_COPY_LINES) {
    lines.push(`- ${line}`);
  }
  lines.push("");
  lines.push("ORDEN SUGERIDO DE PREPARACIÓN FUTURA (no ejecutado)");
  PILOT_ENV_CREATION_PLAN_ORDER_STEPS.forEach((step, i) => {
    lines.push(`${i + 1}. ${step} (futuro; no ejecutado en esta fase).`);
  });
  lines.push("");
  lines.push("RIESGOS ANTES DE PREPARAR ENTORNO");
  for (const x of PILOT_ENV_CREATION_PLAN_RISKS) {
    lines.push(`- ${x}`);
  }
  lines.push("");
  lines.push("ACCIONES BLOQUEADAS");
  for (const c of PILOT_ENV_CREATION_PLAN_BLOCKED_CODES) {
    lines.push(`- ${c}`);
  }
  lines.push("");
  lines.push("NOTA DE SEGURIDAD");
  lines.push(PILOT_ENV_CREATION_PLAN_SECURITY_NOTE);
  return lines.join("\n");
}

const FUTURE_EXECUTABLE_PLAN_INTRO =
  "Este bloque describe qué acciones técnicas podrían ejecutarse en una fase posterior para preparar el entorno piloto. Actualmente todas las acciones están bloqueadas y no se ejecutan desde esta pantalla.";

const FUTURE_EXECUTABLE_PLAN_SEQUENCE_STEPS: string[] = [
  "Validar aprobación final.",
  "Crear entorno / tenant piloto.",
  "Crear configuración base del CRM.",
  "Aplicar módulos CRM del paquete.",
  "Aplicar pipeline comercial.",
  "Aplicar campos de clientes, vehículos y oportunidades.",
  "Configurar reportes iniciales.",
  "Preparar conector Kore read-only.",
  "Validar datos de prueba o lectura inicial.",
  "Registrar auditoría de preparación.",
  "Coordinar acceso restringido con propietarios + Daniel / Summer87.",
  "Recién al final: definir usuarios operativos.",
  "Recién al final: definir permisos individuales.",
  "Recién al final: enviar invitaciones controladas.",
];

const FUTURE_EXECUTABLE_TECHNICAL_ACTIONS: {
  key: string;
  label: string;
  estado: "Bloqueado" | "Postergado";
  motivo: string;
}[] = [
  {
    key: "create_pilot_environment",
    label: "Crear entorno piloto",
    estado: "Bloqueado",
    motivo: "Requiere aprobación final",
  },
  {
    key: "apply_crm_base_config",
    label: "Aplicar configuración base CRM",
    estado: "Bloqueado",
    motivo: "Requiere entorno piloto en fase posterior (aún no ejecutado desde aquí)",
  },
  {
    key: "apply_pipeline_config",
    label: "Aplicar pipeline comercial",
    estado: "Bloqueado",
    motivo: "Requiere configuración base validada",
  },
  {
    key: "apply_lead_fields_config",
    label: "Aplicar campos comerciales",
    estado: "Bloqueado",
    motivo: "Requiere campos mínimos confirmados",
  },
  {
    key: "setup_kore_readonly_connector",
    label: "Preparar conector Kore read-only",
    estado: "Bloqueado",
    motivo: "Requiere documentación/API Kore",
  },
  {
    key: "register_installation_audit",
    label: "Registrar auditoría de instalación",
    estado: "Bloqueado",
    motivo: "Requiere ejecución real en fase posterior",
  },
  {
    key: "define_operational_users_later",
    label: "Definir usuarios operativos al final",
    estado: "Postergado",
    motivo: "Usuarios operativos quedan para una fase posterior",
  },
  {
    key: "send_invites_later",
    label: "Enviar invitaciones controladas",
    estado: "Postergado",
    motivo: "Solo después de validar estructura y permisos",
  },
];

const FUTURE_EXECUTABLE_BLOCKED_CODES: string[] = [
  "create_tenant",
  "create_users",
  "send_invites",
  "write_kore",
  "write_zeta",
  "publish_production",
  "install_crm_automatically",
  "enable_sensitive_automations",
  "expose_constructor_to_client",
];

const REAL_CONFIG_BLUEPRINT_BLOCKED_CODES: string[] = [...FUTURE_EXECUTABLE_BLOCKED_CODES, "apply_real_config"];

const FUTURE_MIGRATION_SPEC_BLOCKED_CODES: string[] = [...REAL_CONFIG_BLUEPRINT_BLOCKED_CODES, "execute_sql_migration"];

const PRE_SQL_READINESS_AUDIT_BLOCKED_CODES: string[] = [
  ...FUTURE_MIGRATION_SPEC_BLOCKED_CODES,
  "introspect_database_runtime",
];

const FUTURE_EXECUTABLE_BARRIER_TITLE = "Barrera de seguridad activa";

const FUTURE_EXECUTABLE_BARRIER_TEXT =
  "Aunque el plan figure como listo para describirse, ninguna acción técnica se ejecuta desde esta pantalla. La creación de entorno, usuarios, invitaciones, escritura externa o instalación automática siguen bloqueadas.";

const FUTURE_EXECUTABLE_PLAN_FINAL_SECURITY =
  "Este plan ejecutable futuro no crea recursos, no instala CRM, no crea usuarios y no escribe en Kore ni en Zeta. Solo documenta qué podría ejecutarse en una fase posterior con aprobación final.";

function computeFutureExecutableUnlockRows(p: {
  packagePayload: Record<string, unknown>;
  meta: DraftMetadata;
  humanConfirmationStatus: string;
  latestAdvanceMeetingDecision: MeetingDecisionListItem;
}): { label: string; badge: FutureExecutableUnlockBadge }[] {
  const { packagePayload: pp, meta, humanConfirmationStatus: humanSt, latestAdvanceMeetingDecision: adv } = p;
  const modulesOk = !isManualInstallPayloadSectionEmpty(
    payloadCfg(pp, "crm_modules_config", "crmModulesConfig")
  );
  const pipelineOk = !isManualInstallPayloadSectionEmpty(payloadCfg(pp, "pipeline_config", "pipelineConfig"));
  const fieldsOk = !isManualInstallPayloadSectionEmpty(payloadCfg(pp, "lead_fields_config", "leadFieldsConfig"));
  const critOk =
    typeof adv.decisionReason === "string" && adv.decisionReason.trim().length >= 20;
  const summer87PilotOk = meta.status === "approved_for_pilot";
  const pickupHumanOk = humanSt === "approved";
  const koreOk = isKoreReadOnlyIntegration(pp);
  const docOk = integrationsConfigHasEntries(pp);
  const baseValidated = modulesOk && pipelineOk && fieldsOk;
  return [
    {
      label: "Aprobación final Summer87.",
      badge: summer87PilotOk ? "antecedente" : "pendiente",
    },
    {
      label: "Aprobación final propietarios Pickup 4x4.",
      badge: pickupHumanOk ? "antecedente" : "pendiente",
    },
    { label: "Alcance piloto cerrado.", badge: modulesOk && pipelineOk ? "antecedente" : "pendiente" },
    { label: "Configuración base validada.", badge: baseValidated ? "antecedente" : "pendiente" },
    { label: "Kore read-only confirmado.", badge: koreOk ? "antecedente" : "pendiente" },
    { label: "Documentación/API Kore disponible.", badge: docOk ? "antecedente" : "pendiente" },
    { label: "Criterio de éxito definido.", badge: critOk ? "antecedente" : "pendiente" },
    { label: "Decisión explícita de crear entorno piloto.", badge: "requerido" },
    {
      label: "Confirmación de que sigue siendo primera etapa restringida.",
      badge: "requerido",
    },
    {
      label: "Confirmación de que usuarios operativos quedan para fase posterior.",
      badge: "requerido",
    },
  ];
}

function buildFutureExecutablePlanPlainText(p: {
  meta: DraftMetadata;
  humanConfirmationStatus: string;
  latestSnapshot: SimulationSnapshotRow;
  latestAdvanceMeetingDecision: MeetingDecisionListItem;
  packagePayload: Record<string, unknown>;
}): string {
  const { meta, humanConfirmationStatus, latestSnapshot, latestAdvanceMeetingDecision, packagePayload } = p;
  const goRaw = (latestSnapshot.finalGoNoGo ?? "").trim();
  const goLabel = goRaw ? goRaw.replace(/_/g, " ") : "—";
  const score =
    latestSnapshot.readinessScore != null && !Number.isNaN(Number(latestSnapshot.readinessScore))
      ? `${String(latestSnapshot.readinessScore)}/100`
      : "—/100";
  const risk = latestSnapshot.riskLevel?.trim() || "—";
  const snapShort = shortSnapshotId(latestSnapshot.id);
  const unlockRows = computeFutureExecutableUnlockRows({
    packagePayload,
    meta,
    humanConfirmationStatus,
    latestAdvanceMeetingDecision,
  });

  const lines: string[] = [];
  lines.push("SUMMER87 — PLAN EJECUTABLE FUTURO (Pickup 4x4)");
  lines.push("Documento informativo. Ninguna acción se ejecuta desde Constructor CRM.");
  lines.push("");
  lines.push("ESTADO DEL PLAN EJECUTABLE");
  for (const b of ["Futuro", "Bloqueado", "No ejecutado", "Requiere fase posterior", "Requiere aprobación final"]) {
    lines.push(`- ${b}`);
  }
  lines.push("");
  lines.push("ESTADO ACTUAL (referencia)");
  lines.push(`- Draft ID: ${meta.id}`);
  lines.push(`- Estado draft: ${meta.status}`);
  lines.push(`- Confirmación humana: ${humanConfirmationStatus}`);
  lines.push(`- Snapshot: ${latestSnapshot.id} (${snapShort})`);
  lines.push(`- Score: ${score}`);
  lines.push(`- Go / No-Go: ${goLabel}`);
  lines.push(`- Riesgo: ${risk}`);
  lines.push(`- Decisión reunión: ${latestAdvanceMeetingDecision.decisionLabel}`);
  lines.push("");
  lines.push("TEXTO INTRODUCTORIO");
  lines.push(FUTURE_EXECUTABLE_PLAN_INTRO);
  lines.push("");
  lines.push("SECUENCIA FUTURA DE EJECUCIÓN (cada paso: Futuro · Bloqueado · No ejecutado)");
  FUTURE_EXECUTABLE_PLAN_SEQUENCE_STEPS.forEach((step, i) => {
    lines.push(`${i + 1}. ${step} [Futuro · Bloqueado · No ejecutado]`);
  });
  lines.push("");
  lines.push("ACCIONES TÉCNICAS FUTURAS");
  for (const a of FUTURE_EXECUTABLE_TECHNICAL_ACTIONS) {
    lines.push(`- ${a.key} — ${a.label} — ${a.estado} — ${a.motivo}`);
  }
  lines.push("");
  lines.push("REQUISITOS PARA DESBLOQUEAR EN EL FUTURO");
  for (const r of unlockRows) {
    lines.push(`- [${futureUnlockBadgeLabel(r.badge)}] ${r.label}`);
  }
  lines.push("");
  lines.push(FUTURE_EXECUTABLE_BARRIER_TITLE.toUpperCase());
  lines.push(FUTURE_EXECUTABLE_BARRIER_TEXT);
  lines.push("");
  lines.push("ACCIONES EXPLÍCITAMENTE BLOQUEADAS");
  for (const c of FUTURE_EXECUTABLE_BLOCKED_CODES) {
    lines.push(`- ${c}`);
  }
  lines.push("");
  lines.push("NOTA DE SEGURIDAD FINAL");
  lines.push(FUTURE_EXECUTABLE_PLAN_FINAL_SECURITY);
  return lines.join("\n");
}

const PILOT_TECH_DESIGN_PURPOSE =
  "Este diseño define cómo debería organizarse técnicamente el primer entorno piloto de Pickup 4x4 antes de crear recursos reales. La etapa inicial queda restringida a propietarios de Pickup 4x4 y Daniel / Summer87. Los usuarios operativos se definirán más adelante.";

const PILOT_TECH_DESIGN_ISOLATION_RECOMMENDED: string[] = [
  "Instancia / tenant piloto separado para Pickup 4x4",
  "Configuración aislada del resto de clientes",
  "Kore como fuente externa read-only",
  "Summer87 como operador inicial controlado",
  "Propietarios como validadores del piloto",
];

const PILOT_TECH_DESIGN_ISOLATION_NOTE =
  "No se crea el tenant en esta fase. Solo se documenta el diseño recomendado.";

const PILOT_TECH_DESIGN_LAYERS: { title: string; body: string }[] = [
  { title: "Capa cliente", body: "Pickup 4x4 como cliente piloto." },
  {
    title: "Capa CRM",
    body: "Módulos, pipeline, campos y reportes definidos desde el package_payload.",
  },
  {
    title: "Capa datos",
    body: "Datos propios del piloto + referencias futuras a Kore read-only.",
  },
  { title: "Capa integración", body: "Kore read-only, sin escritura externa." },
  {
    title: "Capa auditoría",
    body: "Snapshots, decisiones de reunión y trazabilidad del proceso.",
  },
  {
    title: "Capa accesos",
    body: "Primera etapa restringida a propietarios + Daniel / Summer87; usuarios operativos al final.",
  },
];

type PilotTechComponentDef = { key: string; purpose: string; source: string };

const PILOT_TECH_DESIGN_COMPONENTS: PilotTechComponentDef[] = [
  {
    key: "tenant_config",
    purpose: "Representar el entorno piloto Pickup 4x4.",
    source: "Decisión final + package payload.",
  },
  {
    key: "crm_modules_config",
    purpose: "Definir módulos CRM del piloto.",
    source: "package_payload.crm_modules_config",
  },
  {
    key: "pipeline_config",
    purpose: "Definir etapas comerciales.",
    source: "package_payload.pipeline_config",
  },
  {
    key: "lead_fields_config",
    purpose: "Definir campos de clientes, vehículos y oportunidades.",
    source: "package_payload.lead_fields_config",
  },
  {
    key: "report_views_config",
    purpose: "Definir vistas y reportes iniciales.",
    source: "package_payload.reports_config",
  },
  {
    key: "kore_readonly_connector_config",
    purpose: "Conectar lectura desde Kore sin escritura.",
    source: "package_payload.integrations_config",
  },
  {
    key: "audit_log_config",
    purpose: "Registrar trazabilidad de preparación y decisiones.",
    source: "Snapshots + meeting_decisions + proceso Constructor.",
  },
  {
    key: "restricted_access_policy",
    purpose: "Limitar acceso a propietarios + Daniel / Summer87 en etapa 1.",
    source: "Criterio operativo acordado (no persistido en esta pantalla).",
  },
  {
    key: "future_user_access_policy",
    purpose: "Modelar usuarios operativos e invitaciones en fase posterior.",
    source: "Definición futura; no parte del alcance inicial.",
  },
];

const PILOT_TECH_KORE_DESIGN_INTRO =
  "Kore se mantiene como sistema de origen. Summer87 no escribirá datos en Kore en esta etapa.";

const PILOT_TECH_INITIAL_DATA_ITEMS: string[] = [
  "Clientes",
  "Vehículos",
  "Oportunidades",
  "Presupuestos o consultas",
  "Seguimiento comercial",
  "Reportes iniciales",
  "Referencias externas Kore",
  "Estado de sincronización read-only",
];

const PILOT_TECH_INITIAL_DATA_NOTE = "No se importan datos en esta fase.";

const PILOT_TECH_RESTRICTED_PARTICIPANTS = ["Propietarios Pickup 4x4", "Daniel / Summer87"];

const PILOT_TECH_RESTRICTED_EXCLUDED: string[] = [
  "empleados operativos",
  "usuarios comerciales",
  "invitaciones",
  "permisos individuales complejos",
];

const PILOT_TECH_RESTRICTED_TEXT =
  "La primera etapa busca validar estructura, datos y alcance con un grupo reducido antes de abrir uso operativo.";

const PILOT_TECH_DESIGN_RISKS: string[] = [
  "Crear entorno antes de cerrar alcance.",
  "Diseñar integración sin documentación Kore.",
  "Asumir campos Kore no confirmados.",
  "Confundir piloto restringido con producción.",
  "Abrir acceso operativo demasiado temprano.",
  "Activar automatizaciones antes de validar datos.",
  "Mezclar datos de prueba con datos reales sin trazabilidad.",
  "No dejar auditoría suficiente de decisiones.",
];

const PILOT_TECH_DESIGN_SECURITY_NOTE =
  "Este diseño técnico no crea recursos, no instala CRM, no crea tenant, no crea usuarios y no escribe en Kore ni en Zeta. Solo documenta la arquitectura propuesta para una futura fase de preparación controlada.";

const REAL_CONFIG_BLUEPRINT_PURPOSE =
  "Este blueprint traduce el diseño técnico en configuraciones futuras que podrían prepararse cuando exista aprobación final. No crea registros, no aplica SQL y no modifica datos. Solo documenta la estructura lógica esperada.";

const REAL_CONFIG_BLUEPRINT_DEPENDENCY_ORDER: string[] = [
  "pilot_client_config",
  "crm_modules_config",
  "pipeline_config",
  "lead_fields_config",
  "reports_config",
  "kore_readonly_connector_config",
  "audit_log_config",
  "restricted_access_policy",
  "future_user_access_policy",
];

const REAL_CONFIG_BLUEPRINT_DEPENDENCY_NOTE =
  "Este orden es documental. No se ejecuta desde esta pantalla.";

const REAL_CONFIG_BLUEPRINT_NOT_EXEC_TITLE = "Blueprint no es ejecución";

const REAL_CONFIG_BLUEPRINT_NOT_EXEC_TEXT =
  "El blueprint describe qué configuraciones podrían prepararse más adelante. No crea registros reales, no inserta filas, no modifica tablas y no habilita entorno operativo.";

const REAL_CONFIG_BLUEPRINT_RISKS: string[] = [
  "Convertir blueprint en ejecución sin aprobación final.",
  "Aplicar configuraciones sin validar alcance.",
  "Diseñar campos basados en datos Kore no confirmados.",
  "Habilitar reportes antes de validar fuentes.",
  "Confundir acceso restringido con usuarios operativos.",
  "Dejar auditoría incompleta.",
  "Asumir que read-only está confirmado sin documentación técnica.",
];

const REAL_CONFIG_BLUEPRINT_SECURITY_NOTE =
  "Este blueprint no crea recursos, no aplica SQL, no instala CRM, no crea tenant, no crea usuarios y no escribe en Kore ni en Zeta. Solo documenta configuraciones futuras para una fase posterior con aprobación final.";

type RealConfigBlueprintFutureEntry = {
  letter: string;
  title: string;
  logicalKey: string;
  purpose: string;
  futureFields: string[];
  source: string;
  statusLabel: string;
};

const REAL_CONFIG_BLUEPRINT_FUTURE_ENTRIES: RealConfigBlueprintFutureEntry[] = [
  {
    letter: "A",
    title: "Configuración de cliente piloto",
    logicalKey: "pilot_client_config",
    purpose: "Representar Pickup 4x4 como cliente piloto restringido.",
    futureFields: [
      "client_name",
      "business_type",
      "country",
      "pilot_scope",
      "restricted_stage",
      "external_system",
      "integration_mode",
    ],
    source: "package_payload.client_identity + decisión de reunión.",
    statusLabel: "Futuro / No aplicado",
  },
  {
    letter: "B",
    title: "Configuración de módulos CRM",
    logicalKey: "crm_modules_config",
    purpose: "Definir módulos habilitados para el piloto.",
    futureFields: ["module_key", "module_label", "enabled", "order", "scope_notes"],
    source: "package_payload.crm_modules_config",
    statusLabel: "Futuro / No aplicado",
  },
  {
    letter: "C",
    title: "Configuración de pipeline",
    logicalKey: "pipeline_config",
    purpose: "Definir etapas comerciales iniciales.",
    futureFields: ["stage_key", "stage_label", "stage_order", "is_terminal", "stage_notes"],
    source: "package_payload.pipeline_config",
    statusLabel: "Futuro / No aplicado",
  },
  {
    letter: "D",
    title: "Configuración de campos comerciales",
    logicalKey: "lead_fields_config",
    purpose: "Definir grupos y campos mínimos para clientes, vehículos, oportunidades y Kore.",
    futureFields: ["field_group", "field_key", "field_label", "required", "source", "visibility"],
    source: "package_payload.lead_fields_config",
    statusLabel: "Futuro / No aplicado",
  },
  {
    letter: "E",
    title: "Configuración de reportes",
    logicalKey: "reports_config",
    purpose: "Definir reportes iniciales del piloto.",
    futureFields: [
      "report_key",
      "report_label",
      "report_type",
      "source_module",
      "visible_to_restricted_stage",
    ],
    source: "package_payload.reports_config",
    statusLabel: "Futuro / No aplicado",
  },
  {
    letter: "F",
    title: "Configuración de Kore read-only",
    logicalKey: "kore_readonly_connector_config",
    purpose: "Preparar definición técnica de integración sin escritura.",
    futureFields: [
      "system",
      "mode",
      "write_allowed",
      "sync_direction",
      "credentials_status",
      "api_docs_status",
      "endpoints_status",
      "sync_frequency",
    ],
    source: "package_payload.integrations_config",
    statusLabel: "Futuro / No aplicado",
  },
  {
    letter: "G",
    title: "Configuración de auditoría",
    logicalKey: "audit_log_config",
    purpose: "Registrar evidencia de preparación e instalación futura.",
    futureFields: [
      "source_draft_id",
      "source_snapshot_id",
      "meeting_decision_id",
      "created_by",
      "audit_event_type",
      "audit_notes",
    ],
    source: "draft + snapshot + meeting_decision",
    statusLabel: "Futuro / No aplicado",
  },
  {
    letter: "H",
    title: "Política de acceso restringido",
    logicalKey: "restricted_access_policy",
    purpose: "Definir primera etapa restringida a propietarios + Daniel / Summer87.",
    futureFields: [
      "access_stage",
      "allowed_participants",
      "excluded_participants",
      "invite_policy",
      "operational_users_policy",
    ],
    source: "criterio estratégico del proyecto",
    statusLabel: "Futuro / No aplicado",
  },
  {
    letter: "I",
    title: "Política futura de usuarios operativos",
    logicalKey: "future_user_access_policy",
    purpose:
      "Dejar documentado que empleados operativos, permisos individuales e invitaciones se definen después.",
    futureFields: [
      "future_stage",
      "user_collection_required",
      "role_assignment_required",
      "invitation_required",
      "activation_condition",
    ],
    source: "criterio estratégico del proyecto",
    statusLabel: "Fase posterior / No aplicado",
  },
];

const FUTURE_MIGRATION_SPEC_PURPOSE =
  "Esta especificación documenta qué migraciones o configuraciones podrían prepararse en una fase posterior para crear el entorno piloto de Pickup 4x4. No genera SQL, no crea tablas, no inserta datos y no modifica la base.";

type FutureMigrationSpecArea = {
  letter: string;
  title: string;
  key: string;
  need: string;
  futureType: string;
  statusLabel: string;
};

const FUTURE_MIGRATION_SPEC_AREAS: FutureMigrationSpecArea[] = [
  {
    letter: "A",
    title: "Entorno / tenant piloto",
    key: "pilot_environment",
    need: "Crear o registrar un entorno piloto aislado para Pickup 4x4.",
    futureType: "insert/configuración",
    statusLabel: "No definido / No ejecutado",
  },
  {
    letter: "B",
    title: "Configuración de cliente",
    key: "pilot_client_config",
    need: "Registrar metadata de Pickup 4x4 como cliente piloto restringido.",
    futureType: "insert/configuración",
    statusLabel: "No definido / No ejecutado",
  },
  {
    letter: "C",
    title: "Módulos CRM",
    key: "crm_modules_config",
    need: "Persistir módulos definidos en package_payload.",
    futureType: "insert/configuración",
    statusLabel: "No definido / No ejecutado",
  },
  {
    letter: "D",
    title: "Pipeline comercial",
    key: "pipeline_config",
    need: "Persistir etapas comerciales iniciales.",
    futureType: "insert/configuración",
    statusLabel: "No definido / No ejecutado",
  },
  {
    letter: "E",
    title: "Campos comerciales",
    key: "lead_fields_config",
    need: "Persistir grupos y campos mínimos de cliente, vehículo, oportunidad y Kore.",
    futureType: "insert/configuración",
    statusLabel: "No definido / No ejecutado",
  },
  {
    letter: "F",
    title: "Reportes iniciales",
    key: "reports_config",
    need: "Persistir reportes iniciales del piloto.",
    futureType: "insert/configuración",
    statusLabel: "No definido / No ejecutado",
  },
  {
    letter: "G",
    title: "Kore read-only",
    key: "kore_readonly_config",
    need: "Registrar definición de integración read-only sin credenciales sensibles todavía.",
    futureType: "insert/configuración",
    statusLabel: "No definido / No ejecutado",
  },
  {
    letter: "H",
    title: "Auditoría",
    key: "installation_audit",
    need: "Registrar evento de preparación cuando exista ejecución real.",
    futureType: "insert/audit",
    statusLabel: "No definido / No ejecutado",
  },
  {
    letter: "I",
    title: "Acceso restringido primera etapa",
    key: "restricted_access_stage",
    need: "Documentar que el acceso queda limitado a propietarios + Daniel / Summer87.",
    futureType: "configuración",
    statusLabel: "No definido / No ejecutado",
  },
  {
    letter: "J",
    title: "Usuarios operativos fase posterior",
    key: "future_operational_users",
    need: "Dejar explícito que empleados, roles individuales e invitaciones quedan fuera de esta etapa.",
    futureType: "política/metadata",
    statusLabel: "Fase posterior / No ejecutado",
  },
];

const FUTURE_MIGRATION_SPEC_ORDER_STEPS: string[] = [
  "Auditar tablas existentes.",
  "Confirmar modelo de aislamiento.",
  "Definir estrategia de tenant/configuración.",
  "Preparar SQL en archivo separado.",
  "Revisar SQL manualmente.",
  "Aplicar primero en entorno de prueba.",
  "Validar datos resultantes.",
  "Registrar auditoría.",
  "Recién después evaluar ejecución en entorno real.",
  "Mantener usuarios operativos para fase posterior.",
];

const FUTURE_MIGRATION_SPEC_SQL_SCOPE_TITLE = "Alcance posible de SQL futuro";

const FUTURE_MIGRATION_SPEC_SQL_SCOPE_TEXT =
  "El SQL futuro podría incluir inserts de configuración, referencias al draft, referencias al snapshot base, configuración de módulos, pipeline, campos, reportes y metadata de integración Kore read-only. No debería incluir creación de usuarios, invitaciones, escritura en Kore, escritura en Zeta ni activación de automatizaciones sensibles.";

const FUTURE_MIGRATION_SPEC_SQL_SCOPE_IMPORTANT =
  "Importante: no incluir código SQL real en esta fase.";

const FUTURE_MIGRATION_SPEC_RISKS: string[] = [
  "Ejecutar SQL sin revisar tablas existentes.",
  "Duplicar configuraciones ya presentes.",
  "Crear tenant sin aislamiento claro.",
  "Aplicar configuración sin rollback.",
  "Insertar datos reales sin trazabilidad.",
  "Guardar credenciales sensibles prematuramente.",
  "Mezclar piloto con producción.",
  "Incluir usuarios operativos demasiado temprano.",
  "Ejecutar en producción antes de probar.",
];

const FUTURE_MIGRATION_SPEC_SECURITY_NOTE =
  "Esta especificación no genera SQL, no aplica migraciones, no crea tablas, no inserta datos, no crea tenant, no crea usuarios y no escribe en Kore ni en Zeta. Solo documenta una posible migración futura para revisión técnica.";

const PRE_SQL_READINESS_PURPOSE =
  "Esta auditoría ordena qué debe revisarse antes de escribir una migración real para Pickup 4x4. No consulta la base automáticamente, no genera SQL y no modifica datos. Sirve como guía de revisión manual para detectar estructuras reutilizables y evitar crear tablas innecesarias.";

type PreSqlReadinessAuditArea = {
  letter: string;
  title: string;
  possibleStructures: string[];
  questions: string[];
  statusLine: string;
};

const PRE_SQL_READINESS_AUDIT_AREAS: PreSqlReadinessAuditArea[] = [
  {
    letter: "A",
    title: "Clientes / empresas",
    possibleStructures: ["empresas", "clients", "companies", "crm_setup_config", "config"],
    questions: [
      "¿Ya existe una entidad reutilizable para representar Pickup 4x4?",
      "¿Tiene identificador estable?",
      "¿Puede usarse como cliente piloto sin crear tabla nueva?",
    ],
    statusLine: "Revisión manual pendiente",
  },
  {
    letter: "B",
    title: "Configuración CRM",
    possibleStructures: [
      "crm_setup_config",
      "installer_package_drafts",
      "package_payload",
      "config tables",
    ],
    questions: [
      "¿La configuración puede vivir en JSONB existente?",
      "¿Hay una tabla de configuración reusable?",
      "¿Conviene normalizar o mantener declarativo?",
    ],
    statusLine: "Revisión manual pendiente",
  },
  {
    letter: "C",
    title: "Módulos CRM",
    possibleStructures: ["crm_modules_config", "package_payload.crm_modules_config", "tablas legacy de módulos si existen"],
    questions: [
      "¿Ya hay una forma de definir módulos por cliente?",
      "¿Se puede reutilizar package_payload?",
      "¿Hace falta persistir módulos por separado?",
    ],
    statusLine: "Revisión manual pendiente",
  },
  {
    letter: "D",
    title: "Pipeline comercial",
    possibleStructures: ["lead_pipelines", "pipeline_config", "package_payload.pipeline_config"],
    questions: [
      "¿Ya existen pipelines configurables?",
      "¿Están asociados a cliente/empresa?",
      "¿Se puede usar el pipeline del package_payload como origen inicial?",
    ],
    statusLine: "Revisión manual pendiente",
  },
  {
    letter: "E",
    title: "Campos comerciales",
    possibleStructures: ["lead_fields_config", "custom fields", "package_payload.lead_fields_config"],
    questions: [
      "¿Hay campos dinámicos reutilizables?",
      "¿Se pueden agrupar por Cliente / Vehículo / Oportunidad / Kore?",
      "¿Hace falta migración o alcanza con configuración JSONB?",
    ],
    statusLine: "Revisión manual pendiente",
  },
  {
    letter: "F",
    title: "Reportes",
    possibleStructures: ["reports_config", "report_views", "package_payload.reports_config"],
    questions: [
      "¿Los reportes ya se configuran por cliente?",
      "¿Hay vistas reutilizables?",
      "¿La primera etapa puede usar reportes declarativos?",
    ],
    statusLine: "Revisión manual pendiente",
  },
  {
    letter: "G",
    title: "Kore read-only",
    possibleStructures: ["integrations_config", "integration settings", "package_payload.integrations_config"],
    questions: [
      "¿Ya existe estructura para integraciones externas?",
      "¿Permite marcar read-only?",
      "¿Dónde se guardarían credenciales si más adelante aplica?",
      "¿Cómo evitar escritura accidental?",
    ],
    statusLine: "Revisión manual pendiente",
  },
  {
    letter: "H",
    title: "Auditoría",
    possibleStructures: [
      "installer_package_simulation_snapshots",
      "installer_package_meeting_decisions",
      "audit logs si existen",
    ],
    questions: [
      "¿La evidencia actual alcanza para trazabilidad?",
      "¿Hace falta una tabla futura de auditoría de instalación?",
      "¿Qué evento debería registrarse al crear entorno en una fase posterior?",
    ],
    statusLine: "Con antecedentes",
  },
  {
    letter: "I",
    title: "Accesos restringidos",
    possibleStructures: ["app_users", "roles", "permissions", "access policy configs"],
    questions: [
      "¿Cómo representar primera etapa restringida sin empleados operativos?",
      "¿Se puede trabajar solo con propietarios + Daniel / Summer87?",
      "¿Cómo dejar usuarios operativos para etapa posterior?",
    ],
    statusLine: "Revisión manual pendiente",
  },
  {
    letter: "J",
    title: "Tenancy / aislamiento",
    possibleStructures: ["company_id", "workspace_company_id", "tenant_id", "client_id", "empresas.id"],
    questions: [
      "¿Cuál es la columna de aislamiento real del sistema?",
      "¿Conviene tenant separado o configuración por empresa?",
      "¿Qué tablas críticas requieren aislamiento?",
      "¿Hay riesgo de mezclar datos entre clientes?",
    ],
    statusLine: "Revisión manual requerida",
  },
];

const PRE_SQL_TECHNICAL_QUESTIONS: string[] = [
  "¿Qué tabla representa hoy a una empresa/cliente?",
  "¿Cuál es el identificador real para aislar datos?",
  "¿Qué tablas ya tienen company_id, workspace_company_id o equivalente?",
  "¿Qué configuración puede quedar en JSONB?",
  "¿Qué configuración necesita normalización?",
  "¿Qué datos son solo declarativos?",
  "¿Qué datos serían operativos?",
  "¿Qué parte depende de Kore?",
  "¿Qué parte puede prepararse sin Kore?",
  "¿Qué parte debe esperar a fase de usuarios?",
];

const PRE_SQL_DECISION_PENDING_TITLE = "Decisión técnica pendiente";

const PRE_SQL_DECISION_PENDING_TEXT =
  "Antes de escribir SQL real, debe decidirse si Pickup 4x4 se representará como tenant separado, empresa dentro de una estructura existente o configuración declarativa vinculada al package. Esta decisión afecta aislamiento, permisos, reportes y futuras integraciones.";

const PRE_SQL_DECISION_DOCUMENT_OPTIONS: string[] = [
  "Tenant / entorno separado.",
  "Empresa dentro de estructura existente.",
  "Configuración declarativa sobre package_payload.",
  "Modelo híbrido.",
];

const PRE_SQL_READINESS_RISKS: string[] = [
  "Crear tablas nuevas cuando ya existen estructuras reutilizables.",
  "Elegir mal la columna de aislamiento.",
  "Normalizar demasiado pronto configuraciones que aún están cambiando.",
  "Mantener demasiado en JSONB sin estrategia de lectura futura.",
  "Mezclar configuración con datos operativos.",
  "Diseñar sin confirmar cómo se integrará Kore.",
  "Preparar usuarios antes de validar estructura.",
  "Ejecutar SQL sin rollback.",
  "Ejecutar SQL sin ambiente de prueba.",
  "Confundir especificación con migración ejecutable.",
];

const PRE_SQL_READINESS_SECURITY_NOTE =
  "Esta auditoría pre-SQL no ejecuta queries, no genera SQL, no aplica migraciones, no crea tablas, no inserta datos, no crea tenant, no crea usuarios y no escribe en Kore ni en Zeta. Solo ordena la revisión técnica previa a una posible migración futura.";

function koreReadonlyDesignRows(pp: Record<string, unknown>): {
  mode: string;
  direction: string;
  writeAllowed: string;
  credentials: string;
  documentation: string;
  endpoints: string;
  syncFrequency: string;
  validation: string;
} {
  const raw = payloadCfg(pp, "integrations_config", "integrationsConfig");
  let mode = "read_only";
  let direction = "Kore → Summer87";
  let writeAllowed = "no";
  let credentials = "pendiente";
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const list = (raw as Record<string, unknown>).integrations;
    if (Array.isArray(list)) {
      for (const item of list) {
        if (!item || typeof item !== "object" || Array.isArray(item)) continue;
        const o = item as Record<string, unknown>;
        const sys = String(o.system ?? "").toLowerCase();
        if (!sys.includes("kore")) continue;
        if (typeof o.mode === "string" && o.mode.trim()) mode = o.mode.trim();
        if (typeof o.syncDirection === "string" && o.syncDirection.trim())
          direction = o.syncDirection.trim();
        if (o.writeAllowed === false) writeAllowed = "no";
        else if (o.writeAllowed === true) writeAllowed = "sí (no aplica en diseño read-only)";
        const st = String(o.status ?? "").trim();
        if (st) credentials = st === "pending_credentials" ? "pendiente" : st;
        break;
      }
    }
  }
  const docOk = integrationsConfigHasEntries(pp);
  return {
    mode,
    direction,
    writeAllowed,
    credentials,
    documentation: docOk ? "Con antecedente (payload)" : "pendiente",
    endpoints: "pendiente de confirmación",
    syncFrequency: "futura definición",
    validation: "prueba controlada de lectura",
  };
}

function computeTechnicalDesignValidationRows(p: {
  packagePayload: Record<string, unknown>;
  meta: DraftMetadata;
  humanConfirmationStatus: string;
  latestAdvanceMeetingDecision: MeetingDecisionListItem;
}): { label: string; badge: FutureExecutableUnlockBadge }[] {
  const { packagePayload: pp, meta, humanConfirmationStatus: humanSt, latestAdvanceMeetingDecision: adv } = p;
  const modulesOk = !isManualInstallPayloadSectionEmpty(
    payloadCfg(pp, "crm_modules_config", "crmModulesConfig")
  );
  const pipelineOk = !isManualInstallPayloadSectionEmpty(payloadCfg(pp, "pipeline_config", "pipelineConfig"));
  const fieldsOk = !isManualInstallPayloadSectionEmpty(payloadCfg(pp, "lead_fields_config", "leadFieldsConfig"));
  const reportsOk = !isManualInstallPayloadSectionEmpty(payloadCfg(pp, "reports_config", "reportsConfig"));
  const critOk =
    typeof adv.decisionReason === "string" && adv.decisionReason.trim().length >= 20;
  const summer87PilotOk = meta.status === "approved_for_pilot";
  const pickupHumanOk = humanSt === "approved";
  const koreOk = isKoreReadOnlyIntegration(pp);
  const docOk = integrationsConfigHasEntries(pp);
  const approvalsOk = summer87PilotOk && pickupHumanOk;
  const scopeOk = modulesOk && pipelineOk && approvalsOk;
  return [
    {
      label: "Confirmar aprobación final.",
      badge: approvalsOk ? "antecedente" : "pendiente",
    },
    { label: "Confirmar alcance piloto.", badge: scopeOk ? "antecedente" : "pendiente" },
    { label: "Confirmar propietarios participantes.", badge: "pendiente" },
    { label: "Confirmar canal de coordinación.", badge: "pendiente" },
    { label: "Confirmar estructura CRM.", badge: modulesOk ? "antecedente" : "pendiente" },
    { label: "Confirmar pipeline.", badge: pipelineOk ? "antecedente" : "pendiente" },
    { label: "Confirmar campos mínimos.", badge: fieldsOk ? "antecedente" : "pendiente" },
    { label: "Confirmar reportes iniciales.", badge: reportsOk ? "antecedente" : "pendiente" },
    { label: "Confirmar Kore read-only.", badge: koreOk ? "antecedente" : "pendiente" },
    { label: "Confirmar documentación API.", badge: docOk ? "antecedente" : "pendiente" },
    { label: "Confirmar criterio de éxito.", badge: critOk ? "antecedente" : "pendiente" },
    {
      label: "Confirmar que usuarios operativos quedan para etapa posterior.",
      badge: "requerido",
    },
  ];
}

function computeBlueprintValidationRows(p: {
  packagePayload: Record<string, unknown>;
  meta: DraftMetadata;
  humanConfirmationStatus: string;
  latestAdvanceMeetingDecision: MeetingDecisionListItem;
}): { label: string; badge: FutureExecutableUnlockBadge }[] {
  const { packagePayload: pp, meta, humanConfirmationStatus: humanSt, latestAdvanceMeetingDecision: adv } = p;
  const modulesOk = !isManualInstallPayloadSectionEmpty(
    payloadCfg(pp, "crm_modules_config", "crmModulesConfig")
  );
  const pipelineOk = !isManualInstallPayloadSectionEmpty(payloadCfg(pp, "pipeline_config", "pipelineConfig"));
  const fieldsOk = !isManualInstallPayloadSectionEmpty(payloadCfg(pp, "lead_fields_config", "leadFieldsConfig"));
  const reportsOk = !isManualInstallPayloadSectionEmpty(payloadCfg(pp, "reports_config", "reportsConfig"));
  const critOk =
    typeof adv.decisionReason === "string" && adv.decisionReason.trim().length >= 20;
  const summer87PilotOk = meta.status === "approved_for_pilot";
  const pickupHumanOk = humanSt === "approved";
  const koreOk = isKoreReadOnlyIntegration(pp);
  const docOk = integrationsConfigHasEntries(pp);
  const approvalsOk = summer87PilotOk && pickupHumanOk;
  const scopeOk = modulesOk && pipelineOk && approvalsOk;
  return [
    {
      label: "Confirmar aprobación final.",
      badge: approvalsOk ? "antecedente" : "pendiente",
    },
    { label: "Confirmar alcance piloto.", badge: scopeOk ? "antecedente" : "pendiente" },
    { label: "Confirmar propietarios participantes.", badge: "pendiente" },
    { label: "Confirmar canal de coordinación.", badge: "pendiente" },
    { label: "Confirmar módulos finales.", badge: modulesOk ? "antecedente" : "pendiente" },
    { label: "Confirmar pipeline final.", badge: pipelineOk ? "antecedente" : "pendiente" },
    { label: "Confirmar campos mínimos.", badge: fieldsOk ? "antecedente" : "pendiente" },
    { label: "Confirmar reportes iniciales.", badge: reportsOk ? "antecedente" : "pendiente" },
    { label: "Confirmar Kore read-only.", badge: koreOk ? "antecedente" : "pendiente" },
    { label: "Confirmar documentación API Kore.", badge: docOk ? "antecedente" : "pendiente" },
    { label: "Confirmar criterio de éxito.", badge: critOk ? "antecedente" : "pendiente" },
    {
      label: "Confirmar que usuarios operativos quedan para fase posterior.",
      badge: "requerido",
    },
  ];
}

function computeMigrationSpecPrevalidationRows(p: {
  packagePayload: Record<string, unknown>;
  meta: DraftMetadata;
  humanConfirmationStatus: string;
  latestSnapshot: SimulationSnapshotRow;
}): { label: string; badge: FutureExecutableUnlockBadge }[] {
  const { packagePayload: pp, meta, humanConfirmationStatus: humanSt, latestSnapshot } = p;
  const clientIdOk = !isManualInstallPayloadSectionEmpty(
    payloadCfg(pp, "client_identity", "clientIdentity")
  );
  const modulesOk = !isManualInstallPayloadSectionEmpty(
    payloadCfg(pp, "crm_modules_config", "crmModulesConfig")
  );
  const pipelineOk = !isManualInstallPayloadSectionEmpty(payloadCfg(pp, "pipeline_config", "pipelineConfig"));
  const fieldsOk = !isManualInstallPayloadSectionEmpty(payloadCfg(pp, "lead_fields_config", "leadFieldsConfig"));
  const reportsOk = !isManualInstallPayloadSectionEmpty(payloadCfg(pp, "reports_config", "reportsConfig"));
  const koreOk = isKoreReadOnlyIntegration(pp);
  const summer87PilotOk = meta.status === "approved_for_pilot";
  const pickupHumanOk = humanSt === "approved";
  const approvalsSqlOk = summer87PilotOk && pickupHumanOk;
  const reusableSignal =
    Boolean(latestSnapshot.id?.trim()) &&
    (clientIdOk || modulesOk || pipelineOk || fieldsOk || reportsOk);
  return [
    {
      label: "Confirmar si ya existen tablas/configuraciones reutilizables.",
      badge: reusableSignal ? "antecedente" : "pendiente",
    },
    {
      label:
        "Confirmar si el entorno será tenant separado o configuración dentro de estructura existente.",
      badge: "pendiente",
    },
    { label: "Confirmar naming convention.", badge: "pendiente" },
    {
      label: "Confirmar campos obligatorios.",
      badge: fieldsOk ? "antecedente" : "pendiente",
    },
    { label: "Confirmar relaciones / foreign keys.", badge: "pendiente" },
    { label: "Confirmar RLS y políticas necesarias.", badge: "pendiente" },
    { label: "Confirmar rollback posible.", badge: "pendiente" },
    { label: "Confirmar ambiente de prueba.", badge: "pendiente" },
    {
      label: "Confirmar que Kore seguirá read-only.",
      badge: koreOk ? "antecedente" : "pendiente",
    },
    {
      label: "Confirmar que usuarios operativos quedan para etapa posterior.",
      badge: "requerido",
    },
    {
      label: "Confirmar aprobación final antes de ejecutar SQL.",
      badge: approvalsSqlOk ? "antecedente" : "pendiente",
    },
  ];
}

function computePreSqlReadinessChecklistRows(p: {
  packagePayload: Record<string, unknown>;
  latestSnapshot: SimulationSnapshotRow;
}): { label: string; badge: FutureExecutableUnlockBadge }[] {
  const { packagePayload: pp, latestSnapshot } = p;
  const clientIdOk = !isManualInstallPayloadSectionEmpty(
    payloadCfg(pp, "client_identity", "clientIdentity")
  );
  const modulesOk = !isManualInstallPayloadSectionEmpty(
    payloadCfg(pp, "crm_modules_config", "crmModulesConfig")
  );
  const pipelineOk = !isManualInstallPayloadSectionEmpty(payloadCfg(pp, "pipeline_config", "pipelineConfig"));
  const fieldsOk = !isManualInstallPayloadSectionEmpty(payloadCfg(pp, "lead_fields_config", "leadFieldsConfig"));
  const reportsOk = !isManualInstallPayloadSectionEmpty(payloadCfg(pp, "reports_config", "reportsConfig"));
  const koreOk = isKoreReadOnlyIntegration(pp);
  const evidenceOk = Boolean(latestSnapshot.id?.trim());
  return [
    {
      label: "Identificar tabla/entidad principal para Pickup 4x4.",
      badge: clientIdOk ? "antecedente" : "pendiente",
    },
    { label: "Confirmar columna de aislamiento.", badge: "pendiente" },
    {
      label: "Confirmar si se usará tenant separado o configuración existente.",
      badge: "pendiente",
    },
    {
      label: "Confirmar si módulos pueden vivir en JSONB o deben normalizarse.",
      badge: modulesOk ? "antecedente" : "pendiente",
    },
    {
      label: "Confirmar si pipeline puede reutilizar estructuras existentes.",
      badge: pipelineOk ? "antecedente" : "pendiente",
    },
    {
      label: "Confirmar si campos comerciales pueden ser dinámicos.",
      badge: fieldsOk ? "antecedente" : "pendiente",
    },
    {
      label: "Confirmar si reportes iniciales requieren tablas o vistas.",
      badge: reportsOk ? "antecedente" : "pendiente",
    },
    {
      label: "Confirmar estrategia Kore read-only.",
      badge: koreOk ? "antecedente" : "pendiente",
    },
    {
      label: "Confirmar si credenciales quedan fuera de esta etapa.",
      badge: "requerido",
    },
    {
      label: "Confirmar estrategia de auditoría.",
      badge: evidenceOk ? "antecedente" : "pendiente",
    },
    {
      label: "Confirmar que usuarios operativos quedan para etapa posterior.",
      badge: "requerido",
    },
    { label: "Confirmar rollback antes de cualquier SQL.", badge: "pendiente" },
    { label: "Confirmar ambiente de prueba antes de cualquier SQL.", badge: "pendiente" },
  ];
}

function buildTechnicalPilotEnvironmentDesignPlainText(p: {
  meta: DraftMetadata;
  humanConfirmationStatus: string;
  latestSnapshot: SimulationSnapshotRow;
  latestAdvanceMeetingDecision: MeetingDecisionListItem;
  packagePayload: Record<string, unknown>;
}): string {
  const { meta, humanConfirmationStatus, latestSnapshot, latestAdvanceMeetingDecision, packagePayload } = p;
  const snapShort = shortSnapshotId(latestSnapshot.id);
  const koreRows = koreReadonlyDesignRows(packagePayload);
  const valRows = computeTechnicalDesignValidationRows({
    packagePayload,
    meta,
    humanConfirmationStatus,
    latestAdvanceMeetingDecision,
  });

  const lines: string[] = [];
  lines.push("SUMMER87 — DISEÑO TÉCNICO DEL ENTORNO PILOTO (Pickup 4x4)");
  lines.push("Documento informativo. Ninguna acción se ejecuta desde Constructor CRM.");
  lines.push("");
  lines.push("ESTADO DEL DISEÑO");
  for (const b of ["Diseño técnico", "No ejecutado", "Sin SQL", "Sin recursos creados", "Primera etapa restringida"]) {
    lines.push(`- ${b}`);
  }
  lines.push("");
  lines.push("REFERENCIA");
  lines.push(`- Draft ID: ${meta.id}`);
  lines.push(`- Snapshot: ${latestSnapshot.id} (${snapShort})`);
  lines.push(`- Decisión reunión: ${latestAdvanceMeetingDecision.decisionLabel}`);
  lines.push("");
  lines.push("PROPÓSITO");
  lines.push(PILOT_TECH_DESIGN_PURPOSE);
  lines.push("");
  lines.push("MODELO DE AISLAMIENTO PROPUESTO");
  for (const it of PILOT_TECH_DESIGN_ISOLATION_RECOMMENDED) {
    lines.push(`- ${it}`);
  }
  lines.push(PILOT_TECH_DESIGN_ISOLATION_NOTE);
  lines.push("");
  lines.push("CAPAS DEL ENTORNO PILOTO (cada capa: Diseñado · No ejecutado)");
  for (const L of PILOT_TECH_DESIGN_LAYERS) {
    lines.push(`- ${L.title}: ${L.body} [Diseñado · No ejecutado]`);
  }
  lines.push("");
  lines.push("COMPONENTES TÉCNICOS PROPUESTOS (futuro · no creado)");
  for (const c of PILOT_TECH_DESIGN_COMPONENTS) {
    lines.push(`- ${c.key}`);
    lines.push(`  Propósito: ${c.purpose}`);
    lines.push(`  Fuente: ${c.source}`);
    lines.push("  Estado: futuro / no creado");
  }
  lines.push("");
  lines.push("DISEÑO KORE READ-ONLY");
  lines.push(PILOT_TECH_KORE_DESIGN_INTRO);
  lines.push(`- Modo: ${koreRows.mode}`);
  lines.push(`- Dirección: ${koreRows.direction}`);
  lines.push(`- Escritura permitida: ${koreRows.writeAllowed}`);
  lines.push(`- Estado credenciales: ${koreRows.credentials}`);
  lines.push(`- Documentación API: ${koreRows.documentation}`);
  lines.push(`- Endpoints: ${koreRows.endpoints}`);
  lines.push(`- Frecuencia de sincronización: ${koreRows.syncFrequency}`);
  lines.push(`- Validación inicial: ${koreRows.validation}`);
  lines.push("");
  lines.push("DISEÑO DE DATOS INICIALES (no importación en esta fase)");
  for (const d of PILOT_TECH_INITIAL_DATA_ITEMS) {
    lines.push(`- ${d}`);
  }
  lines.push(PILOT_TECH_INITIAL_DATA_NOTE);
  lines.push("");
  lines.push("PRIMERA ETAPA RESTRINGIDA");
  lines.push("Participantes:");
  for (const x of PILOT_TECH_RESTRICTED_PARTICIPANTS) {
    lines.push(`- ${x}`);
  }
  lines.push("Quedan fuera:");
  for (const x of PILOT_TECH_RESTRICTED_EXCLUDED) {
    lines.push(`- ${x}`);
  }
  lines.push(PILOT_TECH_RESTRICTED_TEXT);
  lines.push("");
  lines.push("VALIDACIONES REQUERIDAS ANTES DE CREAR RECURSOS");
  for (const r of valRows) {
    lines.push(`- [${futureUnlockBadgeLabel(r.badge)}] ${r.label}`);
  }
  lines.push("");
  lines.push("RIESGOS TÉCNICOS");
  for (const r of PILOT_TECH_DESIGN_RISKS) {
    lines.push(`- ${r}`);
  }
  lines.push("");
  lines.push("ACCIONES BLOQUEADAS");
  for (const c of FUTURE_EXECUTABLE_BLOCKED_CODES) {
    lines.push(`- ${c}`);
  }
  lines.push("");
  lines.push("NOTA DE SEGURIDAD");
  lines.push(PILOT_TECH_DESIGN_SECURITY_NOTE);
  return lines.join("\n");
}

function buildRealConfigBlueprintPlainText(p: {
  meta: DraftMetadata;
  humanConfirmationStatus: string;
  latestSnapshot: SimulationSnapshotRow;
  latestAdvanceMeetingDecision: MeetingDecisionListItem;
  packagePayload: Record<string, unknown>;
}): string {
  const { meta, humanConfirmationStatus, latestSnapshot, latestAdvanceMeetingDecision, packagePayload } = p;
  const snapShort = shortSnapshotId(latestSnapshot.id);
  const valRows = computeBlueprintValidationRows({
    packagePayload,
    meta,
    humanConfirmationStatus,
    latestAdvanceMeetingDecision,
  });

  const lines: string[] = [];
  lines.push("SUMMER87 — BLUEPRINT TÉCNICO DE CONFIGURACIÓN REAL");
  lines.push("Documento informativo. Ninguna acción se ejecuta desde Constructor CRM.");
  lines.push("");
  lines.push("ESTADO DEL BLUEPRINT");
  for (const b of [
    "Blueprint",
    "No aplicado",
    "Sin SQL",
    "Sin escritura",
    "Futuro",
    "Requiere aprobación final",
  ]) {
    lines.push(`- ${b}`);
  }
  lines.push("");
  lines.push("REFERENCIA");
  lines.push(`- Draft ID: ${meta.id}`);
  lines.push(`- Snapshot: ${latestSnapshot.id} (${snapShort})`);
  lines.push(`- Decisión reunión: ${latestAdvanceMeetingDecision.decisionLabel}`);
  lines.push("");
  lines.push("PROPÓSITO");
  lines.push(REAL_CONFIG_BLUEPRINT_PURPOSE);
  lines.push("");
  lines.push("CONFIGURACIONES FUTURAS");
  for (const e of REAL_CONFIG_BLUEPRINT_FUTURE_ENTRIES) {
    lines.push(`- ${e.letter}. ${e.title} (${e.logicalKey})`);
    lines.push(`  Propósito: ${e.purpose}`);
    lines.push("  Campos futuros sugeridos:");
    for (const f of e.futureFields) {
      lines.push(`    · ${f}`);
    }
    lines.push(`  Fuente: ${e.source}`);
    lines.push(`  Estado: ${e.statusLabel}`);
    lines.push("");
  }
  lines.push("DEPENDENCIAS DE CONFIGURACIÓN (orden documental)");
  REAL_CONFIG_BLUEPRINT_DEPENDENCY_ORDER.forEach((key, i) => {
    lines.push(`${i + 1}. ${key}`);
  });
  lines.push("");
  lines.push(REAL_CONFIG_BLUEPRINT_DEPENDENCY_NOTE);
  lines.push("");
  lines.push("VALIDACIONES PREVIAS ANTES DE APLICAR BLUEPRINT");
  for (const r of valRows) {
    lines.push(`- [${futureUnlockBadgeLabel(r.badge)}] ${r.label}`);
  }
  lines.push("");
  lines.push(REAL_CONFIG_BLUEPRINT_NOT_EXEC_TITLE.toUpperCase());
  lines.push(REAL_CONFIG_BLUEPRINT_NOT_EXEC_TEXT);
  lines.push("");
  lines.push("RIESGOS DEL BLUEPRINT");
  for (const r of REAL_CONFIG_BLUEPRINT_RISKS) {
    lines.push(`- ${r}`);
  }
  lines.push("");
  lines.push("ACCIONES BLOQUEADAS");
  for (const c of REAL_CONFIG_BLUEPRINT_BLOCKED_CODES) {
    lines.push(`- ${c}`);
  }
  lines.push("");
  lines.push("NOTA DE SEGURIDAD");
  lines.push(REAL_CONFIG_BLUEPRINT_SECURITY_NOTE);
  return lines.join("\n");
}

function buildFutureMigrationSpecPlainText(p: {
  meta: DraftMetadata;
  humanConfirmationStatus: string;
  latestSnapshot: SimulationSnapshotRow;
  latestAdvanceMeetingDecision: MeetingDecisionListItem;
  packagePayload: Record<string, unknown>;
}): string {
  const { meta, humanConfirmationStatus, latestSnapshot, latestAdvanceMeetingDecision, packagePayload } = p;
  const snapShort = shortSnapshotId(latestSnapshot.id);
  const preRows = computeMigrationSpecPrevalidationRows({
    packagePayload,
    meta,
    humanConfirmationStatus,
    latestSnapshot,
  });

  const lines: string[] = [];
  lines.push("SUMMER87 — ESPECIFICACIÓN DE MIGRACIÓN FUTURA");
  lines.push("Documento informativo. Ninguna acción se ejecuta desde Constructor CRM.");
  lines.push("");
  lines.push("ESTADO DE LA ESPECIFICACIÓN");
  for (const b of [
    "Especificación",
    "No ejecutada",
    "Sin archivo SQL",
    "Sin migración aplicada",
    "Futuro",
    "Requiere revisión técnica",
  ]) {
    lines.push(`- ${b}`);
  }
  lines.push("");
  lines.push("REFERENCIA");
  lines.push(`- Draft ID: ${meta.id}`);
  lines.push(`- Snapshot: ${latestSnapshot.id} (${snapShort})`);
  lines.push(`- Decisión reunión: ${latestAdvanceMeetingDecision.decisionLabel}`);
  lines.push("");
  lines.push("PROPÓSITO");
  lines.push(FUTURE_MIGRATION_SPEC_PURPOSE);
  lines.push("");
  lines.push("ÁREAS QUE PODRÍAN REQUERIR MIGRACIÓN FUTURA");
  for (const a of FUTURE_MIGRATION_SPEC_AREAS) {
    lines.push(`- ${a.letter}. ${a.title} (${a.key})`);
    lines.push(`  Posible necesidad: ${a.need}`);
    lines.push(`  Tipo futuro: ${a.futureType}`);
    lines.push(`  Estado: ${a.statusLabel}`);
    lines.push("");
  }
  lines.push("PREVALIDACIONES ANTES DE ESCRIBIR CUALQUIER SQL");
  for (const r of preRows) {
    lines.push(`- [${futureUnlockBadgeLabel(r.badge)}] ${r.label}`);
  }
  lines.push("");
  lines.push("ORDEN SUGERIDO DE MIGRACIÓN FUTURA");
  FUTURE_MIGRATION_SPEC_ORDER_STEPS.forEach((step, i) => {
    lines.push(`${i + 1}. ${step}`);
  });
  lines.push("");
  lines.push(FUTURE_MIGRATION_SPEC_SQL_SCOPE_TITLE.toUpperCase());
  lines.push(FUTURE_MIGRATION_SPEC_SQL_SCOPE_TEXT);
  lines.push(FUTURE_MIGRATION_SPEC_SQL_SCOPE_IMPORTANT);
  lines.push("");
  lines.push("RIESGOS DE MIGRACIÓN FUTURA");
  for (const r of FUTURE_MIGRATION_SPEC_RISKS) {
    lines.push(`- ${r}`);
  }
  lines.push("");
  lines.push("ACCIONES BLOQUEADAS");
  for (const c of FUTURE_MIGRATION_SPEC_BLOCKED_CODES) {
    lines.push(`- ${c}`);
  }
  lines.push("");
  lines.push("NOTA DE SEGURIDAD");
  lines.push(FUTURE_MIGRATION_SPEC_SECURITY_NOTE);
  return lines.join("\n");
}

function buildPreSqlReadinessAuditPlainText(p: {
  meta: DraftMetadata;
  latestSnapshot: SimulationSnapshotRow;
  latestAdvanceMeetingDecision: MeetingDecisionListItem;
  packagePayload: Record<string, unknown>;
}): string {
  const { meta, latestSnapshot, latestAdvanceMeetingDecision, packagePayload } = p;
  const snapShort = shortSnapshotId(latestSnapshot.id);
  const checklistRows = computePreSqlReadinessChecklistRows({ packagePayload, latestSnapshot });

  const lines: string[] = [];
  lines.push("SUMMER87 — AUDITORÍA DE READINESS PRE-SQL");
  lines.push("Documento informativo. Sin introspección automática de base ni queries desde esta pantalla.");
  lines.push("");
  lines.push("ESTADO DE LA AUDITORÍA");
  for (const b of [
    "Auditoría pre-SQL",
    "No ejecuta queries",
    "Sin SQL",
    "Sin cambios de base",
    "Requiere revisión manual",
    "Futuro",
  ]) {
    lines.push(`- ${b}`);
  }
  lines.push("");
  lines.push("REFERENCIA");
  lines.push(`- Draft ID: ${meta.id}`);
  lines.push(`- Snapshot: ${latestSnapshot.id} (${snapShort})`);
  lines.push(`- Decisión reunión: ${latestAdvanceMeetingDecision.decisionLabel}`);
  lines.push("");
  lines.push("PROPÓSITO");
  lines.push(PRE_SQL_READINESS_PURPOSE);
  lines.push("");
  lines.push("ÁREAS A AUDITAR ANTES DE SQL");
  for (const a of PRE_SQL_READINESS_AUDIT_AREAS) {
    lines.push(`- ${a.letter}. ${a.title}`);
    lines.push("  Posible estructura a revisar:");
    for (const s of a.possibleStructures) {
      lines.push(`    · ${s}`);
    }
    lines.push("  Preguntas:");
    for (const q of a.questions) {
      lines.push(`    · ${q}`);
    }
    lines.push(`  Estado: ${a.statusLine}`);
    lines.push("");
  }
  lines.push("CHECKLIST DE READINESS PRE-SQL");
  for (const r of checklistRows) {
    lines.push(`- [${futureUnlockBadgeLabel(r.badge)}] ${r.label}`);
  }
  lines.push("");
  lines.push("PREGUNTAS TÉCNICAS ANTES DE MIGRAR");
  for (const q of PRE_SQL_TECHNICAL_QUESTIONS) {
    lines.push(`- ${q}`);
  }
  lines.push("");
  lines.push(PRE_SQL_DECISION_PENDING_TITLE.toUpperCase());
  lines.push(PRE_SQL_DECISION_PENDING_TEXT);
  lines.push("Opciones documentales (sin selección automática):");
  for (const o of PRE_SQL_DECISION_DOCUMENT_OPTIONS) {
    lines.push(`- ${o}`);
  }
  lines.push("");
  lines.push("RIESGOS PRE-SQL");
  for (const r of PRE_SQL_READINESS_RISKS) {
    lines.push(`- ${r}`);
  }
  lines.push("");
  lines.push("ACCIONES BLOQUEADAS");
  for (const c of PRE_SQL_READINESS_AUDIT_BLOCKED_CODES) {
    lines.push(`- ${c}`);
  }
  lines.push("");
  lines.push("NOTA DE SEGURIDAD");
  lines.push(PRE_SQL_READINESS_SECURITY_NOTE);
  return lines.join("\n");
}

const MEETING_FINAL_DECISION_OPTIONS: { value: MeetingFinalDecisionValue; label: string }[] = [
  { value: "advance_manual_preparation", label: "Avanzar a preparación manual controlada" },
  { value: "wait_kore_technical_info", label: "Esperar información técnica de Kore" },
  { value: "adjust_scope", label: "Ajustar alcance antes de avanzar" },
  { value: "pause_project", label: "Pausar proyecto" },
];

function truncateMeetingDecisionPreview(s: string | null | undefined, max: number): string {
  if (s == null) return "—";
  const t = String(s).trim();
  if (!t) return "—";
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

/** Solo lectura: dictamen de readiness para instalación manual (derivado de último snapshot). */
function manualInstallReadinessDictamen(latest: SimulationSnapshotRow | undefined): {
  estadoLabel: string;
  motivo: string;
  siguienteAccion: string;
  semaforoDotClass: string;
} {
  if (!latest) {
    return {
      estadoLabel: "Sin evidencia suficiente",
      motivo: "Primero se debe simular preinstalación y guardar evidencia.",
      siguienteAccion: "Simular preinstalación y guardar snapshot.",
      semaforoDotClass: "bg-slate-400",
    };
  }
  const go = (latest.finalGoNoGo ?? "").trim();
  if (!go) {
    return {
      estadoLabel: "Sin evidencia suficiente",
      motivo: "La evidencia no contiene un dictamen suficiente.",
      siguienteAccion: "Generar una nueva simulación con contrato técnico completo.",
      semaforoDotClass: "bg-slate-400",
    };
  }
  switch (go) {
    case "no_go":
      return {
        estadoLabel: "Bloqueado",
        motivo: "La última evidencia recomienda no avanzar sin correcciones.",
        siguienteAccion: "Corregir faltantes críticos y volver a simular.",
        semaforoDotClass: "bg-rose-500",
      };
    case "pending_inputs":
      return {
        estadoLabel: "Pendiente de insumos",
        motivo: "La última evidencia indica que faltan configuraciones mínimas.",
        siguienteAccion: "Completar cliente, módulos, pipeline, campos y permisos.",
        semaforoDotClass: "bg-amber-500",
      };
    case "ready_for_manual_install":
      return {
        estadoLabel: "Casi listo para revisión manual",
        motivo:
          "La evidencia permite considerar revisión humana final, pero no autoriza ejecución automática.",
        siguienteAccion: "Solicitar aprobación humana final fuera de esta pantalla.",
        semaforoDotClass: "bg-emerald-600/80",
      };
    default:
      return {
        estadoLabel: "Sin evidencia suficiente",
        motivo: "La evidencia no contiene un dictamen suficiente.",
        siguienteAccion: "Generar una nueva simulación con contrato técnico completo.",
        semaforoDotClass: "bg-slate-400",
      };
  }
}

function strFromUnknown(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v).trim();
  return s;
}

/** finalGoNoGo desde readiness (camel o snake). */
function contractFinalGoNoGo(rd: Record<string, unknown> | undefined): string {
  if (!rd) return "";
  return strFromUnknown(rd.finalGoNoGo ?? rd.final_go_no_go);
}

function executiveDictamenText(go: string): string {
  switch (go) {
    case "no_go":
      return "No avanzar. El paquete no está listo para instalación manual.";
    case "pending_inputs":
      return "Pendiente de insumos. El paquete fue aprobado, pero todavía requiere completar configuración antes de avanzar.";
    case "ready_for_manual_install":
      return "Listo para revisión final. Puede considerarse para instalación manual controlada, previa aprobación humana final.";
    default:
      return go ? `Estado no estándar (${go}). Revisar contrato técnico.` : "No informado.";
  }
}

function executiveTrafficLightClasses(go: string): { track: string; label: string } {
  switch (go) {
    case "no_go":
      return {
        track: "bg-rose-100 ring-1 ring-rose-200/80",
        label: "Semáforo: rojo (no avanzar)",
      };
    case "pending_inputs":
      return {
        track: "bg-amber-100 ring-1 ring-amber-200/80",
        label: "Semáforo: ámbar (pendiente de insumos)",
      };
    case "ready_for_manual_install":
      return {
        track: "bg-emerald-50 ring-1 ring-emerald-200/70",
        label: "Semáforo: verde discreto (listo para revisión final)",
      };
    default:
      return {
        track: "bg-slate-100 ring-1 ring-slate-200",
        label: "Semáforo: no informado",
      };
  }
}

function readinessScoreFromContract(rd: Record<string, unknown> | undefined): number | null {
  if (!rd) return null;
  const raw = rd.readinessScore ?? rd.readiness_score;
  if (raw === null || raw === undefined) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return Math.round(Math.max(0, Math.min(100, n)));
}

function readinessRiskFromContract(rd: Record<string, unknown> | undefined): string {
  if (!rd) return "";
  return strFromUnknown(rd.riskLevel ?? rd.risk_level);
}

function scorePreparationLabel(score: number | null): string {
  if (score === null) return "No informado";
  if (score <= 39) return "preparación baja";
  if (score <= 69) return "preparación parcial";
  if (score <= 89) return "preparación avanzada";
  return "preparación alta";
}

function executiveRiskExplanation(level: string): string {
  switch (level) {
    case "low":
      return "Riesgo operativo bajo, sujeto a aprobación final.";
    case "medium":
      return "Riesgo operativo medio: hay faltantes o validaciones pendientes.";
    case "high":
      return "Riesgo operativo alto: no conviene avanzar sin correcciones.";
    default:
      return level ? "Riesgo no estándar; revisar contrato." : "No informado.";
  }
}

function tenantExecutiveCopy(status: string): string {
  switch (status) {
    case "not_resolved":
      return "Cliente/tenant no resuelto.";
    case "metadata_only":
      return "Cliente registrado solo como metadata de draft.";
    case "resolved":
      return "Cliente/tenant resuelto.";
    default:
      return status ? `Estado: ${status}` : "No informado.";
  }
}

function crmSectionStatusBadgeClass(st: string): string {
  switch (st) {
    case "missing":
      return "border border-rose-200/70 bg-rose-50 text-rose-900";
    case "partial":
      return "border border-amber-200/70 bg-amber-50 text-amber-950";
    case "ready":
      return "border border-slate-200 bg-slate-100 text-slate-800";
    default:
      return "border border-slate-200 bg-slate-50 text-slate-600";
  }
}

function executiveNextStep(go: string): string {
  switch (go) {
    case "no_go":
      return "Corregir faltantes críticos antes de generar un nuevo snapshot.";
    case "pending_inputs":
      return "Completar configuración mínima y volver a simular antes de solicitar instalación.";
    case "ready_for_manual_install":
      return "Solicitar aprobación humana final antes de cualquier ejecución.";
    default:
      return "Revisar el contrato técnico y coordinar el siguiente paso con el equipo responsable.";
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

function yn(v: boolean): string {
  return v ? "sí" : "no";
}

/** Texto plano para minuta interna / WhatsApp / mail (no persiste ni ejecuta acciones). */
function buildPickup4x4MeetingDocumentPlainText(p: {
  meta: DraftMetadata;
  humanConfirmationStatus: string;
  latestSnapshot: SimulationSnapshotRow;
  packagePayload: Record<string, unknown>;
}): string {
  const { meta, humanConfirmationStatus, latestSnapshot, packagePayload: pp } = p;
  const goRaw = (latestSnapshot.finalGoNoGo ?? "").trim();
  const goLabel = goRaw ? goRaw.replace(/_/g, " ") : "—";
  const score =
    latestSnapshot.readinessScore != null && !Number.isNaN(Number(latestSnapshot.readinessScore))
      ? `${String(latestSnapshot.readinessScore)}/100`
      : "—/100";
  const risk = latestSnapshot.riskLevel?.trim() || "—";
  const snapShort = shortSnapshotId(latestSnapshot.id);
  const snapDate = formatDt(latestSnapshot.createdAt);
  const execTextOk =
    typeof latestSnapshot.executiveSummaryText === "string" &&
    latestSnapshot.executiveSummaryText.trim().length > 0;
  const resumenGuardado = execTextOk || latestSnapshot.hasExecutiveSummary;

  const sec = (snake: string, camel: string) =>
    yn(!isManualInstallPayloadSectionEmpty(payloadCfg(pp, snake, camel)));

  const lines: string[] = [];
  lines.push("1. TÍTULO");
  lines.push("SUMMER87 — DOCUMENTO INTERNO DE REUNIÓN");
  lines.push("Pickup 4x4 · Preparación de instalación manual controlada");
  lines.push("");
  lines.push("2. ESTADO ACTUAL");
  lines.push(`- Draft ID: ${meta.id}`);
  lines.push(`- Estado draft: ${meta.status}`);
  lines.push(`- Estado humano: ${humanConfirmationStatus}`);
  lines.push(`- Score: ${score}`);
  lines.push(`- Go / No-Go: ${goLabel}`);
  lines.push(`- Riesgo: ${risk}`);
  lines.push(`- Snapshot base: ${latestSnapshot.id} (${snapShort})`);
  lines.push(`- Fecha del snapshot: ${snapDate}`);
  lines.push(`- Resumen ejecutivo guardado: ${yn(resumenGuardado)}`);
  lines.push("");
  lines.push("3. QUÉ YA ESTÁ LISTO");
  lines.push(`- Draft aprobado: sí`);
  lines.push(`- Package payload poblado: ${yn(isPackagePayloadPopulated(pp))}`);
  lines.push(`- Módulos CRM definidos: ${sec("crm_modules_config", "crmModulesConfig")}`);
  lines.push(`- Pipeline definido: ${sec("pipeline_config", "pipelineConfig")}`);
  lines.push(`- Campos de leads definidos: ${sec("lead_fields_config", "leadFieldsConfig")}`);
  lines.push(`- Permisos definidos: ${sec("permissions_config", "permissionsConfig")}`);
  lines.push(`- Integración Kore definida como read-only: ${yn(isKoreReadOnlyIntegration(pp))}`);
  lines.push(`- Snapshot técnico guardado: sí`);
  lines.push(`- Resumen ejecutivo guardado: ${yn(resumenGuardado)}`);
  lines.push("");
  lines.push("4. QUÉ FALTA DEFINIR CON PICKUP 4X4");
  lines.push("- Responsable operativo");
  lines.push("- Usuarios reales del piloto");
  lines.push("- Permisos por usuario");
  lines.push("- Alcance exacto del piloto");
  lines.push("- Datos iniciales a usar/sincronizar desde Kore");
  lines.push("- Criterio de éxito del piloto");
  lines.push("- Confirmación humana final");
  lines.push("");
  lines.push("5. QUÉ FALTA DEFINIR CON KORE / ÁREA TÉCNICA");
  lines.push("- Credenciales o acceso técnico");
  lines.push("- Endpoints disponibles");
  lines.push("- Campos disponibles");
  lines.push("- Frecuencia de sincronización");
  lines.push("- Límites de API");
  lines.push("- Confirmación de modo solo lectura");
  lines.push("- Ambientes disponibles: sandbox / producción / demo");
  lines.push("");
  lines.push("6. BLOQUEOS NO NEGOCIABLES");
  lines.push("- No crear tenant sin aprobación final");
  lines.push("- No crear usuarios sin lista validada");
  lines.push("- No enviar invitaciones");
  lines.push("- No escribir en Kore");
  lines.push("- No escribir en Zeta");
  lines.push("- No publicar producción");
  lines.push("- No instalar automáticamente");
  lines.push("");
  lines.push("7. RECOMENDACIÓN SUMMER87");
  lines.push(
    "El paquete Pickup 4x4 está técnicamente preparado para revisión manual final. La recomendación es avanzar a una reunión breve de validación operativa y técnica antes de instalar. La instalación no debe ejecutarse hasta confirmar usuarios, permisos, acceso Kore, alcance del piloto y responsable operativo."
  );
  lines.push("");
  lines.push("8. DECISIÓN SUGERIDA");
  lines.push("- Avanzar a preparación manual controlada");
  lines.push("- No ejecutar instalación todavía");
  lines.push("- Documentar aprobación final fuera del sistema");
  lines.push("");
  lines.push("9. PRÓXIMOS PASOS PROPUESTOS");
  lines.push("- Confirmar responsable operativo Pickup 4x4");
  lines.push("- Confirmar usuarios piloto");
  lines.push("- Confirmar permisos");
  lines.push("- Confirmar acceso Kore read-only");
  lines.push("- Definir alcance piloto");
  lines.push("- Definir fecha tentativa de instalación manual");
  lines.push("- Registrar decisión final cuando la funcionalidad exista");
  lines.push("");
  lines.push("10. NOTA DE SEGURIDAD");
  lines.push(
    "Este documento proviene de una revisión interna del Constructor CRM. No ejecuta acciones, no crea recursos, no instala CRM y no escribe en Kore ni en Zeta."
  );
  return lines.join("\n");
}

/** Texto plano para “Resumen ejecutivo final del caso” (solo lectura; no persiste). */
function buildFinalCaseExecutiveSummaryPlainText(params: {
  hasAdvanceMeetingDecision: boolean;
  latestAdvanceMeetingDecision: MeetingDecisionListItem | null;
}): string {
  const { hasAdvanceMeetingDecision, latestAdvanceMeetingDecision } = params;
  const lines: string[] = [];
  lines.push("Resumen ejecutivo final del caso");
  lines.push("");
  lines.push("Estado del caso");
  if (hasAdvanceMeetingDecision && latestAdvanceMeetingDecision) {
    lines.push("- Caso preparado");
    lines.push("- Ready manual");
    lines.push("- Ejecución bloqueada");
    lines.push("- Primera etapa restringida");
    lines.push(
      `- Decisión reunión (avance manual): ${latestAdvanceMeetingDecision.decisionLabel} · ${formatDt(latestAdvanceMeetingDecision.createdAt)}`
    );
  } else {
    lines.push("- Ready manual");
    lines.push("- Ejecución bloqueada");
    lines.push("- Primera etapa restringida");
    lines.push(`- ${PICKUP_FINAL_CASE_MEETING_PENDING_NOTE}`);
  }
  lines.push("");
  lines.push("Síntesis");
  if (!hasAdvanceMeetingDecision) {
    lines.push(PICKUP_FINAL_CASE_MEETING_PENDING_NOTE);
    lines.push("");
  }
  lines.push(PICKUP_FINAL_CASE_SYNTHESIS_PARAGRAPH);
  lines.push("");
  lines.push("Qué se preparó");
  for (const item of PICKUP_FINAL_CASE_PREPARED_BULLETS) {
    if (item === "Decisión de avance manual" && !hasAdvanceMeetingDecision) {
      lines.push(`- ${item} (pendiente de registrar en reunión)`);
    } else {
      lines.push(`- ${item}`);
    }
  }
  lines.push("");
  lines.push("Qué está listo");
  lines.push(
    hasAdvanceMeetingDecision
      ? "Paquete CRM documentado, evidencia con ready_for_manual_install y decisión de reunión de avance manual registrada."
      : "Paquete CRM documentado y evidencia con ready_for_manual_install; falta registrar la decisión de reunión de avance manual para cerrar el cierre formal."
  );
  lines.push("");
  lines.push("Qué queda bloqueado");
  for (const item of PICKUP_FINAL_CASE_BLOCKED_BULLETS) {
    lines.push(`- ${item}`);
  }
  lines.push("");
  lines.push("Próximo paso recomendado");
  lines.push(PICKUP_FINAL_CASE_NEXT_STEP_PARAGRAPH);
  lines.push("");
  lines.push("Nota de seguridad");
  lines.push(PICKUP_FINAL_CASE_SECURITY_NOTE);
  return lines.join("\n");
}

/** Texto plano para “Cierre documental del piloto” (solo lectura; no persiste). */
function buildPilotDocumentalClosurePlainText(params: {
  hasAdvanceMeetingDecision: boolean;
  latestAdvanceMeetingDecision: MeetingDecisionListItem | null;
}): string {
  const { hasAdvanceMeetingDecision, latestAdvanceMeetingDecision } = params;
  const lines: string[] = [];
  lines.push("Cierre documental del piloto");
  lines.push("");
  lines.push("Estado de cierre");
  lines.push("- Cierre documental");
  lines.push("- Piloto preparado");
  lines.push("- Ejecución bloqueada");
  lines.push("- Pendiente de fase real");
  if (hasAdvanceMeetingDecision && latestAdvanceMeetingDecision) {
    lines.push("- Decisión registrada");
    lines.push(
      `  (${latestAdvanceMeetingDecision.decisionLabel} · ${formatDt(latestAdvanceMeetingDecision.createdAt)})`
    );
  } else {
    lines.push("- Decisión pendiente");
    lines.push(`  (${PILOT_DOC_CLOSURE_PARTIAL_NOTE})`);
  }
  lines.push("");
  lines.push("Síntesis");
  if (!hasAdvanceMeetingDecision) {
    lines.push(PILOT_DOC_CLOSURE_PARTIAL_NOTE);
    lines.push("");
  }
  lines.push(PILOT_DOC_CLOSURE_SYNTHESIS_PARAGRAPH);
  lines.push("");
  lines.push("Qué quedó preparado");
  for (const item of PILOT_DOC_CLOSURE_PREPARED_BULLETS) {
    if (item === "Decisión de reunión, si existe") {
      lines.push(
        hasAdvanceMeetingDecision && latestAdvanceMeetingDecision
          ? `- Decisión de reunión registrada: ${latestAdvanceMeetingDecision.decisionLabel}`
          : "- Decisión de reunión: pendiente de registrar"
      );
    } else {
      lines.push(`- ${item}`);
    }
  }
  lines.push("");
  lines.push("Pendientes antes de fase real");
  for (const item of PILOT_DOC_CLOSURE_PENDING_BULLETS) {
    lines.push(`- ${item}`);
  }
  lines.push("");
  lines.push("Bloqueos vigentes");
  for (const item of PILOT_DOC_CLOSURE_BLOCKED_BULLETS) {
    lines.push(`- ${item}`);
  }
  lines.push("");
  lines.push("Próximo paso recomendado");
  lines.push(PILOT_DOC_CLOSURE_NEXT_STEP_PARAGRAPH);
  lines.push("");
  lines.push("Estado recomendado del caso");
  lines.push(PILOT_DOC_CLOSURE_RECOMMENDED_STATE_LINE);
  lines.push("");
  lines.push("Nota de seguridad");
  lines.push(PILOT_DOC_CLOSURE_SECURITY_NOTE);
  return lines.join("\n");
}

function crmSummaryPlainLine(crm: Record<string, unknown>): string {
  const pairs: [string, string][] = [
    ["Módulos", "modulesStatus"],
    ["Pipeline", "pipelineStatus"],
    ["Campos de leads", "leadFieldsStatus"],
    ["Permisos", "permissionsStatus"],
    ["Reportes", "reportsStatus"],
    ["Integraciones", "integrationsStatus"],
  ];
  const parts: string[] = [];
  for (const [label, k] of pairs) {
    const v = strFromUnknown(crm[k]);
    if (v) parts.push(`${label}: ${v}`);
  }
  return parts.length ? parts.join("; ") : "No informado";
}

function userProvisioningSummaryPlain(tc: Record<string, unknown>): string {
  const upp = tc.userProvisioningPlanPreview;
  if (!upp || typeof upp !== "object" || Array.isArray(upp)) return "No informado.";
  const u = upp as Record<string, unknown>;
  const status = strFromUnknown(u.status);
  const notes = Array.isArray(u.notes)
    ? (u.notes as unknown[]).map((x) => String(x)).filter(Boolean).join(" ")
    : "";
  const detected = u.initialUsersDetected ?? u.initial_users_detected;
  const bits: string[] = [];
  if (status) bits.push(`Estado: ${status}`);
  if (notes) bits.push(`Notas: ${notes}`);
  if (detected !== undefined && detected !== null) bits.push(`Usuarios detectados: ${String(detected)}`);
  return bits.length ? bits.join(" · ") : "No informado.";
}

type ExecutiveSummaryInput = {
  draftId: string;
  meta: DraftMetadata | undefined;
  humanConfirmationStatus: string;
  simulateResult: SimulatePreinstallResponse;
  contract: Record<string, unknown>;
};

function buildExecutiveSummaryPlainText(p: ExecutiveSummaryInput): string {
  const { draftId, meta, humanConfirmationStatus, simulateResult, contract: tc } = p;
  const rd = tc.readiness as Record<string, unknown> | undefined;
  const finalGo = contractFinalGoNoGo(rd);
  const execScore = readinessScoreFromContract(rd);
  const execRisk =
    readinessRiskFromContract(rd) || String(simulateResult.riskLevel ?? "").trim() || "No informado";
  const simDateRaw = strFromUnknown(tc.generatedAt);
  const simDate = simDateRaw || null;
  const tr = tc.tenantResolution as Record<string, unknown> | undefined;
  const zp = tc.zetaPolicy as Record<string, unknown> | undefined;
  const crm =
    tc.crmConfiguration && typeof tc.crmConfiguration === "object" && !Array.isArray(tc.crmConfiguration)
      ? (tc.crmConfiguration as Record<string, unknown>)
      : {};
  const bpaContract = Array.isArray(tc.blockedProductionActions)
    ? (tc.blockedProductionActions as string[])
    : [];
  const blockedList =
    bpaContract.length > 0 ? bpaContract : [...simulateResult.blockedActions];
  const approvals = Array.isArray(tc.requiredHumanApprovals)
    ? (tc.requiredHumanApprovals as Array<Record<string, unknown>>)
    : [];

  const lines: string[] = [];
  lines.push("SUMMER87 — RESUMEN EJECUTIVO DE PREINSTALACIÓN");
  lines.push("");
  lines.push("Draft:");
  lines.push(`- Package ID: ${strFromUnknown(simulateResult.packageId) || draftId || "No informado"}`);
  lines.push(`- Estado draft: ${meta?.status ?? "No informado"}`);
  lines.push(`- Estado humano: ${humanConfirmationStatus || "No informado"}`);
  lines.push(`- Package version: ${meta?.packageVersion ?? "No informado"}`);
  lines.push(`- Fecha de simulación: ${formatDt(simDate)}`);
  lines.push("");
  lines.push("Dictamen:");
  lines.push(`- Go / No-Go: ${finalGo || "No informado"}`);
  lines.push(
    `- Score de preparación: ${execScore !== null ? `${execScore}/100` : "No informado"}`
  );
  lines.push(`- Riesgo: ${execRisk || "No informado"}`);
  lines.push(`- Dictamen ejecutivo: ${executiveDictamenText(finalGo)}`);
  lines.push("");
  lines.push("Lectura operativa:");
  lines.push(`- Tenant / cliente: ${tenantExecutiveCopy(strFromUnknown(tr?.status))}`);
  lines.push(`- Configuración CRM: ${crmSummaryPlainLine(crm)}`);
  lines.push(`- Usuarios iniciales: ${userProvisioningSummaryPlain(tc)}`);
  const zpMode = strFromUnknown(zp?.mode);
  lines.push(
    `- Zeta: read_only / no escritura${zpMode ? ` (modo contrato: ${zpMode})` : ""}`
  );
  lines.push(
    `- Puede avanzar a preparación piloto: ${simulateResult.canProceedToPilotPreparation ? "Sí" : "No"}`
  );
  lines.push("");
  lines.push("Faltantes principales:");
  if (simulateResult.missingInputs.length === 0) {
    lines.push("- No informado");
  } else {
    for (const item of simulateResult.missingInputs) {
      lines.push(`- ${item}`);
    }
  }
  lines.push("");
  lines.push("Aprobaciones requeridas:");
  if (approvals.length === 0) {
    lines.push("- No informado");
  } else {
    for (const a of approvals) {
      const lab = strFromUnknown(a.label ?? a.Label) || "—";
      const req = a.required ?? a.Required;
      const reqTxt = req === true ? "sí" : req === false ? "no" : "—";
      const reason = strFromUnknown(a.reason ?? a.Reason) || "—";
      lines.push(`- ${lab} (requerida: ${reqTxt}) — ${reason}`);
    }
  }
  lines.push("");
  lines.push("Acciones bloqueadas:");
  if (blockedList.length === 0) {
    lines.push("- No informado");
  } else {
    for (const code of blockedList) {
      lines.push(`- ${code}`);
    }
  }
  lines.push("");
  lines.push("Recomendación:");
  const rec = simulateResult.nextRecommendedAction?.trim();
  lines.push(`- ${rec && rec.length > 0 ? rec : executiveNextStep(finalGo)}`);
  lines.push("");
  lines.push("Nota de seguridad:");
  lines.push(
    "Este resumen proviene de una simulación. No instala CRM, no crea tenant, no crea usuarios y no escribe en Zeta."
  );
  return lines.join("\n");
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

type CollapsibleSectionProps = {
  id: string;
  title: string;
  subtitle: string;
  badges?: string[];
  defaultOpen?: boolean;
  children: ReactNode;
};

function CollapsibleSection({
  id,
  title,
  subtitle,
  badges,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const headingId = `${id}-heading`;
  const panelId = `${id}-panel`;
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4" aria-labelledby={headingId}>
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <h2 id={headingId} className="text-sm font-semibold text-slate-900">
            {title}
          </h2>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{subtitle}</p>
          {badges && badges.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Resumen de estado">
              {badges.map((b) => (
                <li
                  key={`${id}-badge-${b}`}
                  className="inline-flex rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700"
                >
                  {b}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <button
          type="button"
          className="shrink-0 rounded-lg border border-slate-400 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-50"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Ocultar" : "Ver detalle"}
        </button>
      </header>
      <div
        id={panelId}
        role="region"
        aria-labelledby={headingId}
        className={open ? "mt-4" : "hidden"}
      >
        {children}
      </div>
    </section>
  );
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
  const [executiveSummaryCopied, setExecutiveSummaryCopied] = useState(false);
  const [snapshotSaving, setSnapshotSaving] = useState(false);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [snapshotSuccess, setSnapshotSuccess] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<SimulationSnapshotRow[]>([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(false);
  const [snapshotsError, setSnapshotsError] = useState<string | null>(null);
  const [snapshotSummaryCopiedId, setSnapshotSummaryCopiedId] = useState<string | null>(null);
  const [consolidatedSummaryCopied, setConsolidatedSummaryCopied] = useState(false);
  const [finalCaseExecutiveCopied, setFinalCaseExecutiveCopied] = useState(false);
  const [pilotDocumentalClosureCopied, setPilotDocumentalClosureCopied] = useState(false);
  const [preManualReviewSummaryCopied, setPreManualReviewSummaryCopied] = useState(false);
  const [meetingDocumentCopied, setMeetingDocumentCopied] = useState(false);
  const [meetingChecklistCopied, setMeetingChecklistCopied] = useState(false);
  const [meetingMinutaCopied, setMeetingMinutaCopied] = useState(false);
  const [pickupCommercialMessageCopied, setPickupCommercialMessageCopied] = useState(false);
  const [pilotEnvPlanCopied, setPilotEnvPlanCopied] = useState(false);
  const [futureExecutablePlanCopied, setFutureExecutablePlanCopied] = useState(false);
  const [technicalPilotDesignCopied, setTechnicalPilotDesignCopied] = useState(false);
  const [realConfigBlueprintCopied, setRealConfigBlueprintCopied] = useState(false);
  const [futureMigrationSpecCopied, setFutureMigrationSpecCopied] = useState(false);
  const [preSqlReadinessAuditCopied, setPreSqlReadinessAuditCopied] = useState(false);
  const [meetingDecisions, setMeetingDecisions] = useState<MeetingDecisionListItem[]>([]);
  const [meetingDecisionsLoading, setMeetingDecisionsLoading] = useState(false);
  const [meetingDecisionsError, setMeetingDecisionsError] = useState<string | null>(null);
  const [meetingDecisionsTableMissing, setMeetingDecisionsTableMissing] = useState(false);
  const [meetingDecisionSubmitting, setMeetingDecisionSubmitting] = useState(false);
  const [meetingDecisionFormError, setMeetingDecisionFormError] = useState<string | null>(null);
  const [meetingDecisionSuccess, setMeetingDecisionSuccess] = useState<string | null>(null);
  const [selectedMeetingDecision, setSelectedMeetingDecision] = useState<MeetingFinalDecisionValue | null>(null);
  const [meetingDecisionReason, setMeetingDecisionReason] = useState("");
  const [meetingDecisionNotes, setMeetingDecisionNotes] = useState("");
  const [meetingDecisionPendientes, setMeetingDecisionPendientes] = useState("");

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/constructor/installable-package/drafts/${encodeURIComponent(id)}`,
        { cache: "no-store", headers: { "Cache-Control": "no-store" } }
      );
      const json = (await res.json()) as DraftDetailResponse;
      if (!res.ok || !json.ok || !json.draft) {
        const code = json.code;
        let msg = json.message ?? json.code ?? "No se pudo cargar el borrador";
        if (res.status === 400 && code === "INVALID_DRAFT_ID") {
          msg = "El identificador del borrador no es un UUID válido.";
        } else if (res.status === 404 && code === "DRAFT_NOT_FOUND") {
          msg = "No se encontró el borrador.";
        } else if (res.status === 500 && code === "TABLE_NOT_AVAILABLE") {
          msg = "La tabla de borradores no está disponible en este entorno.";
        }
        throw new Error(msg);
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
    setExecutiveSummaryCopied(false);
    setSnapshotError(null);
    setSnapshotSuccess(null);
    setSnapshots([]);
    setSnapshotsError(null);
    setSnapshotsLoading(false);
    setSnapshotSummaryCopiedId(null);
    setConsolidatedSummaryCopied(false);
    setFinalCaseExecutiveCopied(false);
    setPilotDocumentalClosureCopied(false);
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
        const ex = parseSnapshotExecutiveFields(r);
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
          hasExecutiveSummary: ex.hasExecutiveSummary,
          executiveSummaryPreview: ex.executiveSummaryPreview,
          executiveSummaryText: ex.executiveSummaryText,
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

  const copySnapshotSavedSummary = useCallback(async (snapshotId: string, text: string) => {
    if (!text || !navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(text);
      setSnapshotSummaryCopiedId(snapshotId);
      window.setTimeout(() => {
        setSnapshotSummaryCopiedId((cur) => (cur === snapshotId ? null : cur));
      }, 2200);
    } catch {
      /* clipboard no disponible */
    }
  }, []);

  const copyConsolidatedExecutiveSummary = useCallback(async (text: string) => {
    if (!text || !navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(text);
      setConsolidatedSummaryCopied(true);
      window.setTimeout(() => setConsolidatedSummaryCopied(false), 2200);
    } catch {
      /* clipboard no disponible */
    }
  }, []);

  const copyPreManualMeetingSummary = useCallback(async (text: string) => {
    const t = typeof text === "string" ? text.trim() : "";
    if (!t || !navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(t);
      setPreManualReviewSummaryCopied(true);
      window.setTimeout(() => setPreManualReviewSummaryCopied(false), 2200);
    } catch {
      /* clipboard no disponible */
    }
  }, []);

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
    setExecutiveSummaryCopied(false);
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
      const payload: Record<string, unknown> = {
        ...(simulateResult as unknown as Record<string, unknown>),
        technicalPreinstallContract: contract,
        packageId: simulateResult.packageId || id,
      };
      try {
        const executiveSummaryText = buildExecutiveSummaryPlainText({
          draftId: id,
          meta: meta ?? undefined,
          humanConfirmationStatus: data?.humanConfirmationStatus ?? "",
          simulateResult,
          contract,
        });
        if (typeof executiveSummaryText === "string" && executiveSummaryText.trim().length > 0) {
          payload.executiveSummaryText = executiveSummaryText.trim();
        }
      } catch {
        /* Sin resumen ejecutivo: el snapshot se guarda igual. */
      }
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
  const showExecutivePreManualReview =
    showPostApprovalPilotPrep &&
    latestSnapshot !== null &&
    latestSnapshot.finalGoNoGo === "ready_for_manual_install";

  const latestAdvanceMeetingDecision = useMemo(() => {
    const candidates = meetingDecisions.filter((d) => d.decision === "advance_manual_preparation");
    if (candidates.length === 0) return null;
    return candidates.reduce((a, b) => (a.createdAt >= b.createdAt ? a : b));
  }, [meetingDecisions]);

  const showManualControlledPrepSection =
    showExecutivePreManualReview &&
    latestSnapshot !== null &&
    latestSnapshot.finalGoNoGo === "ready_for_manual_install" &&
    latestAdvanceMeetingDecision !== null;

  const copyPickup4x4MeetingDocument = useCallback(async () => {
    if (!meta || !latestSnapshot || !data || !navigator.clipboard?.writeText) return;
    const text = buildPickup4x4MeetingDocumentPlainText({
      meta,
      humanConfirmationStatus: data.humanConfirmationStatus,
      latestSnapshot,
      packagePayload,
    });
    try {
      await navigator.clipboard.writeText(text);
      setMeetingDocumentCopied(true);
      window.setTimeout(() => setMeetingDocumentCopied(false), 2200);
    } catch {
      /* clipboard no disponible */
    }
  }, [meta, latestSnapshot, data, packagePayload]);

  const copyPickup4x4MeetingChecklist = useCallback(async () => {
    if (!meta || !latestSnapshot || !navigator.clipboard?.writeText) return;
    const text = buildPickup4x4MeetingChecklistPlainText({ meta, latestSnapshot });
    try {
      await navigator.clipboard.writeText(text);
      setMeetingChecklistCopied(true);
      window.setTimeout(() => setMeetingChecklistCopied(false), 2200);
    } catch {
      /* clipboard no disponible */
    }
  }, [meta, latestSnapshot]);

  const copyPickup4x4MeetingMinuta = useCallback(async () => {
    if (!meta || !latestSnapshot || !navigator.clipboard?.writeText) return;
    const text = buildPickup4x4MeetingMinutaPlainText({ meta, latestSnapshot });
    try {
      await navigator.clipboard.writeText(text);
      setMeetingMinutaCopied(true);
      window.setTimeout(() => setMeetingMinutaCopied(false), 2200);
    } catch {
      /* clipboard no disponible */
    }
  }, [meta, latestSnapshot]);

  const copyPickup4x4CommercialMessage = useCallback(async () => {
    if (!navigator.clipboard?.writeText) return;
    const text = buildPickup4x4ExternalCommercialMessagePlainText();
    try {
      await navigator.clipboard.writeText(text);
      setPickupCommercialMessageCopied(true);
      window.setTimeout(() => setPickupCommercialMessageCopied(false), 2200);
    } catch {
      /* clipboard no disponible */
    }
  }, []);

  const copyFinalCaseExecutiveSummary = useCallback(async () => {
    if (!navigator.clipboard?.writeText) return;
    const text = buildFinalCaseExecutiveSummaryPlainText({
      hasAdvanceMeetingDecision: latestAdvanceMeetingDecision !== null,
      latestAdvanceMeetingDecision,
    });
    try {
      await navigator.clipboard.writeText(text);
      setFinalCaseExecutiveCopied(true);
      window.setTimeout(() => setFinalCaseExecutiveCopied(false), 2200);
    } catch {
      /* clipboard no disponible */
    }
  }, [latestAdvanceMeetingDecision]);

  const copyPilotDocumentalClosure = useCallback(async () => {
    if (!navigator.clipboard?.writeText) return;
    const text = buildPilotDocumentalClosurePlainText({
      hasAdvanceMeetingDecision: latestAdvanceMeetingDecision !== null,
      latestAdvanceMeetingDecision,
    });
    try {
      await navigator.clipboard.writeText(text);
      setPilotDocumentalClosureCopied(true);
      window.setTimeout(() => setPilotDocumentalClosureCopied(false), 2200);
    } catch {
      /* clipboard no disponible */
    }
  }, [latestAdvanceMeetingDecision]);

  const copyPilotEnvCreationPlan = useCallback(async () => {
    if (!meta || !latestSnapshot || !data || !latestAdvanceMeetingDecision || !navigator.clipboard?.writeText) return;
    const text = buildPilotEnvCreationPlanPlainText({
      meta,
      humanConfirmationStatus: data.humanConfirmationStatus,
      latestSnapshot,
      latestAdvanceMeetingDecision,
      packagePayload,
    });
    try {
      await navigator.clipboard.writeText(text);
      setPilotEnvPlanCopied(true);
      window.setTimeout(() => setPilotEnvPlanCopied(false), 2200);
    } catch {
      /* clipboard no disponible */
    }
  }, [meta, latestSnapshot, data, latestAdvanceMeetingDecision, packagePayload]);

  const copyFutureExecutablePlan = useCallback(async () => {
    if (!meta || !latestSnapshot || !data || !latestAdvanceMeetingDecision || !navigator.clipboard?.writeText) return;
    const text = buildFutureExecutablePlanPlainText({
      meta,
      humanConfirmationStatus: data.humanConfirmationStatus,
      latestSnapshot,
      latestAdvanceMeetingDecision,
      packagePayload,
    });
    try {
      await navigator.clipboard.writeText(text);
      setFutureExecutablePlanCopied(true);
      window.setTimeout(() => setFutureExecutablePlanCopied(false), 2200);
    } catch {
      /* clipboard no disponible */
    }
  }, [meta, latestSnapshot, data, latestAdvanceMeetingDecision, packagePayload]);

  const copyTechnicalPilotEnvironmentDesign = useCallback(async () => {
    if (!meta || !latestSnapshot || !data || !latestAdvanceMeetingDecision || !navigator.clipboard?.writeText) return;
    const text = buildTechnicalPilotEnvironmentDesignPlainText({
      meta,
      humanConfirmationStatus: data.humanConfirmationStatus,
      latestSnapshot,
      latestAdvanceMeetingDecision,
      packagePayload,
    });
    try {
      await navigator.clipboard.writeText(text);
      setTechnicalPilotDesignCopied(true);
      window.setTimeout(() => setTechnicalPilotDesignCopied(false), 2200);
    } catch {
      /* clipboard no disponible */
    }
  }, [meta, latestSnapshot, data, latestAdvanceMeetingDecision, packagePayload]);

  const copyRealConfigBlueprint = useCallback(async () => {
    if (!meta || !latestSnapshot || !data || !latestAdvanceMeetingDecision || !navigator.clipboard?.writeText) return;
    const text = buildRealConfigBlueprintPlainText({
      meta,
      humanConfirmationStatus: data.humanConfirmationStatus,
      latestSnapshot,
      latestAdvanceMeetingDecision,
      packagePayload,
    });
    try {
      await navigator.clipboard.writeText(text);
      setRealConfigBlueprintCopied(true);
      window.setTimeout(() => setRealConfigBlueprintCopied(false), 2200);
    } catch {
      /* clipboard no disponible */
    }
  }, [meta, latestSnapshot, data, latestAdvanceMeetingDecision, packagePayload]);

  const copyFutureMigrationSpec = useCallback(async () => {
    if (!meta || !latestSnapshot || !data || !latestAdvanceMeetingDecision || !navigator.clipboard?.writeText) return;
    const text = buildFutureMigrationSpecPlainText({
      meta,
      humanConfirmationStatus: data.humanConfirmationStatus,
      latestSnapshot,
      latestAdvanceMeetingDecision,
      packagePayload,
    });
    try {
      await navigator.clipboard.writeText(text);
      setFutureMigrationSpecCopied(true);
      window.setTimeout(() => setFutureMigrationSpecCopied(false), 2200);
    } catch {
      /* clipboard no disponible */
    }
  }, [meta, latestSnapshot, data, latestAdvanceMeetingDecision, packagePayload]);

  const copyPreSqlReadinessAudit = useCallback(async () => {
    if (!meta || !latestSnapshot || !data || !latestAdvanceMeetingDecision || !navigator.clipboard?.writeText) return;
    const text = buildPreSqlReadinessAuditPlainText({
      meta,
      latestSnapshot,
      latestAdvanceMeetingDecision,
      packagePayload,
    });
    try {
      await navigator.clipboard.writeText(text);
      setPreSqlReadinessAuditCopied(true);
      window.setTimeout(() => setPreSqlReadinessAuditCopied(false), 2200);
    } catch {
      /* clipboard no disponible */
    }
  }, [meta, latestSnapshot, data, latestAdvanceMeetingDecision, packagePayload]);

  const loadMeetingDecisions = useCallback(async () => {
    if (!id) return;
    setMeetingDecisionsLoading(true);
    setMeetingDecisionsError(null);
    setMeetingDecisionsTableMissing(false);
    try {
      const res = await fetch(
        `/api/admin/constructor/installable-package/drafts/${encodeURIComponent(id)}/meeting-decisions`,
        { cache: "no-store", headers: { "Cache-Control": "no-store" } }
      );
      const json = (await res.json()) as {
        ok?: boolean;
        code?: string;
        message?: string;
        decisions?: MeetingDecisionListItem[];
      };
      if (res.status === 503 && json.code === "MEETING_DECISION_TABLE_NOT_FOUND") {
        setMeetingDecisionsTableMissing(true);
        setMeetingDecisions([]);
        return;
      }
      if (!res.ok || json.ok !== true) {
        throw new Error(
          [json.code, json.message].filter(Boolean).join(" — ") || "No se pudo cargar el historial de decisiones."
        );
      }
      setMeetingDecisions(Array.isArray(json.decisions) ? json.decisions : []);
    } catch (e: unknown) {
      setMeetingDecisionsError(e instanceof Error ? e.message : "Error");
      setMeetingDecisions([]);
    } finally {
      setMeetingDecisionsLoading(false);
    }
  }, [id]);

  const submitMeetingDecision = useCallback(async () => {
    if (!id || !selectedMeetingDecision || meetingDecisionSubmitting) return;
    setMeetingDecisionSubmitting(true);
    setMeetingDecisionFormError(null);
    setMeetingDecisionSuccess(null);
    try {
      const pendingItems = meetingDecisionPendientes
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const res = await fetch(
        `/api/admin/constructor/installable-package/drafts/${encodeURIComponent(id)}/meeting-decisions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
          body: JSON.stringify({
            decision: selectedMeetingDecision,
            decisionReason: meetingDecisionReason.trim() || undefined,
            meetingNotes: meetingDecisionNotes.trim() || undefined,
            pendingItems,
          }),
        }
      );
      const json = (await res.json()) as { ok?: boolean; code?: string; message?: string };
      if (!res.ok || json.ok !== true) {
        throw new Error(
          [json.code, json.message].filter(Boolean).join(" — ") || "No se pudo registrar la decisión."
        );
      }
      setMeetingDecisionSuccess("Decisión registrada");
      setSelectedMeetingDecision(null);
      setMeetingDecisionReason("");
      setMeetingDecisionNotes("");
      setMeetingDecisionPendientes("");
      await loadMeetingDecisions();
      window.setTimeout(() => {
        setMeetingDecisionSuccess(null);
      }, 4500);
    } catch (e: unknown) {
      setMeetingDecisionFormError(e instanceof Error ? e.message : "Error");
    } finally {
      setMeetingDecisionSubmitting(false);
    }
  }, [
    id,
    selectedMeetingDecision,
    meetingDecisionReason,
    meetingDecisionNotes,
    meetingDecisionPendientes,
    loadMeetingDecisions,
  ]);

  useEffect(() => {
    if (!id || !showExecutivePreManualReview) return;
    void loadMeetingDecisions();
  }, [id, showExecutivePreManualReview, loadMeetingDecisions]);

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
                  Revisá warnings y acciones bloqueadas antes de decidir. Tras aprobar, un piloto real solo
                  podría gestionarse en otra fase explícita, con permisos y registros aparte; esta pantalla no
                  ejecuta instalación. Si dudás, no apruebes: coordiná con quien opera el Constructor.
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
                          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                            <p className="text-xs text-slate-500">
                              Solo lectura. No ejecuta instalación ni escribe en sistemas externos.
                            </p>
                            <div className="flex flex-col items-stretch gap-2 sm:items-end">
                              <div className="flex flex-wrap gap-2">
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
                                <button
                                  type="button"
                                  onClick={() => {
                                    void (async () => {
                                      if (
                                        !simulationContract ||
                                        !simulateResult ||
                                        !navigator.clipboard?.writeText
                                      )
                                        return;
                                      const text = buildExecutiveSummaryPlainText({
                                        draftId: id,
                                        meta: meta ?? undefined,
                                        humanConfirmationStatus: data?.humanConfirmationStatus ?? "",
                                        simulateResult,
                                        contract: simulationContract,
                                      });
                                      await navigator.clipboard.writeText(text);
                                      setExecutiveSummaryCopied(true);
                                      window.setTimeout(() => setExecutiveSummaryCopied(false), 2500);
                                    })();
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                >
                                  {executiveSummaryCopied ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5 opacity-70" aria-hidden />
                                  )}
                                  Copiar resumen ejecutivo
                                </button>
                              </div>
                              {executiveSummaryCopied ? (
                                <p className="text-[11px] font-medium text-slate-700" role="status">
                                  Resumen copiado
                                </p>
                              ) : (
                                <p className="max-w-sm text-[11px] text-slate-500">
                                  Texto plano para compartir internamente. No ejecuta acciones.
                                </p>
                              )}
                            </div>
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
                            const crmRaw = tc.crmConfiguration;
                            const crm =
                              crmRaw && typeof crmRaw === "object" && !Array.isArray(crmRaw)
                                ? (crmRaw as Record<string, unknown>)
                                : {};
                            const humanApprovals = Array.isArray(tc.requiredHumanApprovals)
                              ? (tc.requiredHumanApprovals as Array<Record<string, unknown>>)
                              : [];
                            const finalGoExec = contractFinalGoNoGo(rd);
                            const execScore = readinessScoreFromContract(rd);
                            const execRisk =
                              readinessRiskFromContract(rd) ||
                              String(simulateResult?.riskLevel ?? "").trim();
                            const traffic = executiveTrafficLightClasses(finalGoExec);
                            const crmPick = (camel: string, snake: string) =>
                              String(crm[camel] ?? crm[snake] ?? "").trim() || "—";
                            const crmRows: { camel: string; snake: string; label: string }[] = [
                              { camel: "modulesStatus", snake: "modules_status", label: "Módulos" },
                              { camel: "pipelineStatus", snake: "pipeline_status", label: "Pipeline" },
                              { camel: "leadFieldsStatus", snake: "lead_fields_status", label: "Campos de leads" },
                              { camel: "permissionsStatus", snake: "permissions_status", label: "Permisos" },
                              { camel: "reportsStatus", snake: "reports_status", label: "Reportes" },
                              { camel: "integrationsStatus", snake: "integrations_status", label: "Integraciones" },
                            ];
                            const tenantSt = strFromUnknown(tr?.status);
                            const zpMode = strFromUnknown(zp?.mode);
                            const zpWrite = zp?.writeAllowed ?? zp?.write_allowed;
                            const zpReason = strFromUnknown(zp?.reason);
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
                                <div className="rounded-lg border border-slate-200 bg-white p-4">
                                  <h4 className="text-sm font-semibold text-slate-900">
                                    Lectura ejecutiva del contrato
                                  </h4>
                                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Dictamen ejecutivo
                                  </p>
                                  <p className="mt-1 text-sm leading-relaxed text-slate-800">
                                    {executiveDictamenText(finalGoExec)}
                                  </p>
                                  <div className="mt-4 flex flex-wrap items-center gap-3">
                                    <div
                                      className={`h-2.5 w-20 shrink-0 rounded-full ${traffic.track}`}
                                      title={traffic.label}
                                      aria-label={traffic.label}
                                    />
                                    <span className="text-xs text-slate-600">{traffic.label}</span>
                                  </div>
                                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                    <div>
                                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Score de preparación
                                      </p>
                                      <p className="mt-1 text-sm font-semibold tabular-nums text-slate-900">
                                        {execScore !== null ? `${execScore}/100` : "—"}
                                      </p>
                                      <p className="mt-0.5 text-xs text-slate-600">
                                        {scorePreparationLabel(execScore)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Riesgo
                                      </p>
                                      <p className="mt-1 text-sm font-medium uppercase tracking-wide text-slate-800">
                                        {execRisk || "—"}
                                      </p>
                                      <p className="mt-0.5 text-xs text-slate-600">
                                        {executiveRiskExplanation(execRisk)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="mt-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                      Estado del tenant
                                    </p>
                                    <p className="mt-1 text-sm text-slate-800">
                                      {tenantExecutiveCopy(tenantSt)}
                                    </p>
                                  </div>
                                  <div className="mt-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                      Configuración CRM (resumen)
                                    </p>
                                    <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                                      {crmRows.map(({ camel, snake, label }) => {
                                        const st = crmPick(camel, snake);
                                        return (
                                          <div
                                            key={camel}
                                            className="flex items-center justify-between gap-2 rounded-md border border-slate-100 bg-slate-50/80 px-2 py-1.5"
                                          >
                                            <dt className="text-xs text-slate-600">{label}</dt>
                                            <dd>
                                              <span
                                                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${crmSectionStatusBadgeClass(st)}`}
                                              >
                                                {st}
                                              </span>
                                            </dd>
                                          </div>
                                        );
                                      })}
                                    </dl>
                                  </div>
                                  <div className="mt-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                      Aprobaciones humanas pendientes
                                    </p>
                                    {humanApprovals.length === 0 ? (
                                      <p className="mt-1 text-xs text-slate-500">No informado.</p>
                                    ) : (
                                      <ul className="mt-2 space-y-2">
                                        {humanApprovals.map((a, idx) => {
                                          const lab = strFromUnknown(a.label ?? a.Label) || "—";
                                          const req = a.required ?? a.Required;
                                          const reqLabel =
                                            req === true ? "Sí" : req === false ? "No" : "—";
                                          const reason = strFromUnknown(a.reason ?? a.Reason) || "—";
                                          const k = strFromUnknown(a.key ?? a.Key) || `item-${idx}`;
                                          return (
                                            <li
                                              key={`${k}-${idx}`}
                                              className="rounded-md border border-slate-100 bg-slate-50/80 px-2 py-1.5 text-xs text-slate-800"
                                            >
                                              <span className="font-medium text-slate-900">{lab}</span>
                                              <span className="text-slate-500"> · Requerida: {reqLabel}</span>
                                              <p className="mt-0.5 text-slate-600">{reason}</p>
                                            </li>
                                          );
                                        })}
                                      </ul>
                                    )}
                                  </div>
                                  <div className="mt-4 rounded-md border border-slate-100 bg-slate-50/80 px-3 py-2">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                      Política Zeta
                                    </p>
                                    <p className="mt-1 text-xs leading-relaxed text-slate-800">
                                      Zeta permanece en modo solo lectura. Esta simulación no escribe en Zeta.
                                    </p>
                                    <p className="mt-2 text-xs text-slate-700">
                                      <span className="text-slate-500">Modo:</span>{" "}
                                      <span className="font-mono">{zpMode || "—"}</span>
                                      {" · "}
                                      <span className="text-slate-500">writeAllowed:</span>{" "}
                                      <span className="font-mono">
                                        {zpWrite === undefined || zpWrite === null
                                          ? "—"
                                          : String(zpWrite)}
                                      </span>
                                    </p>
                                    {zpReason ? (
                                      <p className="mt-1 text-xs text-slate-600">{zpReason}</p>
                                    ) : null}
                                  </div>
                                  <div className="mt-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                      Acciones bloqueadas críticas
                                    </p>
                                    {bpa.length === 0 ? (
                                      <p className="mt-1 text-xs text-slate-500">—</p>
                                    ) : (
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
                                    )}
                                  </div>
                                  <div className="mt-4 border-t border-slate-100 pt-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                      Recomendación siguiente
                                    </p>
                                    <p className="mt-1 text-sm text-slate-800">
                                      {executiveNextStep(finalGoExec)}
                                    </p>
                                  </div>
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

            <section
              className="rounded-xl border border-slate-200 bg-white p-5"
              aria-labelledby="consolidated-evidence-title"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 id="consolidated-evidence-title" className="text-sm font-semibold text-slate-900">
                    Evidencia consolidada del draft
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Último snapshot guardado (orden reciente). Solo lectura; no guarda evidencia nueva.
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {snapshots[0]?.executiveSummaryText ? (
                    <button
                      type="button"
                      onClick={() =>
                        void copyConsolidatedExecutiveSummary(snapshots[0]!.executiveSummaryText!)
                      }
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-400 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-50"
                    >
                      <Copy className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                      Copiar resumen consolidado
                    </button>
                  ) : null}
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
                      "Actualizar evidencia"
                    )}
                  </button>
                </div>
              </div>

              {snapshotsError ? (
                <div
                  className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950"
                  role="status"
                >
                  {snapshotsError}
                </div>
              ) : null}

              {consolidatedSummaryCopied ? (
                <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                  <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Resumen consolidado copiado
                </p>
              ) : null}

              {snapshotsLoading && snapshots.length === 0 && !snapshotsError ? (
                <p className="mt-4 text-sm text-slate-500">Cargando evidencia…</p>
              ) : null}

              {!snapshotsLoading && !snapshotsError && snapshots.length === 0 ? (
                <p className="mt-4 text-sm text-slate-600">
                  Todavía no hay evidencia guardada para este borrador.
                </p>
              ) : null}

              {snapshots[0] ? (
                <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                  {(() => {
                    const latest = snapshots[0]!;
                    const scoreLabel =
                      latest.readinessScore != null && !Number.isNaN(Number(latest.readinessScore))
                        ? String(latest.readinessScore)
                        : "—";
                    const go = latest.finalGoNoGo?.trim() ? latest.finalGoNoGo : null;
                    const risk = latest.riskLevel?.trim() ? latest.riskLevel : null;
                    const createdBy = latest.createdBy?.trim() ? latest.createdBy : "—";
                    const contractVer = latest.contractVersion?.trim() ? latest.contractVersion : "—";
                    const preview =
                      typeof latest.executiveSummaryPreview === "string" &&
                      latest.executiveSummaryPreview.trim()
                        ? latest.executiveSummaryPreview.trim()
                        : null;
                    return (
                      <>
                        <dl className="grid gap-x-4 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                          <div>
                            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              Snapshot
                            </dt>
                            <dd className="mt-0.5 font-mono text-xs text-slate-900" title={latest.id || undefined}>
                              {latest.id ? shortSnapshotId(latest.id) : "—"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              Fecha
                            </dt>
                            <dd className="mt-0.5 text-xs text-slate-800">
                              {latest.createdAt ? formatDt(latest.createdAt) : "—"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              Versión contrato
                            </dt>
                            <dd className="mt-0.5 font-mono text-xs text-slate-800">{contractVer}</dd>
                          </div>
                          <div>
                            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              Readiness score
                            </dt>
                            <dd className="mt-0.5 tabular-nums text-slate-900">{scoreLabel}</dd>
                          </div>
                          <div className="flex flex-col gap-1">
                            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              Go / No-Go
                            </dt>
                            <dd className="mt-0.5">
                              {go ? (
                                <span
                                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${snapshotGoNoGoBadgeClass(go)}`}
                                >
                                  {go.replace(/_/g, " ")}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-500">—</span>
                              )}
                            </dd>
                          </div>
                          <div className="flex flex-col gap-1">
                            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              Riesgo
                            </dt>
                            <dd className="mt-0.5">
                              {risk ? (
                                <span
                                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${snapshotRiskBadgeClass(risk)}`}
                                >
                                  {risk}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-500">—</span>
                              )}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              Prep. piloto
                            </dt>
                            <dd className="mt-0.5 text-xs text-slate-800">
                              {latest.canProceedToPilotPreparation ? "Sí" : "No"}
                            </dd>
                          </div>
                          <div className="sm:col-span-2 lg:col-span-2">
                            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              Creado por
                            </dt>
                            <dd className="mt-0.5 break-all font-mono text-xs text-slate-700">{createdBy}</dd>
                          </div>
                        </dl>
                        <div className="rounded-md border border-slate-100 bg-slate-50/80 px-3 py-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            Resumen ejecutivo en evidencia
                          </p>
                          <p className="mt-1 text-xs font-medium text-slate-800">
                            {latest.hasExecutiveSummary
                              ? "Resumen ejecutivo guardado"
                              : "Sin resumen ejecutivo guardado"}
                          </p>
                          {preview ? (
                            <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-slate-600">{preview}</p>
                          ) : null}
                        </div>
                        <p className="text-xs leading-relaxed text-slate-700">
                          <span className="font-semibold text-slate-800">Recomendación: </span>
                          {consolidatedEvidenceGoRecommendation(go)}
                        </p>
                      </>
                    );
                  })()}
                </div>
              ) : null}
            </section>

            {showExecutivePreManualReview && meta && data && latestSnapshot ? (
              <section
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                aria-labelledby="final-case-executive-summary-title"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2
                      id="final-case-executive-summary-title"
                      className="text-sm font-semibold text-slate-900"
                    >
                      Resumen ejecutivo final del caso
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Solo lectura. No guarda cambios; copia texto plano para uso externo.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copyFinalCaseExecutiveSummary()}
                    className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50"
                  >
                    <Copy className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                    Copiar resumen ejecutivo final
                  </button>
                </div>

                {finalCaseExecutiveCopied ? (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                    <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Resumen final copiado
                  </p>
                ) : null}

                {!latestAdvanceMeetingDecision ? (
                  <div
                    className="mt-3 rounded-lg border border-amber-200/90 bg-amber-50/90 px-3 py-2 text-xs leading-snug text-amber-950"
                    role="status"
                  >
                    {PICKUP_FINAL_CASE_MEETING_PENDING_NOTE}
                  </div>
                ) : null}

                <div className="mt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Estado del caso
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {latestAdvanceMeetingDecision ? (
                      <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                        Caso preparado
                      </span>
                    ) : null}
                    <span className="inline-flex rounded-full border border-amber-200/90 bg-amber-50/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-950">
                      Ready manual
                    </span>
                    <span className="inline-flex rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-800">
                      Ejecución bloqueada
                    </span>
                    <span className="inline-flex rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                      Primera etapa restringida
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Síntesis</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-700">
                    {PICKUP_FINAL_CASE_SYNTHESIS_PARAGRAPH}
                  </p>
                </div>

                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Qué está preparado
                    </p>
                    <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-[11px] leading-snug text-slate-700">
                      {PICKUP_FINAL_CASE_PREPARED_BULLETS.map((item) => (
                        <li key={item} className="marker:text-slate-300">
                          {item === "Decisión de avance manual" && !latestAdvanceMeetingDecision
                            ? `${item} (pendiente en reunión)`
                            : item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Qué sigue bloqueado
                    </p>
                    <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-[11px] leading-snug text-slate-700">
                      {PICKUP_FINAL_CASE_BLOCKED_BULLETS.map((item) => (
                        <li key={item} className="marker:text-slate-300">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-3 rounded-md border border-slate-100 bg-slate-50/80 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Próximo paso recomendado
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-800">
                    {PICKUP_FINAL_CASE_NEXT_STEP_PARAGRAPH}
                  </p>
                </div>

                <p className="mt-3 text-[10px] leading-relaxed text-slate-500">{PICKUP_FINAL_CASE_SECURITY_NOTE}</p>
              </section>
            ) : null}

            {showExecutivePreManualReview && meta && data && latestSnapshot ? (
              <section
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                aria-labelledby="pilot-documental-closure-title"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2
                      id="pilot-documental-closure-title"
                      className="text-sm font-semibold text-slate-900"
                    >
                      Cierre documental del piloto
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Solo lectura. Documenta el estado interno antes de una fase de ejecución real.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copyPilotDocumentalClosure()}
                    className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50"
                  >
                    <Copy className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                    Copiar cierre documental
                  </button>
                </div>

                {pilotDocumentalClosureCopied ? (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                    <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Cierre copiado
                  </p>
                ) : null}

                {!latestAdvanceMeetingDecision ? (
                  <div
                    className="mt-3 rounded-lg border border-amber-200/90 bg-amber-50/90 px-3 py-2 text-xs leading-snug text-amber-950"
                    role="status"
                  >
                    {PILOT_DOC_CLOSURE_PARTIAL_NOTE}
                  </div>
                ) : null}

                <div className="mt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Estado de cierre
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                      Cierre documental
                    </span>
                    <span className="inline-flex rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                      Piloto preparado
                    </span>
                    <span className="inline-flex rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-800">
                      Ejecución bloqueada
                    </span>
                    <span className="inline-flex rounded-full border border-amber-200/90 bg-amber-50/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-950">
                      Pendiente de fase real
                    </span>
                    {latestAdvanceMeetingDecision ? (
                      <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                        Decisión registrada
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                        Decisión pendiente
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Síntesis de cierre
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-700">
                    {PILOT_DOC_CLOSURE_SYNTHESIS_PARAGRAPH}
                  </p>
                </div>

                <div className="mt-3 grid gap-4 lg:grid-cols-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Qué quedó preparado
                    </p>
                    <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-[11px] leading-snug text-slate-700">
                      {PILOT_DOC_CLOSURE_PREPARED_BULLETS.map((item) => (
                        <li key={item} className="marker:text-slate-300">
                          {item === "Decisión de reunión, si existe"
                            ? latestAdvanceMeetingDecision
                              ? `Decisión de reunión registrada (${latestAdvanceMeetingDecision.decisionLabel})`
                              : "Decisión de reunión: pendiente de registrar"
                            : item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Pendientes antes de fase real
                    </p>
                    <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-[11px] leading-snug text-slate-700">
                      {PILOT_DOC_CLOSURE_PENDING_BULLETS.map((item) => (
                        <li key={item} className="marker:text-slate-300">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Bloqueos vigentes
                    </p>
                    <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-[11px] leading-snug text-slate-700">
                      {PILOT_DOC_CLOSURE_BLOCKED_BULLETS.map((item) => (
                        <li key={item} className="marker:text-slate-300">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-3 rounded-md border border-slate-100 bg-slate-50/80 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Próximo paso recomendado
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-800">
                    {PILOT_DOC_CLOSURE_NEXT_STEP_PARAGRAPH}
                  </p>
                </div>

                <div className="mt-3 rounded-md border border-slate-200/80 bg-white px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Estado recomendado del caso
                  </p>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-slate-800">
                    {PILOT_DOC_CLOSURE_RECOMMENDED_STATE_LINE}
                  </p>
                </div>

                <p className="mt-3 text-[10px] leading-relaxed text-slate-500">{PILOT_DOC_CLOSURE_SECURITY_NOTE}</p>
              </section>
            ) : null}

            {showPostApprovalPilotPrep && meta && data ? (
              <CollapsibleSection
                id="manual-controlled-install"
                title="Instalación manual controlada"
                subtitle="Contrato visual de una futura fase. Solo lectura: no instala CRM, no crea tenant ni usuarios, no escribe en Zeta y no guarda snapshots desde aquí."
                badges={[
                  "No iniciada",
                  "Bloqueada hasta aprobación final",
                  ...(snapshots[0] ? ["Basada en evidencia guardada"] : []),
                ]}
                defaultOpen={false}
              >
              <p className="mt-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-700">
                Esta sección define las condiciones para una futura instalación manual controlada. No ejecuta
                acciones, no crea recursos y no escribe en sistemas externos.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                  No iniciada
                </span>
                <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-950">
                  Bloqueada hasta aprobación final
                </span>
                {snapshots[0] ? (
                  <span className="inline-flex rounded-full border border-slate-400 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-800">
                    Basada en evidencia guardada
                  </span>
                ) : null}
              </div>

              <div
                className="mt-5 rounded-lg border border-slate-200 bg-white px-3 py-2.5"
                aria-labelledby="manual-readiness-dictamen-title"
              >
                <p
                  id="manual-readiness-dictamen-title"
                  className="text-[10px] font-semibold uppercase tracking-wide text-slate-400"
                >
                  Dictamen de readiness
                </p>
                {(() => {
                  const d = manualInstallReadinessDictamen(snapshots[0]);
                  return (
                    <div className="mt-2 flex gap-2.5">
                      <span
                        aria-hidden
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ring-1 ring-black/5 ${d.semaforoDotClass}`}
                      />
                      <div className="min-w-0 flex-1 space-y-1.5 text-xs leading-relaxed">
                        <p className="font-semibold text-slate-900">{d.estadoLabel}</p>
                        <p className="text-slate-600">{d.motivo}</p>
                        <p className="text-[11px] text-slate-600">
                          <span className="font-medium text-slate-700">Próxima acción recomendada: </span>
                          {d.siguienteAccion}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="mt-5 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Evidencia base (último snapshot)
                </p>
                {snapshots[0] ? (
                  <dl className="mt-2 grid gap-2 text-xs text-slate-800 sm:grid-cols-2">
                    <div>
                      <dt className="text-slate-500">Snapshot</dt>
                      <dd className="font-mono text-[11px]" title={snapshots[0].id}>
                        {shortSnapshotId(snapshots[0].id)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Fecha</dt>
                      <dd>{formatDt(snapshots[0].createdAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Versión contrato</dt>
                      <dd className="font-mono text-[11px]">{snapshots[0].contractVersion || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Readiness score</dt>
                      <dd className="tabular-nums">
                        {snapshots[0].readinessScore != null && !Number.isNaN(Number(snapshots[0].readinessScore))
                          ? String(snapshots[0].readinessScore)
                          : "—"}
                      </dd>
                    </div>
                    <div className="flex flex-col gap-1">
                      <dt className="text-slate-500">Go / No-Go</dt>
                      <dd>
                        {snapshots[0].finalGoNoGo ? (
                          <span
                            className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${snapshotGoNoGoBadgeClass(snapshots[0].finalGoNoGo)}`}
                          >
                            {snapshots[0].finalGoNoGo.replace(/_/g, " ")}
                          </span>
                        ) : (
                          "—"
                        )}
                      </dd>
                    </div>
                    <div className="flex flex-col gap-1">
                      <dt className="text-slate-500">Riesgo</dt>
                      <dd>
                        {snapshots[0].riskLevel ? (
                          <span
                            className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${snapshotRiskBadgeClass(snapshots[0].riskLevel)}`}
                          >
                            {snapshots[0].riskLevel}
                          </span>
                        ) : (
                          "—"
                        )}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    No hay evidencia guardada. Primero simulá preinstalación y guardá un snapshot.
                  </p>
                )}
              </div>

              <div className="mt-5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Condiciones mínimas para instalación manual
                </p>
                <ul className="mt-2 space-y-2">
                  {(() => {
                    const latest = snapshots[0];
                    const go = (latest?.finalGoNoGo ?? "").trim();
                    const pp = packagePayload;
                    const cfg = (k: string) => pp[k];
                    const sec = (snake: string, camel: string): ManualCheckStatus => {
                      if (!latest) return "pendiente";
                      if (go === "no_go") return "bloqueado";
                      const v = cfg(snake) ?? cfg(camel);
                      return isManualInstallPayloadSectionEmpty(v) ? "pendiente" : "cumplido";
                    };
                    const row = (label: string, status: ManualCheckStatus) => (
                      <li
                        key={label}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-100 bg-white px-2.5 py-2"
                      >
                        <span className="text-xs text-slate-800">{label}</span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${manualChecklistStatusBadgeClass(status)}`}
                        >
                          {status === "cumplido" ? "Cumplido" : status === "bloqueado" ? "Bloqueado" : "Pendiente"}
                        </span>
                      </li>
                    );
                    return (
                      <>
                        {row("Draft aprobado para piloto", "cumplido")}
                        {row("Snapshot técnico guardado", latest ? "cumplido" : "pendiente")}
                        {row(
                          "Resumen ejecutivo guardado",
                          latest?.hasExecutiveSummary ? "cumplido" : "pendiente"
                        )}
                        {row(
                          "Cliente destino resuelto",
                          strFromUnknown(meta?.targetClientId).length > 0 ? "cumplido" : "pendiente"
                        )}
                        {row("Módulos CRM definidos", sec("crm_modules_config", "crmModulesConfig"))}
                        {row("Pipeline definido", sec("pipeline_config", "pipelineConfig"))}
                        {row("Campos de leads definidos", sec("lead_fields_config", "leadFieldsConfig"))}
                        {row("Permisos iniciales definidos", sec("permissions_config", "permissionsConfig"))}
                        {row("Aprobación humana final documentada", "pendiente")}
                      </>
                    );
                  })()}
                </ul>
              </div>

              <div className="mt-5 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Acciones explícitamente bloqueadas hasta confirmación final
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {[
                    "create_tenant",
                    "create_users",
                    "send_invites",
                    "write_zeta",
                    "install_crm_automatically",
                    "publish_production",
                  ].map((code) => (
                    <li
                      key={code}
                      className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-800"
                    >
                      {code}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                <div>
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="inline-flex cursor-not-allowed items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-500 opacity-90"
                  >
                    Solicitar instalación manual — Próximamente
                  </button>
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    Botón informativo. Esta fase no ejecuta instalación.
                  </p>
                </div>
              </div>

              <p className="mt-4 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-700">
                <span className="font-semibold text-slate-900">Manual vs automatización futura: </span>
                Hoy todo es revisión, simulación y evidencia en persona. Una fase posterior podría automatizar
                verificaciones o tickets, pero la ejecución sobre tenant/Zeta seguiría requiriendo confirmación
                explícita y controles aparte.
              </p>
              </CollapsibleSection>
            ) : null}

            {showExecutivePreManualReview && latestSnapshot && meta && data ? (
              <CollapsibleSection
                id="exec-pre-manual-review"
                title="Revisión ejecutiva previa a instalación manual"
                subtitle="Listo para revisión humana final: no implica instalación, no autoriza ejecución automática y no escribe en sistemas externos."
                badges={["Revisión manual", "Sin ejecución automática"]}
                defaultOpen={false}
              >
                <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Estado ejecutivo
                  </p>
                  <ul className="mt-2 space-y-1.5 text-xs text-slate-800">
                    <li>
                      <span className="font-semibold text-slate-900">Estado: </span>
                      Listo para revisión manual final
                    </li>
                    <li>
                      <span className="font-semibold text-slate-900">Score: </span>
                      <span className="tabular-nums">
                        {latestSnapshot.readinessScore != null &&
                        !Number.isNaN(Number(latestSnapshot.readinessScore))
                          ? `${String(latestSnapshot.readinessScore)}/100`
                          : "—/100"}
                      </span>
                    </li>
                    <li className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900">Riesgo: </span>
                      {latestSnapshot.riskLevel ? (
                        <span
                          className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${snapshotRiskBadgeClass(latestSnapshot.riskLevel)}`}
                        >
                          {latestSnapshot.riskLevel}
                        </span>
                      ) : (
                        "—"
                      )}
                    </li>
                    <li>
                      <span className="font-semibold text-slate-900">Evidencia: </span>
                      <span className="font-mono text-[11px]" title={latestSnapshot.id}>
                        {shortSnapshotId(latestSnapshot.id)}
                      </span>
                    </li>
                    <li>
                      <span className="font-semibold text-slate-900">Resumen ejecutivo: </span>
                      {(() => {
                        const hasText =
                          typeof latestSnapshot.executiveSummaryText === "string" &&
                          latestSnapshot.executiveSummaryText.trim().length > 0;
                        if (hasText || latestSnapshot.hasExecutiveSummary) return "disponible";
                        return "no disponible";
                      })()}
                    </li>
                  </ul>
                </div>

                <div className="mt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Qué ya está listo
                  </p>
                  <ul className="mt-2 space-y-2">
                    {(() => {
                      const pp = packagePayload;
                      const secOk = (snake: string, camel: string): ManualCheckStatus =>
                        isManualInstallPayloadSectionEmpty(payloadCfg(pp, snake, camel))
                          ? "pendiente"
                          : "cumplido";
                      const row = (label: string, status: ManualCheckStatus) => (
                        <li
                          key={label}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-100 bg-white px-2.5 py-2"
                        >
                          <span className="text-xs text-slate-800">{label}</span>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${manualChecklistStatusBadgeClass(status)}`}
                          >
                            {status === "cumplido" ? "Cumplido" : status === "bloqueado" ? "Bloqueado" : "Pendiente"}
                          </span>
                        </li>
                      );
                      const execTextOk =
                        typeof latestSnapshot.executiveSummaryText === "string" &&
                        latestSnapshot.executiveSummaryText.trim().length > 0;
                      return (
                        <>
                          {row("Draft aprobado", "cumplido")}
                          {row("Package payload poblado", isPackagePayloadPopulated(pp) ? "cumplido" : "pendiente")}
                          {row("Módulos CRM definidos", secOk("crm_modules_config", "crmModulesConfig"))}
                          {row("Pipeline definido", secOk("pipeline_config", "pipelineConfig"))}
                          {row("Campos de leads definidos", secOk("lead_fields_config", "leadFieldsConfig"))}
                          {row("Permisos definidos", secOk("permissions_config", "permissionsConfig"))}
                          {row(
                            "Integración Kore definida como read-only",
                            isKoreReadOnlyIntegration(pp) ? "cumplido" : "pendiente"
                          )}
                          {row("Snapshot técnico guardado", "cumplido")}
                          {row(
                            "Resumen ejecutivo guardado",
                            execTextOk || latestSnapshot.hasExecutiveSummary ? "cumplido" : "pendiente"
                          )}
                        </>
                      );
                    })()}
                  </ul>
                </div>

                <div className="mt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Qué falta definir antes de instalar
                  </p>
                  <ul className="mt-2 space-y-2">
                    {[
                      "Responsable operativo de Pickup 4x4",
                      "Usuarios reales del piloto",
                      "Permisos por usuario",
                      "Credenciales/acceso técnico Kore",
                      "Alcance exacto del piloto",
                      "Datos iniciales a sincronizar desde Kore",
                      "Confirmación humana final de Summer87",
                      "Confirmación humana final de Pickup 4x4",
                    ].map((label) => (
                      <li
                        key={label}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-100 bg-white px-2.5 py-2"
                      >
                        <span className="text-xs text-slate-800">{label}</span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${manualChecklistStatusBadgeClass("pendiente")}`}
                        >
                          Pendiente
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Qué sigue bloqueado
                  </p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-relaxed text-slate-700">
                    <li>Crear tenant</li>
                    <li>Crear usuarios</li>
                    <li>Enviar invitaciones</li>
                    <li>Escribir en Kore</li>
                    <li>Escribir en Zeta</li>
                    <li>Publicar en producción</li>
                    <li>Instalar automáticamente</li>
                  </ul>
                </div>

                <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs leading-relaxed text-slate-700">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Recomendación Summer87
                  </p>
                  <p className="mt-2">
                    El paquete Pickup 4x4 está técnicamente preparado para revisión manual final. No debe
                    instalarse todavía. El siguiente paso recomendado es una reunión breve de validación con Pickup
                    4x4 y el responsable técnico para confirmar usuarios, permisos, acceso Kore y alcance del piloto.
                  </p>
                </div>

                <div className="mt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Decisión sugerida (solo lectura)
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    No ejecuta acciones desde esta pantalla.
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-lg border border-slate-800 bg-slate-50 px-3 py-2.5 shadow-sm">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                        Opción recomendada
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-900">
                        Avanzar a preparación manual controlada
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Alternativa
                      </p>
                      <p className="mt-1 text-xs text-slate-800">Esperar definición de accesos Kore</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Alternativa
                      </p>
                      <p className="mt-1 text-xs text-slate-800">Corregir alcance antes de instalar</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4" aria-labelledby="checklist-reunion-previa-title">
                  <h3
                    id="checklist-reunion-previa-title"
                    className="text-xs font-semibold text-slate-900"
                  >
                    Checklist de reunión previa
                  </h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                    Guía para alinear reunión con Pickup 4x4, responsable operativo del cliente, área técnica / Kore y
                    Summer87. Solo lectura: no guarda respuestas.
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {PICKUP_REUNION_PREVIA_CHECKLIST.map((g) => (
                      <div
                        key={g.title}
                        className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                          {g.title}
                        </p>
                        <ul className="mt-2 space-y-2">
                          {g.items.map((it) => (
                            <li
                              key={it.text}
                              className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-2 last:border-b-0 last:pb-0"
                            >
                              <span className="min-w-0 flex-1 text-xs leading-snug text-slate-800">
                                <span className="text-slate-400" aria-hidden>
                                  •{" "}
                                </span>
                                {it.text}
                              </span>
                              <span
                                className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${reunionChecklistBadgeClass(it.badge)}`}
                              >
                                {reunionChecklistBadgeLabel(it.badge)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4" aria-labelledby="minuta-reunion-comercial-title">
                  <h3
                    id="minuta-reunion-comercial-title"
                    className="text-xs font-semibold text-slate-900"
                  >
                    Minuta comercial/técnica para reunión
                  </h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                    Conducción sugerida de la reunión con Pickup 4x4 y/o Kore. Solo lectura; no guarda notas en el
                    sistema.
                  </p>
                  <div className="mt-3 space-y-3">
                    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        1. Objetivo de la reunión
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-slate-800">
                        {PICKUP_REUNION_MINUTA_OBJETIVO}
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                          2. Agenda sugerida
                        </p>
                        <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-snug text-slate-800">
                          {PICKUP_REUNION_MINUTA_AGENDA.map((a) => (
                            <li key={a}>{a}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                          3. Preguntas para Pickup 4x4
                        </p>
                        <ul className="mt-2 space-y-1.5 text-xs leading-snug text-slate-800">
                          {PICKUP_REUNION_MINUTA_PREGUNTAS_PICKUP.map((q) => (
                            <li key={q} className="flex gap-1.5">
                              <span className="shrink-0 text-slate-400" aria-hidden>
                                •
                              </span>
                              <span>{q}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                          4. Preguntas para Kore / área técnica
                        </p>
                        <ul className="mt-2 space-y-1.5 text-xs leading-snug text-slate-800">
                          {PICKUP_REUNION_MINUTA_PREGUNTAS_KORE.map((q) => (
                            <li key={q} className="flex gap-1.5">
                              <span className="shrink-0 text-slate-400" aria-hidden>
                                •
                              </span>
                              <span>{q}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                          5. Decisiones que deben salir de la reunión
                        </p>
                        <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-snug text-slate-800">
                          {PICKUP_REUNION_MINUTA_DECISIONES.map((d) => (
                            <li key={d}>{d}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 shadow-sm">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        6. Cierre esperado
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-slate-800">{PICKUP_REUNION_MINUTA_CIERRE}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/80 p-3" aria-labelledby="pickup-external-message-title">
                  <h3
                    id="pickup-external-message-title"
                    className="text-xs font-semibold text-slate-900"
                  >
                    Mensaje comercial para Pickup 4x4
                  </h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                    Mensaje externo para coordinar la reunión de validación con Pickup 4x4. No incluye datos internos
                    del sistema.
                  </p>
                  <button
                    type="button"
                    onClick={() => void copyPickup4x4CommercialMessage()}
                    className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-400 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-50"
                  >
                    {pickupCommercialMessageCopied ? (
                      <Check className="h-3.5 w-3.5 shrink-0 text-slate-700" aria-hidden />
                    ) : (
                      <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    )}
                    Copiar mensaje para Pickup 4x4
                  </button>
                  {pickupCommercialMessageCopied ? (
                    <p className="mt-1.5 text-[11px] text-slate-600">Mensaje copiado</p>
                  ) : null}
                </div>

                <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm" aria-labelledby="meeting-final-decision-title">
                  <h3 id="meeting-final-decision-title" className="text-xs font-semibold text-slate-900">
                    Decisión final de reunión
                  </h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                    Registrar una decisión no instala el CRM ni ejecuta acciones. Solo deja evidencia de la reunión.
                  </p>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                    Aun si se elige avanzar, la instalación real queda bloqueada hasta una fase posterior explícita.
                  </p>

                  {meetingDecisionsTableMissing ? (
                    <div
                      className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950"
                      role="alert"
                    >
                      La tabla de decisiones de reunión no existe en la base. Aplicá la migración SQL en Supabase
                      antes de registrar decisiones.
                    </div>
                  ) : null}

                  {meetingDecisionsError ? (
                    <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                      {meetingDecisionsError}
                    </div>
                  ) : null}

                  {meetingDecisionSuccess ? (
                    <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800">
                      {meetingDecisionSuccess}
                    </div>
                  ) : null}

                  {!meetingDecisionsTableMissing ? (
                    <>
                      <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Elegí la decisión
                      </p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {MEETING_FINAL_DECISION_OPTIONS.map((opt) => {
                          const sel = selectedMeetingDecision === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setSelectedMeetingDecision(opt.value)}
                              disabled={meetingDecisionSubmitting}
                              className={`rounded-lg border px-3 py-2 text-left text-xs font-medium leading-snug transition-colors disabled:opacity-60 ${
                                sel
                                  ? "border-slate-600 bg-slate-50 text-slate-900 ring-2 ring-slate-400"
                                  : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>

                      <label className="mt-3 block">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Motivo de la decisión
                        </span>
                        <textarea
                          value={meetingDecisionReason}
                          onChange={(e) => setMeetingDecisionReason(e.target.value)}
                          rows={3}
                          disabled={meetingDecisionSubmitting}
                          className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-800 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 disabled:bg-slate-50"
                          placeholder="Opcional"
                        />
                      </label>
                      <label className="mt-2 block">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Notas de reunión
                        </span>
                        <textarea
                          value={meetingDecisionNotes}
                          onChange={(e) => setMeetingDecisionNotes(e.target.value)}
                          rows={3}
                          disabled={meetingDecisionSubmitting}
                          className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-800 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 disabled:bg-slate-50"
                          placeholder="Opcional"
                        />
                      </label>
                      <label className="mt-2 block">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Pendientes (uno por línea)
                        </span>
                        <textarea
                          value={meetingDecisionPendientes}
                          onChange={(e) => setMeetingDecisionPendientes(e.target.value)}
                          rows={3}
                          disabled={meetingDecisionSubmitting}
                          className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-800 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 disabled:bg-slate-50"
                          placeholder="Un ítem por línea"
                        />
                      </label>

                      {meetingDecisionFormError ? (
                        <p className="mt-2 text-xs text-red-700">{meetingDecisionFormError}</p>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => void submitMeetingDecision()}
                        disabled={
                          meetingDecisionSubmitting || !selectedMeetingDecision || meetingDecisionsTableMissing
                        }
                        className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-500 bg-slate-100 px-4 py-2 text-xs font-medium text-slate-900 shadow-sm hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {meetingDecisionSubmitting ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
                            Registrando…
                          </>
                        ) : (
                          "Registrar decisión"
                        )}
                      </button>
                    </>
                  ) : null}

                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Historial de decisiones de reunión
                    </p>
                    {meetingDecisionsLoading ? (
                      <p className="mt-2 text-xs text-slate-500">Cargando…</p>
                    ) : meetingDecisions.length === 0 ? (
                      <p className="mt-2 text-xs text-slate-500">
                        Todavía no hay decisiones de reunión registradas.
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-2">
                        {meetingDecisions.map((d) => (
                          <li
                            key={d.id}
                            className="rounded-md border border-slate-100 bg-slate-50/80 px-2.5 py-2 text-xs text-slate-800"
                          >
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <span className="font-semibold text-slate-900">{d.decisionLabel}</span>
                              <span className="font-mono text-[10px] text-slate-500">
                                {formatDt(d.createdAt)}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] text-slate-600">
                              <span className="text-slate-500">Por: </span>
                              {d.decidedBy ?? "—"}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-600">
                              <span className="text-slate-500">Motivo: </span>
                              {truncateMeetingDecisionPreview(d.decisionReason, 120)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                  <div>
                    <p className="max-w-md text-[11px] leading-relaxed text-slate-500">
                      La instalación manual del CRM no se ejecuta desde esta pantalla. Los botones de la derecha
                      copian material interno o externo; la decisión de reunión se audita en el bloque anterior.
                    </p>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col items-stretch gap-2 sm:max-w-sm sm:items-end">
                    <p className="text-[11px] leading-relaxed text-slate-500 sm:text-right">
                      Texto plano para WhatsApp, correo o minuta. No incluye el contrato técnico completo.
                    </p>
                    <button
                      type="button"
                      onClick={() => void copyPickup4x4MeetingDocument()}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-400 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-50"
                    >
                      {meetingDocumentCopied ? (
                        <Check className="h-3.5 w-3.5 shrink-0 text-slate-700" aria-hidden />
                      ) : (
                        <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      )}
                      Copiar documento de reunión
                    </button>
                    {meetingDocumentCopied ? (
                      <p className="text-[11px] text-slate-600 sm:text-right">Documento copiado</p>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void copyPickup4x4MeetingChecklist()}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-400 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-50"
                    >
                      {meetingChecklistCopied ? (
                        <Check className="h-3.5 w-3.5 shrink-0 text-slate-700" aria-hidden />
                      ) : (
                        <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      )}
                      Copiar checklist de reunión
                    </button>
                    {meetingChecklistCopied ? (
                      <p className="text-[11px] text-slate-600 sm:text-right">Checklist copiada</p>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void copyPickup4x4MeetingMinuta()}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-400 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-50"
                    >
                      {meetingMinutaCopied ? (
                        <Check className="h-3.5 w-3.5 shrink-0 text-slate-700" aria-hidden />
                      ) : (
                        <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      )}
                      Copiar minuta de reunión
                    </button>
                    {meetingMinutaCopied ? (
                      <p className="text-[11px] text-slate-600 sm:text-right">Minuta copiada</p>
                    ) : null}
                    {typeof latestSnapshot.executiveSummaryText === "string" &&
                    latestSnapshot.executiveSummaryText.trim().length > 0 ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void copyPreManualMeetingSummary(latestSnapshot.executiveSummaryText!)}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-400 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-50"
                        >
                          {preManualReviewSummaryCopied ? (
                            <Check className="h-3.5 w-3.5 shrink-0 text-slate-700" aria-hidden />
                          ) : (
                            <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          )}
                          Copiar resumen para reunión
                        </button>
                        {preManualReviewSummaryCopied ? (
                          <p className="text-[11px] text-slate-600 sm:text-right">Resumen copiado</p>
                        ) : null}
                      </>
                    ) : (
                      <p className="text-[11px] leading-relaxed text-slate-500 sm:text-right">
                        Resumen ejecutivo no disponible para copiar.
                      </p>
                    )}
                  </div>
                </div>
              </CollapsibleSection>
            ) : null}

            {showManualControlledPrepSection && latestSnapshot && meta && data && latestAdvanceMeetingDecision ? (
              <CollapsibleSection
                id="manual-controlled-prep"
                title="Preparación manual controlada"
                subtitle="Vista operativa posterior a una decisión de reunión para avanzar. No crea entornos ni ejecuta acciones; solo resume qué falta antes de un piloto real."
                badges={[
                  "Preparación habilitada por decisión",
                  "No ejecutada",
                  "Instalación bloqueada",
                ]}
                defaultOpen={false}
              >
                <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Estado de preparación
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {[
                      "Preparación habilitada por decisión de reunión",
                      "No ejecutada",
                      "Pendiente de datos reales",
                      "Instalación bloqueada hasta fase posterior",
                    ].map((label) => (
                      <li
                        key={label}
                        className="inline-flex rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700"
                      >
                        {label}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Evidencia base
                  </p>
                  <dl className="mt-2 grid gap-2 text-xs text-slate-800 sm:grid-cols-2">
                    <div>
                      <dt className="text-slate-500">Snapshot</dt>
                      <dd className="font-mono text-[11px]" title={latestSnapshot.id}>
                        {shortSnapshotId(latestSnapshot.id)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Fecha</dt>
                      <dd>{formatDt(latestSnapshot.createdAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Versión contrato</dt>
                      <dd className="font-mono text-[11px]">{latestSnapshot.contractVersion || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Score</dt>
                      <dd className="tabular-nums">
                        {latestSnapshot.readinessScore != null && !Number.isNaN(Number(latestSnapshot.readinessScore))
                          ? String(latestSnapshot.readinessScore)
                          : "—"}
                      </dd>
                    </div>
                    <div className="flex flex-col gap-1">
                      <dt className="text-slate-500">Go / No-Go</dt>
                      <dd>
                        {latestSnapshot.finalGoNoGo ? (
                          <span
                            className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${snapshotGoNoGoBadgeClass(latestSnapshot.finalGoNoGo)}`}
                          >
                            {latestSnapshot.finalGoNoGo.replace(/_/g, " ")}
                          </span>
                        ) : (
                          "—"
                        )}
                      </dd>
                    </div>
                    <div className="flex flex-col gap-1">
                      <dt className="text-slate-500">Riesgo</dt>
                      <dd>
                        {latestSnapshot.riskLevel ? (
                          <span
                            className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${snapshotRiskBadgeClass(latestSnapshot.riskLevel)}`}
                          >
                            {latestSnapshot.riskLevel}
                          </span>
                        ) : (
                          "—"
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Decisión base (reunión)
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-slate-800">
                    <li>
                      <span className="font-semibold text-slate-900">Decisión: </span>
                      {latestAdvanceMeetingDecision.decisionLabel}
                    </li>
                    <li>
                      <span className="font-semibold text-slate-900">Fecha: </span>
                      {formatDt(latestAdvanceMeetingDecision.createdAt)}
                    </li>
                    <li>
                      <span className="font-semibold text-slate-900">Registró: </span>
                      {latestAdvanceMeetingDecision.decidedBy ?? "—"}
                    </li>
                    <li>
                      <span className="font-semibold text-slate-900">Motivo (extracto): </span>
                      {truncateMeetingDecisionPreview(latestAdvanceMeetingDecision.decisionReason, 160)}
                    </li>
                  </ul>
                </div>

                <div className="mt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Datos mínimos requeridos antes de crear entorno
                  </p>
                  <ul className="mt-2 space-y-2">
                    {(() => {
                      const pp = packagePayload;
                      const secOk = (snake: string, camel: string): ManualCheckStatus =>
                        isManualInstallPayloadSectionEmpty(payloadCfg(pp, snake, camel))
                          ? "pendiente"
                          : "cumplido";
                      const row = (label: string, status: ManualCheckStatus) => (
                        <li
                          key={label}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-100 bg-white px-2.5 py-2"
                        >
                          <span className="text-xs text-slate-800">{label}</span>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${prepReadinessBadgeClass(status)}`}
                          >
                            {status === "cumplido" ? "Con antecedentes" : "Pendiente"}
                          </span>
                        </li>
                      );
                      const idName = clientIdentityOperationalName(pp);
                      const scopeReady =
                        !isManualInstallPayloadSectionEmpty(payloadCfg(pp, "crm_modules_config", "crmModulesConfig")) &&
                        !isManualInstallPayloadSectionEmpty(payloadCfg(pp, "pipeline_config", "pipelineConfig"));
                      const critOk =
                        typeof latestAdvanceMeetingDecision.decisionReason === "string" &&
                        latestAdvanceMeetingDecision.decisionReason.trim().length >= 20;
                      return (
                        <>
                          {row(
                            "Responsable operativo Pickup 4x4",
                            idName ? "cumplido" : "pendiente"
                          )}
                          {row("Usuarios reales con email", "pendiente")}
                          {row(
                            "Roles y permisos por usuario",
                            secOk("permissions_config", "permissionsConfig")
                          )}
                          {row(
                            "Confirmación Kore read-only",
                            isKoreReadOnlyIntegration(pp) ? "cumplido" : "pendiente"
                          )}
                          {row(
                            "Documentación/API Kore",
                            integrationsConfigHasEntries(pp) ? "cumplido" : "pendiente"
                          )}
                          {row("Alcance piloto cerrado", scopeReady ? "cumplido" : "pendiente")}
                          {row("Criterio de éxito definido", critOk ? "cumplido" : "pendiente")}
                          {row("Aprobación final explícita", "pendiente")}
                        </>
                      );
                    })()}
                  </ul>
                </div>

                <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Plan de preparación manual
                  </p>
                  <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs leading-relaxed text-slate-800">
                    <li>Revisar alcance final</li>
                    <li>Confirmar usuarios</li>
                    <li>Confirmar permisos</li>
                    <li>Confirmar acceso Kore read-only</li>
                    <li>Definir estructura inicial del entorno</li>
                    <li>Preparar migración/configuración futura</li>
                    <li>Solicitar aprobación final</li>
                    <li>Recién después crear entorno piloto</li>
                  </ol>
                </div>

                <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Acciones que siguen bloqueadas
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {[
                      "create_tenant",
                      "create_users",
                      "send_invites",
                      "write_kore",
                      "write_zeta",
                      "install_crm_automatically",
                      "publish_production",
                    ].map((code) => (
                      <li
                        key={code}
                        className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-800"
                      >
                        {code}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="inline-flex cursor-not-allowed items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-500 opacity-90"
                  >
                    Crear entorno piloto — Próximamente
                  </button>
                  <p className="max-w-md text-[11px] leading-relaxed text-slate-500">
                    Este botón es informativo. La creación del entorno requiere una fase posterior explícita.
                  </p>
                </div>

                <p className="mt-4 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-700">
                  <span className="font-semibold text-slate-900">Seguridad: </span>
                  El registro de decisión habilita la preparación manual, no la instalación. Antes de crear recursos
                  reales se deben confirmar usuarios, permisos, alcance, acceso Kore y aprobación final.
                </p>
              </CollapsibleSection>
            ) : null}

            {showManualControlledPrepSection && latestSnapshot && meta && data && latestAdvanceMeetingDecision ? (
              <CollapsibleSection
                id="pilot-env-creation-plan"
                title="Plan de creación de entorno piloto"
                subtitle="Plan prospectivo · Sin creación de recursos · Acceso restringido en primera etapa"
                badges={["Plan preliminar", "No ejecutado", "Requiere aprobación final"]}
                defaultOpen={false}
              >
                <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Estado del plan
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {[
                      "Plan preliminar",
                      "No ejecutado",
                      "Requiere aprobación final",
                      "Recursos no creados",
                      "Acceso restringido",
                      "Usuarios operativos al final",
                    ].map((label) => (
                      <li
                        key={label}
                        className="inline-flex rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700"
                      >
                        {label}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Objetivo del entorno piloto
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-800">
                    {PILOT_ENV_CREATION_PLAN_OBJECTIVE_TEXT}
                  </p>
                </div>

                <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Entidades futuras a preparar
                  </p>
                  <ul className="mt-2 space-y-2">
                    {PILOT_ENV_CREATION_PLAN_ENTITY_DEFS.map(({ label, kind }) => (
                      <li
                        key={label}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-100 bg-slate-50/40 px-2.5 py-2"
                      >
                        <span className="text-xs text-slate-800">{label}</span>
                        <span className="flex shrink-0 flex-wrap gap-1">
                          <span className="rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                            Futuro
                          </span>
                          {kind === "users_late" ? (
                            <span className="rounded-full border border-slate-400 bg-slate-200/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-800">
                              Al final
                            </span>
                          ) : kind === "restricted_access" ? (
                            <span className="rounded-full border border-slate-500/40 bg-slate-200/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-800">
                              Primera etapa
                            </span>
                          ) : (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-950">
                              No creado
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Datos requeridos antes de preparar entorno
                  </p>
                  <ul className="mt-2 space-y-2">
                    {computePilotEnvironmentPlanDataRows({
                      packagePayload,
                      meta,
                      humanConfirmationStatus: data.humanConfirmationStatus,
                      latestAdvanceMeetingDecision,
                    }).map((row) => (
                      <li
                        key={row.label}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-100 bg-white px-2.5 py-2"
                      >
                        <span className="text-xs text-slate-800">{row.label}</span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${prepReadinessBadgeClass(row.status)}`}
                        >
                          {row.status === "cumplido" ? "Con antecedente" : "Pendiente"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Accesos controlados — primera etapa restringida
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-800">{PILOT_ENV_CONTROLLED_ACCESS_INTRO}</p>
                  <ul className="mt-3 space-y-2">
                    {PILOT_ENV_CONTROLLED_ACCESS_ROWS.map(({ label, badgeGroup }) => (
                      <li
                        key={label}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-100 bg-slate-50/40 px-2.5 py-2"
                      >
                        <span className="text-xs text-slate-800">{label}</span>
                        <span className="flex shrink-0 flex-wrap gap-1">
                          {badgeGroup === "etapa1" ? (
                            <>
                              <span className="rounded-full border border-slate-500/35 bg-slate-200/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-800">
                                Primera etapa
                              </span>
                              <span className="rounded-full border border-rose-200/90 bg-rose-50/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-900">
                                Restringido
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="rounded-full border border-slate-400 bg-slate-200/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-800">
                                Fase posterior
                              </span>
                              <span className="rounded-full border border-rose-200/90 bg-rose-50/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-900">
                                Restringido
                              </span>
                            </>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Orden sugerido de preparación futura
                  </p>
                  <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                    Pasos prospectivos; ninguno se ejecuta desde esta pantalla.
                  </p>
                  <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-slate-800">
                    {PILOT_ENV_CREATION_PLAN_ORDER_STEPS.map((step) => (
                      <li key={step}>
                        {step}{" "}
                        <span className="text-[10px] font-medium text-slate-500">(futuro · no ejecutado)</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Riesgos antes de preparar entorno
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-slate-800">
                    {PILOT_ENV_CREATION_PLAN_RISKS.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Acciones bloqueadas
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {PILOT_ENV_CREATION_PLAN_BLOCKED_CODES.map((code) => (
                      <li
                        key={code}
                        className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-800"
                      >
                        {code}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      className="inline-flex cursor-not-allowed items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-500 opacity-90"
                    >
                      Generar plan ejecutable — Próximamente
                    </button>
                    <button
                      type="button"
                      onClick={() => void copyPilotEnvCreationPlan()}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-400 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-50"
                    >
                      {pilotEnvPlanCopied ? (
                        <Check className="h-3.5 w-3.5 shrink-0 text-slate-700" aria-hidden />
                      ) : (
                        <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      )}
                      Copiar plan de entorno piloto
                    </button>
                  </div>
                  <div className="flex max-w-md flex-col gap-1">
                    <p className="text-[11px] leading-relaxed text-slate-500">
                      Este botón es informativo. El plan ejecutable requiere una fase posterior explícita.
                    </p>
                    {pilotEnvPlanCopied ? (
                      <p className="text-[11px] font-medium text-slate-700">Plan copiado</p>
                    ) : null}
                  </div>
                </div>

                <p className="mt-4 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-700">
                  <span className="font-semibold text-slate-900">Seguridad: </span>
                  {PILOT_ENV_CREATION_PLAN_SECURITY_NOTE}
                </p>
              </CollapsibleSection>
            ) : null}

            {showManualControlledPrepSection && latestSnapshot && meta && data && latestAdvanceMeetingDecision ? (
              <CollapsibleSection
                id="future-executable-plan"
                title="Plan ejecutable futuro"
                subtitle="Futuro · Bloqueado · No ejecutado · Sin ejecución real en esta pantalla"
                badges={["Bloqueado", "No ejecutado", "Requiere fase posterior"]}
                defaultOpen={false}
              >
                <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Estado del plan ejecutable
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {["Futuro", "Bloqueado", "No ejecutado", "Requiere fase posterior", "Requiere aprobación final"].map(
                      (label) => (
                        <li
                          key={label}
                          className="inline-flex rounded-full border border-slate-400/60 bg-slate-200/50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-800"
                        >
                          {label}
                        </li>
                      )
                    )}
                  </ul>
                </div>

                <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Introducción
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-800">{FUTURE_EXECUTABLE_PLAN_INTRO}</p>
                </div>

                <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Secuencia futura de ejecución
                  </p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    Cada paso: prospectivo, bloqueado y no ejecutado desde aquí.
                  </p>
                  <ol className="mt-2 list-decimal space-y-2 pl-4 text-xs leading-relaxed text-slate-800">
                    {FUTURE_EXECUTABLE_PLAN_SEQUENCE_STEPS.map((step) => (
                      <li key={step} className="pl-0.5">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <span>{step}</span>
                          <span className="flex shrink-0 flex-wrap gap-1">
                            <span className="rounded-full border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-700">
                              Futuro
                            </span>
                            <span className="rounded-full border border-slate-500/30 bg-slate-200/80 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-800">
                              Bloqueado
                            </span>
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-950">
                              No ejecutado
                            </span>
                          </span>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="mt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Acciones técnicas futuras
                  </p>
                  <ul className="mt-2 space-y-2">
                    {FUTURE_EXECUTABLE_TECHNICAL_ACTIONS.map((a) => (
                      <li
                        key={a.key}
                        className="rounded-md border border-slate-200 bg-white px-2.5 py-2 shadow-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-mono text-[10px] text-slate-600">{a.key}</span>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                              a.estado === "Postergado"
                                ? "border border-slate-400 bg-slate-200/70 text-slate-800"
                                : "border border-slate-500/35 bg-slate-200/80 text-slate-800"
                            }`}
                          >
                            {a.estado}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-medium text-slate-900">{a.label}</p>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">{a.motivo}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Requisitos para desbloquear en el futuro
                  </p>
                  <ul className="mt-2 space-y-2">
                    {computeFutureExecutableUnlockRows({
                      packagePayload,
                      meta,
                      humanConfirmationStatus: data.humanConfirmationStatus,
                      latestAdvanceMeetingDecision,
                    }).map((row) => (
                      <li
                        key={row.label}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-100 bg-white px-2.5 py-2"
                      >
                        <span className="text-xs text-slate-800">{row.label}</span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${futureUnlockBadgeClass(row.badge)}`}
                        >
                          {futureUnlockBadgeLabel(row.badge)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 rounded-lg border border-slate-400/40 bg-slate-200/30 px-3 py-2.5">
                  <p className="text-xs font-semibold text-slate-900">{FUTURE_EXECUTABLE_BARRIER_TITLE}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-800">{FUTURE_EXECUTABLE_BARRIER_TEXT}</p>
                </div>

                <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Acciones explícitamente bloqueadas
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {FUTURE_EXECUTABLE_BLOCKED_CODES.map((code) => (
                      <li
                        key={code}
                        className="rounded-md border border-slate-300 bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-800"
                      >
                        {code}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      className="inline-flex cursor-not-allowed items-center justify-center rounded-lg border border-slate-400 bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 opacity-95"
                    >
                      Ejecutar plan piloto — Bloqueado
                    </button>
                    <button
                      type="button"
                      onClick={() => void copyFutureExecutablePlan()}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-400 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-50"
                    >
                      {futureExecutablePlanCopied ? (
                        <Check className="h-3.5 w-3.5 shrink-0 text-slate-700" aria-hidden />
                      ) : (
                        <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      )}
                      Copiar plan ejecutable futuro
                    </button>
                  </div>
                  <div className="flex max-w-md flex-col gap-1">
                    <p className="text-[11px] leading-relaxed text-slate-500">
                      Este botón es informativo. La ejecución real requiere una fase posterior explícita.
                    </p>
                    {futureExecutablePlanCopied ? (
                      <p className="text-[11px] font-medium text-slate-700">Plan ejecutable copiado</p>
                    ) : null}
                  </div>
                </div>

                <p className="mt-4 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-700">
                  <span className="font-semibold text-slate-900">Seguridad: </span>
                  {FUTURE_EXECUTABLE_PLAN_FINAL_SECURITY}
                </p>
              </CollapsibleSection>
            ) : null}

            {showManualControlledPrepSection && latestSnapshot && meta && data && latestAdvanceMeetingDecision ? (
              <>
                <CollapsibleSection
                  id="pilot-tech-design"
                  title="Diseño técnico del entorno piloto"
                  subtitle="Arquitectura en papel · Sin SQL · Primera etapa restringida"
                  badges={["Diseño técnico", "No ejecutado", "Sin SQL"]}
                  defaultOpen={false}
                >
                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Estado del diseño
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {[
                      "Diseño técnico",
                      "No ejecutado",
                      "Sin SQL",
                      "Sin recursos creados",
                      "Primera etapa restringida",
                    ].map((label) => (
                      <li
                        key={label}
                        className="inline-flex rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700"
                      >
                        {label}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Propósito</p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-800">{PILOT_TECH_DESIGN_PURPOSE}</p>
                </div>

                <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Modelo de aislamiento propuesto
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-800">
                    <li className="font-medium text-slate-900">Opción recomendada</li>
                    {PILOT_TECH_DESIGN_ISOLATION_RECOMMENDED.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-600">{PILOT_TECH_DESIGN_ISOLATION_NOTE}</p>
                </div>

                <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Capas del entorno piloto
                  </p>
                  <ul className="mt-2 space-y-2">
                    {PILOT_TECH_DESIGN_LAYERS.map((L) => (
                      <li
                        key={L.title}
                        className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-slate-100 bg-slate-50/40 px-2.5 py-2"
                      >
                        <div>
                          <p className="text-xs font-semibold text-slate-900">{L.title}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-slate-700">{L.body}</p>
                        </div>
                        <span className="flex shrink-0 flex-wrap gap-1">
                          <span className="rounded-full border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-700">
                            Diseñado
                          </span>
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-950">
                            No ejecutado
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Componentes técnicos propuestos
                  </p>
                  <ul className="mt-2 space-y-2">
                    {PILOT_TECH_DESIGN_COMPONENTS.map((c) => (
                      <li
                        key={c.key}
                        className="rounded-md border border-slate-200 bg-white px-2.5 py-2 shadow-sm"
                      >
                        <p className="font-mono text-[10px] text-slate-600">{c.key}</p>
                        <p className="mt-1 text-xs text-slate-800">
                          <span className="font-semibold text-slate-900">Propósito: </span>
                          {c.purpose}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-600">
                          <span className="font-semibold text-slate-800">Fuente: </span>
                          {c.source}
                        </p>
                        <p className="mt-1.5 flex flex-wrap gap-1">
                          <span className="rounded-full border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-700">
                            Futuro
                          </span>
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-950">
                            No creado
                          </span>
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Diseño de Kore read-only
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-800">{PILOT_TECH_KORE_DESIGN_INTRO}</p>
                  <dl className="mt-2 grid gap-1.5 text-xs text-slate-800 sm:grid-cols-2">
                    {(() => {
                      const kr = koreReadonlyDesignRows(packagePayload);
                      return (
                        <>
                          <div>
                            <dt className="text-slate-500">Modo</dt>
                            <dd className="font-mono text-[11px]">{kr.mode}</dd>
                          </div>
                          <div>
                            <dt className="text-slate-500">Dirección</dt>
                            <dd>{kr.direction}</dd>
                          </div>
                          <div>
                            <dt className="text-slate-500">Escritura permitida</dt>
                            <dd>{kr.writeAllowed}</dd>
                          </div>
                          <div>
                            <dt className="text-slate-500">Estado credenciales</dt>
                            <dd>{kr.credentials}</dd>
                          </div>
                          <div>
                            <dt className="text-slate-500">Documentación API</dt>
                            <dd>{kr.documentation}</dd>
                          </div>
                          <div>
                            <dt className="text-slate-500">Endpoints</dt>
                            <dd>{kr.endpoints}</dd>
                          </div>
                          <div>
                            <dt className="text-slate-500">Frecuencia de sincronización</dt>
                            <dd>{kr.syncFrequency}</dd>
                          </div>
                          <div>
                            <dt className="text-slate-500">Validación inicial</dt>
                            <dd>{kr.validation}</dd>
                          </div>
                        </>
                      );
                    })()}
                  </dl>
                </div>

                <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Diseño de datos iniciales
                  </p>
                  <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs text-slate-800">
                    {PILOT_TECH_INITIAL_DATA_ITEMS.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[11px] font-medium text-slate-700">{PILOT_TECH_INITIAL_DATA_NOTE}</p>
                </div>

                <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Diseño de primera etapa restringida
                  </p>
                  <p className="mt-2 text-xs font-semibold text-slate-900">Participantes</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-slate-800">
                    {PILOT_TECH_RESTRICTED_PARTICIPANTS.map((participant) => (
                      <li key={participant}>{participant}</li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs font-semibold text-slate-900">Quedan fuera</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-slate-800">
                    {PILOT_TECH_RESTRICTED_EXCLUDED.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs leading-relaxed text-slate-700">{PILOT_TECH_RESTRICTED_TEXT}</p>
                </div>

                <div className="mt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Validaciones requeridas antes de crear recursos
                  </p>
                  <ul className="mt-2 space-y-2">
                    {computeTechnicalDesignValidationRows({
                      packagePayload,
                      meta,
                      humanConfirmationStatus: data.humanConfirmationStatus,
                      latestAdvanceMeetingDecision,
                    }).map((row) => (
                      <li
                        key={row.label}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-100 bg-white px-2.5 py-2"
                      >
                        <span className="text-xs text-slate-800">{row.label}</span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${futureUnlockBadgeClass(row.badge)}`}
                        >
                          {futureUnlockBadgeLabel(row.badge)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Riesgos técnicos
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-slate-800">
                    {PILOT_TECH_DESIGN_RISKS.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Acciones bloqueadas
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {FUTURE_EXECUTABLE_BLOCKED_CODES.map((code) => (
                      <li
                        key={code}
                        className="rounded-md border border-slate-300 bg-white px-2 py-0.5 font-mono text-[10px] text-slate-800"
                      >
                        {code}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      className="inline-flex cursor-not-allowed items-center justify-center rounded-lg border border-slate-400 bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 opacity-95"
                    >
                      Crear diseño ejecutable — Próximamente
                    </button>
                    <button
                      type="button"
                      onClick={() => void copyTechnicalPilotEnvironmentDesign()}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-400 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-50"
                    >
                      {technicalPilotDesignCopied ? (
                        <Check className="h-3.5 w-3.5 shrink-0 text-slate-700" aria-hidden />
                      ) : (
                        <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      )}
                      Copiar diseño técnico
                    </button>
                  </div>
                  <div className="flex max-w-md flex-col gap-1">
                    <p className="text-[11px] leading-relaxed text-slate-500">
                      Este botón es informativo. El diseño ejecutable requiere una fase posterior explícita.
                    </p>
                    {technicalPilotDesignCopied ? (
                      <p className="text-[11px] font-medium text-slate-700">Diseño copiado</p>
                    ) : null}
                  </div>
                </div>

                <p className="mt-4 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-700">
                  <span className="font-semibold text-slate-900">Seguridad: </span>
                  {PILOT_TECH_DESIGN_SECURITY_NOTE}
                </p>
                </CollapsibleSection>

                <CollapsibleSection
                  id="real-config-blueprint"
                  title="Blueprint técnico de configuración real"
                  subtitle="Declarativo · Futuro · Sin aplicación real · Etapa restringida"
                  badges={["Blueprint", "No aplicado", "Futuro"]}
                  defaultOpen={false}
                >
                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Estado del blueprint
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {[
                        "Blueprint",
                        "No aplicado",
                        "Sin SQL",
                        "Sin escritura",
                        "Futuro",
                        "Requiere aprobación final",
                      ].map((label) => (
                        <li
                          key={label}
                          className="inline-flex rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700"
                        >
                          {label}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Propósito</p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-800">{REAL_CONFIG_BLUEPRINT_PURPOSE}</p>
                  </div>

                  <div className="mt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Configuraciones futuras
                    </p>
                    <ul className="mt-2 space-y-2">
                      {REAL_CONFIG_BLUEPRINT_FUTURE_ENTRIES.map((entry) => (
                        <li
                          key={entry.logicalKey}
                          className="rounded-md border border-slate-200 bg-white px-2.5 py-2 shadow-sm"
                        >
                          <p className="text-xs font-semibold text-slate-900">
                            {entry.letter}. {entry.title}
                          </p>
                          <p className="mt-0.5 font-mono text-[10px] text-slate-600">{entry.logicalKey}</p>
                          <p className="mt-1 text-xs text-slate-800">
                            <span className="font-semibold text-slate-900">Propósito: </span>
                            {entry.purpose}
                          </p>
                          <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            Campos futuros sugeridos
                          </p>
                          <ul className="mt-1 flex flex-wrap gap-1">
                            {entry.futureFields.map((field) => (
                              <li
                                key={field}
                                className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[9px] text-slate-700"
                              >
                                {field}
                              </li>
                            ))}
                          </ul>
                          <p className="mt-1.5 text-[11px] text-slate-600">
                            <span className="font-semibold text-slate-800">Fuente: </span>
                            {entry.source}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-700">
                            <span className="font-semibold text-slate-900">Estado: </span>
                            {entry.statusLabel}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Dependencias de configuración
                    </p>
                    <ol className="mt-2 space-y-1 font-mono text-[10px] leading-relaxed text-slate-800">
                      {REAL_CONFIG_BLUEPRINT_DEPENDENCY_ORDER.map((depKey, idx) => (
                        <li key={depKey} className="flex gap-2">
                          <span className="w-4 shrink-0 text-slate-500">{idx + 1}.</span>
                          <span>{depKey}</span>
                        </li>
                      ))}
                    </ol>
                    <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
                      {REAL_CONFIG_BLUEPRINT_DEPENDENCY_NOTE}
                    </p>
                  </div>

                  <div className="mt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Validaciones previas antes de aplicar blueprint
                    </p>
                    <ul className="mt-2 space-y-2">
                      {computeBlueprintValidationRows({
                        packagePayload,
                        meta,
                        humanConfirmationStatus: data.humanConfirmationStatus,
                        latestAdvanceMeetingDecision,
                      }).map((row) => (
                        <li
                          key={row.label}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-100 bg-white px-2.5 py-2"
                        >
                          <span className="text-xs text-slate-800">{row.label}</span>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${futureUnlockBadgeClass(row.badge)}`}
                          >
                            {futureUnlockBadgeLabel(row.badge)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5">
                    <p className="text-sm font-semibold text-slate-900">{REAL_CONFIG_BLUEPRINT_NOT_EXEC_TITLE}</p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-800">
                      {REAL_CONFIG_BLUEPRINT_NOT_EXEC_TEXT}
                    </p>
                  </div>

                  <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Riesgos del blueprint
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-slate-800">
                      {REAL_CONFIG_BLUEPRINT_RISKS.map((risk) => (
                        <li key={risk}>{risk}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Acciones bloqueadas
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {REAL_CONFIG_BLUEPRINT_BLOCKED_CODES.map((code) => (
                        <li
                          key={code}
                          className="rounded-md border border-slate-300 bg-white px-2 py-0.5 font-mono text-[10px] text-slate-800"
                        >
                          {code}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                      <button
                        type="button"
                        disabled
                        aria-disabled="true"
                        className="inline-flex cursor-not-allowed items-center justify-center rounded-lg border border-slate-400 bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 opacity-95"
                      >
                        Aplicar blueprint — Bloqueado
                      </button>
                      <button
                        type="button"
                        onClick={() => void copyRealConfigBlueprint()}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-400 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-50"
                      >
                        {realConfigBlueprintCopied ? (
                          <Check className="h-3.5 w-3.5 shrink-0 text-slate-700" aria-hidden />
                        ) : (
                          <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        )}
                        Copiar blueprint técnico
                      </button>
                    </div>
                    <div className="flex max-w-md flex-col gap-1">
                      <p className="text-[11px] leading-relaxed text-slate-500">
                        Este botón es informativo. Aplicar configuraciones reales requiere una fase posterior explícita.
                      </p>
                      {realConfigBlueprintCopied ? (
                        <p className="text-[11px] font-medium text-slate-700">Blueprint copiado</p>
                      ) : null}
                    </div>
                  </div>

                  <p className="mt-4 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-700">
                    <span className="font-semibold text-slate-900">Seguridad: </span>
                    {REAL_CONFIG_BLUEPRINT_SECURITY_NOTE}
                  </p>
                </CollapsibleSection>

                <CollapsibleSection
                  id="future-migration-spec"
                  title="Especificación de migración futura"
                  subtitle="Documentación prospectiva · Sin SQL ejecutable · Sin migración aplicada"
                  badges={["Especificación", "No ejecutada", "Futuro"]}
                  defaultOpen={false}
                >
                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Estado de la especificación
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {[
                        "Especificación",
                        "No ejecutada",
                        "Sin archivo SQL",
                        "Sin migración aplicada",
                        "Futuro",
                        "Requiere revisión técnica",
                      ].map((label) => (
                        <li
                          key={label}
                          className="inline-flex rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700"
                        >
                          {label}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Propósito</p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-800">{FUTURE_MIGRATION_SPEC_PURPOSE}</p>
                  </div>

                  <div className="mt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Áreas que podrían requerir migración futura
                    </p>
                    <ul className="mt-2 space-y-2">
                      {FUTURE_MIGRATION_SPEC_AREAS.map((area) => (
                        <li
                          key={area.key}
                          className="rounded-md border border-slate-200 bg-white px-2.5 py-2 shadow-sm"
                        >
                          <p className="text-xs font-semibold text-slate-900">
                            {area.letter}. {area.title}
                          </p>
                          <p className="mt-0.5 font-mono text-[10px] text-slate-600">{area.key}</p>
                          <p className="mt-1 text-xs text-slate-800">
                            <span className="font-semibold text-slate-900">Posible necesidad: </span>
                            {area.need}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-700">
                            <span className="font-semibold text-slate-800">Tipo futuro: </span>
                            {area.futureType}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-700">
                            <span className="font-semibold text-slate-800">Estado: </span>
                            {area.statusLabel}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Prevalidaciones antes de escribir cualquier SQL
                    </p>
                    <ul className="mt-2 space-y-2">
                      {computeMigrationSpecPrevalidationRows({
                        packagePayload,
                        meta,
                        humanConfirmationStatus: data.humanConfirmationStatus,
                        latestSnapshot,
                      }).map((row) => (
                        <li
                          key={row.label}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-100 bg-white px-2.5 py-2"
                        >
                          <span className="text-xs text-slate-800">{row.label}</span>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${futureUnlockBadgeClass(row.badge)}`}
                          >
                            {futureUnlockBadgeLabel(row.badge)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Orden sugerido de migración futura
                    </p>
                    <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs leading-relaxed text-slate-800">
                      {FUTURE_MIGRATION_SPEC_ORDER_STEPS.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5">
                    <p className="text-sm font-semibold text-slate-900">{FUTURE_MIGRATION_SPEC_SQL_SCOPE_TITLE}</p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-800">
                      {FUTURE_MIGRATION_SPEC_SQL_SCOPE_TEXT}
                    </p>
                    <p className="mt-2 text-[11px] font-medium text-slate-700">
                      {FUTURE_MIGRATION_SPEC_SQL_SCOPE_IMPORTANT}
                    </p>
                  </div>

                  <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Riesgos de migración futura
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-slate-800">
                      {FUTURE_MIGRATION_SPEC_RISKS.map((risk) => (
                        <li key={risk}>{risk}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Acciones bloqueadas
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {FUTURE_MIGRATION_SPEC_BLOCKED_CODES.map((code) => (
                        <li
                          key={code}
                          className="rounded-md border border-slate-300 bg-white px-2 py-0.5 font-mono text-[10px] text-slate-800"
                        >
                          {code}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                      <button
                        type="button"
                        disabled
                        aria-disabled="true"
                        className="inline-flex cursor-not-allowed items-center justify-center rounded-lg border border-slate-400 bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 opacity-95"
                      >
                        Generar migración SQL — Bloqueado
                      </button>
                      <button
                        type="button"
                        onClick={() => void copyFutureMigrationSpec()}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-400 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-50"
                      >
                        {futureMigrationSpecCopied ? (
                          <Check className="h-3.5 w-3.5 shrink-0 text-slate-700" aria-hidden />
                        ) : (
                          <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        )}
                        Copiar especificación de migración
                      </button>
                    </div>
                    <div className="flex max-w-md flex-col gap-1">
                      <p className="text-[11px] leading-relaxed text-slate-500">
                        Este botón es informativo. La generación de SQL requiere una fase posterior explícita.
                      </p>
                      {futureMigrationSpecCopied ? (
                        <p className="text-[11px] font-medium text-slate-700">Especificación copiada</p>
                      ) : null}
                    </div>
                  </div>

                  <p className="mt-4 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-700">
                    <span className="font-semibold text-slate-900">Seguridad: </span>
                    {FUTURE_MIGRATION_SPEC_SECURITY_NOTE}
                  </p>
                </CollapsibleSection>

                <CollapsibleSection
                  id="pre-sql-readiness-audit"
                  title="Auditoría de readiness pre-SQL"
                  subtitle="Guía manual · Sin introspección en runtime · Sin queries desde esta pantalla"
                  badges={["Auditoría pre-SQL", "Revisión manual", "Futuro"]}
                  defaultOpen={false}
                >
                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Estado de la auditoría
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {[
                        "Auditoría pre-SQL",
                        "No ejecuta queries",
                        "Sin SQL",
                        "Sin cambios de base",
                        "Requiere revisión manual",
                        "Futuro",
                      ].map((label) => (
                        <li
                          key={label}
                          className="inline-flex rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700"
                        >
                          {label}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Propósito</p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-800">{PRE_SQL_READINESS_PURPOSE}</p>
                  </div>

                  <div className="mt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Áreas a auditar antes de SQL
                    </p>
                    <ul className="mt-2 space-y-2">
                      {PRE_SQL_READINESS_AUDIT_AREAS.map((area) => (
                        <li
                          key={area.letter}
                          className="rounded-md border border-slate-200 bg-white px-2.5 py-2 shadow-sm"
                        >
                          <p className="text-xs font-semibold text-slate-900">
                            {area.letter}. {area.title}
                          </p>
                          <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            Posible estructura a revisar
                          </p>
                          <ul className="mt-1 flex flex-wrap gap-1">
                            {area.possibleStructures.map((s) => (
                              <li
                                key={s}
                                className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[9px] text-slate-700"
                              >
                                {s}
                              </li>
                            ))}
                          </ul>
                          <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            Preguntas
                          </p>
                          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs leading-relaxed text-slate-800">
                            {area.questions.map((q) => (
                              <li key={q}>{q}</li>
                            ))}
                          </ul>
                          <p className="mt-2 text-[11px] text-slate-700">
                            <span className="font-semibold text-slate-900">Estado: </span>
                            {area.statusLine}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Checklist de readiness pre-SQL
                    </p>
                    <ul className="mt-2 space-y-2">
                      {computePreSqlReadinessChecklistRows({
                        packagePayload,
                        latestSnapshot,
                      }).map((row) => (
                        <li
                          key={row.label}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-100 bg-white px-2.5 py-2"
                        >
                          <span className="text-xs text-slate-800">{row.label}</span>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${futureUnlockBadgeClass(row.badge)}`}
                          >
                            {futureUnlockBadgeLabel(row.badge)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Preguntas técnicas antes de migrar
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-slate-800">
                      {PRE_SQL_TECHNICAL_QUESTIONS.map((q) => (
                        <li key={q}>{q}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5">
                    <p className="text-sm font-semibold text-slate-900">{PRE_SQL_DECISION_PENDING_TITLE}</p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-800">{PRE_SQL_DECISION_PENDING_TEXT}</p>
                    <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Opciones documentales
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                      No se elige automáticamente una opción en esta fase; solo se listan para decisión manual.
                    </p>
                    <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs text-slate-800">
                      {PRE_SQL_DECISION_DOCUMENT_OPTIONS.map((opt) => (
                        <li key={opt}>{opt}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Riesgos pre-SQL
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-slate-800">
                      {PRE_SQL_READINESS_RISKS.map((risk) => (
                        <li key={risk}>{risk}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Acciones bloqueadas
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {PRE_SQL_READINESS_AUDIT_BLOCKED_CODES.map((code) => (
                        <li
                          key={code}
                          className="rounded-md border border-slate-300 bg-white px-2 py-0.5 font-mono text-[10px] text-slate-800"
                        >
                          {code}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                      <button
                        type="button"
                        disabled
                        aria-disabled="true"
                        className="inline-flex cursor-not-allowed items-center justify-center rounded-lg border border-slate-400 bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 opacity-95"
                      >
                        Ejecutar auditoría SQL — Bloqueado
                      </button>
                      <button
                        type="button"
                        onClick={() => void copyPreSqlReadinessAudit()}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-400 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-50"
                      >
                        {preSqlReadinessAuditCopied ? (
                          <Check className="h-3.5 w-3.5 shrink-0 text-slate-700" aria-hidden />
                        ) : (
                          <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        )}
                        Copiar auditoría pre-SQL
                      </button>
                    </div>
                    <div className="flex max-w-md flex-col gap-1">
                      <p className="text-[11px] leading-relaxed text-slate-500">
                        Este botón es informativo. La auditoría real de base requiere una fase posterior explícita y
                        revisión manual.
                      </p>
                      {preSqlReadinessAuditCopied ? (
                        <p className="text-[11px] font-medium text-slate-700">Auditoría copiada</p>
                      ) : null}
                    </div>
                  </div>

                  <p className="mt-4 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-700">
                    <span className="font-semibold text-slate-900">Seguridad: </span>
                    {PRE_SQL_READINESS_SECURITY_NOTE}
                  </p>
                </CollapsibleSection>
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
                  <table className="min-w-[880px] w-full text-left text-sm text-slate-800">
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
                        <th className="min-w-[200px] max-w-[280px] py-2 pr-3">Resumen</th>
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
                          <td className="min-w-[200px] max-w-[280px] py-2 pr-3 align-top text-xs text-slate-700">
                            {s.hasExecutiveSummary ? (
                              <p className="font-medium text-slate-800">Resumen ejecutivo guardado</p>
                            ) : (
                              <>
                                <p className="font-medium text-slate-600">Sin resumen ejecutivo</p>
                                <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                                  No disponible en esta evidencia.
                                </p>
                              </>
                            )}
                            {s.executiveSummaryText ? (
                              <>
                                <details className="mt-2 rounded-md border border-slate-200 bg-slate-50/60 px-2 py-1.5">
                                  <summary className="cursor-pointer select-none text-[11px] font-medium text-slate-700 hover:text-slate-900">
                                    Ver resumen
                                  </summary>
                                  <pre className="mt-2 max-h-52 overflow-auto whitespace-pre-wrap break-words rounded border border-slate-200 bg-white p-2 font-sans text-[11px] leading-relaxed text-slate-800">
                                    {s.executiveSummaryText}
                                  </pre>
                                </details>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => void copySnapshotSavedSummary(s.id, s.executiveSummaryText!)}
                                    className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-800 shadow-sm hover:bg-slate-50"
                                  >
                                    <Copy className="h-3 w-3 shrink-0" aria-hidden />
                                    Copiar resumen guardado
                                  </button>
                                  {snapshotSummaryCopiedId === s.id ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600">
                                      <Check className="h-3.5 w-3.5 text-slate-600" aria-hidden />
                                      Resumen guardado copiado
                                    </span>
                                  ) : null}
                                </div>
                              </>
                            ) : null}
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

            <CollapsibleSection
              id="draft-warnings-json"
              title="Warnings"
              subtitle="Respuesta del borrador · Solo lectura · Sin modificación"
              badges={
                warningsCount > 0
                  ? [`${warningsCount} advertencia(s)`]
                  : ["Sin advertencias activas"]
              }
              defaultOpen={false}
            >
              <JsonBlock title="Warnings" value={data.warnings} />
            </CollapsibleSection>

            <CollapsibleSection
              id="draft-blocked-actions-json"
              title="Acciones bloqueadas (blocked_actions)"
              subtitle="Códigos declarados por el constructor · Solo lectura"
              badges={
                blockedCount > 0
                  ? [`${blockedCount} bloqueada(s)`]
                  : ["Sin acciones bloqueadas listadas"]
              }
              defaultOpen={false}
            >
              <JsonBlock title="Acciones bloqueadas (blocked_actions)" value={data.blockedActions} />
            </CollapsibleSection>

            <CollapsibleSection
              id="package-payload-section"
              title="Contenido del paquete (package_payload)"
              subtitle="JSON solo lectura · Zeta no se edita desde aquí"
              badges={["Solo lectura", "Sin escritura externa"]}
              defaultOpen={false}
            >
              <div className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  {PAYLOAD_SECTION_KEYS.map(({ key, label }) => (
                    <JsonBlock key={key} title={label} value={packagePayload[key]} />
                  ))}
                </div>
                <JsonBlock title="package_payload completo" value={packagePayload} />
              </div>
            </CollapsibleSection>
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
