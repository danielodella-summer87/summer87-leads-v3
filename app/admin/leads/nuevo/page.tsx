"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import RubroSelect from "@/app/admin/empresas/RubroSelect";

type LeadCreatePayload = {
  nombre: string;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  origen: string | null;
  pipeline: string | null;
  notas: string | null;
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
  const [pipeline, setPipeline] = useState("Nuevo");
  const [notas, setNotas] = useState("");
  const [comercialId, setComercialId] = useState<string>("");
  const [comerciales, setComerciales] = useState<Comercial[]>([]);
  const [rubroId, setRubroId] = useState<string | null>(null);
  const [cantidadPersonal, setCantidadPersonal] = useState("");
  const [superficieM2, setSuperficieM2] = useState("");
  const [direccion, setDireccion] = useState("");
  const [visitaScheduledAt, setVisitaScheduledAt] = useState("");

  const canSave = useMemo(() => {
    return nombre.trim().length > 0 && !saving;
  }, [nombre, saving]);

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
      notas: norm(notas),
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

          <div className="rounded-xl border p-4">
            <div className="text-xs font-semibold text-slate-600">Pipeline</div>
            <select
              value={pipeline}
              onChange={(e) => setPipeline(e.target.value)}
              disabled={saving}
              className="mt-2 w-full rounded-xl border px-3 py-2 text-sm text-slate-900 disabled:opacity-50"
            >
              <option>Nuevo</option>
              <option>Contactado</option>
              <option>En seguimiento</option>
              <option>Calificado</option>
              <option>No interesado</option>
              <option>Cerrado</option>
            </select>
            <div className="mt-2 text-xs text-slate-500">
              (En A es texto. En B lo conectamos a opciones configurables.)
            </div>
          </div>

          <div className="rounded-xl border p-4">
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