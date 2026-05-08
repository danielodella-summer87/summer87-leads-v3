"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { MockAISuggestionCard } from "@/components/constructor/MockAISuggestionCard";
import { PageContainer } from "@/components/layout/PageContainer";
import { CRM_SETUP_STEPS } from "@/lib/config/crmMode";
import { type ConstructorMockAISuggestion } from "@/lib/constructor-ai/client";
import { useConstructorMockAI } from "@/lib/constructor-ai/useConstructorMockAI";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type CuestionarioForm = {
  // A. Modelo comercial
  queVendeDetalle: string;
  tiposVenta: string[];
  cicloVenta: string;
  ticketPromedio: string;
  // B. Clientes y decisores
  tiposClienteObj: string[];
  decisores: string[];
  criteriosCalificacion: string;
  // C. Proceso actual
  procesoActual: string;
  requiereDiagnostico: string;
  infoPrePropuesta: string[];
  queBloquea: string;
  // D. Propuesta y cierre
  tiposPropuesta: string[];
  aprobadorInterno: string;
  condicionesGanado: string;
  motivosPerdida: string[];
  // E. Reportes y control
  queVerDireccion: string;
  frecuenciaReportes: string;
  metricasImportantes: string[];
  // F. Validación humana e IA
  decisionesNoIA: string;
  dondeAyudarIA: string[];
  comentariosAdicionales: string;
};

type LocalSuggestion = {
  id: string;
  targetField:
    | "queVendeDetalle"
    | "tiposVenta"
    | "decisores"
    | "infoPrePropuesta"
    | "procesoActual"
    | "queBloquea"
    | "motivosPerdida"
    | "metricasImportantes"
    | "dondeAyudarIA"
    | "decisionesNoIA"
    | "general";
  title: string;
  description: string;
  actionLabel?: string;
  apply?: () => void;
};

const INITIAL_FORM: CuestionarioForm = {
  queVendeDetalle: "",
  tiposVenta: [],
  cicloVenta: "",
  ticketPromedio: "",
  tiposClienteObj: [],
  decisores: [],
  criteriosCalificacion: "",
  procesoActual: "",
  requiereDiagnostico: "",
  infoPrePropuesta: [],
  queBloquea: "",
  tiposPropuesta: [],
  aprobadorInterno: "",
  condicionesGanado: "",
  motivosPerdida: [],
  queVerDireccion: "",
  frecuenciaReportes: "",
  metricasImportantes: [],
  decisionesNoIA: "",
  dondeAyudarIA: [],
  comentariosAdicionales: "",
};

// ─── Opciones ─────────────────────────────────────────────────────────────────

const TIPOS_VENTA = [
  "Venta consultiva",
  "Venta transaccional",
  "Venta recurrente",
  "Venta por proyecto",
  "Venta por licitación",
  "Venta por referidos",
  "Venta inbound",
  "Venta outbound",
];

const CICLOS_VENTA = [
  "Menos de 7 días",
  "1 a 4 semanas",
  "1 a 3 meses",
  "Más de 3 meses",
  "Variable",
];

const TIPOS_CLIENTE_OBJ = [
  "Empresas pequeñas",
  "Empresas medianas",
  "Grandes empresas",
  "Personas individuales",
  "Instituciones públicas",
  "Instituciones educativas",
  "Otros",
];

const DECISORES = [
  "Dueño / fundador",
  "Gerente general",
  "Gerente comercial",
  "Administración / finanzas",
  "Operaciones",
  "Gerente financiero",
  "Área técnica",
  "Compras",
  "Comité",
  "Otro",
];

const REQUIERE_DIAGNOSTICO = ["Sí, siempre", "No", "Depende del caso"];

const INFO_PRE_PROPUESTA = [
  "Datos de contacto",
  "Dirección / ubicación",
  "Necesidad declarada",
  "Presupuesto estimado",
  "Plazo esperado",
  "Cantidad de usuarios / personas / sedes",
  "Documentos técnicos",
  "Fotos o evidencia",
  "Reunión previa",
  "Visita técnica",
  "Otro",
];

const TIPOS_PROPUESTA = [
  "Propuesta estándar",
  "Propuesta personalizada",
  "Cotización rápida",
  "Cotización técnica",
  "Aprobación por dirección",
  "Requiere contrato",
  "Requiere visita previa",
  "Requiere negociación",
];

const MOTIVOS_PERDIDA = [
  "Precio",
  "Falta de respuesta",
  "Competencia",
  "No era el cliente ideal",
  "Falta de presupuesto",
  "Decisión postergada",
  "No se logró contactar",
  "Otro",
];

const FRECUENCIAS_REPORTE = [
  "Diario",
  "Semanal",
  "Quincenal",
  "Mensual",
  "Bajo demanda",
];

const METRICAS = [
  "Leads nuevos",
  "Leads por etapa",
  "Tasa de conversión",
  "Motivo de pérdida",
  "Motivos de pérdida",
  "Ventas ganadas",
  "Monto cotizado",
  "Monto cerrado",
  "Tiempo promedio de cierre",
  "Actividad por comercial",
  "Leads estancados",
];

const DONDE_AYUDAR_IA = [
  "Investigar prospectos",
  "Resumir reuniones",
  "Recomendar próximos pasos",
  "Sugerir servicios/productos",
  "Armar propuestas",
  "Detectar riesgos",
  "Generar reportes",
  "Analizar oportunidades perdidas",
];

const QUE_VENDE_SUGERIDO =
  "Vendemos [producto/servicio] para [cliente objetivo], resolvemos [problema principal] y nos diferenciamos por [diferencial].";

const TIPOS_VENTA_SUGERIDOS = [
  "Venta consultiva",
  "Venta recurrente",
  "Venta por proyecto",
  "Venta inbound",
  "Venta outbound",
];

const PROCESO_CONSULTIVO_SUGERIDO =
  "En una venta consultiva conviene detallar diagnóstico, armado de propuesta y seguimiento posterior.";

const DECISORES_SUGERIDOS = [
  "Dueño / fundador",
  "Gerente general",
  "Gerente comercial",
  "Administración / finanzas",
  "Operaciones",
];

const INFO_PRE_PROPUESTA_SUGERIDA = [
  "Datos de contacto",
  "Necesidad declarada",
  "Presupuesto estimado",
  "Plazo esperado",
  "Cantidad de usuarios / personas / sedes",
  "Documentos técnicos",
];

const PROCESO_ACTUAL_SUGERIDO =
  "Lead recibido → calificación → diagnóstico/reunión → propuesta → seguimiento → negociación → cierre → onboarding.";

const BLOQUEOS_AVANCE_SUGERIDO =
  "Falta de respuesta del cliente, decisión postergada, falta de presupuesto, falta de información o aprobación interna.";

const MOTIVOS_PERDIDA_SUGERIDOS = [
  "Precio",
  "Falta de respuesta",
  "Competencia",
  "No era el cliente ideal",
  "Falta de presupuesto",
  "Decisión postergada",
];

const METRICAS_SUGERIDAS = [
  "Leads nuevos",
  "Tasa de conversión",
  "Motivo de pérdida",
  "Ventas ganadas",
  "Monto cotizado",
  "Monto cerrado",
  "Tiempo promedio de cierre",
];

const DONDE_AYUDAR_IA_SUGERIDO = [
  "Investigar prospectos",
  "Resumir reuniones",
  "Recomendar próximos pasos",
  "Armar propuestas",
  "Detectar riesgos",
  "Generar reportes",
];

const DECISIONES_NO_IA_SUGERIDO =
  "Firmar contratos, aprobar descuentos mayores, calificar un lead como perdido o enviar propuestas finales sin revisión humana.";

function mergeUnique(current: string[], additions: string[]) {
  return Array.from(new Set([...(Array.isArray(current) ? current : []), ...additions]));
}

// ─── Helpers de estilo ────────────────────────────────────────────────────────

const INPUT_CLASS =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none";

const TEXTAREA_CLASS =
  "mt-1 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none";

const LABEL_CLASS = "block text-sm font-medium text-slate-700";

function SectionHeader({ letter, title }: { letter: string; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-900 text-[11px] font-bold text-white">
        {letter}
      </span>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
    </div>
  );
}

function PillGroup({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
            value === opt
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function CheckGroup({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  function toggle(opt: string) {
    onChange(
      value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]
    );
  }
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            value.includes(opt)
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function CuestionarioPage() {
  const [form, setForm] = useState<CuestionarioForm>(INITIAL_FORM);
  const [segmentosCustom, setSegmentosCustom] = useState<string[]>([]);
  const [segmentoInput, setSegmentoInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const {
    suggestions: mockAIProcesoSuggestions,
    loading: mockAIProcesoLoading,
    error: mockAIProcesoError,
    request: requestMockAIProceso,
    clear: clearMockAIProceso,
  } = useConstructorMockAI();

  useEffect(() => {
    let cancelled = false;

    async function loadSetup() {
      setLoading(true);
      setSaveError(null);

      try {
        const res = await fetch("/api/admin/constructor/setup", {
          cache: "no-store",
        });

        const json = (await res.json().catch(() => null)) as {
          data?: { cuestionario?: unknown } | null;
          error?: string | null;
        } | null;

        if (!res.ok) {
          if (!cancelled) {
            setSaveError(json?.error ?? "No se pudo cargar la configuración guardada.");
          }
          return;
        }

        const cuestionario = json?.data?.cuestionario;

        if (
          cuestionario &&
          typeof cuestionario === "object" &&
          !Array.isArray(cuestionario) &&
          Object.keys(cuestionario).length > 0
        ) {
          if (!cancelled) {
            const loaded = cuestionario as Partial<CuestionarioForm>;
            setForm({
              ...INITIAL_FORM,
              ...loaded,
              tiposVenta: Array.isArray(loaded.tiposVenta)
                ? loaded.tiposVenta
                : INITIAL_FORM.tiposVenta,
              tiposClienteObj: Array.isArray(loaded.tiposClienteObj)
                ? loaded.tiposClienteObj
                : INITIAL_FORM.tiposClienteObj,
              decisores: Array.isArray(loaded.decisores)
                ? loaded.decisores
                : INITIAL_FORM.decisores,
              infoPrePropuesta: Array.isArray(loaded.infoPrePropuesta)
                ? loaded.infoPrePropuesta
                : INITIAL_FORM.infoPrePropuesta,
              tiposPropuesta: Array.isArray(loaded.tiposPropuesta)
                ? loaded.tiposPropuesta
                : INITIAL_FORM.tiposPropuesta,
              motivosPerdida: Array.isArray(loaded.motivosPerdida)
                ? loaded.motivosPerdida
                : INITIAL_FORM.motivosPerdida,
              metricasImportantes: Array.isArray(loaded.metricasImportantes)
                ? loaded.metricasImportantes
                : INITIAL_FORM.metricasImportantes,
              dondeAyudarIA: Array.isArray(loaded.dondeAyudarIA)
                ? loaded.dondeAyudarIA
                : INITIAL_FORM.dondeAyudarIA,
            });
          }
        }
      } catch {
        if (!cancelled) {
          setSaveError(
            "No se pudo cargar la configuración guardada. Podés completar el formulario y guardar nuevamente."
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

  function setField<K extends keyof CuestionarioForm>(
    key: K,
    value: CuestionarioForm[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function requestMockAISuggestionForProcesoActual() {
    await requestMockAIProceso({
      mode: "field_suggestion",
      step: "cuestionario",
      field: "procesoActual",
      value: form.procesoActual,
      currentForm: form,
      constructorContext: {},
    });
  }

  function applyMockAIProcesoSuggestion(suggestion: ConstructorMockAISuggestion) {
    if (typeof suggestion.suggestedValue !== "string") return;

    setForm((prev) => ({
      ...prev,
      procesoActual: suggestion.suggestedValue as string,
    }));
  }

  function agregarSegmento() {
    const s = segmentoInput.trim();
    if (!s) return;
    setSegmentosCustom((prev) => [...prev, s]);
    setSegmentoInput("");
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const res = await fetch("/api/admin/constructor/setup", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "cuestionario",
          mark_completed: true,
          data: form,
        }),
      });

      const json = (await res.json().catch(() => null)) as {
        data?: unknown;
        error?: string | null;
      } | null;

      if (!res.ok || json?.error) {
        setSaveError(json?.error ?? "Error al guardar");
      } else {
        setSaveMessage("Cuestionario guardado correctamente.");
      }
    } catch {
      setSaveError("Error de red al guardar");
    } finally {
      setSaving(false);
    }
  }

  const localSuggestions: LocalSuggestion[] = [];

  if (form.queVendeDetalle.trim().length < 40) {
    localSuggestions.push({
      id: "que-vende-corto",
      targetField: "queVendeDetalle",
      title: "Podés completar mejor qué vende la empresa",
      description:
        "Incluí producto/servicio, cliente objetivo, problema que resuelve y diferencial.",
      actionLabel: "Aplicar sugerencia",
      apply: () => setField("queVendeDetalle", QUE_VENDE_SUGERIDO),
    });
  }

  if (form.tiposVenta.length === 0) {
    localSuggestions.push({
      id: "tipos-venta-vacios",
      targetField: "tiposVenta",
      title: "Podés partir de tipos de venta frecuentes",
      description:
        "Sugerimos venta consultiva, recurrente, por proyecto, inbound y outbound.",
      actionLabel: "Aplicar sugerencia",
      apply: () =>
        setField("tiposVenta", mergeUnique(form.tiposVenta, TIPOS_VENTA_SUGERIDOS)),
    });
  }

  if (
    form.tiposVenta.includes("Venta consultiva") &&
    form.procesoActual.trim().length < 70
  ) {
    localSuggestions.push({
      id: "venta-consultiva-proceso",
      targetField: "tiposVenta",
      title: "La venta consultiva necesita más detalle operativo",
      description: PROCESO_CONSULTIVO_SUGERIDO,
      actionLabel: "Completar proceso sugerido",
      apply: () => setField("procesoActual", PROCESO_ACTUAL_SUGERIDO),
    });
  }

  if (form.decisores.length === 0) {
    localSuggestions.push({
      id: "decisores-vacios",
      targetField: "decisores",
      title: "Podés cargar decisores habituales",
      description:
        "Dueño/fundador, gerencia, comercial, administración/finanzas y operaciones suelen participar en la decisión.",
      actionLabel: "Aplicar sugerencia",
      apply: () =>
        setField("decisores", mergeUnique(form.decisores, DECISORES_SUGERIDOS)),
    });
  }

  if (form.infoPrePropuesta.length === 0) {
    localSuggestions.push({
      id: "info-pre-propuesta-vacia",
      targetField: "infoPrePropuesta",
      title: "Definí información mínima antes de proponer",
      description:
        "Datos de contacto, necesidad, presupuesto, plazo, cantidad de usuarios/personas/sedes y documentos técnicos.",
      actionLabel: "Aplicar sugerencia",
      apply: () =>
        setField(
          "infoPrePropuesta",
          mergeUnique(form.infoPrePropuesta, INFO_PRE_PROPUESTA_SUGERIDA)
        ),
    });
  }

  if (form.procesoActual.trim().length > 0 && form.procesoActual.trim().length < 70) {
    localSuggestions.push({
      id: "proceso-actual-corto",
      targetField: "procesoActual",
      title: "El proceso comercial puede quedar más estructurado",
      description: `Estructura sugerida: ${PROCESO_ACTUAL_SUGERIDO}`,
      actionLabel: "Aplicar sugerencia",
      apply: () => setField("procesoActual", PROCESO_ACTUAL_SUGERIDO),
    });
  }

  if (!form.queBloquea.trim()) {
    localSuggestions.push({
      id: "bloqueos-avance-vacio",
      targetField: "queBloquea",
      title: "Podés registrar bloqueos frecuentes",
      description: BLOQUEOS_AVANCE_SUGERIDO,
      actionLabel: "Aplicar sugerencia",
      apply: () => setField("queBloquea", BLOQUEOS_AVANCE_SUGERIDO),
    });
  }

  if (form.motivosPerdida.length === 0) {
    localSuggestions.push({
      id: "motivos-perdida-vacios",
      targetField: "motivosPerdida",
      title: "Podés partir de motivos de pérdida típicos",
      description:
        "Precio, falta de respuesta, competencia, cliente no ideal, falta de presupuesto y decisión postergada.",
      actionLabel: "Aplicar sugerencia",
      apply: () =>
        setField(
          "motivosPerdida",
          mergeUnique(form.motivosPerdida, MOTIVOS_PERDIDA_SUGERIDOS)
        ),
    });
  }

  if (form.metricasImportantes.length === 0) {
    localSuggestions.push({
      id: "metricas-vacias",
      targetField: "metricasImportantes",
      title: "Podés iniciar con métricas comerciales clave",
      description:
        "Leads nuevos, tasa de conversión, motivo de pérdida, ventas ganadas, montos y tiempo promedio de cierre.",
      actionLabel: "Aplicar sugerencia",
      apply: () =>
        setField(
          "metricasImportantes",
          mergeUnique(form.metricasImportantes, METRICAS_SUGERIDAS)
        ),
    });
  }

  if (form.dondeAyudarIA.length === 0) {
    localSuggestions.push({
      id: "donde-ayudar-ia-vacio",
      targetField: "dondeAyudarIA",
      title: "Podés definir primeros usos seguros de IA",
      description:
        "Investigar prospectos, resumir reuniones, recomendar próximos pasos, armar propuestas, detectar riesgos y generar reportes.",
      actionLabel: "Aplicar sugerencia",
      apply: () =>
        setField(
          "dondeAyudarIA",
          mergeUnique(form.dondeAyudarIA, DONDE_AYUDAR_IA_SUGERIDO)
        ),
    });
  }

  if (!form.decisionesNoIA.trim()) {
    localSuggestions.push({
      id: "decisiones-no-ia-vacio",
      targetField: "decisionesNoIA",
      title: "Definí límites de decisión para la IA",
      description: DECISIONES_NO_IA_SUGERIDO,
      actionLabel: "Aplicar sugerencia",
      apply: () => setField("decisionesNoIA", DECISIONES_NO_IA_SUGERIDO),
    });
  }

  function renderFieldSuggestions(targetField: LocalSuggestion["targetField"]) {
    const suggestions = localSuggestions.filter(
      (suggestion) => suggestion.targetField === targetField
    );
    if (suggestions.length === 0) return null;

    return (
      <div className="mt-2 space-y-2">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2"
          >
            <p className="text-[11px] font-semibold text-indigo-800">
              {suggestion.title}
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-indigo-700">
              {suggestion.description}
            </p>
            {suggestion.apply && (
              <button
                type="button"
                onClick={suggestion.apply}
                className="mt-2 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-indigo-700 transition-colors hover:bg-indigo-50"
              >
                {suggestion.actionLabel ?? "Aplicar sugerencia"}
              </button>
            )}
          </div>
        ))}
      </div>
    );
  }

  const step = CRM_SETUP_STEPS.find((s) => s.id === "cuestionario");

  return (
    <PageContainer>
      <div className="space-y-5">

        {/* ── Aviso de persistencia ───────────────────────────────────────── */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3">
          <p className="text-xs font-semibold text-amber-800">
            {loading
              ? "Cargando configuración guardada..."
              : "Este paso guarda el cuestionario en la base de datos"}
          </p>
          <p className="mt-0.5 text-xs text-amber-700">
            Usá <strong>Guardar cuestionario</strong> antes de avanzar al
            siguiente bloque.
          </p>
        </div>

        {/* ── Card principal ───────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8">

          {/* Breadcrumb */}
          <div className="mb-6 flex items-center gap-2 text-xs text-slate-400">
            <Link
              href="/admin/constructor"
              className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              Constructor CRM
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link
              href="/admin/constructor/empresa"
              className="hover:text-slate-700 transition-colors"
            >
              Empresa
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-600">Cuestionario comercial</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              Paso {step?.step ?? 2} de {CRM_SETUP_STEPS.length}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Cuestionario comercial
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
              Respondé estas preguntas para que el sistema pueda entender cómo
              vende la empresa, qué tipo de clientes atiende, qué datos necesita
              relevar y qué validaciones humanas serán necesarias antes de operar
              leads reales.
            </p>
          </div>

          {/* ── Formulario ─────────────────────────────────────────────────── */}
          <div className="space-y-8">

            {/* A. Modelo comercial */}
            <section className="rounded-xl border border-slate-100 bg-slate-50/60 p-5">
              <SectionHeader letter="A" title="Modelo comercial" />
              <div className="space-y-5">

                <div>
                  <label className={LABEL_CLASS}>
                    ¿Qué vende principalmente la empresa?
                  </label>
                  <textarea
                    value={form.queVendeDetalle}
                    onChange={(e) => setField("queVendeDetalle", e.target.value)}
                    placeholder="Describí con más detalle qué productos, servicios o soluciones comercializa."
                    rows={3}
                    className={TEXTAREA_CLASS}
                  />
                  {renderFieldSuggestions("queVendeDetalle")}
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    Tipo de venta principal
                    <span className="ml-1 text-xs font-normal text-slate-400">(puede ser más de uno)</span>
                  </label>
                  <CheckGroup
                    options={TIPOS_VENTA}
                    value={form.tiposVenta}
                    onChange={(v) => setField("tiposVenta", v)}
                  />
                  {renderFieldSuggestions("tiposVenta")}
                </div>

                <div>
                  <label className={LABEL_CLASS}>Ciclo de venta estimado</label>
                  <PillGroup
                    options={CICLOS_VENTA}
                    value={form.cicloVenta}
                    onChange={(v) => setField("cicloVenta", v)}
                  />
                </div>

                <div>
                  <label className={LABEL_CLASS}>Ticket promedio</label>
                  <input
                    type="text"
                    value={form.ticketPromedio}
                    onChange={(e) => setField("ticketPromedio", e.target.value)}
                    placeholder="Ej: USD 500, USD 2.000, variable según proyecto…"
                    className={INPUT_CLASS}
                  />
                </div>

              </div>
            </section>

            {/* B. Clientes y decisores */}
            <section className="rounded-xl border border-slate-100 bg-slate-50/60 p-5">
              <SectionHeader letter="B" title="Clientes y decisores" />
              <div className="space-y-5">

                <div>
                  <label className={LABEL_CLASS}>Tipo de cliente objetivo</label>
                  <CheckGroup
                    options={TIPOS_CLIENTE_OBJ}
                    value={form.tiposClienteObj}
                    onChange={(v) => setField("tiposClienteObj", v)}
                  />
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    Segmentos o verticales específicas
                    <span className="ml-1 text-xs font-normal text-slate-400">(opcional — agregá los que apliquen)</span>
                  </label>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none"
                      placeholder="Ej: rentadoras de autos, automotoras, colegios, pymes industriales…"
                      value={segmentoInput}
                      onChange={(e) => setSegmentoInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); agregarSegmento(); }
                      }}
                    />
                    <button
                      type="button"
                      onClick={agregarSegmento}
                      disabled={!segmentoInput.trim()}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    >
                      Agregar
                    </button>
                  </div>
                  {segmentosCustom.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {segmentosCustom.map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-900 bg-slate-900 px-3 py-1 text-xs font-medium text-white"
                        >
                          {s}
                          <button
                            type="button"
                            onClick={() =>
                              setSegmentosCustom((prev) => prev.filter((x) => x !== s))
                            }
                            className="ml-0.5 text-slate-300 hover:text-white"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    ¿Quién suele tomar la decisión de compra?
                  </label>
                  <CheckGroup
                    options={DECISORES}
                    value={form.decisores}
                    onChange={(v) => setField("decisores", v)}
                  />
                  {renderFieldSuggestions("decisores")}
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    Principales criterios para calificar un buen prospecto
                  </label>
                  <textarea
                    value={form.criteriosCalificacion}
                    onChange={(e) =>
                      setField("criteriosCalificacion", e.target.value)
                    }
                    placeholder="Ej: que tenga más de 50 empleados, que esté en el sector salud, que tenga presupuesto definido…"
                    rows={3}
                    className={TEXTAREA_CLASS}
                  />
                </div>

              </div>
            </section>

            {/* C. Proceso actual */}
            <section className="rounded-xl border border-slate-100 bg-slate-50/60 p-5">
              <SectionHeader letter="C" title="Proceso actual" />
              <div className="space-y-5">

                <div>
                  <label className={LABEL_CLASS}>
                    ¿Cómo es hoy el proceso desde que llega un prospecto hasta
                    que se cierra?
                  </label>
                  <textarea
                    value={form.procesoActual}
                    onChange={(e) => {
                      setField("procesoActual", e.target.value);
                      clearMockAIProceso();
                    }}
                    placeholder="Describí el proceso paso a paso tal como lo hace hoy el equipo comercial."
                    rows={4}
                    className={TEXTAREA_CLASS}
                  />
                  {renderFieldSuggestions("procesoActual")}
                  <div className="mt-2 rounded-xl border border-violet-100 bg-violet-50 px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={requestMockAISuggestionForProcesoActual}
                        disabled={
                          mockAIProcesoLoading || !form.procesoActual.trim()
                        }
                        className="rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-violet-700 transition-colors hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {mockAIProcesoLoading
                          ? "Consultando IA mock..."
                          : "Consultar IA mock"}
                      </button>
                      <span className="text-[11px] text-violet-700">
                        Prototipo: usa endpoint mock, no OpenAI.
                      </span>
                    </div>

                    {mockAIProcesoError && (
                      <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800">
                        {mockAIProcesoError}
                      </p>
                    )}

                    {mockAIProcesoSuggestions.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {mockAIProcesoSuggestions.map((suggestion) => (
                          <MockAISuggestionCard
                            key={suggestion.id}
                            suggestion={suggestion}
                            onApply={applyMockAIProcesoSuggestion}
                            showApply={typeof suggestion.suggestedValue === "string"}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    ¿Hay reunión, visita o diagnóstico antes de cotizar?
                  </label>
                  <PillGroup
                    options={REQUIERE_DIAGNOSTICO}
                    value={form.requiereDiagnostico}
                    onChange={(v) => setField("requiereDiagnostico", v)}
                  />
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    ¿Qué información se necesita antes de armar una propuesta?
                  </label>
                  <CheckGroup
                    options={INFO_PRE_PROPUESTA}
                    value={form.infoPrePropuesta}
                    onChange={(v) => setField("infoPrePropuesta", v)}
                  />
                  {renderFieldSuggestions("infoPrePropuesta")}
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    ¿Qué bloquea normalmente el avance de una oportunidad?
                  </label>
                  <textarea
                    value={form.queBloquea}
                    onChange={(e) => setField("queBloquea", e.target.value)}
                    placeholder="Ej: falta de respuesta del cliente, precio, demoras internas para armar la propuesta…"
                    rows={3}
                    className={TEXTAREA_CLASS}
                  />
                  {renderFieldSuggestions("queBloquea")}
                </div>

              </div>
            </section>

            {/* D. Propuesta y cierre */}
            <section className="rounded-xl border border-slate-100 bg-slate-50/60 p-5">
              <SectionHeader letter="D" title="Propuesta y cierre" />
              <div className="space-y-5">

                <div>
                  <label className={LABEL_CLASS}>
                    Tipo de propuesta / cierre
                    <span className="ml-1 text-xs font-normal text-slate-400">(puede ser más de uno)</span>
                  </label>
                  <CheckGroup
                    options={TIPOS_PROPUESTA}
                    value={form.tiposPropuesta}
                    onChange={(v) => setField("tiposPropuesta", v)}
                  />
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    ¿Quién aprueba internamente una propuesta antes de enviarla?
                  </label>
                  <input
                    type="text"
                    value={form.aprobadorInterno}
                    onChange={(e) =>
                      setField("aprobadorInterno", e.target.value)
                    }
                    placeholder="Ej: gerente comercial, dirección, área técnica…"
                    className={INPUT_CLASS}
                  />
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    ¿Qué condiciones deben cumplirse para marcar una oportunidad
                    como ganada?
                  </label>
                  <textarea
                    value={form.condicionesGanado}
                    onChange={(e) =>
                      setField("condicionesGanado", e.target.value)
                    }
                    placeholder="Ej: contrato firmado, pago inicial recibido, orden de compra emitida…"
                    rows={3}
                    className={TEXTAREA_CLASS}
                  />
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    Motivos frecuentes de pérdida
                  </label>
                  <CheckGroup
                    options={MOTIVOS_PERDIDA}
                    value={form.motivosPerdida}
                    onChange={(v) => setField("motivosPerdida", v)}
                  />
                  {renderFieldSuggestions("motivosPerdida")}
                </div>

              </div>
            </section>

            {/* E. Reportes y control */}
            <section className="rounded-xl border border-slate-100 bg-slate-50/60 p-5">
              <SectionHeader letter="E" title="Reportes y control" />
              <div className="space-y-5">

                <div>
                  <label className={LABEL_CLASS}>
                    ¿Qué necesita ver la dirección o gerencia?
                  </label>
                  <textarea
                    value={form.queVerDireccion}
                    onChange={(e) =>
                      setField("queVerDireccion", e.target.value)
                    }
                    placeholder="Ej: cuántos leads entraron esta semana, cuántas propuestas hay en curso, qué se ganó y qué se perdió…"
                    rows={3}
                    className={TEXTAREA_CLASS}
                  />
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    Frecuencia ideal de reportes
                  </label>
                  <PillGroup
                    options={FRECUENCIAS_REPORTE}
                    value={form.frecuenciaReportes}
                    onChange={(v) => setField("frecuenciaReportes", v)}
                  />
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    Métricas importantes para el negocio
                  </label>
                  <CheckGroup
                    options={METRICAS}
                    value={form.metricasImportantes}
                    onChange={(v) => setField("metricasImportantes", v)}
                  />
                  {renderFieldSuggestions("metricasImportantes")}
                </div>

              </div>
            </section>

            {/* F. Validación humana e IA futura */}
            <section className="rounded-xl border border-slate-100 bg-slate-50/60 p-5">
              <SectionHeader letter="F" title="Validación humana e IA futura" />
              <div className="space-y-5">

                <div>
                  <label className={LABEL_CLASS}>
                    ¿Qué decisiones nunca debería tomar la IA sola?
                  </label>
                  <textarea
                    value={form.decisionesNoIA}
                    onChange={(e) =>
                      setField("decisionesNoIA", e.target.value)
                    }
                    placeholder="Ej: firmar un contrato, aprobar un descuento mayor al 20%, calificar un lead como perdido…"
                    rows={3}
                    className={TEXTAREA_CLASS}
                  />
                  {renderFieldSuggestions("decisionesNoIA")}
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    ¿Dónde te gustaría que la IA ayude primero?
                  </label>
                  <CheckGroup
                    options={DONDE_AYUDAR_IA}
                    value={form.dondeAyudarIA}
                    onChange={(v) => setField("dondeAyudarIA", v)}
                  />
                  {renderFieldSuggestions("dondeAyudarIA")}
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    Comentarios adicionales para diseñar el CRM
                  </label>
                  <textarea
                    value={form.comentariosAdicionales}
                    onChange={(e) =>
                      setField("comentariosAdicionales", e.target.value)
                    }
                    placeholder="Cualquier cosa que el sistema debería saber sobre cómo trabaja la empresa o qué necesita el CRM."
                    rows={4}
                    className={TEXTAREA_CLASS}
                  />
                </div>

              </div>
            </section>

          </div>

          {/* ── Acciones ─────────────────────────────────────────────────────── */}
          <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-6">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar cuestionario"}
            </button>

            <Link
              href="/admin/constructor/documentos"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              Continuar a Documentos fuente
              <ChevronRight className="h-4 w-4" />
            </Link>
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
            <div className="ml-auto flex items-center gap-4">
              <Link
                href="/admin/constructor/empresa"
                className="text-sm text-slate-400 hover:text-slate-700 transition-colors"
              >
                ← Volver a Empresa
              </Link>
              <Link
                href="/admin/constructor"
                className="text-sm text-slate-400 hover:text-slate-700 transition-colors"
              >
                ← Volver al Constructor
              </Link>
            </div>
          </div>

        </div>
      </div>
    </PageContainer>
  );
}
