"use client";

import { useState } from "react";
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
  ChevronLeft,
  Info,
  AlertCircle,
} from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";

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

// ─── Estilos ──────────────────────────────────────────────────────────────────

const LABEL_CLASS = "block text-xs font-semibold text-slate-600 mb-1";
const INPUT_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300";
const SELECT_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300";

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

export default function DocumentosPage() {
  const [form, setForm] = useState<Omit<DocumentoRegistrado, "id">>({
    nombre: "",
    tipo: "",
    usoActual: "",
    etapaComercial: "",
    importancia: "",
  });
  const [lista, setLista] = useState<DocumentoRegistrado[]>([]);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoDocumento | null>(null);

  function agregarDocumento() {
    if (!form.nombre.trim()) return;
    const nuevo: DocumentoRegistrado = {
      id: crypto.randomUUID(),
      ...form,
    };
    setLista((prev) => [...prev, nuevo]);
    setForm({ nombre: "", tipo: "", usoActual: "", etapaComercial: "", importancia: "" });
  }

  function quitarDocumento(id: string) {
    setLista((prev) => prev.filter((d) => d.id !== id));
  }

  const TIPO_LABEL: Record<TipoDocumento, string> = Object.fromEntries(
    TIPO_DOCS.map((t) => [t.id, t.label])
  ) as Record<TipoDocumento, string>;

  const IMPORTANCIA_LABEL: Record<ImportanciaDoc, string> = {
    alta: "Alta",
    media: "Media",
    baja: "Baja",
  };

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

        {/* ── Card principal ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8">

          {/* Header */}
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  Paso 3 de 8
                </span>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Documentos fuente
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                Registrá los materiales, archivos y recursos que ya existen en tu negocio.
                No se suben archivos todavía — solo describís qué tenés para que el sistema
                entienda con qué trabajar en el diagnóstico.
              </p>
            </div>
          </div>

          {/* ── A: Tipos de documentos ──────────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="A" title="¿Qué tipos de documentos tenés?" />
            <p className="mb-4 text-xs text-slate-500">
              Hacé clic en los tipos que aplican a tu negocio. Esto ayuda a entender qué
              materiales existen y cuáles faltan.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {TIPO_DOCS.map((tipo) => {
                const Icon = tipo.icon;
                const isSelected = tipoSeleccionado === tipo.id;
                return (
                  <button
                    key={tipo.id}
                    type="button"
                    onClick={() =>
                      setTipoSeleccionado(isSelected ? null : tipo.id)
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
          </div>

          {/* ── B: Dropzone simulado ────────────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="B" title="Zona de carga (próximamente)" />
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
          </div>

          {/* ── C: Registro manual ──────────────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="C" title="Registrar documento manualmente" />
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
          </div>

          {/* ── D: Lista de documentos registrados ──────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="D" title="Documentos registrados en esta sesión" />
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
              Esta lista es temporal — no se guarda. La persistencia se conectará en un bloque posterior.
            </p>
          </div>

          {/* ── E: Preguntas guía ────────────────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="E" title="Preguntas guía" />
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
          </div>

          {/* ── F: Próximos pasos ────────────────────────────────────────── */}
          <div className="mb-8">
            <SectionHeader letter="F" title="¿Qué pasa con estos documentos?" />
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
          </div>

          {/* ── Navegación ──────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
            <div className="flex flex-wrap gap-2">
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

            <div className="flex flex-col items-end gap-1">
              <button
                type="button"
                disabled
                className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-slate-300 px-6 py-3 text-sm font-semibold text-white opacity-60"
              >
                Continuar a Diagnóstico comercial
              </button>
              <span className="text-[11px] text-slate-400">
                Disponible en Bloque 1F
              </span>
            </div>
          </div>

        </div>
      </div>
    </PageContainer>
  );
}
