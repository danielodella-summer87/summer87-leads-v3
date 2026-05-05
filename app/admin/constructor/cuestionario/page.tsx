"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { CRM_SETUP_STEPS } from "@/lib/config/crmMode";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type CuestionarioForm = {
  // A. Modelo comercial
  queVendeDetalle: string;
  tipoVenta: string;
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
  tipoPropuesta: string;
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

const INITIAL_FORM: CuestionarioForm = {
  queVendeDetalle: "",
  tipoVenta: "",
  cicloVenta: "",
  ticketPromedio: "",
  tiposClienteObj: [],
  decisores: [],
  criteriosCalificacion: "",
  procesoActual: "",
  requiereDiagnostico: "",
  infoPrePropuesta: [],
  queBloquea: "",
  tipoPropuesta: "",
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

const TIPOS_VENTA = ["Producto", "Servicio", "Proyecto", "Suscripción", "Mixto"];

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
  "Cantidad de usuarios / personas / sedes",
  "Documentos técnicos",
  "Fotos o evidencia",
  "Reunión previa",
  "Visita técnica",
  "Otro",
];

const TIPOS_PROPUESTA = [
  "Cotización simple",
  "Propuesta comercial",
  "Propuesta técnica + comercial",
  "Contrato",
  "Depende del servicio",
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

  function setField<K extends keyof CuestionarioForm>(
    key: K,
    value: CuestionarioForm[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const step = CRM_SETUP_STEPS.find((s) => s.id === "cuestionario");

  return (
    <PageContainer>
      <div className="space-y-5">

        {/* ── Aviso de no-persistencia ─────────────────────────────────────── */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3">
          <p className="text-xs font-semibold text-amber-800">
            Datos no guardados en este bloque
          </p>
          <p className="mt-0.5 text-xs text-amber-700">
            Esta pantalla prepara la estructura del futuro cuestionario. La
            persistencia y el análisis IA se conectarán en una fase posterior.
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
                </div>

                <div>
                  <label className={LABEL_CLASS}>Tipo de venta principal</label>
                  <PillGroup
                    options={TIPOS_VENTA}
                    value={form.tipoVenta}
                    onChange={(v) => setField("tipoVenta", v)}
                  />
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
                    ¿Quién suele tomar la decisión de compra?
                  </label>
                  <CheckGroup
                    options={DECISORES}
                    value={form.decisores}
                    onChange={(v) => setField("decisores", v)}
                  />
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
                    onChange={(e) => setField("procesoActual", e.target.value)}
                    placeholder="Describí el proceso paso a paso tal como lo hace hoy el equipo comercial."
                    rows={4}
                    className={TEXTAREA_CLASS}
                  />
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
                </div>

              </div>
            </section>

            {/* D. Propuesta y cierre */}
            <section className="rounded-xl border border-slate-100 bg-slate-50/60 p-5">
              <SectionHeader letter="D" title="Propuesta y cierre" />
              <div className="space-y-5">

                <div>
                  <label className={LABEL_CLASS}>Tipo de propuesta</label>
                  <PillGroup
                    options={TIPOS_PROPUESTA}
                    value={form.tipoPropuesta}
                    onChange={(v) => setField("tipoPropuesta", v)}
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
              disabled
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white opacity-40"
            >
              Continuar a Documentos fuente
              <ChevronRight className="h-4 w-4" />
            </button>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              Disponible en Bloque 1E
            </span>
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
