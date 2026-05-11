"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  FileText,
  FileImage,
  Presentation,
  MessageSquare,
  Mail,
  Globe,
  BarChart3,
  Users,
  Workflow,
  Upload,
  Plus,
  Trash2,
  ChevronDown,
  ChevronLeft,
  Info,
  AlertCircle,
} from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { FieldQualityHint } from "@/components/constructor/FieldQualityHint";
import { StepReadinessPanel } from "@/components/constructor/StepReadinessPanel";
import { CRM_SETUP_STEPS } from "@/lib/config/crmMode";
import { clampCompletionPercent, countSelectedValues, textLength } from "@/lib/constructor/readiness/helpers";
import { getConstructorOverallProgress } from "@/lib/constructor/readiness/overallProgress";
import {
  READINESS_SUMMARY_LABEL,
  STATUS_VALUE,
} from "@/lib/constructor/readiness/statusStyles";
import type {
  BaseReadiness,
  FieldQualityHintValue,
  QualityStatus,
} from "@/lib/constructor/readiness/types";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type TipoDocumento =
  | "excel"
  | "pdf"
  | "word"
  | "presentacion"
  | "captura"
  | "whatsapp"
  | "email"
  | "web"
  | "reporte"
  | "organigrama"
  | "flujo"
  | "otro";

type ImportanciaDoc = "alta" | "media" | "baja";

type DocumentoRegistrado = {
  id: string;
  nombre: string;
  tipo: TipoDocumento | "";
  usoActual: string;
  etapaComercial: string;
  importancia: ImportanciaDoc | "";
};

type DocumentoForm = Omit<DocumentoRegistrado, "id">;

type DocumentosForm = {
  form: DocumentoForm;
  lista: DocumentoRegistrado[];
  tiposSeleccionados: TipoDocumento[];
};

// ─── Catálogo de tipos de documento ──────────────────────────────────────────

const TIPO_DOCS: {
  id: TipoDocumento;
  label: string;
  descripcion: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: "excel",
    label: "Excel / Planilla",
    descripcion: "Bases de datos, seguimiento de clientes, precios, pipelines manuales.",
    icon: FileSpreadsheet,
  },
  {
    id: "pdf",
    label: "PDF",
    descripcion: "Brochures, propuestas comerciales, contratos, presentaciones exportadas.",
    icon: FileText,
  },
  {
    id: "word",
    label: "Word / Documento",
    descripcion: "Procedimientos, guiones de venta, argumentarios, descripciones de servicio.",
    icon: FileText,
  },
  {
    id: "presentacion",
    label: "Presentación",
    descripcion: "PowerPoint, Keynote o Google Slides usados con clientes o internamente.",
    icon: Presentation,
  },
  {
    id: "captura",
    label: "Captura de pantalla",
    descripcion: "Capturas de CRM anterior, WhatsApp, email, sistema de gestión actual.",
    icon: FileImage,
  },
  {
    id: "whatsapp",
    label: "Conversaciones WhatsApp",
    descripcion: "Chats exportados con prospectos o clientes que muestren el proceso real.",
    icon: MessageSquare,
  },
  {
    id: "email",
    label: "Emails comerciales",
    descripcion: "Plantillas, respuestas tipo, secuencias de seguimiento por email.",
    icon: Mail,
  },
  {
    id: "web",
    label: "Sitio web / Landing",
    descripcion: "URL del sitio, landing pages, formularios de contacto activos.",
    icon: Globe,
  },
  {
    id: "reporte",
    label: "Reporte / Dashboard",
    descripcion: "Reportes de ventas, métricas actuales, KPIs del negocio.",
    icon: BarChart3,
  },
  {
    id: "organigrama",
    label: "Organigrama / Equipo",
    descripcion: "Estructura del equipo comercial, roles y responsabilidades.",
    icon: Users,
  },
  {
    id: "flujo",
    label: "Flujo / Proceso",
    descripcion: "Diagramas de proceso, mapas de customer journey, flujos de venta.",
    icon: Workflow,
  },
  {
    id: "otro",
    label: "Otro",
    descripcion: "Cualquier material que aporte contexto sobre cómo opera el negocio.",
    icon: FileText,
  },
];

const ETAPAS_COMERCIALES = [
  "Prospección",
  "Primer contacto",
  "Calificación",
  "Propuesta",
  "Negociación",
  "Cierre",
  "Post-venta",
  "Todas las etapas",
  "No aplica",
];

const IMPORTANCIA_OPTIONS: { value: ImportanciaDoc; label: string; className: string }[] = [
  { value: "alta", label: "Alta — Esencial para el diagnóstico", className: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100" },
  { value: "media", label: "Media — Complementa el análisis", className: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100" },
  { value: "baja", label: "Baja — Referencia adicional", className: "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100" },
];

const INITIAL_FORM: DocumentoForm = {
  nombre: "",
  tipo: "",
  usoActual: "",
  etapaComercial: "",
  importancia: "",
};

const INITIAL_DOCUMENTOS: DocumentosForm = {
  form: INITIAL_FORM,
  lista: [],
  tiposSeleccionados: [],
};

const TIPO_DOC_IDS = new Set<TipoDocumento>(TIPO_DOCS.map((doc) => doc.id));
const IMPORTANCIA_IDS = new Set<ImportanciaDoc>(
  IMPORTANCIA_OPTIONS.map((opt) => opt.value)
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asTipoDocumento(value: unknown): TipoDocumento | "" {
  return typeof value === "string" && TIPO_DOC_IDS.has(value as TipoDocumento)
    ? (value as TipoDocumento)
    : "";
}

function asImportancia(value: unknown): ImportanciaDoc | "" {
  return typeof value === "string" && IMPORTANCIA_IDS.has(value as ImportanciaDoc)
    ? (value as ImportanciaDoc)
    : "";
}

function normalizeDocumentoForm(value: Record<string, unknown>): DocumentoForm {
  return {
    nombre: asString(value.nombre),
    tipo: asTipoDocumento(value.tipo),
    usoActual: asString(value.usoActual),
    etapaComercial: asString(value.etapaComercial),
    importancia: asImportancia(value.importancia),
  };
}

function normalizeDocumentoRegistrado(
  value: unknown,
  index: number
): DocumentoRegistrado | null {
  if (!isRecord(value)) return null;
  const form = normalizeDocumentoForm(value);
  return {
    id: asString(value.id) || `documento-${index}`,
    ...form,
  };
}

type DocumentosReadiness = BaseReadiness;

type DocumentosReadinessInput = {
  form: DocumentoForm;
  lista: DocumentoRegistrado[];
  tiposSeleccionados: TipoDocumento[];
};

function includesAnyKeyword(haystack: string, keywords: readonly string[]): boolean {
  const h = haystack.toLowerCase();
  return keywords.some((k) => h.includes(k));
}

function evaluateDocumentosReadiness(
  data: DocumentosReadinessInput
): DocumentosReadiness {
  const { form, lista, tiposSeleccionados } = data;
  const tiposCount = countSelectedValues(tiposSeleccionados);

  let tiposStatus: QualityStatus;
  let tiposDetail: string;
  if (tiposCount === 0) {
    tiposStatus = "danger";
    tiposDetail = "Sin tipos seleccionados.";
  } else if (tiposCount === 1) {
    tiposStatus = "warning";
    tiposDetail = "Un solo tipo seleccionado; sumá más si aplica.";
  } else {
    tiposStatus = "good";
    tiposDetail = "Variedad de tipos de fuente marcada.";
  }

  let materialesLen = 0;
  for (const doc of lista) {
    materialesLen += textLength(doc.nombre) + textLength(doc.usoActual);
  }

  let materialesStatus: QualityStatus;
  let materialesDetail: string;
  if (lista.length === 0) {
    materialesStatus = "danger";
    materialesDetail = "Sin documentos registrados en la lista.";
  } else if (materialesLen < 30) {
    materialesStatus = "warning";
    materialesDetail = "Pocos detalles sobre los materiales disponibles.";
  } else {
    materialesStatus = "good";
    materialesDetail = "Buen nivel de detalle sobre materiales.";
  }

  const calidadHaystack = lista.map((d) => `${d.nombre} ${d.usoActual}`).join(" ");
  const CALIDAD_KEYWORDS = [
    "actualizado",
    "actualizados",
    "vigente",
    "ordenado",
    "ordenados",
    "organizado",
    "desactualizado",
    "desactualizados",
    "incompleto",
    "incompletos",
    "faltante",
    "faltantes",
  ];
  const hasCalidadKeyword = includesAnyKeyword(calidadHaystack, CALIDAD_KEYWORDS);
  const docsConImportancia = lista.filter((d) => d.importancia !== "").length;

  let calidadStatus: QualityStatus;
  let calidadDetail: string;
  if (lista.length === 0) {
    calidadStatus = "warning";
    calidadDetail = "Registrá documentos para describir calidad y vigencia.";
  } else if (
    hasCalidadKeyword ||
    docsConImportancia >= Math.ceil(lista.length / 2)
  ) {
    calidadStatus = "good";
    calidadDetail = "Hay señales de orden, vigencia o importancia marcada.";
  } else {
    calidadStatus = "warning";
    calidadDetail = "Indicá si los materiales están actualizados u ordenados.";
  }

  const contextoPieces = [...lista.map((d) => d.usoActual), form.usoActual];
  let contextoLen = 0;
  for (const s of contextoPieces) {
    contextoLen += textLength(s);
  }
  const contextoHaystack = contextoPieces.join(" ");
  const CONTEXTO_KEYWORDS = [
    "faltante",
    "faltan",
    "no tenemos",
    "duda",
    "dudas",
    "pendiente",
    "revisar",
    "necesitamos",
  ];
  const hasContextoKeyword = includesAnyKeyword(contextoHaystack, CONTEXTO_KEYWORDS);

  let contextStatus: QualityStatus;
  let contextDetail: string;
  if (contextoLen >= 30) {
    contextStatus = "good";
    contextDetail = "Contexto útil sobre uso, faltantes o revisión.";
  } else if (contextoLen > 0 || hasContextoKeyword) {
    contextStatus = "warning";
    contextDetail = "Ampliá qué falta o qué debería revisar el diagnóstico.";
  } else {
    contextStatus = "warning";
    contextDetail = "Anotá faltantes o dudas para la IA.";
  }

  const completionPercent = clampCompletionPercent(
    Math.round(
      30 * STATUS_VALUE[tiposStatus] +
        35 * STATUS_VALUE[materialesStatus] +
        15 * STATUS_VALUE[calidadStatus] +
        20 * STATUS_VALUE[contextStatus]
    )
  );

  const hasDanger = [
    tiposStatus,
    materialesStatus,
    calidadStatus,
    contextStatus,
  ].some((s) => s === "danger");

  let overallStatus: QualityStatus;
  if (completionPercent >= 80 && !hasDanger) {
    overallStatus = "good";
  } else if (completionPercent >= 55) {
    overallStatus = "warning";
  } else {
    overallStatus = "danger";
  }

  let nextAction = "Podés guardar y continuar a Diagnóstico.";
  if (tiposCount === 0) {
    nextAction = "Seleccioná al menos un tipo de documento fuente.";
  } else if (lista.length === 0) {
    nextAction =
      "Describí qué documentos o materiales tiene hoy la empresa.";
  } else if (materialesLen < 30) {
    nextAction = "Agregá más detalle sobre los materiales disponibles.";
  } else if (contextoLen < 30 && !hasContextoKeyword) {
    nextAction =
      "Agregá qué documentos faltan o qué debería revisar la IA.";
  }

  const fieldHints: Record<string, FieldQualityHintValue> = {};

  if (tiposCount === 0) {
    fieldHints.tiposDocumentos = {
      status: "danger",
      text: "Seleccioná los tipos de fuentes disponibles para orientar el diagnóstico.",
    };
  } else if (tiposCount === 1) {
    fieldHints.tiposDocumentos = {
      status: "warning",
      text: "Agregar más tipos de documentos mejora el contexto del CRM.",
    };
  }

  if (lista.length === 0) {
    fieldHints.materialesDisponibles = {
      status: "danger",
      text: "Campo clave: describí qué materiales existen hoy.",
    };
  } else if (materialesLen < 30) {
    fieldHints.materialesDisponibles = {
      status: "warning",
      text: "Agregá más detalle: origen, formato, vigencia y utilidad.",
    };
  }

  if (
    lista.length > 0 &&
    !hasCalidadKeyword &&
    docsConImportancia < Math.ceil(lista.length / 2)
  ) {
    fieldHints.calidadDocumentos = {
      status: "warning",
      text: "Indicá si los documentos están actualizados, completos o desordenados.",
    };
  }

  if (contextoLen < 30 && tiposCount > 0) {
    fieldHints.contextoIA = {
      status: "warning",
      text: "Anotá documentos faltantes o dudas para evitar supuestos en Diagnóstico.",
    };
  }

  return {
    completionPercent,
    overallStatus,
    overallLabel: READINESS_SUMMARY_LABEL[overallStatus],
    nextAction,
    sections: [
      {
        key: "tipos",
        label: "Tipos de documentos",
        status: tiposStatus,
        detail: tiposDetail,
      },
      {
        key: "materiales",
        label: "Materiales disponibles",
        status: materialesStatus,
        detail: materialesDetail,
      },
      {
        key: "calidad",
        label: "Calidad y actualización",
        status: calidadStatus,
        detail: calidadDetail,
      },
      {
        key: "contexto",
        label: "Faltantes / contexto IA",
        status: contextStatus,
        detail: contextDetail,
      },
    ],
    fieldHints,
  };
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const LABEL_CLASS = "block text-xs font-semibold text-slate-600 mb-1";
const INPUT_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300";
const SELECT_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300";

// ─── Subcomponentes ───────────────────────────────────────────────────────────

/** Fase 5N: acordeón local (un panel abierto a la vez; el abierto puede cerrarse). */
type CollapsibleDocumentosSectionProps = {
  id: string;
  letter: string;
  title: string;
  description?: string;
  badge?: ReactNode;
  statusLabel?: string;
  isOpen: boolean;
  onToggle: (id: string) => void;
  children: ReactNode;
};

function CollapsibleDocumentosSection({
  id,
  letter,
  title,
  description,
  badge,
  statusLabel,
  isOpen,
  onToggle,
  children,
}: CollapsibleDocumentosSectionProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={isOpen}
        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-900 text-[11px] font-bold text-white">
          {letter}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug text-slate-800">{title}</p>
          {statusLabel ? (
            <p className="mt-0.5 text-[11px] text-slate-500">{statusLabel}</p>
          ) : null}
        </div>
        {badge ? (
          <div className="hidden max-w-[40%] shrink-0 sm:flex sm:justify-end">{badge}</div>
        ) : null}
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <span className="text-[10px] font-medium text-slate-500">
            {isOpen ? "Contraer" : "Expandir"}
          </span>
          <ChevronDown
            className={[
              "h-4 w-4 text-slate-500 transition-transform",
              isOpen ? "rotate-180" : "",
            ].join(" ")}
            aria-hidden
          />
        </div>
      </button>
      {badge ? (
        <div className="border-t border-slate-100 px-4 py-2 sm:hidden">{badge}</div>
      ) : null}
      {isOpen ? (
        <div className="border-t border-slate-100 bg-slate-50/40 px-4 pb-4 pt-3">
          {description ? (
            <p className="mb-4 text-xs leading-relaxed text-slate-500">{description}</p>
          ) : null}
          {children}
        </div>
      ) : null}
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function DocumentosPage() {
  const [form, setForm] = useState<DocumentoForm>(INITIAL_FORM);
  const [lista, setLista] = useState<DocumentoRegistrado[]>(INITIAL_DOCUMENTOS.lista);
  const [tiposSeleccionados, setTiposSeleccionados] = useState<TipoDocumento[]>(
    INITIAL_DOCUMENTOS.tiposSeleccionados
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [openDocumentosSection, setOpenDocumentosSection] =
    useState<string>("materiales");

  useEffect(() => {
    let cancelled = false;

    async function loadSetup() {
      setLoading(true);
      setSaveError(null);

      try {
        const res = await fetch("/api/admin/constructor/setup", {
          cache: "no-store",
          credentials: "same-origin",
          headers: { Accept: "application/json" },
        });

        const json = (await res.json().catch(() => null)) as {
          data?: { documentos?: unknown } | null;
          error?: string | null;
        } | null;

        if (res.redirected || !json) {
          if (!cancelled) {
            setSaveError("No se pudo cargar la configuración guardada.");
          }
          return;
        }

        if (!res.ok) {
          if (!cancelled) {
            setSaveError(json?.error ?? "No se pudo cargar la configuración guardada.");
          }
          return;
        }

        const documentos = json?.data?.documentos;

        if (
          documentos &&
          typeof documentos === "object" &&
          !Array.isArray(documentos) &&
          Object.keys(documentos).length > 0
        ) {
          if (!cancelled) {
            const loaded = documentos as Partial<DocumentosForm>;
            const loadedRecord = documentos as Record<string, unknown>;

            setForm(
              isRecord(loadedRecord.form)
                ? normalizeDocumentoForm(loadedRecord.form)
                : INITIAL_FORM
            );
            setLista(
              Array.isArray(loaded.lista)
                ? loaded.lista
                    .map((doc, index) => normalizeDocumentoRegistrado(doc, index))
                    .filter((doc): doc is DocumentoRegistrado => doc !== null)
                : INITIAL_DOCUMENTOS.lista
            );
            setTiposSeleccionados(
              Array.isArray(loaded.tiposSeleccionados)
                ? loaded.tiposSeleccionados.filter((tipo): tipo is TipoDocumento =>
                    TIPO_DOC_IDS.has(tipo as TipoDocumento)
                  )
                : INITIAL_DOCUMENTOS.tiposSeleccionados
            );
          }
        }
      } catch {
        if (!cancelled) {
          setSaveError(
            "No se pudo cargar la configuración guardada. Podés completar los documentos y guardar nuevamente."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSetup();

    return () => {
      cancelled = true;
    };
  }, []);

  function agregarDocumento() {
    if (!form.nombre.trim()) return;
    const nuevo: DocumentoRegistrado = {
      id: crypto.randomUUID(),
      ...form,
    };
    setLista((prev) => [...prev, nuevo]);
    setForm(INITIAL_FORM);
  }

  function quitarDocumento(id: string) {
    setLista((prev) => prev.filter((d) => d.id !== id));
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    const payloadDocumentos: DocumentosForm = {
      form,
      lista,
      tiposSeleccionados,
    };

    try {
      const res = await fetch("/api/admin/constructor/setup", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "documentos",
          mark_completed: true,
          data: payloadDocumentos,
        }),
      });

      const json = (await res.json().catch(() => null)) as {
        data?: unknown;
        error?: string | null;
      } | null;

      if (res.redirected || !json) {
        setSaveError("No se pudo guardar. Revisá que la sesión siga activa.");
        return;
      }

      if (!res.ok || json?.error) {
        setSaveError(json?.error ?? "Error al guardar");
      } else {
        setSaveMessage("Documentos guardados correctamente.");
      }
    } catch {
      setSaveError("Error de red al guardar");
    } finally {
      setSaving(false);
    }
  }

  function handleDocumentosSectionToggle(id: string) {
    setOpenDocumentosSection((prev) => (prev === id ? "" : id));
  }

  const TIPO_LABEL: Record<TipoDocumento, string> = Object.fromEntries(
    TIPO_DOCS.map((t) => [t.id, t.label])
  ) as Record<TipoDocumento, string>;

  const IMPORTANCIA_LABEL: Record<ImportanciaDoc, string> = {
    alta: "Alta",
    media: "Media",
    baja: "Baja",
  };

  const step = CRM_SETUP_STEPS.find((s) => s.id === "documentos");

  const readiness = evaluateDocumentosReadiness({
    form,
    lista,
    tiposSeleccionados,
  });

  return (
    <PageContainer>
      <div className="space-y-6">

        {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          <Link href="/admin/constructor" className="hover:text-slate-800 transition-colors">
            ← Constructor CRM
          </Link>
          <span>/</span>
          <Link href="/admin/constructor/empresa" className="hover:text-slate-800 transition-colors">
            Empresa
          </Link>
          <span>/</span>
          <Link href="/admin/constructor/cuestionario" className="hover:text-slate-800 transition-colors">
            Cuestionario
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-800">Documentos fuente</span>
        </div>

        {/* ── Aviso de persistencia ─────────────────────────────────────── */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3">
          <p className="text-xs font-semibold text-amber-800">
            {loading
              ? "Cargando documentos guardados..."
              : "Este paso guarda los documentos fuente en la base de datos"}
          </p>
          <p className="mt-0.5 text-xs text-amber-700">
            Usá <strong>Guardar documentos</strong> antes de avanzar al
            siguiente bloque.
          </p>
        </div>

        {/* ── Card principal ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8">

          {/* Header */}
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  Paso {step?.step ?? 3} de {CRM_SETUP_STEPS.length}
                </span>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                {step?.title ?? "Documentos fuente"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                {step?.description ??
                  "Registrá los materiales, archivos y recursos que ya existen en tu negocio."}
                {" "}No se suben archivos todavía — solo describís qué tenés para que
                el sistema entienda con qué trabajar en el diagnóstico.
              </p>
            </div>
          </div>

          <StepReadinessPanel
            title="Estado de documentos fuente"
            readiness={readiness}
            overallProgress={getConstructorOverallProgress({
              currentStep: "documentos",
              currentStepPercent: readiness.completionPercent,
            })}
          />

          <div className="space-y-4">
          {/* ── A: Tipos de documentos ──────────────────────────────────── */}
          <CollapsibleDocumentosSection
            id="materiales"
            letter="A"
            title="¿Qué tipos de documentos tenés?"
            isOpen={openDocumentosSection === "materiales"}
            onToggle={handleDocumentosSectionToggle}
          >
            <p className="mb-4 text-xs text-slate-500">
              Seleccioná todos los tipos que aplican a tu negocio. Podés marcar más de uno.
            </p>
            <FieldQualityHint hint={readiness.fieldHints.tiposDocumentos} />
            {tiposSeleccionados.length > 0 && (
              <p className="mb-3 text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700">{tiposSeleccionados.length}</span> tipo{tiposSeleccionados.length !== 1 ? "s" : ""} seleccionado{tiposSeleccionados.length !== 1 ? "s" : ""}
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {TIPO_DOCS.map((tipo) => {
                const Icon = tipo.icon;
                const isSelected = tiposSeleccionados.includes(tipo.id);
                return (
                  <button
                    key={tipo.id}
                    type="button"
                    onClick={() =>
                      setTiposSeleccionados((prev) =>
                        prev.includes(tipo.id)
                          ? prev.filter((t) => t !== tipo.id)
                          : [...prev, tipo.id]
                      )
                    }
                    className={[
                      "flex items-start gap-3 rounded-xl border p-3 text-left transition-all",
                      isSelected
                        ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white",
                    ].join(" ")}
                  >
                    <Icon
                      className={[
                        "mt-0.5 h-4 w-4 shrink-0",
                        isSelected ? "text-white" : "text-slate-400",
                      ].join(" ")}
                    />
                    <div>
                      <p
                        className={[
                          "text-xs font-semibold",
                          isSelected ? "text-white" : "text-slate-800",
                        ].join(" ")}
                      >
                        {tipo.label}
                      </p>
                      <p
                        className={[
                          "mt-0.5 text-[11px] leading-relaxed",
                          isSelected ? "text-slate-300" : "text-slate-500",
                        ].join(" ")}
                      >
                        {tipo.descripcion}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </CollapsibleDocumentosSection>

          {/* ── B: Dropzone simulado ────────────────────────────────────── */}
          <CollapsibleDocumentosSection
            id="carga"
            letter="B"
            title="Zona de carga (próximamente)"
            isOpen={openDocumentosSection === "carga"}
            onToggle={handleDocumentosSectionToggle}
          >
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200">
                <Upload className="h-5 w-5 text-slate-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  La carga real de archivos estará disponible en un bloque posterior
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Por ahora, registrá los documentos manualmente en la sección C.
                  El sistema usará esa descripción para el diagnóstico IA.
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                <Info className="h-3 w-3" />
                Disponible en Bloque 2A — Supabase Storage
              </div>
            </div>
          </CollapsibleDocumentosSection>

          {/* ── C: Registro manual ──────────────────────────────────────── */}
          <CollapsibleDocumentosSection
            id="registro"
            letter="C"
            title="Registrar documento manualmente"
            isOpen={openDocumentosSection === "registro"}
            onToggle={handleDocumentosSectionToggle}
          >
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="grid gap-4 sm:grid-cols-2">

                <div className="sm:col-span-2">
                  <label className={LABEL_CLASS}>Nombre del documento</label>
                  <input
                    type="text"
                    className={INPUT_CLASS}
                    placeholder="Ej: Planilla de seguimiento de clientes 2025"
                    value={form.nombre}
                    onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                  />
                </div>

                <div>
                  <label className={LABEL_CLASS}>Tipo</label>
                  <select
                    className={SELECT_CLASS}
                    value={form.tipo}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, tipo: e.target.value as TipoDocumento }))
                    }
                  >
                    <option value="">Seleccionar tipo…</option>
                    {TIPO_DOCS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={LABEL_CLASS}>Etapa comercial donde se usa</label>
                  <select
                    className={SELECT_CLASS}
                    value={form.etapaComercial}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, etapaComercial: e.target.value }))
                    }
                  >
                    <option value="">Seleccionar etapa…</option>
                    {ETAPAS_COMERCIALES.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className={LABEL_CLASS}>¿Para qué se usa actualmente?</label>
                  <input
                    type="text"
                    className={INPUT_CLASS}
                    placeholder="Ej: El vendedor lo completa luego de cada visita"
                    value={form.usoActual}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, usoActual: e.target.value }))
                    }
                  />
                  <FieldQualityHint hint={readiness.fieldHints.contextoIA} />
                </div>

                <div className="sm:col-span-2">
                  <label className={LABEL_CLASS}>Importancia para el diagnóstico</label>
                  <div className="flex flex-wrap gap-2">
                    {IMPORTANCIA_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setForm((p) => ({
                            ...p,
                            importancia:
                              p.importancia === opt.value ? "" : opt.value,
                          }))
                        }
                        className={[
                          "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                          form.importancia === opt.value
                            ? opt.className + " ring-2 ring-offset-1 ring-slate-400"
                            : opt.className,
                        ].join(" ")}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <FieldQualityHint hint={readiness.fieldHints.calidadDocumentos} />
                </div>

              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={agregarDocumento}
                  disabled={!form.nombre.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Agregar a lista temporal
                </button>
                {!form.nombre.trim() && (
                  <p className="text-xs text-slate-400">
                    El nombre es obligatorio para agregar.
                  </p>
                )}
              </div>
            </div>
          </CollapsibleDocumentosSection>

          {/* ── D: Lista de documentos registrados ──────────────────────── */}
          <CollapsibleDocumentosSection
            id="lista"
            letter="D"
            title="Documentos registrados en esta sesión"
            isOpen={openDocumentosSection === "lista"}
            onToggle={handleDocumentosSectionToggle}
          >
            <FieldQualityHint hint={readiness.fieldHints.materialesDisponibles} />
            {lista.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center">
                <AlertCircle className="h-8 w-8 text-slate-300" />
                <p className="text-sm font-medium text-slate-500">
                  Todavía no registraste ningún documento
                </p>
                <p className="text-xs text-slate-400">
                  Completá el formulario de la sección C y hacé clic en "Agregar a lista temporal".
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-2.5 text-left font-semibold text-slate-600">Nombre</th>
                      <th className="px-4 py-2.5 text-left font-semibold text-slate-600">Tipo</th>
                      <th className="px-4 py-2.5 text-left font-semibold text-slate-600">Etapa</th>
                      <th className="px-4 py-2.5 text-left font-semibold text-slate-600">Uso actual</th>
                      <th className="px-4 py-2.5 text-left font-semibold text-slate-600">Importancia</th>
                      <th className="px-4 py-2.5 text-left font-semibold text-slate-600" />
                    </tr>
                  </thead>
                  <tbody>
                    {lista.map((doc) => (
                      <tr
                        key={doc.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                      >
                        <td className="px-4 py-2.5 font-medium text-slate-800">
                          {doc.nombre}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">
                          {doc.tipo ? TIPO_LABEL[doc.tipo as TipoDocumento] : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">
                          {doc.etapaComercial || "—"}
                        </td>
                        <td className="max-w-[200px] px-4 py-2.5 text-slate-500">
                          {doc.usoActual || "—"}
                        </td>
                        <td className="px-4 py-2.5">
                          {doc.importancia ? (
                            <span
                              className={[
                                "rounded-full px-2 py-0.5 font-medium",
                                doc.importancia === "alta"
                                  ? "bg-red-50 text-red-700"
                                  : doc.importancia === "media"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-slate-100 text-slate-600",
                              ].join(" ")}
                            >
                              {IMPORTANCIA_LABEL[doc.importancia as ImportanciaDoc]}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <button
                            type="button"
                            onClick={() => quitarDocumento(doc.id)}
                            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Quitar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-2 text-[11px] text-slate-400">
              Esta lista se guarda como referencia del Constructor. La carga real
              de archivos se conectará en un bloque posterior.
            </p>
          </CollapsibleDocumentosSection>

          {/* ── E: Preguntas guía ────────────────────────────────────────── */}
          <CollapsibleDocumentosSection
            id="guia"
            letter="E"
            title="Preguntas guía"
            isOpen={openDocumentosSection === "guia"}
            onToggle={handleDocumentosSectionToggle}
          >
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
              <p className="mb-3 text-xs font-semibold text-blue-800">
                Usá estas preguntas para identificar qué documentos buscar en tu negocio:
              </p>
              <ul className="space-y-2 text-xs text-blue-700">
                {[
                  "¿Tenés alguna planilla donde registrás o seguís clientes potenciales?",
                  "¿Existe algún documento que los vendedores usan como guión o referencia en las reuniones?",
                  "¿Tenés propuestas comerciales, presupuestos o cotizaciones tipo que enviás a clientes?",
                  "¿Hay reportes de ventas actuales? ¿Con qué frecuencia se generan y quién los ve?",
                  "¿Usás algún sistema de gestión o CRM previo? ¿Se puede exportar algo de ahí?",
                  "¿Hay conversaciones de WhatsApp, correos o chats que muestren cómo se cierra realmente una venta?",
                  "¿Existe algún material de onboarding para nuevos vendedores?",
                  "¿Tenés documentado en algún lugar cómo es el proceso de venta ideal?",
                ].map((q, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-200 text-[9px] font-bold text-blue-700">
                      {i + 1}
                    </span>
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          </CollapsibleDocumentosSection>

          {/* ── F: Próximos pasos ────────────────────────────────────────── */}
          <CollapsibleDocumentosSection
            id="proximos"
            letter="F"
            title="¿Qué pasa con estos documentos?"
            isOpen={openDocumentosSection === "proximos"}
            onToggle={handleDocumentosSectionToggle}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  paso: "1",
                  titulo: "Diagnóstico IA",
                  texto:
                    "El Motor de Lectura Documental analizará los archivos y extraerá insights comerciales automáticamente.",
                },
                {
                  paso: "2",
                  titulo: "Detección de brechas",
                  texto:
                    "El sistema identificará qué documentos o datos faltan para configurar un CRM completo.",
                },
                {
                  paso: "3",
                  titulo: "Base del CRM",
                  texto:
                    "Los materiales existentes se usarán como insumo para definir el pipeline, etapas y motores IA.",
                },
              ].map((item) => (
                <div
                  key={item.paso}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div className="mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                    {item.paso}
                  </div>
                  <p className="text-xs font-semibold text-slate-800">{item.titulo}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.texto}</p>
                </div>
              ))}
            </div>
          </CollapsibleDocumentosSection>
          </div>

          {/* ── Navegación ──────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || loading}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar documentos"}
              </button>
              <Link
                href="/admin/constructor/cuestionario"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Volver al Cuestionario
              </Link>
              <Link
                href="/admin/constructor"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Volver al Constructor
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              {saveMessage && (
                <span className="text-xs font-medium text-green-700">
                  {saveMessage}
                </span>
              )}
              {saveError && (
                <span className="text-xs font-medium text-red-600">
                  {saveError}
                </span>
              )}
              <Link
                href="/admin/constructor/diagnostico"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                Continuar a Diagnóstico comercial
              </Link>
            </div>
          </div>

        </div>
      </div>
    </PageContainer>
  );
}
