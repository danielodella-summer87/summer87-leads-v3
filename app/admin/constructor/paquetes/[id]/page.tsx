"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";

type DraftMetadata = {
  id: string;
  constructorId: string | null;
  targetClientId: string | null;
  packageVersion: string;
  status: string;
  requiresHumanConfirmation: boolean;
  humanConfirmationStatus: string;
  requestedBy: string | null;
  reviewedBy: string | null;
  approvedBy: string | null;
  rejectedBy: string | null;
  rejectionReason: string | null;
  generatedAt: string;
  reviewedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type DraftDetailResponse = {
  ok: boolean;
  draft?: {
    metadata: DraftMetadata;
    packagePayload: Record<string, unknown>;
    warnings: unknown[];
    blockedActions: unknown[];
    humanConfirmationStatus: string;
  };
  code?: string;
  message?: string;
};

const PAYLOAD_SECTION_KEYS: { key: string; label: string }[] = [
  { key: "installation_manifest", label: "Manifest" },
  { key: "client_identity", label: "Identidad cliente" },
  { key: "crm_modules_config", label: "Módulos CRM" },
  { key: "pipeline_config", label: "Pipeline" },
  { key: "lead_fields_config", label: "Campos de leads" },
  { key: "permissions_config", label: "Permisos" },
  { key: "ai_rules_config", label: "Reglas IA" },
  { key: "reports_config", label: "Reportes" },
  { key: "integrations_config", label: "Integraciones" },
  { key: "installer_decisions", label: "Decisiones del instalador" },
  { key: "activation_checklist", label: "Checklist de activación" },
];

function formatDt(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es-AR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function JsonBlock({ title, value }: { title: string; value: unknown }) {
  const text =
    value === undefined
      ? "// (ausente)"
      : JSON.stringify(value, null, 2);
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/50">
      <div className="border-b border-slate-200 bg-white px-4 py-2">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>
      <pre className="max-h-[min(420px,50vh)] overflow-auto p-4 text-xs leading-relaxed text-slate-700">
        {text}
      </pre>
    </section>
  );
}

export default function PaqueteDraftDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DraftDetailResponse["draft"] | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/constructor/installable-package/drafts/${encodeURIComponent(id)}`,
        { cache: "no-store", headers: { "Cache-Control": "no-store" } }
      );
      const json = (await res.json()) as DraftDetailResponse;
      if (!res.ok || !json.ok || !json.draft) {
        throw new Error(json?.message ?? json?.code ?? "No se pudo cargar el borrador");
      }
      setData(json.draft);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function copyId() {
    if (!id || !navigator.clipboard?.writeText) return;
    await navigator.clipboard.writeText(id);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  const meta = data?.metadata;

  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <Link
            href="/admin/constructor/paquetes"
            className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Borradores de paquete
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Detalle del borrador</h1>
              <p className="mt-1 text-sm text-slate-500">
                Solo lectura. Sin aprobar, instalar, borrar ni escribir en Zeta.
              </p>
            </div>
            {id ? (
              <button
                type="button"
                onClick={() => void copyId()}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                Copiar ID
              </button>
            ) : null}
          </div>
          {id ? (
            <p className="mt-2 font-mono text-xs text-slate-500 break-all">{id}</p>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : null}

        {loading ? (
          <p className="text-sm text-slate-500">Cargando…</p>
        ) : meta && data ? (
          <div className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-800">Resumen del draft</h2>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-slate-400">Estado</dt>
                  <dd className="font-mono text-slate-900">{meta.status}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">package_version</dt>
                  <dd className="text-slate-800">{meta.packageVersion}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Generado</dt>
                  <dd className="text-slate-800">{formatDt(meta.generatedAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Expira</dt>
                  <dd className="text-slate-800">{formatDt(meta.expiresAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">constructor_id</dt>
                  <dd className="break-all font-mono text-xs text-slate-700">{meta.constructorId ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">target_client_id</dt>
                  <dd className="break-all font-mono text-xs text-slate-700">{meta.targetClientId ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">requested_by</dt>
                  <dd className="break-all font-mono text-xs text-slate-700">{meta.requestedBy ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">created_at / updated_at</dt>
                  <dd className="text-xs text-slate-700">
                    {formatDt(meta.createdAt)} · {formatDt(meta.updatedAt)}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-800">Estado humano</h2>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-slate-400">human_confirmation_status</dt>
                  <dd className="font-mono text-slate-900">{data.humanConfirmationStatus}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">requires_human_confirmation</dt>
                  <dd className="text-slate-800">{meta.requiresHumanConfirmation ? "sí" : "no"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">reviewed_by / reviewed_at</dt>
                  <dd className="break-all font-mono text-xs text-slate-700">
                    {meta.reviewedBy ?? "—"} · {formatDt(meta.reviewedAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">approved_by / approved_at</dt>
                  <dd className="break-all font-mono text-xs text-slate-700">
                    {meta.approvedBy ?? "—"} · {formatDt(meta.approvedAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">rejected_by / rejected_at</dt>
                  <dd className="break-all font-mono text-xs text-slate-700">
                    {meta.rejectedBy ?? "—"} · {formatDt(meta.rejectedAt)}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-slate-400">rejection_reason</dt>
                  <dd className="text-slate-800">{meta.rejectionReason ?? "—"}</dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-amber-700">
                La confirmación explícita y botones de aprobación serán fases posteriores (p. ej. 8E). Esta
                pantalla no modifica estados.
              </p>
            </section>

            <JsonBlock title="Warnings" value={data.warnings} />
            <JsonBlock title="Acciones bloqueadas (blocked_actions)" value={data.blockedActions} />

            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-800">Contenido del paquete (package_payload)</h2>
              <p className="text-xs text-slate-500">
                JSON solo lectura. Zeta no se edita desde aquí. No hay instalación ni escritura a sistemas
                externos.
              </p>
              <div className="grid gap-4 lg:grid-cols-2">
                {PAYLOAD_SECTION_KEYS.map(({ key, label }) => (
                  <JsonBlock key={key} title={label} value={data.packagePayload[key]} />
                ))}
              </div>
              <JsonBlock title="package_payload completo" value={data.packagePayload} />
            </div>
          </div>
        ) : !loading && !error ? (
          <p className="text-sm text-slate-500">Sin datos.</p>
        ) : null}
      </div>
    </PageContainer>
  );
}
