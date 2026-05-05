"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Info,
  AlertTriangle,
  TrendingUp,
  Eye,
  Users,
  Database,
  GitBranch,
  Bot,
  CheckSquare,
  Square,
  Code2,
} from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ModeloComercial =
  | "simple"
  | "consultiva"
  | "tecnica"
  | "licitacion"
  | "recurrente"
  | "proyecto"
  | "mixta"
  | "";

type Complejidad = "baja" | "media" | "alta" | "";
type Madurez = "inicial" | "en-desarrollo" | "estructurada" | "avanzada" | "";
type DependenciaHumana = "bajo" | "medio" | "alto" | "";
type EstadoMatriz = "pendiente" | "parcial" | "solido" | "riesgo" | "";

type BloqueMatriz = {
  estado: EstadoMatriz;
  nota: string;
};

type DiagnosticoForm = {
  modeloComercial: ModeloComercial;
  complejidad: Complejidad;
  madurez: Madurez;
  dependenciaHumana: DependenciaHumana;
  comoVende: string;
  oportunidades: string;
  riesgos: string;
  puntosCiegos: string;
  matrizProceso: BloqueMatriz;
  matrizDatos: BloqueMatriz;
  matrizEquipo: BloqueMatriz;
  matrizAutomatizacion: BloqueMatriz;
  recomendaciones: string[];
  preguntas: string[];
};

// ─── Constantes ───────────────────────────────────────────────────────────────

const MODELOS_COMERCIALES: { value: ModeloComercial; label: string }[] = [
  { value: "simple", label: "Venta simple" },
  { value: "consultiva", label: "Venta consultiva" },
  { value: "tecnica", label: "Venta técnica" },
  { value: "licitacion", label: "Venta por licitación" },
  { value: "recurrente", label: "Venta recurrente" },
  { value: "proyecto", label: "Venta por proyecto" },
  { value: "mixta", label: "Venta mixta" },
];

const ESTADOS_MATRIZ: { value: EstadoMatriz; label: string; className: string }[] = [
  { value: "pendiente", label: "Pendiente", className: "border-slate-200 bg-slate-50 text-slate-600" },
  { value: "parcial", label: "Parcial", className: "border-amber-200 bg-amber-50 text-amber-700" },
  { value: "solido", label: "Sólido", className: "border-green-200 bg-green-50 text-green-700" },
  { value: "riesgo", label: "Riesgo", className: "border-red-200 bg-red-50 text-red-700" },
];

const RECOMENDACIONES_SUGERIDAS = [
  "Definir etapas comerciales antes de cargar leads",
  "Separar proceso profundo de Kanban visual",
  "Definir condiciones de avance por etapa",
  "Identificar tareas que requieren validación humana",
  "Definir documentos obligatorios por etapa",
  "Definir reportes mínimos para dirección",
  "Definir motores IA por etapa",
  "Crear auditoría final antes de activar CRM",
];

const PREGUNTAS_SUGERIDAS = [
  "¿Quién aprueba una propuesta antes de enviarla?",
  "¿Qué información mínima debe tener un lead para avanzar?",
  "¿Qué documentos son obligatorios antes de cotizar?",
  "¿Cuándo una oportunidad se considera perdida?",
  "¿Qué reportes necesita dirección cada semana?",
  "¿Qué tareas nunca debería decidir la IA sola?",
];

const INITIAL_FORM: DiagnosticoForm = {
  modeloComercial: "",
  complejidad: "",
  madurez: "",
  dependenciaHumana: "",
  comoVende: "",
  oportunidades: "",
  riesgos: "",
  puntosCiegos: "",
  matrizProceso: { estado: "", nota: "" },
  matrizDatos: { estado: "", nota: "" },
  matrizEquipo: { estado: "", nota: "" },
  matrizAutomatizacion: { estado: "", nota: "" },
  recomendaciones: [],
  preguntas: [...PREGUNTAS_SUGERIDAS],
};

// ─── Estilos compartidos ──────────────────────────────────────────────────────

const LABEL_CLASS = "block text-xs font-semibold text-slate-600 mb-1";
const TEXTAREA_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 resize-none";
const INPUT_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300";

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

function PillGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(value === opt.value ? ("" as T) : opt.value)}
          className={[
            "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
            value === opt.value
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
          ].join(" ")}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function DiagnosticoPage() {
  const [form, setForm] = useState<DiagnosticoForm>(INITIAL_FORM);

  function setField<K extends keyof DiagnosticoForm>(
    key: K,
    value: DiagnosticoForm[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setMatriz(
    key: "matrizProceso" | "matrizDatos" | "matrizEquipo" | "matrizAutomatizacion",
    patch: Partial<BloqueMatriz>
  ) {
    setForm((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  function toggleRecomendacion(rec: string) {
    setForm((prev) => ({
      ...prev,
      recomendaciones: prev.recomendaciones.includes(rec)
        ? prev.recomendaciones.filter((r) => r !== rec)
        : [...prev.recomendaciones, rec],
    }));
  }

  function setPregunta(index: number, value: string) {
    setForm((prev) => {
      const next = [...prev.preguntas];
      next[index] = value;
      return { ...prev, preguntas: next };
    });
  }

  const MODELO_LABEL =
    MODELOS_COMERCIALES.find((m) => m.value === form.modeloComercial)?.label ??
    "Sin definir";

  const matrizBlocks: {
    key: "matrizProceso" | "matrizDatos" | "matrizEquipo" | "matrizAutomatizacion";
    title: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { key: "matrizProceso", title: "Proceso comercial", icon: GitBranch },
    { key: "matrizDatos", title: "Datos y documentación", icon: Database },
    { key: "matrizEquipo", title: "Equipo y responsabilidades", icon: Users },
    { key: "matrizAutomatizacion", title: "Automatización e IA", icon: Bot },
  ];

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
          <Link href="/admin/constructor/documentos" className="hover:text-slate-800 transition-colors">
            Documentos
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-800">Diagnóstico comercial</span>
        </div>

        {/* ── Card principal ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8">

          {/* Header */}
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2">
                <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  Paso 4 de 8
                </span>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Diagnóstico comercial
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                Prepará el diagnóstico que usará el sistema para entender cómo vende la empresa,
                qué oportunidades existen, qué riesgos deben controlarse y qué partes del proceso
                pueden asistirse con IA.
              </p>
            </div>
          </div>

          {/* Aviso de bloque */}
          <div className="mb-8 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-xs leading-relaxed text-amber-700">
              <span className="font-semibold">Bloque visual — sin IA ni persistencia.</span>{" "}
              En este bloque el diagnóstico todavía no se genera con IA ni se guarda. Esta pantalla
              prepara la estructura del futuro motor de diagnóstico comercial.
            </p>
          </div>

          {/* ── A: Resumen del diagnóstico esperado ─────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="A" title="Resumen del diagnóstico esperado" />
            <div className="grid gap-6 sm:grid-cols-2">

              <div className="sm:col-span-2">
                <label className={LABEL_CLASS}>Modelo comercial detectado</label>
                <select
                  className={INPUT_CLASS}
                  value={form.modeloComercial}
                  onChange={(e) =>
                    setField("modeloComercial", e.target.value as ModeloComercial)
                  }
                >
                  <option value="">Seleccionar modelo…</option>
                  {MODELOS_COMERCIALES.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={LABEL_CLASS}>Complejidad comercial</label>
                <PillGroup
                  options={[
                    { value: "baja" as Complejidad, label: "Baja" },
                    { value: "media" as Complejidad, label: "Media" },
                    { value: "alta" as Complejidad, label: "Alta" },
                  ]}
                  value={form.complejidad}
                  onChange={(v) => setField("complejidad", v)}
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>Madurez comercial actual</label>
                <PillGroup
                  options={[
                    { value: "inicial" as Madurez, label: "Inicial" },
                    { value: "en-desarrollo" as Madurez, label: "En desarrollo" },
                    { value: "estructurada" as Madurez, label: "Estructurada" },
                    { value: "avanzada" as Madurez, label: "Avanzada" },
                  ]}
                  value={form.madurez}
                  onChange={(v) => setField("madurez", v)}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={LABEL_CLASS}>Nivel de dependencia humana</label>
                <PillGroup
                  options={[
                    { value: "bajo" as DependenciaHumana, label: "Bajo — proceso muy automatizable" },
                    { value: "medio" as DependenciaHumana, label: "Medio — mezcla de criterio y sistema" },
                    { value: "alto" as DependenciaHumana, label: "Alto — requiere criterio humano en cada paso" },
                  ]}
                  value={form.dependenciaHumana}
                  onChange={(v) => setField("dependenciaHumana", v)}
                />
              </div>

            </div>
          </div>

          {/* ── B: Hallazgos principales ─────────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="B" title="Hallazgos principales" />
            <div className="grid gap-4 sm:grid-cols-2">

              <div>
                <label className={LABEL_CLASS}>
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Cómo parece vender hoy la empresa
                  </span>
                </label>
                <textarea
                  className={TEXTAREA_CLASS}
                  rows={4}
                  placeholder="Describí brevemente el proceso de venta actual según lo que sabés…"
                  value={form.comoVende}
                  onChange={(e) => setField("comoVende", e.target.value)}
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>
                  <span className="inline-flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Principales oportunidades detectadas
                  </span>
                </label>
                <textarea
                  className={TEXTAREA_CLASS}
                  rows={4}
                  placeholder="¿Qué podría mejorar notablemente con un CRM bien configurado?"
                  value={form.oportunidades}
                  onChange={(e) => setField("oportunidades", e.target.value)}
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>
                  <span className="inline-flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Principales riesgos comerciales
                  </span>
                </label>
                <textarea
                  className={TEXTAREA_CLASS}
                  rows={4}
                  placeholder="¿Qué podría fallar o perderse si no se controla bien?"
                  value={form.riesgos}
                  onChange={(e) => setField("riesgos", e.target.value)}
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3 w-3 opacity-50" />
                    Puntos ciegos o información faltante
                  </span>
                </label>
                <textarea
                  className={TEXTAREA_CLASS}
                  rows={4}
                  placeholder="¿Qué no sabés todavía? ¿Qué datos faltan para un diagnóstico completo?"
                  value={form.puntosCiegos}
                  onChange={(e) => setField("puntosCiegos", e.target.value)}
                />
              </div>

            </div>
          </div>

          {/* ── C: Matriz de diagnóstico ─────────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="C" title="Matriz de diagnóstico" />
            <p className="mb-4 text-xs text-slate-500">
              Evaluá el estado actual de cada dimensión. Esto define dónde el sistema
              necesita más trabajo antes de activarse.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {matrizBlocks.map(({ key, title, icon: Icon }) => {
                const bloque = form[key];
                const estadoActivo = ESTADOS_MATRIZ.find(
                  (e) => e.value === bloque.estado
                );
                return (
                  <div
                    key={key}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-200">
                        <Icon className="h-3.5 w-3.5 text-slate-600" />
                      </div>
                      <p className="text-xs font-semibold text-slate-800">{title}</p>
                    </div>

                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {ESTADOS_MATRIZ.map((est) => (
                        <button
                          key={est.value}
                          type="button"
                          onClick={() =>
                            setMatriz(key, {
                              estado:
                                bloque.estado === est.value
                                  ? ""
                                  : est.value,
                            })
                          }
                          className={[
                            "rounded-md border px-2 py-1 text-[11px] font-medium transition-all",
                            bloque.estado === est.value
                              ? est.className + " ring-1 ring-offset-1 ring-slate-400"
                              : est.className + " opacity-60 hover:opacity-100",
                          ].join(" ")}
                        >
                          {est.label}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      className={INPUT_CLASS}
                      placeholder="Nota breve (opcional)…"
                      value={bloque.nota}
                      onChange={(e) => setMatriz(key, { nota: e.target.value })}
                    />

                    {estadoActivo && (
                      <p className="mt-2 text-[11px] text-slate-500">
                        Estado seleccionado:{" "}
                        <span className="font-semibold text-slate-700">
                          {estadoActivo.label}
                        </span>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── D: Recomendaciones preliminares ──────────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="D" title="Recomendaciones preliminares" />
            <p className="mb-4 text-xs text-slate-500">
              Seleccioná las acciones que deben completarse antes de diseñar el proceso
              y activar el CRM.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {RECOMENDACIONES_SUGERIDAS.map((rec) => {
                const activa = form.recomendaciones.includes(rec);
                return (
                  <button
                    key={rec}
                    type="button"
                    onClick={() => toggleRecomendacion(rec)}
                    className={[
                      "flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-xs transition-all",
                      activa
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    {activa ? (
                      <CheckSquare className="h-4 w-4 shrink-0" />
                    ) : (
                      <Square className="h-4 w-4 shrink-0 text-slate-400" />
                    )}
                    <span className="font-medium">{rec}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── E: Preguntas abiertas ────────────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="E" title="Preguntas abiertas para completar antes de diseñar el proceso" />
            <p className="mb-4 text-xs text-slate-500">
              Editá estas preguntas o usalas tal cual. Serán insumo para el diseño del proceso
              y pipeline en el próximo paso.
            </p>
            <div className="space-y-2">
              {form.preguntas.map((pregunta, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">
                    {i + 1}
                  </span>
                  <input
                    type="text"
                    className={INPUT_CLASS}
                    value={pregunta}
                    onChange={(e) => setPregunta(i, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Estas preguntas son locales — no se guardan todavía.
            </p>
          </div>

          {/* ── F: Vista previa del futuro output IA ─────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="F" title="Vista previa del futuro output IA" />
            <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 mb-4">
              <Code2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <p className="text-xs leading-relaxed text-blue-700">
                <span className="font-semibold">Solo estructura — no es un resultado real.</span>{" "}
                Este panel muestra el formato de salida que generará el Motor de Diagnóstico Comercial
                cuando se conecte la IA. Por ahora refleja los valores ingresados arriba más
                marcadores de posición.
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
              <div className="flex items-center gap-2 border-b border-slate-700 bg-slate-900 px-4 py-2">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span className="ml-2 text-[10px] font-mono text-slate-400">
                  diagnostico_comercial.json — preview
                </span>
              </div>
              <pre className="overflow-x-auto px-5 py-4 text-[11px] leading-relaxed text-slate-300 font-mono">
                <code>{JSON.stringify(
                  {
                    diagnostico_narrativo:
                      form.comoVende.trim()
                        ? form.comoVende.trim().slice(0, 120) + (form.comoVende.length > 120 ? "…" : "")
                        : "⏳ Pendiente — se generará con IA en un bloque futuro",
                    modelo_venta: form.modeloComercial || "⏳ sin definir",
                    complejidad: form.complejidad || "⏳ sin definir",
                    madurez_comercial: form.madurez || "⏳ sin definir",
                    dependencia_humana: form.dependenciaHumana || "⏳ sin definir",
                    riesgos: form.riesgos.trim()
                      ? form.riesgos.trim().slice(0, 80) + "…"
                      : "⏳ Pendiente — análisis de documentos fuente",
                    oportunidades: form.oportunidades.trim()
                      ? form.oportunidades.trim().slice(0, 80) + "…"
                      : "⏳ Pendiente — análisis de cuestionario + documentos",
                    puntos_ciegos: form.puntosCiegos.trim()
                      ? form.puntosCiegos.trim().slice(0, 80) + "…"
                      : "⏳ Pendiente — lectura documental IA",
                    recomendaciones:
                      form.recomendaciones.length > 0
                        ? form.recomendaciones
                        : ["⏳ Sin selección todavía"],
                    preguntas_pendientes: form.preguntas.filter((p) => p.trim()),
                    matriz: {
                      proceso_comercial: form.matrizProceso.estado || "⏳ sin evaluar",
                      datos_documentacion: form.matrizDatos.estado || "⏳ sin evaluar",
                      equipo_responsabilidades: form.matrizEquipo.estado || "⏳ sin evaluar",
                      automatizacion_ia: form.matrizAutomatizacion.estado || "⏳ sin evaluar",
                    },
                    readiness_parcial: "⏳ Se calculará al completar todos los pasos del Constructor",
                    generado_por: "Motor Diagnóstico Comercial v1 — no disponible aún",
                    timestamp: "⏳ pendiente",
                  },
                  null,
                  2
                )}</code>
              </pre>
            </div>
          </div>

          {/* ── Navegación ──────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/constructor/documentos"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Volver a Documentos fuente
              </Link>
              <Link
                href="/admin/constructor"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Volver al Constructor
              </Link>
            </div>

            <div className="flex flex-col items-end gap-1">
              <button
                type="button"
                disabled
                className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-slate-300 px-6 py-3 text-sm font-semibold text-white opacity-60"
              >
                Continuar a Proceso y pipeline
              </button>
              <span className="text-[11px] text-slate-400">
                Disponible en Bloque 1G
              </span>
            </div>
          </div>

        </div>
      </div>
    </PageContainer>
  );
}
