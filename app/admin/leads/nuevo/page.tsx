"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import RubroSelect from "@/app/admin/empresas/RubroSelect";

type PipelineRow = {
  id: string;
  nombre: string;
  posicion: number;
  tipo: "normal" | "ganado" | "perdido";
  color: string | null;
  orden?: number | null;
  created_at?: string;
};

type PipelinesApiResponse = {
  data?: PipelineRow[] | null;
  error?: string | null;
};

/** Orden coherente con Kanban (`app/admin/leads/kanban/page.tsx`). */
function sortPipelineRows(rows: PipelineRow[]): PipelineRow[] {
  return [...rows].sort((a, b) => {
    const ordenA = a.orden ?? 999999;
    const ordenB = b.orden ?? 999999;
    if (ordenA !== ordenB) return ordenA - ordenB;
    return (a.created_at ?? "").localeCompare(b.created_at ?? "");
  });
}

const FALLBACK_PIPELINE_NAMES = [
  "Nuevo",
  "Contactado",
  "En seguimiento",
  "Calificado",
  "No interesado",
  "Cerrado",
] as const;

/** Etiquetas UI → valores `next_activity_type` permitidos por POST (cleanActivityType). */
const NEXT_ACTIVITY_OPTIONS: ReadonlyArray<{ label: string; value: string }> = [
  { label: "— Opcional —", value: "" },
  { label: "Contactar por WhatsApp", value: "whatsapp" },
  { label: "Llamar", value: "call" },
  { label: "Enviar cotización", value: "proposal" },
  { label: "Coordinar visita", value: "meeting" },
  { label: "Consultar stock", value: "email" },
  { label: "Hacer seguimiento", value: "followup" },
  { label: "Otro", value: "followup" },
];

type LeadCreatePayload = {
  nombre: string;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  origen: string | null;
  pipeline: string | null;
  oferta: string | null;
  notas: string | null;
  next_activity_type: string | null;
  next_activity_at: string | null;
  comercial_id: string | null;
  rubro_id: string | null;
  cantidad_personal: number | null;
  superficie_m2: number | null;
  direccion: string | null;
  visita_scheduled_at: string | null;
};

type Lead = LeadCreatePayload & {
  id: string;
  created_at?: string | null;
  updated_at?: string | null;
  estado?: string | null;
};

type LeadApiResponse = {
  data?: Lead | null;
  error?: string | null;
};

type Comercial = {
  id: string;
  nombre: string;
};

type ComercialesApiResponse = {
  data?: Comercial[] | null;
  error?: string | null;
};

function norm(v: string): string | null {
  const s = (v ?? "").trim();
  return s.length ? s : null;
}

function normNumber(v: string): number | null {
  const s = (v ?? "").trim();
  if (!s.length) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function normDateTimeLocal(v: string): string | null {
  const s = (v ?? "").trim();
  if (!s.length) return null;
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d.toISOString() : null;
}

export default function NuevoLeadPage() {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [origen, setOrigen] = useState("");
  const [oferta, setOferta] = useState("");
  const [pipeline, setPipeline] = useState("");
  const [nextActivityType, setNextActivityType] = useState("");
  const [nextActivityAt, setNextActivityAt] = useState("");
  const [notas, setNotas] = useState("");
  const [comercialId, setComercialId] = useState<string>("");
  const [comerciales, setComerciales] = useState<Comercial[]>([]);
  const [rubroId, setRubroId] = useState<string | null>(null);
  const [cantidadPersonal, setCantidadPersonal] = useState("");
  const [superficieM2, setSuperficieM2] = useState("");
  const [direccion, setDireccion] = useState("");
  const [visitaScheduledAt, setVisitaScheduledAt] = useState("");

  const [pipelinesRemote, setPipelinesRemote] = useState<PipelineRow[]>([]);
  const [pipelinesLoading, setPipelinesLoading] = useState(true);
  const [pipelinesUseFallback, setPipelinesUseFallback] = useState(false);
  const appliedInitialPipeline = useRef(false);

  const canSave = useMemo(() => {
    return nombre.trim().length > 0 && !saving;
  }, [nombre, saving]);

  const pipelineOptions = useMemo(() => {
    if (pipelinesLoading) return [...FALLBACK_PIPELINE_NAMES];
    if (pipelinesUseFallback || pipelinesRemote.length === 0) {
      return [...FALLBACK_PIPELINE_NAMES];
    }
    return pipelinesRemote.map((p) => p.nombre);
  }, [pipelinesLoading, pipelinesUseFallback, pipelinesRemote]);

  useEffect(() => {
    if (pipelinesLoading) return;

    if (pipelinesUseFallback || pipelinesRemote.length === 0) {
      if (!appliedInitialPipeline.current) {
        appliedInitialPipeline.current = true;
        setPipeline(FALLBACK_PIPELINE_NAMES[0]);
      }
      return;
    }

    if (!appliedInitialPipeline.current) {
      appliedInitialPipeline.current = true;
      setPipeline(pipelinesRemote[0].nombre);
    }
  }, [pipelinesLoading, pipelinesRemote, pipelinesUseFallback]);

  useEffect(() => {
    if (!pipelineOptions.length) return;
    if (!pipelineOptions.includes(pipeline)) {
      setPipeline(pipelineOptions[0]);
    }
  }, [pipeline, pipelineOptions]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/comerciales", { cache: "no-store" });
        const json = (await res.json()) as ComercialesApiResponse;
        const rows = Array.isArray(json?.data) ? json.data : [];
        setComerciales(rows);
        if (rows.length === 1) setComercialId((current) => current || rows[0].id);
      } catch {
        setComerciales([]);
      }
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPipelinesLoading(true);
      setPipelinesUseFallback(false);
      try {
        const res = await fetch("/api/admin/leads/pipelines", {
          cache: "no-store",
          headers: { "Cache-Control": "no-store" },
        });
        const json = (await res.json()) as PipelinesApiResponse;
        if (!res.ok) throw new Error(json?.error ?? "Error cargando pipelines");
        const raw = Array.isArray(json?.data) ? json.data : [];
        const sorted = sortPipelineRows(raw);
        if (!cancelled) {
          setPipelinesRemote(sorted);
          setPipelinesUseFallback(false);
        }
      } catch {
        if (!cancelled) {
          setPipelinesRemote([]);
          setPipelinesUseFallback(true);
        }
      } finally {
        if (!cancelled) setPipelinesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function createLead() {
    setError(null);

    if (!nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    if (!comercialId.trim()) {
      setError("Seleccioná un comercial antes de guardar el lead.");
      return;
    }

    const payload: LeadCreatePayload = {
      nombre: nombre.trim(),
      contacto: norm(contacto),
      telefono: norm(telefono),
      email: norm(email),
      origen: norm(origen),
      pipeline: norm(pipeline),
      oferta: norm(oferta),
      notas: norm(notas),
      next_activity_type: norm(nextActivityType),
      next_activity_at: normDateTimeLocal(nextActivityAt),
      comercial_id: comercialId.trim(),
      rubro_id: rubroId,
      cantidad_personal: normNumber(cantidadPersonal),
      superficie_m2: normNumber(superficieM2),
      direccion: norm(direccion),
      visita_scheduled_at: normDateTimeLocal(visitaScheduledAt),
    };

    setSaving(true);
    try {
      const res = await fetch("/api/admin/leads", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as LeadApiResponse;
      if (!res.ok) throw new Error(json?.error ?? "Error creando lead");

      const created = json?.data;
      if (!created?.id) throw new Error("No se recibió el id del lead creado");

      router.push(`/admin/leads/${created.id}`);
    } catch (e: any) {
      setError(e?.message ?? "Error creando lead");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageContainer>
      <div className="rounded-2xl border bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Nuevo lead</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Creamos el lead en Supabase. Incluye <span className="font-semibold">contacto</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={createLead}
              disabled={!canSave}
              className="rounded-xl border px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>

            <Link
              href="/admin/leads"
              className="rounded-xl border px-4 py-2 text-sm hover:bg-slate-50"
            >
              Volver
            </Link>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <Input label="Nombre *" value={nombre} onChange={setNombre} disabled={saving} />
          <Input label="Contacto" value={contacto} onChange={setContacto} disabled={saving} />

          <Input label="Teléfono" value={telefono} onChange={setTelefono} disabled={saving} />
          <Input label="Email" value={email} onChange={setEmail} disabled={saving} />

          <Input label="Origen" value={origen} onChange={setOrigen} disabled={saving} />

          <div className="md:col-span-2 rounded-xl border p-4">
            <div className="text-xs font-semibold text-slate-600">
              Producto / servicio consultado{" "}
              <span className="font-normal text-slate-400">(opcional)</span>
            </div>
            <textarea
              value={oferta}
              onChange={(e) => setOferta(e.target.value)}
              disabled={saving}
              rows={3}
              placeholder="Ej: tapa rígida, lona, cubre caja, baca, rejilla, accesorio interior"
              className="mt-2 w-full rounded-xl border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 disabled:opacity-50"
            />
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
              Ayuda a identificar qué busca el prospecto y luego ordenar reportes por demanda.
            </p>
          </div>

          <div className="rounded-xl border p-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-xs font-semibold text-slate-600">Pipeline</div>
              {pipelinesLoading ? (
                <span className="text-[11px] text-slate-400">Cargando etapas…</span>
              ) : null}
            </div>
            <select
              value={pipelineOptions.includes(pipeline) ? pipeline : pipelineOptions[0] ?? ""}
              onChange={(e) => setPipeline(e.target.value)}
              disabled={saving || pipelinesLoading}
              className="mt-2 w-full rounded-xl border px-3 py-2 text-sm text-slate-900 disabled:opacity-50"
            >
              {pipelineOptions.map((nombre) => (
                <option key={nombre} value={nombre}>
                  {nombre}
                </option>
              ))}
            </select>
            {pipelinesUseFallback ? (
              <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] leading-relaxed text-amber-900">
                No se pudieron cargar las etapas reales. Se muestran opciones base.
              </div>
            ) : (
              <div className="mt-2 text-xs text-slate-500">
                Etapas desde la configuración del pipeline (mismas columnas que el Kanban).
              </div>
            )}
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-xs font-semibold text-slate-800">Seguimiento inicial</p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Evita que el lead quede sin próximo paso en el Kanban.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <div className="text-xs font-semibold text-slate-600">
                  Próxima acción{" "}
                  <span className="font-normal text-slate-400">(opcional)</span>
                </div>
                <select
                  value={nextActivityType}
                  onChange={(e) => setNextActivityType(e.target.value)}
                  disabled={saving}
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm text-slate-900 disabled:opacity-50"
                >
                  {NEXT_ACTIVITY_OPTIONS.map((opt) => (
                    <option key={`${opt.label}-${opt.value}`} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-600">
                  Fecha de próximo seguimiento{" "}
                  <span className="font-normal text-slate-400">(opcional)</span>
                </div>
                <input
                  type="datetime-local"
                  value={nextActivityAt}
                  onChange={(e) => setNextActivityAt(e.target.value)}
                  disabled={saving}
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm text-slate-900 disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border p-4 md:col-span-2">
            <div className="text-xs font-semibold text-slate-600">Comercial *</div>
            <select
              value={comercialId}
              onChange={(e) => setComercialId(e.target.value)}
              disabled={saving}
              className="mt-2 w-full rounded-xl border px-3 py-2 text-sm text-slate-900 disabled:opacity-50"
            >
              <option value="">Sin asignar</option>
              {comerciales.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            <div className="mt-2 text-xs text-slate-500">
              Obligatorio para guardar el lead.
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border p-4">
          <h2 className="text-sm font-semibold text-slate-800">Datos Casalimpia</h2>
          <p className="mt-1 text-sm text-slate-500">
            Estos datos permiten preparar la visita, estimar alcance y avanzar hacia evaluación/costeo.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border p-4">
              <div className="text-xs font-semibold text-slate-600">Rubro</div>
              <div className="mt-2">
                <RubroSelect
                  value={rubroId}
                  onChange={setRubroId}
                  disabled={saving}
                  placeholder="Seleccionar rubro…"
                />
              </div>
            </div>

            <Input
              label="Cantidad de personal"
              value={cantidadPersonal}
              onChange={setCantidadPersonal}
              disabled={saving}
              type="number"
              min="0"
              step="1"
            />

            <Input
              label="Superficie m²"
              value={superficieM2}
              onChange={setSuperficieM2}
              disabled={saving}
              type="number"
              min="0"
              step="0.01"
            />

            <Input label="Dirección" value={direccion} onChange={setDireccion} disabled={saving} />

            <Input
              label="Fecha de visita"
              value={visitaScheduledAt}
              onChange={setVisitaScheduledAt}
              disabled={saving}
              type="datetime-local"
            />
          </div>
        </div>

        <div className="mt-4">
          <Textarea label="Notas" value={notas} onChange={setNotas} disabled={saving} />
        </div>
      </div>
    </PageContainer>
  );
}

function Input({
  label,
  value,
  onChange,
  disabled,
  type = "text",
  min,
  step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  type?: string;
  min?: string;
  step?: string;
}) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-xs font-semibold text-slate-600">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        min={min}
        step={step}
        className="mt-2 w-full rounded-xl border px-3 py-2 text-sm text-slate-900 disabled:opacity-50"
      />
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="text-xs font-semibold text-slate-600">{label}</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={4}
        className="mt-2 w-full rounded-xl border px-3 py-2 text-sm text-slate-900 disabled:opacity-50"
      />
    </div>
  );
}