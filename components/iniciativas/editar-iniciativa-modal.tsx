"use client";

import { useEffect, useState } from "react";
import RubroSelect from "@/app/admin/empresas/RubroSelect";
import {
  INITIATIVE_KIND_STANDARD,
  INITIATIVE_KIND_STARTUP,
  MIN_STARTUP_PROJECT_DESCRIPTION_LENGTH,
  isStartupInitiativeKind,
} from "@/lib/crm/initiativeKind";
import { labelEstadoRevisionIniciativa } from "@/lib/crm/iniciativaEstadoRevision";

export type IniciativaEditable = {
  id: string;
  nombre: string;
  tipo?: "empresa" | "profesional" | "institucion" | null;
  web: string | null;
  instagram?: string | null;
  instagram_url?: string | null;
  facebook?: string | null;
  linkedin_url?: string | null;
  linkedin_empresa?: string | null;
  linkedin_personal?: string | null;
  direccion?: string | null;
  rut?: string | null;
  ciudad?: string | null;
  pais?: string | null;
  clasificacion?: string | null;
  contacto_nombre?: string | null;
  contacto_cargo?: string | null;
  email: string | null;
  telefono: string | null;
  celular?: string | null;
  whatsapp?: string | null;
  contacto_email?: string | null;
  contacto_celular?: string | null;
  rubro_id: string | null;
  rubro?: string | null;
  descripcion?: string | null;
  fuente_remota?: string | null;
  score_preliminar?: number | null;
  /** Ya normalizado desde API o crudo; solo lectura en el modal. */
  estado_revision?: string | null;
  initiative_kind?: string | null;
  project_description?: string | null;
};

/** Cuerpo enviado a PATCH `/api/admin/empresas/[id]` (no incluye estado_revision). */
export type IniciativaModalSavePayload = {
  nombre: string;
  tipo: "empresa" | "profesional" | "institucion";
  rubro_id: string | null;
  web: string | null;
  instagram_url: string | null;
  facebook: string | null;
  linkedin_url: string | null;
  linkedin_empresa: string | null;
  linkedin_personal: string | null;
  direccion: string | null;
  rut: string | null;
  ciudad: string | null;
  pais: string | null;
  clasificacion: string | null;
  contacto_nombre: string | null;
  contacto_cargo: string | null;
  email: string | null;
  telefono: string | null;
  celular: string | null;
  whatsapp: string | null;
  contacto_email: string | null;
  contacto_celular: string | null;
  initiative_kind: typeof INITIATIVE_KIND_STANDARD | typeof INITIATIVE_KIND_STARTUP;
  project_description: string | null;
  fuente_remota: string | null;
  score_preliminar: number | null;
  descripcion: string | null;
};

/** @deprecated Usar IniciativaModalSavePayload */
export type IniciativaBasicSavePayload = IniciativaModalSavePayload;

type Props = {
  iniciativa: IniciativaEditable | null;
  onClose: () => void;
  onSave: (payload: IniciativaModalSavePayload) => Promise<void>;
  saving?: boolean;
};

function trimOrNull(s: string): string | null {
  const t = s.trim();
  return t.length ? t : null;
}

export default function EditarIniciativaModal({ iniciativa, onClose, onSave, saving = false }: Props) {
  const [nombre, setNombre] = useState("");
  const [tipoEntidad, setTipoEntidad] = useState<"empresa" | "profesional" | "institucion">("empresa");
  const [sitioWeb, setSitioWeb] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [linkedinUrlPrincipal, setLinkedinUrlPrincipal] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [linkedinOrg, setLinkedinOrg] = useState("");
  const [linkedinPersona, setLinkedinPersona] = useState("");
  const [direccion, setDireccion] = useState("");
  const [rut, setRut] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [pais, setPais] = useState("");
  const [clasificacion, setClasificacion] = useState("");
  const [rubroId, setRubroId] = useState<string | null>(null);
  const [initiativeKind, setInitiativeKind] = useState<typeof INITIATIVE_KIND_STANDARD | typeof INITIATIVE_KIND_STARTUP>(
    INITIATIVE_KIND_STANDARD
  );
  const [projectDescription, setProjectDescription] = useState("");

  const [contactoNombre, setContactoNombre] = useState("");
  const [contactoCargo, setContactoCargo] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [celular, setCelular] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [contactoEmail, setContactoEmail] = useState("");
  const [contactoCelular, setContactoCelular] = useState("");

  const [fuenteRemota, setFuenteRemota] = useState("");
  const [scoreStr, setScoreStr] = useState("");
  const [notas, setNotas] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!iniciativa) return;
    setNombre(iniciativa.nombre ?? "");
    const t = iniciativa.tipo;
    setTipoEntidad(t === "profesional" || t === "institucion" ? t : "empresa");
    setSitioWeb(iniciativa.web ?? "");
    setInstagramUrl(iniciativa.instagram_url ?? iniciativa.instagram ?? "");
    setLinkedinUrlPrincipal(iniciativa.linkedin_url ?? "");
    setFacebookUrl(iniciativa.facebook ?? "");
    setLinkedinOrg(iniciativa.linkedin_empresa ?? "");
    setLinkedinPersona(iniciativa.linkedin_personal ?? "");
    setDireccion(iniciativa.direccion ?? "");
    setRut(iniciativa.rut ?? "");
    setCiudad(iniciativa.ciudad ?? "");
    setPais(iniciativa.pais ?? "");
    setClasificacion(iniciativa.clasificacion ?? "");
    setRubroId(iniciativa.rubro_id ?? null);
    const k = String(iniciativa.initiative_kind ?? "").trim().toLowerCase();
    setInitiativeKind(k === INITIATIVE_KIND_STARTUP ? INITIATIVE_KIND_STARTUP : INITIATIVE_KIND_STANDARD);
    setProjectDescription(iniciativa.project_description ?? "");

    setContactoNombre(iniciativa.contacto_nombre ?? "");
    setContactoCargo(iniciativa.contacto_cargo ?? "");
    setEmail(iniciativa.email ?? "");
    setTelefono(iniciativa.telefono ?? "");
    setCelular(iniciativa.celular ?? "");
    setWhatsapp(iniciativa.whatsapp ?? "");
    setContactoEmail(iniciativa.contacto_email ?? "");
    setContactoCelular(iniciativa.contacto_celular ?? "");

    setFuenteRemota(iniciativa.fuente_remota ?? "");
    setScoreStr(
      typeof iniciativa.score_preliminar === "number" && !Number.isNaN(iniciativa.score_preliminar)
        ? String(iniciativa.score_preliminar)
        : ""
    );
    setNotas(iniciativa.descripcion ?? "");
    setLocalError(null);
  }, [iniciativa]);

  useEffect(() => {
    if (!iniciativa) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [iniciativa, onClose]);

  if (!iniciativa) return null;

  const estadoLabel = labelEstadoRevisionIniciativa(iniciativa.estado_revision);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    const n = nombre.trim();
    if (!n) {
      setLocalError("El nombre es obligatorio.");
      return;
    }
    if (isStartupInitiativeKind(initiativeKind)) {
      const plen = projectDescription.trim().length;
      if (plen < MIN_STARTUP_PROJECT_DESCRIPTION_LENGTH) {
        setLocalError(
          `Modo startup: «Proyecto» debe tener al menos ${MIN_STARTUP_PROJECT_DESCRIPTION_LENGTH} caracteres.`
        );
        return;
      }
    }
    let score_preliminar: number | null = null;
    if (scoreStr.trim() !== "") {
      const r = Math.round(Number(scoreStr));
      if (Number.isNaN(r) || r < 0 || r > 10) {
        setLocalError("Score preliminar: número entero entre 0 y 10, o vacío.");
        return;
      }
      score_preliminar = r;
    }

    try {
      await onSave({
        nombre: n,
        tipo: tipoEntidad,
        rubro_id: rubroId,
        web: trimOrNull(sitioWeb),
        instagram_url: trimOrNull(instagramUrl),
        facebook: trimOrNull(facebookUrl),
        linkedin_url: trimOrNull(linkedinUrlPrincipal),
        linkedin_empresa: trimOrNull(linkedinOrg),
        linkedin_personal: trimOrNull(linkedinPersona),
        direccion: trimOrNull(direccion),
        rut: trimOrNull(rut),
        ciudad: trimOrNull(ciudad),
        pais: trimOrNull(pais),
        clasificacion: trimOrNull(clasificacion),
        contacto_nombre: trimOrNull(contactoNombre),
        contacto_cargo: trimOrNull(contactoCargo),
        email: trimOrNull(email),
        telefono: trimOrNull(telefono),
        celular: trimOrNull(celular),
        whatsapp: trimOrNull(whatsapp),
        contacto_email: trimOrNull(contactoEmail),
        contacto_celular: trimOrNull(contactoCelular),
        initiative_kind: initiativeKind,
        project_description: isStartupInitiativeKind(initiativeKind) ? projectDescription.trim() || null : trimOrNull(projectDescription),
        fuente_remota: trimOrNull(fuenteRemota),
        score_preliminar,
        descripcion: trimOrNull(notas),
      });
    } catch {
      /* error en el padre */
    }
  }

  const inputCls =
    "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 disabled:opacity-60";
  const labelCls = "block text-xs font-medium text-slate-600";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="editar-iniciativa-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40"
        aria-label="Cerrar"
        onClick={onClose}
        disabled={saving}
      />
      <div className="relative z-10 flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="shrink-0 border-b border-slate-100 px-6 py-4">
          <h2 id="editar-iniciativa-title" className="text-lg font-semibold text-slate-900">
            Editar iniciativa
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Un solo guardado vía API de empresa. El estado de revisión se muestra solo lectura (cambialo desde Detalle o
            la bandeja).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">A) Datos de empresa</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className={`${labelCls} sm:col-span-2`}>
                  Nombre
                  <input value={nombre} onChange={(ev) => setNombre(ev.target.value)} className={inputCls} disabled={saving} />
                </label>
                <label className={labelCls}>
                  Sitio web
                  <input
                    value={sitioWeb}
                    onChange={(ev) => setSitioWeb(ev.target.value)}
                    className={inputCls}
                    disabled={saving}
                    placeholder="https://…"
                    autoComplete="url"
                  />
                </label>
                <label className={labelCls}>
                  Facebook (URL)
                  <input
                    value={facebookUrl}
                    onChange={(ev) => setFacebookUrl(ev.target.value)}
                    className={inputCls}
                    disabled={saving}
                    placeholder="https://facebook.com/…"
                  />
                </label>
                <label className={labelCls}>
                  Instagram (URL)
                  <input
                    value={instagramUrl}
                    onChange={(ev) => setInstagramUrl(ev.target.value)}
                    className={inputCls}
                    disabled={saving}
                    placeholder="https://instagram.com/…"
                    autoComplete="url"
                  />
                </label>
                <label className={labelCls}>
                  LinkedIn (URL)
                  <input
                    value={linkedinUrlPrincipal}
                    onChange={(ev) => setLinkedinUrlPrincipal(ev.target.value)}
                    className={inputCls}
                    disabled={saving}
                    placeholder="https://linkedin.com/company/…"
                    autoComplete="url"
                  />
                </label>
                <label className={labelCls}>
                  LinkedIn organización (URL)
                  <input
                    value={linkedinOrg}
                    onChange={(ev) => setLinkedinOrg(ev.target.value)}
                    className={inputCls}
                    disabled={saving}
                    placeholder="https://linkedin.com/company/…"
                  />
                </label>
                <label className={labelCls}>
                  LinkedIn contacto (URL)
                  <input
                    value={linkedinPersona}
                    onChange={(ev) => setLinkedinPersona(ev.target.value)}
                    className={inputCls}
                    disabled={saving}
                    placeholder="https://linkedin.com/in/…"
                  />
                </label>
                <label className={`${labelCls} sm:col-span-2`}>
                  Dirección
                  <input value={direccion} onChange={(ev) => setDireccion(ev.target.value)} className={inputCls} disabled={saving} />
                </label>
                <label className={labelCls}>
                  RUT
                  <input value={rut} onChange={(ev) => setRut(ev.target.value)} className={inputCls} disabled={saving} />
                </label>
                <label className={labelCls}>
                  Ciudad
                  <input value={ciudad} onChange={(ev) => setCiudad(ev.target.value)} className={inputCls} disabled={saving} />
                </label>
                <label className={labelCls}>
                  País
                  <input value={pais} onChange={(ev) => setPais(ev.target.value)} className={inputCls} disabled={saving} />
                </label>
                <div className={`${labelCls} sm:col-span-2`}>
                  <span>Rubro</span>
                  <div className="mt-1">
                    <RubroSelect value={rubroId ?? iniciativa.rubro ?? null} onChange={setRubroId} disabled={saving} />
                  </div>
                </div>
                <label className={`${labelCls} sm:col-span-2`}>
                  Clasificación
                  <input
                    value={clasificacion}
                    onChange={(ev) => setClasificacion(ev.target.value)}
                    className={inputCls}
                    disabled={saving}
                    placeholder="Etiqueta comercial libre (ej. prioridad, segmento)…"
                  />
                </label>
                <label className={labelCls}>
                  Tipo de entidad
                  <select
                    value={tipoEntidad}
                    onChange={(ev) => setTipoEntidad(ev.target.value as typeof tipoEntidad)}
                    className={inputCls}
                    disabled={saving}
                  >
                    <option value="empresa">Empresa</option>
                    <option value="profesional">Profesional</option>
                    <option value="institucion">Institución</option>
                  </select>
                </label>
                <label className={labelCls}>
                  Tipo de iniciativa (comercial)
                  <select
                    value={initiativeKind}
                    onChange={(ev) =>
                      setInitiativeKind(
                        ev.target.value === INITIATIVE_KIND_STARTUP ? INITIATIVE_KIND_STARTUP : INITIATIVE_KIND_STANDARD
                      )
                    }
                    className={inputCls}
                    disabled={saving}
                  >
                    <option value={INITIATIVE_KIND_STANDARD}>Estándar</option>
                    <option value={INITIATIVE_KIND_STARTUP}>Startup / proyecto temprano</option>
                  </select>
                </label>
                <label className={`${labelCls} sm:col-span-2`}>
                  Describa su proyecto {isStartupInitiativeKind(initiativeKind) ? `(mín. ${MIN_STARTUP_PROJECT_DESCRIPTION_LENGTH} caracteres)` : "(opcional)"}
                  <textarea
                    value={projectDescription}
                    onChange={(ev) => setProjectDescription(ev.target.value)}
                    rows={isStartupInitiativeKind(initiativeKind) ? 5 : 2}
                    className={inputCls}
                    disabled={saving}
                    placeholder="Solo obligatorio en modo startup…"
                  />
                </label>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">B) Datos de contacto</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className={`${labelCls} sm:col-span-2`}>
                  Contacto (nombre)
                  <input
                    value={contactoNombre}
                    onChange={(ev) => setContactoNombre(ev.target.value)}
                    className={inputCls}
                    disabled={saving}
                  />
                </label>
                <label className={`${labelCls} sm:col-span-2`}>
                  Cargo del contacto
                  <input
                    value={contactoCargo}
                    onChange={(ev) => setContactoCargo(ev.target.value)}
                    className={inputCls}
                    disabled={saving}
                    placeholder="Ej. Director comercial"
                  />
                </label>
                <label className={labelCls}>
                  Email (empresa)
                  <input type="email" value={email} onChange={(ev) => setEmail(ev.target.value)} className={inputCls} disabled={saving} />
                </label>
                <label className={labelCls}>
                  Teléfono
                  <input value={telefono} onChange={(ev) => setTelefono(ev.target.value)} className={inputCls} disabled={saving} />
                </label>
                <label className={labelCls}>
                  Celular
                  <input value={celular} onChange={(ev) => setCelular(ev.target.value)} className={inputCls} disabled={saving} />
                </label>
                <label className={labelCls}>
                  WhatsApp
                  <input
                    value={whatsapp}
                    onChange={(ev) => setWhatsapp(ev.target.value)}
                    className={inputCls}
                    disabled={saving}
                    placeholder="+598 …"
                    autoComplete="tel"
                  />
                </label>
                <label className={labelCls}>
                  Email de contacto
                  <input
                    type="email"
                    value={contactoEmail}
                    onChange={(ev) => setContactoEmail(ev.target.value)}
                    className={inputCls}
                    disabled={saving}
                  />
                </label>
                <label className={labelCls}>
                  Celular de contacto
                  <input
                    value={contactoCelular}
                    onChange={(ev) => setContactoCelular(ev.target.value)}
                    className={inputCls}
                    disabled={saving}
                  />
                </label>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">C) Contexto interno</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className={`${labelCls} sm:col-span-2`}>
                  Fuente remota
                  <input
                    value={fuenteRemota}
                    onChange={(ev) => setFuenteRemota(ev.target.value)}
                    className={inputCls}
                    disabled={saving}
                    placeholder="Ej. LinkedIn, campaña…"
                  />
                </label>
                <label className={labelCls}>
                  Score preliminar (0–10)
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step={1}
                    value={scoreStr}
                    onChange={(ev) => setScoreStr(ev.target.value)}
                    className={inputCls}
                    disabled={saving}
                    placeholder="Vacío = sin score"
                  />
                </label>
                <div className={labelCls}>
                  Estado de revisión
                  <div className="mt-1 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    {estadoLabel}
                  </div>
                  <p className="mt-1 text-[11px] font-normal text-slate-400">Solo lectura en este modal.</p>
                </div>
                <label className={`${labelCls} sm:col-span-2`}>
                  Notas / descripción
                  <textarea
                    value={notas}
                    onChange={(ev) => setNotas(ev.target.value)}
                    rows={4}
                    className={inputCls}
                    disabled={saving}
                    placeholder="Contexto interno, observaciones…"
                  />
                </label>
              </div>
            </div>
          </div>

          {localError ? <p className="mt-3 text-sm text-red-600">{localError}</p> : null}

          <div className="sticky bottom-0 mt-4 flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-white pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl border border-emerald-600 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
