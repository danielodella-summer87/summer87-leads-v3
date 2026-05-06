"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Info,
  Bot,
  Wrench,
  ShieldCheck,
  CheckSquare,
  Square,
  Code2,
  Zap,
  ZapOff,
  ShieldAlert,
} from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Prioridad = "alta" | "media" | "baja";
type NivelRiesgo = "bajo" | "medio" | "alto";

type MotorIA = {
  id: string;
  nombre: string;
  etapa: string;
  tipo: string;
  objetivo: string;
  input: string;
  output: string;
  requiereValidacionHumana: boolean;
  prioridad: Prioridad;
  riesgo: NivelRiesgo;
  activo: boolean;
};

type ReglasUsoIA = {
  motoresAutomaticos: string;
  motivosAprobacion: string;
  outputsBorrador: string;
  outputsReportes: string;
  riesgosRevisar: string;
};

// ─── Datos iniciales ──────────────────────────────────────────────────────────

const ETAPAS_OPCIONES = [
  "Nuevo lead",
  "Calificación inicial",
  "Reunión / visita",
  "Diagnóstico / evaluación",
  "Propuesta / cotización",
  "Negociación",
  "Cierre",
  "Transversal",
  "Post-venta",
];

const MOTORES_INICIALES: MotorIA[] = [
  {
    id: "m1",
    nombre: "Investigación Digital del Prospecto",
    etapa: "Nuevo lead",
    tipo: "Investigación",
    objetivo: "Recopilar datos públicos del prospecto para enriquecer su ficha antes del primer contacto.",
    input: "Nombre, empresa, email o teléfono del lead",
    output: "Perfil enriquecido: LinkedIn, web, sector, tamaño, noticias recientes",
    requiereValidacionHumana: false,
    prioridad: "alta",
    riesgo: "bajo",
    activo: true,
  },
  {
    id: "m2",
    nombre: "Diagnóstico Comercial Inicial",
    etapa: "Calificación inicial",
    tipo: "Diagnóstico",
    objetivo: "Analizar si el lead califica según el perfil de cliente ideal definido.",
    input: "Datos del lead + cuestionario de calificación + ICP configurado",
    output: "Score de calificación + señales positivas/negativas + recomendación de avance",
    requiereValidacionHumana: false,
    prioridad: "alta",
    riesgo: "medio",
    activo: true,
  },
  {
    id: "m3",
    nombre: "Relevamiento Técnico",
    etapa: "Reunión / visita",
    tipo: "Relevamiento",
    objetivo: "Guiar al vendedor durante la reunión y capturar información clave del cliente.",
    input: "Notas de la reunión + tipo de servicio + sector del cliente",
    output: "Resumen estructurado de la reunión + gaps detectados + próximos pasos sugeridos",
    requiereValidacionHumana: true,
    prioridad: "alta",
    riesgo: "medio",
    activo: true,
  },
  {
    id: "m4",
    nombre: "Recomendador de Servicios",
    etapa: "Diagnóstico / evaluación",
    tipo: "Recomendación",
    objetivo: "Sugerir qué servicios o productos son los más adecuados para el cliente según su perfil.",
    input: "Relevamiento técnico + catálogo de servicios + historial de casos similares",
    output: "Lista priorizada de servicios recomendados con justificación",
    requiereValidacionHumana: true,
    prioridad: "media",
    riesgo: "medio",
    activo: true,
  },
  {
    id: "m5",
    nombre: "Generador de Propuesta",
    etapa: "Propuesta / cotización",
    tipo: "Generación",
    objetivo: "Generar un borrador de propuesta comercial personalizada para el cliente.",
    input: "Recomendación de servicios + datos del cliente + plantilla de propuesta",
    output: "Borrador de propuesta en formato estructurado listo para revisión humana",
    requiereValidacionHumana: true,
    prioridad: "alta",
    riesgo: "alto",
    activo: true,
  },
  {
    id: "m6",
    nombre: "Validador de Propuesta",
    etapa: "Propuesta / cotización",
    tipo: "Validación",
    objetivo: "Revisar que la propuesta cumple con los criterios de calidad antes de enviarla.",
    input: "Borrador de propuesta + criterios de validación configurados",
    output: "Lista de observaciones + score de calidad + aprobación/rechazo con justificación",
    requiereValidacionHumana: true,
    prioridad: "alta",
    riesgo: "bajo",
    activo: true,
  },
  {
    id: "m7",
    nombre: "Seguimiento Inteligente",
    etapa: "Negociación",
    tipo: "Seguimiento",
    objetivo: "Sugerir el próximo paso de seguimiento según el historial de interacciones del lead.",
    input: "Historial de actividades + días sin respuesta + etapa actual",
    output: "Mensaje de seguimiento sugerido + canal recomendado + urgencia",
    requiereValidacionHumana: false,
    prioridad: "media",
    riesgo: "bajo",
    activo: true,
  },
  {
    id: "m8",
    nombre: "Análisis de Cierre Perdido",
    etapa: "Cierre",
    tipo: "Análisis",
    objetivo: "Analizar las razones de pérdida de oportunidades para identificar patrones y mejoras.",
    input: "Historial del lead perdido + motivo de pérdida + etapa donde se perdió",
    output: "Análisis de causas + patrones identificados + recomendaciones de mejora",
    requiereValidacionHumana: false,
    prioridad: "media",
    riesgo: "bajo",
    activo: false,
  },
];

// ─── Estilos ──────────────────────────────────────────────────────────────────

const LABEL_CLASS = "block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide";
const INPUT_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300";
const TEXTAREA_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 resize-none";
const TEXTAREA_LG_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 resize-none";
const SELECT_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300";

const PRIORIDAD_STYLES: Record<Prioridad, string> = {
  alta: "border-red-200 bg-red-50 text-red-700",
  media: "border-amber-200 bg-amber-50 text-amber-700",
  baja: "border-slate-200 bg-slate-50 text-slate-600",
};

const RIESGO_STYLES: Record<NivelRiesgo, string> = {
  alto: "border-red-200 bg-red-50 text-red-700",
  medio: "border-amber-200 bg-amber-50 text-amber-700",
  bajo: "border-green-200 bg-green-50 text-green-700",
};

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

function PillSelect<T extends string>({
  options,
  value,
  onChange,
  styleMap,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  styleMap: Record<T, string>;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={[
            "rounded border px-2 py-0.5 text-[10px] font-medium transition-all",
            value === opt.value
              ? styleMap[opt.value] + " ring-1 ring-offset-1 ring-slate-400"
              : styleMap[opt.value] + " opacity-50 hover:opacity-90",
          ].join(" ")}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function MotoresIAPage() {
  const [motores, setMotores] = useState<MotorIA[]>(MOTORES_INICIALES);
  const [reglas, setReglas] = useState<ReglasUsoIA>({
    motoresAutomaticos: "",
    motivosAprobacion: "",
    outputsBorrador: "",
    outputsReportes: "",
    riesgosRevisar: "",
  });

  function setMotor<K extends keyof MotorIA>(
    id: string,
    key: K,
    value: MotorIA[K]
  ) {
    setMotores((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [key]: value } : m))
    );
  }

  function setRegla<K extends keyof ReglasUsoIA>(
    key: K,
    value: ReglasUsoIA[K]
  ) {
    setReglas((prev) => ({ ...prev, [key]: value }));
  }

  // Derivar mapa de motores agrupados por etapa
  const etapasConMotores = ETAPAS_OPCIONES.filter((etapa) =>
    motores.some((m) => m.etapa === etapa)
  );

  const totalActivos = motores.filter((m) => m.activo).length;
  const totalConValidacion = motores.filter((m) => m.requiereValidacionHumana).length;
  const totalAltoRiesgo = motores.filter((m) => m.riesgo === "alto").length;

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
          <Link href="/admin/constructor/proceso-pipeline" className="hover:text-slate-800 transition-colors">Proceso y pipeline</Link>
          <span>/</span>
          <span className="font-medium text-slate-800">Motores IA</span>
        </div>

        {/* ── Card principal ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8">

          {/* Header */}
          <div className="mb-6">
            <div className="mb-2">
              <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                Paso 6 de 8
              </span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Motores IA
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
              Definí qué inteligencias acompañarán al equipo comercial, en qué etapa actuarán,
              qué información usarán y cuándo necesitarán validación humana.
            </p>
          </div>

          {/* Aviso */}
          <div className="mb-8 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-xs leading-relaxed text-amber-700">
              <span className="font-semibold">Bloque visual — sin ejecución ni persistencia.</span>{" "}
              En este bloque los motores todavía no se ejecutan. Esta pantalla prepara la estructura del
              futuro sistema de IA operativa. La ejecución real y la persistencia se conectarán en una
              fase posterior.
            </p>
          </div>

          {/* ── A: Explicación conceptual ────────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="A" title="Tipos de motores IA en el Constructor" />
            <p className="mb-4 text-xs text-slate-500">
              El sistema distingue tres categorías de motores según su momento de uso y propósito.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
                    <Wrench className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">Motores de configuración</p>
                </div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Cuándo actúan
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Antes de activar el CRM. Asisten el diseño del proceso comercial, el diagnóstico y
                  la auditoría final del Constructor.
                </p>
                <p className="mt-2 text-[11px] text-slate-500">
                  Ejemplos: Motor de Diagnóstico Comercial, Motor de Lectura Documental, CLOF Auditor.
                </p>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">Motores operativos</p>
                </div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-blue-400">
                  Cuándo actúan
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Durante la gestión real de leads. Asisten al vendedor etapa por etapa con
                  información, sugerencias y generación de contenido.
                </p>
                <p className="mt-2 text-[11px] text-slate-500">
                  Ejemplos: Investigador Digital, Generador de Propuesta, Seguimiento Inteligente.
                </p>
              </div>

              <div className="rounded-xl border border-green-100 bg-green-50 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600">
                    <ShieldCheck className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">Motores de auditoría</p>
                </div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-green-500">
                  Cuándo actúan
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Antes y después de hitos críticos. Revisan coherencia, calidad, riesgos y readiness
                  del sistema o de un resultado generado.
                </p>
                <p className="mt-2 text-[11px] text-slate-500">
                  Ejemplos: Validador de Propuesta, Análisis de Cierre Perdido, CLOF Auditor.
                </p>
              </div>
            </div>
          </div>

          {/* ── B: Diseñador de motores ──────────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="B" title="Diseñador de motores IA operativos" />
            <p className="mb-4 text-xs text-slate-500">
              Editá cada motor según las necesidades reales del proceso. Los cambios son locales —
              no se guardan todavía.
            </p>

            {/* Resumen rápido */}
            <div className="mb-5 flex flex-wrap gap-3">
              {[
                { label: "Total motores", value: motores.length, color: "text-slate-700" },
                { label: "Activos", value: totalActivos, color: "text-green-700" },
                { label: "Con validación humana", value: totalConValidacion, color: "text-amber-700" },
                { label: "Riesgo alto", value: totalAltoRiesgo, color: "text-red-700" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center"
                >
                  <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-[10px] text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {motores.map((motor, index) => (
                <div
                  key={motor.id}
                  className={[
                    "overflow-hidden rounded-xl border bg-white transition-all",
                    motor.activo ? "border-slate-200" : "border-slate-200 opacity-60",
                  ].join(" ")}
                >
                  {/* Card header */}
                  <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
                      value={motor.nombre}
                      onChange={(e) => setMotor(motor.id, "nombre", e.target.value)}
                      placeholder="Nombre del motor…"
                    />
                    <div className="flex items-center gap-3">
                      <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-slate-500 select-none">
                        <button
                          type="button"
                          onClick={() =>
                            setMotor(motor.id, "requiereValidacionHumana", !motor.requiereValidacionHumana)
                          }
                        >
                          {motor.requiereValidacionHumana ? (
                            <CheckSquare className="h-4 w-4 text-amber-600" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-400" />
                          )}
                        </button>
                        <ShieldAlert className="h-3 w-3 text-slate-400" />
                        Validación humana
                      </label>

                      <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-slate-500 select-none">
                        <button
                          type="button"
                          onClick={() => setMotor(motor.id, "activo", !motor.activo)}
                        >
                          {motor.activo ? (
                            <Zap className="h-4 w-4 text-green-600" />
                          ) : (
                            <ZapOff className="h-4 w-4 text-slate-400" />
                          )}
                        </button>
                        {motor.activo ? "Activo" : "Inactivo"}
                      </label>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">

                    <div>
                      <label className={LABEL_CLASS}>Etapa</label>
                      <select
                        className={SELECT_CLASS}
                        value={motor.etapa}
                        onChange={(e) => setMotor(motor.id, "etapa", e.target.value)}
                      >
                        <option value="">Sin etapa…</option>
                        {ETAPAS_OPCIONES.map((e) => (
                          <option key={e} value={e}>{e}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={LABEL_CLASS}>Tipo</label>
                      <input
                        type="text"
                        className={INPUT_CLASS}
                        value={motor.tipo}
                        onChange={(e) => setMotor(motor.id, "tipo", e.target.value)}
                        placeholder="Ej: Diagnóstico, Generación…"
                      />
                    </div>

                    <div className="flex flex-col gap-3">
                      <div>
                        <label className={LABEL_CLASS}>Prioridad</label>
                        <PillSelect
                          options={[
                            { value: "alta" as Prioridad, label: "Alta" },
                            { value: "media" as Prioridad, label: "Media" },
                            { value: "baja" as Prioridad, label: "Baja" },
                          ]}
                          value={motor.prioridad}
                          onChange={(v) => setMotor(motor.id, "prioridad", v)}
                          styleMap={PRIORIDAD_STYLES}
                        />
                      </div>
                      <div>
                        <label className={LABEL_CLASS}>Riesgo</label>
                        <PillSelect
                          options={[
                            { value: "bajo" as NivelRiesgo, label: "Bajo" },
                            { value: "medio" as NivelRiesgo, label: "Medio" },
                            { value: "alto" as NivelRiesgo, label: "Alto" },
                          ]}
                          value={motor.riesgo}
                          onChange={(v) => setMotor(motor.id, "riesgo", v)}
                          styleMap={RIESGO_STYLES}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={LABEL_CLASS}>Objetivo</label>
                      <textarea
                        className={TEXTAREA_CLASS}
                        rows={3}
                        value={motor.objetivo}
                        onChange={(e) => setMotor(motor.id, "objetivo", e.target.value)}
                        placeholder="¿Qué hace este motor?"
                      />
                    </div>

                    <div>
                      <label className={LABEL_CLASS}>Input (datos que usa)</label>
                      <textarea
                        className={TEXTAREA_CLASS}
                        rows={3}
                        value={motor.input}
                        onChange={(e) => setMotor(motor.id, "input", e.target.value)}
                        placeholder="¿Qué información necesita para funcionar?"
                      />
                    </div>

                    <div>
                      <label className={LABEL_CLASS}>Output (qué produce)</label>
                      <textarea
                        className={TEXTAREA_CLASS}
                        rows={3}
                        value={motor.output}
                        onChange={(e) => setMotor(motor.id, "output", e.target.value)}
                        placeholder="¿Qué entrega al usuario?"
                      />
                    </div>

                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              {motores.length} motores definidos — locales, sin persistencia ni ejecución.
            </p>
          </div>

          {/* ── C: Mapa de motores por etapa ─────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="C" title="Mapa de motores por etapa comercial" />
            <p className="mb-4 text-xs text-slate-500">
              Vista derivada del estado local. Muestra en qué momento del proceso comercial actúa
              cada motor, si requiere validación y su nivel de riesgo.
            </p>
            <div className="space-y-3">
              {etapasConMotores.map((etapa) => {
                const motorsDe = motores.filter((m) => m.etapa === etapa);
                return (
                  <div key={etapa} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                    <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                      <p className="text-xs font-semibold text-slate-700">{etapa}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 p-3">
                      {motorsDe.map((m) => (
                        <div
                          key={m.id}
                          className={[
                            "flex items-start gap-2 rounded-lg border px-3 py-2",
                            m.activo ? "border-slate-200 bg-slate-50" : "border-slate-100 bg-slate-50 opacity-50",
                          ].join(" ")}
                        >
                          <Bot
                            className={[
                              "mt-0.5 h-3.5 w-3.5 shrink-0",
                              m.activo ? "text-slate-600" : "text-slate-400",
                            ].join(" ")}
                          />
                          <div>
                            <p className="text-[11px] font-semibold text-slate-800">{m.nombre}</p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              <span
                                className={`rounded px-1.5 py-0.5 text-[9px] font-medium border ${PRIORIDAD_STYLES[m.prioridad]}`}
                              >
                                {m.prioridad}
                              </span>
                              <span
                                className={`rounded px-1.5 py-0.5 text-[9px] font-medium border ${RIESGO_STYLES[m.riesgo]}`}
                              >
                                riesgo {m.riesgo}
                              </span>
                              {m.requiereValidacionHumana && (
                                <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-medium text-amber-700">
                                  humano
                                </span>
                              )}
                              {!m.activo && (
                                <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500">
                                  inactivo
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── D: Reglas de uso y validación humana ─────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="D" title="Reglas de uso y validación humana" />
            <p className="mb-4 text-xs text-slate-500">
              Definí las reglas generales que gobiernan cuándo la IA puede actuar sola y cuándo
              necesita intervención humana antes de ejecutar o entregar output.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ¿Qué motores pueden ejecutarse automáticamente?
                </label>
                <textarea
                  className={TEXTAREA_LG_CLASS}
                  rows={3}
                  value={reglas.motoresAutomaticos}
                  onChange={(e) => setRegla("motoresAutomaticos", e.target.value)}
                  placeholder="Ej: Investigación Digital puede ejecutarse al crear un lead sin aprobación…"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ¿Qué motores requieren aprobación antes de generar output?
                </label>
                <textarea
                  className={TEXTAREA_LG_CLASS}
                  rows={3}
                  value={reglas.motivosAprobacion}
                  onChange={(e) => setRegla("motivosAprobacion", e.target.value)}
                  placeholder="Ej: Generador de Propuesta siempre requiere revisión del vendedor…"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ¿Qué outputs deben quedar como borrador?
                </label>
                <textarea
                  className={TEXTAREA_LG_CLASS}
                  rows={3}
                  value={reglas.outputsBorrador}
                  onChange={(e) => setRegla("outputsBorrador", e.target.value)}
                  placeholder="Ej: Propuestas, mensajes de negociación, respuestas a objeciones…"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ¿Qué outputs podrían alimentar reportes automáticamente?
                </label>
                <textarea
                  className={TEXTAREA_LG_CLASS}
                  rows={3}
                  value={reglas.outputsReportes}
                  onChange={(e) => setRegla("outputsReportes", e.target.value)}
                  placeholder="Ej: Scores de calificación, análisis de cierre perdido, alertas de SLA…"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ¿Qué riesgos debe revisar el usuario antes de aprobar un output?
                </label>
                <textarea
                  className={TEXTAREA_LG_CLASS}
                  rows={3}
                  value={reglas.riesgosRevisar}
                  onChange={(e) => setRegla("riesgosRevisar", e.target.value)}
                  placeholder="Ej: Datos incorrectos del cliente, precios fuera de rango, compromisos que no puede cumplir…"
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
                Este panel muestra el objeto de configuración que el sistema persistirá cuando se
                conecte Supabase. Se actualiza en tiempo real con los valores ingresados arriba.
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
              <div className="flex items-center gap-2 border-b border-slate-700 bg-slate-900 px-4 py-2">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span className="ml-2 text-[10px] font-mono text-slate-400">
                  motores_ia.json — preview local
                </span>
              </div>
              <pre className="max-h-[420px] overflow-auto px-5 py-4 text-[11px] leading-relaxed text-slate-300 font-mono">
                <code>
                  {JSON.stringify(
                    {
                      motoresIA: motores.map((m) => ({
                        id: m.id,
                        nombre: m.nombre,
                        etapa: m.etapa || "⏳ sin etapa",
                        tipo: m.tipo || "⏳ sin tipo",
                        objetivo: m.objetivo || "⏳ pendiente",
                        input: m.input || "⏳ pendiente",
                        output: m.output || "⏳ pendiente",
                        requiereValidacionHumana: m.requiereValidacionHumana,
                        prioridad: m.prioridad,
                        riesgo: m.riesgo,
                        activo: m.activo,
                      })),
                      reglasUsoIA: {
                        motoresAutomaticos: reglas.motoresAutomaticos || "⏳ pendiente",
                        motivosAprobacion: reglas.motivosAprobacion || "⏳ pendiente",
                        outputsBorrador: reglas.outputsBorrador || "⏳ pendiente",
                        outputsReportes: reglas.outputsReportes || "⏳ pendiente",
                        riesgosRevisar: reglas.riesgosRevisar || "⏳ pendiente",
                      },
                      meta: {
                        totalMotores: motores.length,
                        motoresActivos: totalActivos,
                        motoresConValidacionHumana: totalConValidacion,
                        motoresAltoRiesgo: totalAltoRiesgo,
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
                href="/admin/constructor/proceso-pipeline"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Volver a Proceso y pipeline
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
              href="/admin/constructor/reportes"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Continuar a Reportes
            </Link>
          </div>

        </div>
      </div>
    </PageContainer>
  );
}
