"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  ChevronRight,
} from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { CRM_SETUP_STEPS } from "@/lib/config/crmMode";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type EmpresaForm = {
  // A. Identidad
  nombreComercial: string;
  nombreLegal: string;
  pais: string;
  ciudad: string;
  sitioWeb: string;
  redes: string;
  // B. Rubro y vertical
  rubro: string;
  giro: string;
  tiposCliente: string[];
  vertical: string;
  // C. Modelo comercial
  queVende: string;
  fuentesProspectos: string[];
  requiereVisita: string;
  tipoCotizacion: string;
  // D. Contexto IA
  comoTrabajaHoy: string;
  queEsperaLograr: string;
  queDeberiaAnalizarIA: string;
};

const INITIAL_FORM: EmpresaForm = {
  nombreComercial: "",
  nombreLegal: "",
  pais: "",
  ciudad: "",
  sitioWeb: "",
  redes: "",
  rubro: "",
  giro: "",
  tiposCliente: [],
  vertical: "",
  queVende: "",
  fuentesProspectos: [],
  requiereVisita: "",
  tipoCotizacion: "",
  comoTrabajaHoy: "",
  queEsperaLograr: "",
  queDeberiaAnalizarIA: "",
};

// ─── Opciones de campos ───────────────────────────────────────────────────────

const RUBROS = [
  "Agencia de marketing",
  "Empresa de limpieza",
  "Laboratorio",
  "Estudio contable",
  "Consultoría B2B",
  "Software / tecnología",
  "Salud",
  "Educación",
  "Construcción",
  "Otro",
];

const TIPOS_CLIENTE = ["B2B", "B2C", "B2G"];

const FUENTES_PROSPECTOS = [
  "Web",
  "Redes sociales",
  "Referidos",
  "WhatsApp",
  "Llamadas",
  "Email",
  "Eventos",
  "Outbound comercial",
  "Alianzas",
  "Otro",
];

const OPCIONES_VISITA = ["Sí", "No", "Depende"];

const OPCIONES_COTIZACION = ["Estándar", "Personalizada", "Mixta"];

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

// ─── Página ───────────────────────────────────────────────────────────────────

export default function EmpresaPage() {
  const [form, setForm] = useState<EmpresaForm>(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

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
          data?: { empresa?: unknown } | null;
          error?: string | null;
        } | null;

        if (!res.ok) {
          if (!cancelled) {
            setSaveError(json?.error ?? "No se pudo cargar la configuración guardada.");
          }
          return;
        }

        const empresa = json?.data?.empresa;

        if (
          empresa &&
          typeof empresa === "object" &&
          !Array.isArray(empresa) &&
          Object.keys(empresa).length > 0
        ) {
          if (!cancelled) {
            const loaded = empresa as Partial<EmpresaForm>;
            setForm({
              ...INITIAL_FORM,
              ...loaded,
              tiposCliente: Array.isArray(loaded.tiposCliente)
                ? loaded.tiposCliente
                : INITIAL_FORM.tiposCliente,
              fuentesProspectos: Array.isArray(loaded.fuentesProspectos)
                ? loaded.fuentesProspectos
                : INITIAL_FORM.fuentesProspectos,
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

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/admin/constructor/setup", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "empresa", mark_completed: true, data: form }),
      });
      const json = (await res.json()) as { data?: unknown; error?: string | null };
      if (!res.ok || json.error) {
        setSaveError(json.error ?? "Error al guardar");
      } else {
        setSaveMessage("Configuración guardada correctamente.");
      }
    } catch {
      setSaveError("Error de red al guardar");
    } finally {
      setSaving(false);
    }
  }

  function setField<K extends keyof EmpresaForm>(key: K, value: EmpresaForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleFuente(fuente: string) {
    setForm((prev) => ({
      ...prev,
      fuentesProspectos: prev.fuentesProspectos.includes(fuente)
        ? prev.fuentesProspectos.filter((f) => f !== fuente)
        : [...prev.fuentesProspectos, fuente],
    }));
  }

  function toggleTipoCliente(tipo: string) {
    setForm((prev) => ({
      ...prev,
      tiposCliente: prev.tiposCliente.includes(tipo)
        ? prev.tiposCliente.filter((t) => t !== tipo)
        : [...prev.tiposCliente, tipo],
    }));
  }

  const step = CRM_SETUP_STEPS.find((s) => s.id === "empresa");

  return (
    <PageContainer>
      <div className="space-y-5">

        {/* ── Aviso de persistencia ─────────────────────────────────────── */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3">
          <p className="text-xs font-semibold text-amber-800">
            {loading
              ? "Cargando configuración guardada..."
              : "Este paso guarda la configuración en la base de datos"}
          </p>
          <p className="mt-0.5 text-xs text-amber-700">
            Usá <strong>Guardar configuración</strong> antes de avanzar al siguiente bloque.
          </p>
        </div>

        {/* ── Card principal ───────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8">

          {/* Breadcrumb / back */}
          <div className="mb-6 flex items-center gap-2 text-xs text-slate-400">
            <Link
              href="/admin/constructor"
              className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              Constructor CRM
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-600">Empresa</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              Paso {step?.step ?? 1} de {CRM_SETUP_STEPS.length}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Empresa
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
              Definí la base de la empresa para que el sistema pueda diseñar un
              CRM comercial coherente con su país, rubro, giro, vertical y
              modelo de negocio.
            </p>
          </div>

          {/* ── Formulario ───────────────────────────────────────────────────── */}
          <div className="space-y-8">

            {/* A. Identidad de empresa */}
            <section className="rounded-xl border border-slate-100 bg-slate-50/60 p-5">
              <SectionHeader letter="A" title="Identidad de empresa" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={LABEL_CLASS}>Nombre comercial</label>
                  <input
                    type="text"
                    value={form.nombreComercial}
                    onChange={(e) => setField("nombreComercial", e.target.value)}
                    placeholder="Ej: Casalimpia"
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Nombre legal</label>
                  <input
                    type="text"
                    value={form.nombreLegal}
                    onChange={(e) => setField("nombreLegal", e.target.value)}
                    placeholder="Ej: Casalimpia S.A."
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>País</label>
                  <input
                    type="text"
                    value={form.pais}
                    onChange={(e) => setField("pais", e.target.value)}
                    placeholder="Ej: Ecuador"
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Ciudad / región</label>
                  <input
                    type="text"
                    value={form.ciudad}
                    onChange={(e) => setField("ciudad", e.target.value)}
                    placeholder="Ej: Guayaquil"
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Sitio web</label>
                  <input
                    type="url"
                    value={form.sitioWeb}
                    onChange={(e) => setField("sitioWeb", e.target.value)}
                    placeholder="https://..."
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Redes o links relevantes</label>
                  <input
                    type="text"
                    value={form.redes}
                    onChange={(e) => setField("redes", e.target.value)}
                    placeholder="LinkedIn, Instagram, etc."
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            </section>

            {/* B. Rubro y vertical */}
            <section className="rounded-xl border border-slate-100 bg-slate-50/60 p-5">
              <SectionHeader letter="B" title="Rubro y vertical" />
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={LABEL_CLASS}>Rubro principal</label>
                    <select
                      value={form.rubro}
                      onChange={(e) => setField("rubro", e.target.value)}
                      className={INPUT_CLASS}
                    >
                      <option value="">Seleccioná un rubro</option>
                      {RUBROS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Giro / actividad específica</label>
                    <input
                      type="text"
                      value={form.giro}
                      onChange={(e) => setField("giro", e.target.value)}
                      placeholder="Ej: limpieza de hospitales y laboratorios"
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    Tipo de cliente principal
                    <span className="ml-1 text-xs font-normal text-slate-400">(puede ser más de uno)</span>
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {TIPOS_CLIENTE.map((tipo) => (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => toggleTipoCliente(tipo)}
                        className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                          form.tiposCliente.includes(tipo)
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {tipo}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={LABEL_CLASS}>Vertical principal</label>
                  <input
                    type="text"
                    value={form.vertical}
                    onChange={(e) => setField("vertical", e.target.value)}
                    placeholder="Ej: limpieza corporativa, servicios contables para pymes, laboratorio clínico…"
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            </section>

            {/* C. Modelo comercial inicial */}
            <section className="rounded-xl border border-slate-100 bg-slate-50/60 p-5">
              <SectionHeader letter="C" title="Modelo comercial inicial" />
              <div className="space-y-4">
                <div>
                  <label className={LABEL_CLASS}>¿Qué vende la empresa?</label>
                  <textarea
                    value={form.queVende}
                    onChange={(e) => setField("queVende", e.target.value)}
                    placeholder="Describí brevemente los productos o servicios que comercializa."
                    rows={3}
                    className={TEXTAREA_CLASS}
                  />
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    ¿Cómo llegan normalmente los prospectos?
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {FUENTES_PROSPECTOS.map((fuente) => (
                      <button
                        key={fuente}
                        type="button"
                        onClick={() => toggleFuente(fuente)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                          form.fuentesProspectos.includes(fuente)
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {fuente}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    ¿Requiere visita o reunión antes de cotizar?
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {OPCIONES_VISITA.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setField("requiereVisita", opt)}
                        className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                          form.requiereVisita === opt
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    ¿La propuesta o cotización es estándar o personalizada?
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {OPCIONES_COTIZACION.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setField("tipoCotizacion", opt)}
                        className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                          form.tipoCotizacion === opt
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* D. Contexto para IA futura */}
            <section className="rounded-xl border border-slate-100 bg-slate-50/60 p-5">
              <SectionHeader letter="D" title="Contexto para IA futura" />
              <p className="mb-4 text-xs text-slate-500">
                Esta información alimentará los motores IA cuando se activen en
                una fase posterior. Cuanto más detallada, mejor será el análisis.
              </p>
              <div className="space-y-4">
                <div>
                  <label className={LABEL_CLASS}>
                    ¿Cómo trabaja hoy la empresa? (proceso actual)
                  </label>
                  <textarea
                    value={form.comoTrabajaHoy}
                    onChange={(e) => setField("comoTrabajaHoy", e.target.value)}
                    placeholder="Describí brevemente cómo funciona el proceso comercial hoy: cómo contactan prospectos, cómo cotizan, cómo cierran."
                    rows={4}
                    className={TEXTAREA_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>
                    ¿Qué espera lograr con el CRM?
                  </label>
                  <textarea
                    value={form.queEsperaLograr}
                    onChange={(e) => setField("queEsperaLograr", e.target.value)}
                    placeholder="Ej: ordenar el seguimiento, cerrar más rápido, tener visibilidad del pipeline, automatizar tareas repetitivas…"
                    rows={3}
                    className={TEXTAREA_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>
                    ¿Qué información debería analizar la IA cuando se active?
                  </label>
                  <textarea
                    value={form.queDeberiaAnalizarIA}
                    onChange={(e) => setField("queDeberiaAnalizarIA", e.target.value)}
                    placeholder="Ej: los contratos anteriores, la base de clientes actuales, el tarifario, los informes de ventas históricos…"
                    rows={3}
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
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar configuración"}
            </button>

            {saveMessage && (
              <span className="text-xs font-medium text-green-700">{saveMessage}</span>
            )}
            {saveError && (
              <span className="text-xs font-medium text-red-600">{saveError}</span>
            )}

            <Link
              href="/admin/constructor/cuestionario"
              className="ml-auto inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900"
            >
              Continuar a Cuestionario
              <ChevronRight className="h-4 w-4" />
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
    </PageContainer>
  );
}
