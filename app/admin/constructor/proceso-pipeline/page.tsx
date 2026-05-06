"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Info,
  Layers,
  LayoutGrid,
  CheckSquare,
  Square,
  Code2,
  User,
  Target,
  ListTodo,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type TipoColumna = "inicial" | "activa" | "bloqueada" | "ganada" | "perdida" | "";

type EtapaProceso = {
  id: string;
  nombre: string;
  objetivo: string;
  responsable: string;
  tareas: string;
  condicionAvance: string;
  requiereValidacionHumana: boolean;
};

type ColumnaKanban = {
  id: string;
  nombre: string;
  tipo: TipoColumna;
  criterioEntrada: string;
  criterioSalida: string;
  slaDias: string;
};

type ReglasValidacion = {
  condicionesAvance: string;
  decisionesHumanas: string;
  documentosPorEtapa: string;
  alertasSistema: string;
  tareasAutomaticas: string;
};

// ─── Datos iniciales ──────────────────────────────────────────────────────────

const ETAPAS_INICIALES: EtapaProceso[] = [
  {
    id: "e1",
    nombre: "Nuevo lead",
    objetivo: "Registrar y verificar los datos básicos del prospecto.",
    responsable: "SDR / Vendedor",
    tareas: "Crear ficha, verificar contacto, asignar origen",
    condicionAvance: "Datos completos y lead contactado al menos una vez",
    requiereValidacionHumana: false,
  },
  {
    id: "e2",
    nombre: "Calificación inicial",
    objetivo: "Determinar si el lead cumple el perfil de cliente ideal.",
    responsable: "SDR / Vendedor",
    tareas: "Llamada de calificación, completar campos BANT o similares",
    condicionAvance: "Lead calificado: presupuesto, autoridad, necesidad y timing confirmados",
    requiereValidacionHumana: false,
  },
  {
    id: "e3",
    nombre: "Reunión / visita",
    objetivo: "Establecer una reunión presencial o virtual con el decisor.",
    responsable: "Vendedor",
    tareas: "Agendar reunión, preparar presentación, ejecutar reunión, registrar notas",
    condicionAvance: "Reunión realizada y necesidad confirmada por el cliente",
    requiereValidacionHumana: false,
  },
  {
    id: "e4",
    nombre: "Diagnóstico / evaluación",
    objetivo: "Entender en profundidad el problema y los requerimientos del cliente.",
    responsable: "Vendedor / Técnico",
    tareas: "Relevamiento de necesidades, visita técnica si aplica, documentar requerimientos",
    condicionAvance: "Requerimientos validados y aprobados internamente",
    requiereValidacionHumana: true,
  },
  {
    id: "e5",
    nombre: "Propuesta / cotización",
    objetivo: "Preparar y enviar una propuesta comercial formal.",
    responsable: "Vendedor / Gerente comercial",
    tareas: "Redactar propuesta, revisar internamente, enviar al cliente, confirmar recepción",
    condicionAvance: "Propuesta enviada y acuse de recibo del cliente",
    requiereValidacionHumana: true,
  },
  {
    id: "e6",
    nombre: "Negociación",
    objetivo: "Resolver objeciones y ajustar condiciones hasta llegar a un acuerdo.",
    responsable: "Vendedor / Gerente comercial",
    tareas: "Registrar objeciones, proponer alternativas, negociar condiciones",
    condicionAvance: "Acuerdo verbal o escrito sobre precio y condiciones",
    requiereValidacionHumana: true,
  },
  {
    id: "e7",
    nombre: "Cierre",
    objetivo: "Formalizar la venta y preparar el onboarding del cliente.",
    responsable: "Vendedor / Administración",
    tareas: "Firma de contrato o pedido, cobro inicial, handoff a operaciones",
    condicionAvance: "Contrato firmado y pago confirmado",
    requiereValidacionHumana: true,
  },
];

const COLUMNAS_INICIALES: ColumnaKanban[] = [
  { id: "k1", nombre: "Nuevo", tipo: "inicial", criterioEntrada: "Lead creado en el sistema", criterioSalida: "Lead contactado y datos verificados", slaDias: "1" },
  { id: "k2", nombre: "Calificar", tipo: "activa", criterioEntrada: "Lead contactado", criterioSalida: "Calificación BANT completada", slaDias: "3" },
  { id: "k3", nombre: "Reunión agendada", tipo: "activa", criterioEntrada: "Lead calificado positivamente", criterioSalida: "Reunión realizada y necesidad confirmada", slaDias: "5" },
  { id: "k4", nombre: "Evaluación", tipo: "activa", criterioEntrada: "Reunión completada", criterioSalida: "Requerimientos documentados y aprobados", slaDias: "7" },
  { id: "k5", nombre: "Propuesta enviada", tipo: "activa", criterioEntrada: "Diagnóstico aprobado internamente", criterioSalida: "Propuesta recibida y en evaluación por el cliente", slaDias: "3" },
  { id: "k6", nombre: "Negociación", tipo: "activa", criterioEntrada: "Cliente respondió la propuesta", criterioSalida: "Acuerdo de condiciones alcanzado", slaDias: "10" },
  { id: "k7", nombre: "Ganado", tipo: "ganada", criterioEntrada: "Contrato firmado o pedido confirmado", criterioSalida: "—", slaDias: "" },
  { id: "k8", nombre: "Perdido", tipo: "perdida", criterioEntrada: "Cliente descartó la propuesta o no respondió", criterioSalida: "—", slaDias: "" },
];

const TIPOS_COLUMNA: { value: TipoColumna; label: string; className: string }[] = [
  { value: "inicial", label: "Inicial", className: "border-slate-200 bg-slate-100 text-slate-600" },
  { value: "activa", label: "Activa", className: "border-blue-200 bg-blue-50 text-blue-700" },
  { value: "bloqueada", label: "Bloqueada", className: "border-amber-200 bg-amber-50 text-amber-700" },
  { value: "ganada", label: "Ganada", className: "border-green-200 bg-green-50 text-green-700" },
  { value: "perdida", label: "Perdida", className: "border-red-200 bg-red-50 text-red-700" },
];

// ─── Estilos ──────────────────────────────────────────────────────────────────

const LABEL_CLASS = "block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide";
const INPUT_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300";
const TEXTAREA_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 resize-none";
const TEXTAREA_LG_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 resize-none";

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function SectionHeader({ letter, title }: { letter: string; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
        {letter}
      </div>
      <h2 className="text-base font-semibold text-slate-800">{title}</h2>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function ProcesoPipelinePage() {
  const [etapas, setEtapas] = useState<EtapaProceso[]>(ETAPAS_INICIALES);
  const [columnas, setColumnas] = useState<ColumnaKanban[]>(COLUMNAS_INICIALES);
  const [reglas, setReglas] = useState<ReglasValidacion>({
    condicionesAvance: "",
    decisionesHumanas: "",
    documentosPorEtapa: "",
    alertasSistema: "",
    tareasAutomaticas: "",
  });

  function setEtapa<K extends keyof EtapaProceso>(
    id: string,
    key: K,
    value: EtapaProceso[K]
  ) {
    setEtapas((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [key]: value } : e))
    );
  }

  function setColumna<K extends keyof ColumnaKanban>(
    id: string,
    key: K,
    value: ColumnaKanban[K]
  ) {
    setColumnas((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [key]: value } : c))
    );
  }

  function setRegla<K extends keyof ReglasValidacion>(
    key: K,
    value: ReglasValidacion[K]
  ) {
    setReglas((prev) => ({ ...prev, [key]: value }));
  }

  const TIPO_COLUMNA_LABEL = Object.fromEntries(
    TIPOS_COLUMNA.map((t) => [t.value, t.label])
  ) as Record<TipoColumna, string>;

  const TIPO_COLUMNA_CLASS = Object.fromEntries(
    TIPOS_COLUMNA.map((t) => [t.value, t.className])
  ) as Record<TipoColumna, string>;

  return (
    <PageContainer>
      <div className="space-y-6">

        {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          <Link href="/admin/constructor" className="hover:text-slate-800 transition-colors">
            ← Constructor CRM
          </Link>
          <span>/</span>
          <Link href="/admin/constructor/empresa" className="hover:text-slate-800 transition-colors">Empresa</Link>
          <span>/</span>
          <Link href="/admin/constructor/cuestionario" className="hover:text-slate-800 transition-colors">Cuestionario</Link>
          <span>/</span>
          <Link href="/admin/constructor/documentos" className="hover:text-slate-800 transition-colors">Documentos</Link>
          <span>/</span>
          <Link href="/admin/constructor/diagnostico" className="hover:text-slate-800 transition-colors">Diagnóstico</Link>
          <span>/</span>
          <span className="font-medium text-slate-800">Proceso y pipeline</span>
        </div>

        {/* ── Card principal ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8">

          {/* Header */}
          <div className="mb-6">
            <div className="mb-2">
              <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                Paso 5 de 8
              </span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Proceso y pipeline
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
              Diseñá cómo trabaja comercialmente la empresa por dentro y cómo se verá ese
              proceso en el tablero operativo del CRM.
            </p>
          </div>

          {/* Aviso */}
          <div className="mb-8 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-xs leading-relaxed text-amber-700">
              <span className="font-semibold">Bloque visual — sin persistencia.</span>{" "}
              En este bloque los datos todavía no se guardan. Esta pantalla prepara la estructura
              del futuro diseñador de procesos y pipeline. La persistencia se conectará en una
              fase posterior.
            </p>
          </div>

          {/* ── A: Diferencia conceptual ─────────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="A" title="Proceso comercial vs. Pipeline / Kanban" />
            <p className="mb-4 text-xs text-slate-500">
              Son dos representaciones del mismo trabajo comercial. El proceso define el{" "}
              <span className="font-semibold text-slate-700">cómo interno</span> de la empresa;
              el pipeline define el <span className="font-semibold text-slate-700">qué visible</span>{" "}
              en el tablero del CRM. No todo lo que existe en el proceso interno debe convertirse
              en una columna del Kanban.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
                    <Layers className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">Proceso comercial profundo</p>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {[
                    "Etapas internas con lógica específica",
                    "Tareas concretas por etapa",
                    "Responsable definido en cada paso",
                    "Documentos requeridos antes de avanzar",
                    "Condiciones de avance verificables",
                    "Decisiones que requieren aprobación humana",
                    "Validaciones automáticas posibles",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                    <LayoutGrid className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">Pipeline / Kanban visual</p>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {[
                    "Columnas simples del tablero operativo",
                    "El equipo mueve oportunidades día a día",
                    "Vista rápida del estado de cada lead",
                    "Criterio de entrada y salida por columna",
                    "SLA de tiempo máximo por columna",
                    "No necesita reflejar toda la complejidad interna",
                    "Puede tener menos columnas que etapas del proceso",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-blue-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Ejemplo práctico */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Ejemplo práctico
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold text-slate-700">
                    Proceso interno (5 pasos)
                  </p>
                  <ol className="space-y-1 text-xs text-slate-600">
                    {[
                      "Recibir y registrar el lead",
                      "Validar datos de contacto",
                      "Asignar responsable y origen",
                      "Solicitar documentación técnica",
                      "Coordinar visita o reunión",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[9px] font-bold text-slate-600">
                          {i + 1}
                        </span>
                        {item}
                      </li>
                    ))}
                  </ol>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold text-blue-700">
                    Pipeline visual (3 columnas)
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {["Nuevo", "Calificación", "Visita agendada"].map((col, i, arr) => (
                      <div key={col} className="flex items-center gap-2">
                        <span className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                          {col}
                        </span>
                        {i < arr.length - 1 && (
                          <ArrowRight className="h-3 w-3 shrink-0 text-slate-400" />
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
                    Los 5 pasos internos se consolidan en 3 columnas operativas. El vendedor mueve
                    el lead entre columnas; el sistema verifica las condiciones internas.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── B: Diseñador de etapas del proceso ──────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="B" title="Diseñador de etapas del proceso comercial" />
            <p className="mb-4 text-xs text-slate-500">
              Estas son las etapas internas del proceso. Editá cada una según la realidad de la empresa.
              Los cambios son locales — no se guardan todavía.
            </p>
            <div className="space-y-3">
              {etapas.map((etapa, index) => (
                <div
                  key={etapa.id}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                >
                  {/* Card header */}
                  <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      className="flex-1 bg-transparent text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
                      value={etapa.nombre}
                      onChange={(e) => setEtapa(etapa.id, "nombre", e.target.value)}
                      placeholder="Nombre de la etapa…"
                    />
                    <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-slate-500 select-none">
                      <button
                        type="button"
                        onClick={() =>
                          setEtapa(
                            etapa.id,
                            "requiereValidacionHumana",
                            !etapa.requiereValidacionHumana
                          )
                        }
                        className="shrink-0"
                        title="Requiere validación humana"
                      >
                        {etapa.requiereValidacionHumana ? (
                          <CheckSquare className="h-4 w-4 text-slate-900" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-400" />
                        )}
                      </button>
                      <ShieldAlert className="h-3 w-3 text-slate-400" />
                      Validación humana
                    </label>
                  </div>

                  {/* Card body */}
                  <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className={LABEL_CLASS}>
                        <span className="inline-flex items-center gap-1">
                          <Target className="h-2.5 w-2.5" />
                          Objetivo
                        </span>
                      </label>
                      <textarea
                        className={TEXTAREA_CLASS}
                        rows={2}
                        value={etapa.objetivo}
                        onChange={(e) => setEtapa(etapa.id, "objetivo", e.target.value)}
                        placeholder="¿Qué se busca lograr en esta etapa?"
                      />
                    </div>

                    <div>
                      <label className={LABEL_CLASS}>
                        <span className="inline-flex items-center gap-1">
                          <User className="h-2.5 w-2.5" />
                          Responsable
                        </span>
                      </label>
                      <input
                        type="text"
                        className={INPUT_CLASS}
                        value={etapa.responsable}
                        onChange={(e) => setEtapa(etapa.id, "responsable", e.target.value)}
                        placeholder="Ej: Vendedor / SDR"
                      />
                    </div>

                    <div>
                      <label className={LABEL_CLASS}>
                        <span className="inline-flex items-center gap-1">
                          <ListTodo className="h-2.5 w-2.5" />
                          Tareas
                        </span>
                      </label>
                      <textarea
                        className={TEXTAREA_CLASS}
                        rows={2}
                        value={etapa.tareas}
                        onChange={(e) => setEtapa(etapa.id, "tareas", e.target.value)}
                        placeholder="¿Qué acciones concretas hay en esta etapa?"
                      />
                    </div>

                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className={LABEL_CLASS}>
                        <span className="inline-flex items-center gap-1">
                          <ArrowRight className="h-2.5 w-2.5" />
                          Condición de avance
                        </span>
                      </label>
                      <input
                        type="text"
                        className={INPUT_CLASS}
                        value={etapa.condicionAvance}
                        onChange={(e) => setEtapa(etapa.id, "condicionAvance", e.target.value)}
                        placeholder="¿Qué debe estar cumplido para pasar a la siguiente etapa?"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              {etapas.length} etapas definidas — locales, sin persistencia.
            </p>
          </div>

          {/* ── C: Diseñador de pipeline/Kanban ──────────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="C" title="Diseñador de pipeline / Kanban visual" />
            <p className="mb-4 text-xs text-slate-500">
              Estas son las columnas que el equipo verá en el tablero operativo. Editá nombres,
              criterios y SLAs según el ritmo real del negocio.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {columnas.map((col, index) => {
                const tipoInfo = TIPOS_COLUMNA.find((t) => t.value === col.tipo);
                return (
                  <div
                    key={col.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
                  >
                    {/* Column header */}
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-300 text-[10px] font-bold text-slate-700">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        className="flex-1 bg-transparent text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
                        value={col.nombre}
                        onChange={(e) => setColumna(col.id, "nombre", e.target.value)}
                        placeholder="Nombre columna…"
                      />
                    </div>

                    {/* Tipo pills */}
                    <div className="flex flex-wrap gap-1">
                      {TIPOS_COLUMNA.map((tipo) => (
                        <button
                          key={tipo.value}
                          type="button"
                          onClick={() =>
                            setColumna(col.id, "tipo", col.tipo === tipo.value ? "" : tipo.value)
                          }
                          className={[
                            "rounded px-1.5 py-0.5 text-[10px] font-medium border transition-all",
                            col.tipo === tipo.value
                              ? tipo.className + " ring-1 ring-offset-1 ring-slate-400"
                              : tipo.className + " opacity-50 hover:opacity-80",
                          ].join(" ")}
                        >
                          {tipo.label}
                        </button>
                      ))}
                    </div>

                    {/* Fields */}
                    <div className="space-y-2">
                      <div>
                        <label className={LABEL_CLASS}>Criterio entrada</label>
                        <textarea
                          className={TEXTAREA_CLASS}
                          rows={2}
                          value={col.criterioEntrada}
                          onChange={(e) => setColumna(col.id, "criterioEntrada", e.target.value)}
                          placeholder="¿Cuándo entra un lead a esta columna?"
                        />
                      </div>
                      <div>
                        <label className={LABEL_CLASS}>Criterio salida</label>
                        <textarea
                          className={TEXTAREA_CLASS}
                          rows={2}
                          value={col.criterioSalida}
                          onChange={(e) => setColumna(col.id, "criterioSalida", e.target.value)}
                          placeholder="¿Cuándo sale?"
                        />
                      </div>
                      <div>
                        <label className={LABEL_CLASS}>SLA (días máx.)</label>
                        <input
                          type="number"
                          min={0}
                          className={INPUT_CLASS}
                          value={col.slaDias}
                          onChange={(e) => setColumna(col.id, "slaDias", e.target.value)}
                          placeholder="Días"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              {columnas.length} columnas definidas — locales, sin persistencia. Sin drag and drop todavía.
            </p>
          </div>

          {/* ── D: Condiciones y validaciones ────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="D" title="Condiciones y validaciones del proceso" />
            <p className="mb-4 text-xs text-slate-500">
              Definí las reglas generales que el sistema deberá implementar para controlar
              el avance, la calidad del dato y las responsabilidades.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ¿Qué debe estar completo para avanzar de etapa?
                </label>
                <textarea
                  className={TEXTAREA_LG_CLASS}
                  rows={3}
                  value={reglas.condicionesAvance}
                  onChange={(e) => setRegla("condicionesAvance", e.target.value)}
                  placeholder="Ej: Nombre, empresa, email y teléfono completos. Reunión registrada con notas…"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ¿Qué decisiones requieren aprobación humana?
                </label>
                <textarea
                  className={TEXTAREA_LG_CLASS}
                  rows={3}
                  value={reglas.decisionesHumanas}
                  onChange={(e) => setRegla("decisionesHumanas", e.target.value)}
                  placeholder="Ej: Envío de propuesta, descuento mayor al 10%, cierre de contrato…"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ¿Qué documentos se generan o registran en cada etapa?
                </label>
                <textarea
                  className={TEXTAREA_LG_CLASS}
                  rows={3}
                  value={reglas.documentosPorEtapa}
                  onChange={(e) => setRegla("documentosPorEtapa", e.target.value)}
                  placeholder="Ej: Etapa 3: acta de reunión. Etapa 5: propuesta en PDF firmada…"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ¿Qué alertas debería mostrar el sistema?
                </label>
                <textarea
                  className={TEXTAREA_LG_CLASS}
                  rows={3}
                  value={reglas.alertasSistema}
                  onChange={(e) => setRegla("alertasSistema", e.target.value)}
                  placeholder="Ej: Lead sin actividad por 5 días, SLA vencido, propuesta sin respuesta en 7 días…"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ¿Qué tareas podrían ser automáticas?
                </label>
                <textarea
                  className={TEXTAREA_LG_CLASS}
                  rows={3}
                  value={reglas.tareasAutomaticas}
                  onChange={(e) => setRegla("tareasAutomaticas", e.target.value)}
                  placeholder="Ej: Envío de email de seguimiento, creación de tarea de llamada, notificación al gerente…"
                />
              </div>
            </div>
          </div>

          {/* ── E: Preview JSON ──────────────────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="E" title="Preview del futuro JSON de configuración" />
            <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 mb-4">
              <Code2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <p className="text-xs leading-relaxed text-blue-700">
                <span className="font-semibold">Solo estructura — refleja el estado local.</span>{" "}
                Este panel muestra el objeto de configuración que el sistema persistirá cuando se conecte
                Supabase. Se actualiza en tiempo real con los valores ingresados arriba.
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
              <div className="flex items-center gap-2 border-b border-slate-700 bg-slate-900 px-4 py-2">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span className="ml-2 text-[10px] font-mono text-slate-400">
                  proceso_pipeline.json — preview local
                </span>
              </div>
              <pre className="max-h-[400px] overflow-auto px-5 py-4 text-[11px] leading-relaxed text-slate-300 font-mono">
                <code>
                  {JSON.stringify(
                    {
                      procesoComercial: etapas.map((e) => ({
                        id: e.id,
                        nombre: e.nombre,
                        objetivo: e.objetivo || "⏳ pendiente",
                        responsable: e.responsable || "⏳ pendiente",
                        tareas: e.tareas || "⏳ pendiente",
                        condicionAvance: e.condicionAvance || "⏳ pendiente",
                        requiereValidacionHumana: e.requiereValidacionHumana,
                      })),
                      pipelineKanban: columnas.map((c) => ({
                        id: c.id,
                        nombre: c.nombre,
                        tipo: c.tipo || "⏳ sin tipo",
                        criterioEntrada: c.criterioEntrada || "⏳ pendiente",
                        criterioSalida: c.criterioSalida || "⏳ pendiente",
                        slaDias: c.slaDias ? Number(c.slaDias) : null,
                      })),
                      reglasValidacion: {
                        condicionesAvance: reglas.condicionesAvance || "⏳ pendiente",
                        decisionesHumanas: reglas.decisionesHumanas || "⏳ pendiente",
                        documentosPorEtapa: reglas.documentosPorEtapa || "⏳ pendiente",
                        alertasSistema: reglas.alertasSistema || "⏳ pendiente",
                        tareasAutomaticas: reglas.tareasAutomaticas || "⏳ pendiente",
                      },
                      meta: {
                        totalEtapas: etapas.length,
                        totalColumnas: columnas.length,
                        etapasConValidacionHumana: etapas.filter((e) => e.requiereValidacionHumana).length,
                        persistido: false,
                        version: "⏳ pendiente — Bloque 2A",
                      },
                    },
                    null,
                    2
                  )}
                </code>
              </pre>
            </div>
          </div>

          {/* ── F: Navegación ────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/constructor/diagnostico"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Volver a Diagnóstico
              </Link>
              <Link
                href="/admin/constructor"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Volver al Constructor
              </Link>
            </div>

            <Link
              href="/admin/constructor/motores-ia"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Continuar a Motores IA
            </Link>
          </div>

        </div>
      </div>
    </PageContainer>
  );
}
