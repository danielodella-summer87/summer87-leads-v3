"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Info,
  BarChart3,
  LineChart,
  BrainCircuit,
  Code2,
  Users,
  Zap,
  ZapOff,
} from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type TipoReporte = "operativo" | "gerencial" | "ia";
type Frecuencia =
  | "tiempo-real"
  | "diaria"
  | "semanal"
  | "mensual"
  | "bajo-demanda";

type ReporteSugerido = {
  id: string;
  nombre: string;
  tipo: TipoReporte;
  audiencia: string;
  metricas: string;
  filtros: string;
  frecuencia: Frecuencia;
  activo: boolean;
};

type ReglasReportes = {
  generacionAutomatica: string;
  distribucion: string;
  formatoPreferido: string;
  alertasUmbral: string;
};

// ─── Datos iniciales ──────────────────────────────────────────────────────────

const AUDIENCIAS_OPCIONES = [
  "Vendedor",
  "Supervisor comercial",
  "Gerente de ventas",
  "Dirección",
  "Operaciones",
  "Transversal",
];

const FRECUENCIAS: { value: Frecuencia; label: string }[] = [
  { value: "tiempo-real", label: "Tiempo real" },
  { value: "diaria", label: "Diaria" },
  { value: "semanal", label: "Semanal" },
  { value: "mensual", label: "Mensual" },
  { value: "bajo-demanda", label: "Bajo demanda" },
];

const REPORTES_INICIALES: ReporteSugerido[] = [
  {
    id: "r1",
    nombre: "Bandeja de leads activos",
    tipo: "operativo",
    audiencia: "Vendedor",
    metricas: "Leads por etapa, días sin actividad, próximas acciones",
    filtros: "Vendedor asignado, etapa, última actividad",
    frecuencia: "tiempo-real",
    activo: true,
  },
  {
    id: "r2",
    nombre: "Estado del pipeline comercial",
    tipo: "operativo",
    audiencia: "Supervisor comercial",
    metricas: "Leads por etapa, tasa de conversión por etapa, SLA en riesgo",
    filtros: "Equipo, período, etapa",
    frecuencia: "diaria",
    activo: true,
  },
  {
    id: "r3",
    nombre: "Performance del equipo",
    tipo: "gerencial",
    audiencia: "Gerente de ventas",
    metricas:
      "Conversiones por vendedor, tiempo promedio en etapa, propuestas enviadas",
    filtros: "Vendedor, período, producto/servicio",
    frecuencia: "semanal",
    activo: true,
  },
  {
    id: "r4",
    nombre: "Dashboard ejecutivo de ventas",
    tipo: "gerencial",
    audiencia: "Dirección",
    metricas: "Ingresos proyectados, tasa de cierre, leads perdidos vs ganados",
    filtros: "Período, vertical de negocio",
    frecuencia: "mensual",
    activo: true,
  },
  {
    id: "r5",
    nombre: "Análisis de calificación IA",
    tipo: "ia",
    audiencia: "Supervisor comercial",
    metricas:
      "Score promedio por etapa, leads calificados vs rechazados por IA, patrones detectados",
    filtros: "Motor IA, etapa, período",
    frecuencia: "semanal",
    activo: true,
  },
  {
    id: "r6",
    nombre: "Patrones de cierre perdido",
    tipo: "ia",
    audiencia: "Gerente de ventas",
    metricas:
      "Motivos de pérdida, etapa donde se pierde, correlación con perfil del lead",
    filtros: "Período, motivo de pérdida, etapa",
    frecuencia: "mensual",
    activo: false,
  },
];

// ─── Estilos ──────────────────────────────────────────────────────────────────

const LABEL_CLASS =
  "block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide";
const INPUT_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300";
const TEXTAREA_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 resize-none";
const TEXTAREA_LG_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 resize-none";
const SELECT_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300";

const TIPO_STYLES: Record<TipoReporte, string> = {
  operativo: "border-blue-200 bg-blue-50 text-blue-700",
  gerencial: "border-purple-200 bg-purple-50 text-purple-700",
  ia: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const TIPO_LABELS: Record<TipoReporte, string> = {
  operativo: "Operativo",
  gerencial: "Gerencial",
  ia: "IA",
};

const FRECUENCIA_STYLES: Record<Frecuencia, string> = {
  "tiempo-real": "border-green-200 bg-green-50 text-green-700",
  diaria: "border-blue-200 bg-blue-50 text-blue-700",
  semanal: "border-amber-200 bg-amber-50 text-amber-700",
  mensual: "border-slate-200 bg-slate-50 text-slate-600",
  "bajo-demanda": "border-slate-200 bg-slate-100 text-slate-500",
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

export default function ReportesPage() {
  const [reportes, setReportes] =
    useState<ReporteSugerido[]>(REPORTES_INICIALES);
  const [reglas, setReglas] = useState<ReglasReportes>({
    generacionAutomatica: "",
    distribucion: "",
    formatoPreferido: "",
    alertasUmbral: "",
  });

  function setReporte<K extends keyof ReporteSugerido>(
    id: string,
    key: K,
    value: ReporteSugerido[K]
  ) {
    setReportes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [key]: value } : r))
    );
  }

  function setRegla<K extends keyof ReglasReportes>(
    key: K,
    value: ReglasReportes[K]
  ) {
    setReglas((prev) => ({ ...prev, [key]: value }));
  }

  // Derivar matriz de audiencias
  const audienciasConReportes = AUDIENCIAS_OPCIONES.filter((a) =>
    reportes.some((r) => r.audiencia === a)
  );

  const totalActivos = reportes.filter((r) => r.activo).length;
  const totalPorTipo = {
    operativo: reportes.filter((r) => r.tipo === "operativo").length,
    gerencial: reportes.filter((r) => r.tipo === "gerencial").length,
    ia: reportes.filter((r) => r.tipo === "ia").length,
  };

  return (
    <PageContainer>
      <div className="space-y-6">

        {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          <Link
            href="/admin/constructor"
            className="hover:text-slate-800 transition-colors"
          >
            ← Constructor CRM
          </Link>
          <span>/</span>
          <Link
            href="/admin/constructor/empresa"
            className="hover:text-slate-800 transition-colors"
          >
            Empresa
          </Link>
          <span>/</span>
          <Link
            href="/admin/constructor/cuestionario"
            className="hover:text-slate-800 transition-colors"
          >
            Cuestionario
          </Link>
          <span>/</span>
          <Link
            href="/admin/constructor/documentos"
            className="hover:text-slate-800 transition-colors"
          >
            Documentos
          </Link>
          <span>/</span>
          <Link
            href="/admin/constructor/diagnostico"
            className="hover:text-slate-800 transition-colors"
          >
            Diagnóstico
          </Link>
          <span>/</span>
          <Link
            href="/admin/constructor/proceso-pipeline"
            className="hover:text-slate-800 transition-colors"
          >
            Proceso y pipeline
          </Link>
          <span>/</span>
          <Link
            href="/admin/constructor/motores-ia"
            className="hover:text-slate-800 transition-colors"
          >
            Motores IA
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-800">Reportes</span>
        </div>

        {/* ── Card principal ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8">

          {/* Header */}
          <div className="mb-6">
            <div className="mb-2">
              <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                Paso 7 de 8
              </span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Reportes
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
              Definí qué reportes necesita el CRM, quién los consume, con qué
              frecuencia se generan y qué reglas gobiernan su distribución.
            </p>
          </div>

          {/* Aviso */}
          <div className="mb-8 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-xs leading-relaxed text-amber-700">
              <span className="font-semibold">
                Bloque visual — sin persistencia ni reportes reales.
              </span>{" "}
              Los reportes definidos aquí todavía no se ejecutan ni guardan.
              Esta pantalla prepara la estructura del sistema de reporting. La
              generación real y la persistencia se conectarán en una fase
              posterior.
            </p>
          </div>

          {/* ── A: Tipos de reportes ─────────────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="A" title="Tipos de reportes en el CRM" />
            <p className="mb-4 text-xs text-slate-500">
              El sistema distingue tres categorías según el perfil de consumo y
              el origen de los datos.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                    <BarChart3 className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    Reportes operativos
                  </p>
                </div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-blue-400">
                  Quién los consume
                </p>
                <p className="text-xs leading-relaxed text-slate-600">
                  Vendedores y supervisores. Se usan en el día a día para
                  gestionar leads, detectar SLA en riesgo y priorizar acciones.
                </p>
                <p className="mt-2 text-[11px] text-slate-500">
                  Ejemplos: bandeja de leads, estado del pipeline, alertas de
                  inactividad.
                </p>
              </div>

              <div className="rounded-xl border border-purple-100 bg-purple-50 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600">
                    <LineChart className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    Reportes gerenciales
                  </p>
                </div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-purple-400">
                  Quién los consume
                </p>
                <p className="text-xs leading-relaxed text-slate-600">
                  Gerentes y dirección. Se usan para analizar performance del
                  equipo, tendencias de conversión y proyecciones de cierre.
                </p>
                <p className="mt-2 text-[11px] text-slate-500">
                  Ejemplos: performance por vendedor, forecast mensual,
                  dashboard ejecutivo.
                </p>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
                    <BrainCircuit className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    Reportes IA
                  </p>
                </div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-500">
                  Quién los consume
                </p>
                <p className="text-xs leading-relaxed text-slate-600">
                  Supervisores y gerentes de ventas. Sintetizan los outputs de
                  los motores IA: scores, patrones, alertas y recomendaciones.
                </p>
                <p className="mt-2 text-[11px] text-slate-500">
                  Ejemplos: análisis de calificación IA, patrones de pérdida,
                  calidad de propuestas.
                </p>
              </div>

            </div>
          </div>

          {/* ── B: Diseñador de reportes ──────────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="B" title="Diseñador de reportes sugeridos" />
            <p className="mb-4 text-xs text-slate-500">
              Editá cada reporte según las necesidades del equipo. Los cambios
              son locales — no se guardan todavía.
            </p>

            {/* Resumen rápido */}
            <div className="mb-5 flex flex-wrap gap-3">
              {[
                {
                  label: "Total reportes",
                  value: reportes.length,
                  color: "text-slate-700",
                },
                {
                  label: "Activos",
                  value: totalActivos,
                  color: "text-green-700",
                },
                {
                  label: "Operativos",
                  value: totalPorTipo.operativo,
                  color: "text-blue-700",
                },
                {
                  label: "Gerenciales",
                  value: totalPorTipo.gerencial,
                  color: "text-purple-700",
                },
                {
                  label: "IA",
                  value: totalPorTipo.ia,
                  color: "text-emerald-700",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center"
                >
                  <p className={`text-lg font-bold ${stat.color}`}>
                    {stat.value}
                  </p>
                  <p className="text-[10px] text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {reportes.map((reporte, index) => (
                <div
                  key={reporte.id}
                  className={[
                    "overflow-hidden rounded-xl border bg-white transition-all",
                    reporte.activo
                      ? "border-slate-200"
                      : "border-slate-200 opacity-60",
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
                      value={reporte.nombre}
                      onChange={(e) =>
                        setReporte(reporte.id, "nombre", e.target.value)
                      }
                      placeholder="Nombre del reporte…"
                    />
                    <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-slate-500 select-none">
                      <button
                        type="button"
                        onClick={() =>
                          setReporte(reporte.id, "activo", !reporte.activo)
                        }
                      >
                        {reporte.activo ? (
                          <Zap className="h-4 w-4 text-green-600" />
                        ) : (
                          <ZapOff className="h-4 w-4 text-slate-400" />
                        )}
                      </button>
                      {reporte.activo ? "Activo" : "Inactivo"}
                    </label>
                  </div>

                  {/* Card body */}
                  <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">

                    <div>
                      <label className={LABEL_CLASS}>Tipo</label>
                      <PillSelect
                        options={[
                          { value: "operativo" as TipoReporte, label: "Operativo" },
                          { value: "gerencial" as TipoReporte, label: "Gerencial" },
                          { value: "ia" as TipoReporte, label: "IA" },
                        ]}
                        value={reporte.tipo}
                        onChange={(v) => setReporte(reporte.id, "tipo", v)}
                        styleMap={TIPO_STYLES}
                      />
                    </div>

                    <div>
                      <label className={LABEL_CLASS}>Audiencia</label>
                      <select
                        className={SELECT_CLASS}
                        value={reporte.audiencia}
                        onChange={(e) =>
                          setReporte(reporte.id, "audiencia", e.target.value)
                        }
                      >
                        <option value="">Sin audiencia…</option>
                        {AUDIENCIAS_OPCIONES.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={LABEL_CLASS}>Frecuencia</label>
                      <PillSelect
                        options={FRECUENCIAS}
                        value={reporte.frecuencia}
                        onChange={(v) =>
                          setReporte(reporte.id, "frecuencia", v)
                        }
                        styleMap={FRECUENCIA_STYLES}
                      />
                    </div>

                    <div>
                      <label className={LABEL_CLASS}>Métricas</label>
                      <textarea
                        className={TEXTAREA_CLASS}
                        rows={3}
                        value={reporte.metricas}
                        onChange={(e) =>
                          setReporte(reporte.id, "metricas", e.target.value)
                        }
                        placeholder="¿Qué datos muestra este reporte?"
                      />
                    </div>

                    <div>
                      <label className={LABEL_CLASS}>Filtros</label>
                      <textarea
                        className={TEXTAREA_CLASS}
                        rows={3}
                        value={reporte.filtros}
                        onChange={(e) =>
                          setReporte(reporte.id, "filtros", e.target.value)
                        }
                        placeholder="¿Por qué dimensiones se puede filtrar?"
                      />
                    </div>

                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              {reportes.length} reportes definidos — locales, sin persistencia
              ni generación real.
            </p>
          </div>

          {/* ── C: Matriz por audiencia ───────────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader
              letter="C"
              title="Matriz de reportes por audiencia"
            />
            <p className="mb-4 text-xs text-slate-500">
              Vista derivada del estado local. Muestra qué reportes consume cada
              rol y con qué frecuencia.
            </p>
            <div className="space-y-3">
              {audienciasConReportes.map((audiencia) => {
                const reportesDe = reportes.filter(
                  (r) => r.audiencia === audiencia
                );
                return (
                  <div
                    key={audiencia}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                  >
                    <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      <p className="text-xs font-semibold text-slate-700">
                        {audiencia}
                      </p>
                      <span className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-[10px] text-slate-600">
                        {reportesDe.length} reporte
                        {reportesDe.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 p-3">
                      {reportesDe.map((r) => (
                        <div
                          key={r.id}
                          className={[
                            "flex items-start gap-2 rounded-lg border px-3 py-2",
                            r.activo
                              ? "border-slate-200 bg-slate-50"
                              : "border-slate-100 bg-slate-50 opacity-50",
                          ].join(" ")}
                        >
                          <BarChart3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <div>
                            <p className="text-[11px] font-semibold text-slate-800">
                              {r.nombre}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              <span
                                className={`rounded border px-1.5 py-0.5 text-[9px] font-medium ${TIPO_STYLES[r.tipo]}`}
                              >
                                {TIPO_LABELS[r.tipo]}
                              </span>
                              <span
                                className={`rounded border px-1.5 py-0.5 text-[9px] font-medium ${FRECUENCIA_STYLES[r.frecuencia]}`}
                              >
                                {
                                  FRECUENCIAS.find(
                                    (f) => f.value === r.frecuencia
                                  )?.label
                                }
                              </span>
                              {!r.activo && (
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

          {/* ── D: Reglas de generación y distribución ────────────────────── */}
          <div className="mb-8">
            <SectionHeader
              letter="D"
              title="Reglas de generación y distribución"
            />
            <p className="mb-4 text-xs text-slate-500">
              Definí las reglas generales que gobiernan cuándo se generan los
              reportes, cómo se distribuyen y qué umbrales disparan alertas.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ¿Qué reportes se generan automáticamente?
                </label>
                <textarea
                  className={TEXTAREA_LG_CLASS}
                  rows={3}
                  value={reglas.generacionAutomatica}
                  onChange={(e) =>
                    setRegla("generacionAutomatica", e.target.value)
                  }
                  placeholder="Ej: La bandeja de leads se actualiza en tiempo real. El dashboard ejecutivo se genera cada lunes…"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ¿Cómo se distribuyen los reportes?
                </label>
                <textarea
                  className={TEXTAREA_LG_CLASS}
                  rows={3}
                  value={reglas.distribucion}
                  onChange={(e) => setRegla("distribucion", e.target.value)}
                  placeholder="Ej: Los reportes gerenciales se envían por email. Los operativos están disponibles en el panel del vendedor…"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ¿Qué formato prefiere cada audiencia?
                </label>
                <textarea
                  className={TEXTAREA_LG_CLASS}
                  rows={3}
                  value={reglas.formatoPreferido}
                  onChange={(e) =>
                    setRegla("formatoPreferido", e.target.value)
                  }
                  placeholder="Ej: Dirección prefiere PDF ejecutivo. Vendedores prefieren vista en pantalla. Supervisores prefieren tabla exportable…"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ¿Qué umbrales disparan alertas automáticas?
                </label>
                <textarea
                  className={TEXTAREA_LG_CLASS}
                  rows={3}
                  value={reglas.alertasUmbral}
                  onChange={(e) => setRegla("alertasUmbral", e.target.value)}
                  placeholder="Ej: Alerta si un lead lleva más de 5 días sin actividad. Alerta si la tasa de conversión baja del 20%…"
                />
              </div>
            </div>
          </div>

          {/* ── E: Preview JSON ───────────────────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader
              letter="E"
              title="Preview del futuro JSON de configuración"
            />
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
              <Code2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <p className="text-xs leading-relaxed text-blue-700">
                <span className="font-semibold">
                  Solo estructura — refleja el estado local.
                </span>{" "}
                Este panel muestra el objeto de configuración que el sistema
                persistirá cuando se conecte Supabase. Se actualiza en tiempo
                real con los valores ingresados arriba.
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
              <div className="flex items-center gap-2 border-b border-slate-700 bg-slate-900 px-4 py-2">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span className="ml-2 text-[10px] font-mono text-slate-400">
                  reportes.json — preview local
                </span>
              </div>
              <pre className="max-h-[420px] overflow-auto px-5 py-4 text-[11px] leading-relaxed text-slate-300 font-mono">
                <code>
                  {JSON.stringify(
                    {
                      reportes: reportes.map((r) => ({
                        id: r.id,
                        nombre: r.nombre || "⏳ pendiente",
                        tipo: r.tipo,
                        audiencia: r.audiencia || "⏳ sin audiencia",
                        metricas: r.metricas || "⏳ pendiente",
                        filtros: r.filtros || "⏳ pendiente",
                        frecuencia: r.frecuencia,
                        activo: r.activo,
                      })),
                      reglasReportes: {
                        generacionAutomatica:
                          reglas.generacionAutomatica || "⏳ pendiente",
                        distribucion: reglas.distribucion || "⏳ pendiente",
                        formatoPreferido:
                          reglas.formatoPreferido || "⏳ pendiente",
                        alertasUmbral: reglas.alertasUmbral || "⏳ pendiente",
                      },
                      meta: {
                        totalReportes: reportes.length,
                        reportesActivos: totalActivos,
                        porTipo: totalPorTipo,
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

          {/* ── F: Navegación ─────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/constructor/motores-ia"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Volver a Motores IA
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
                Continuar a Auditoría final
              </button>
              <span className="text-[11px] text-slate-400">
                Disponible en Bloque 1J
              </span>
            </div>
          </div>

        </div>
      </div>
    </PageContainer>
  );
}
