"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";

type DraftListItem = {
  id: string;
  status: string;
  packageVersion: string;
  constructorId: string | null;
  targetClientId: string | null;
  requestedBy: string | null;
  generatedAt: string;
  expiresAt: string | null;
  warningsCount: number;
  blockedActionsCount: number;
  humanConfirmationStatus: string;
  createdAt: string;
};

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

function rowSemaphore(item: DraftListItem): "green" | "amber" | "red" {
  if (item.status === "rejected" || item.status === "expired") return "red";
  if (
    item.status === "under_review" ||
    item.status === "changes_requested" ||
    item.warningsCount > 0
  ) {
    return "amber";
  }
  return "green";
}

const DOT: Record<"green" | "amber" | "red", string> = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
};

export default function PaquetesDraftsListPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<DraftListItem[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/constructor/installable-package/drafts?limit=100", {
        cache: "no-store",
        headers: { "Cache-Control": "no-store" },
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.message ?? json?.code ?? "Error al cargar borradores");
      }
      setItems(Array.isArray(json?.items) ? json.items : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/admin/constructor"
              className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Constructor CRM
            </Link>
            <h1 className="text-xl font-semibold text-slate-900">Borradores de paquete instalable</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Vista interna solo lectura. No aprueba ni instala CRM; inspección del paquete persistido
              en <code className="rounded bg-slate-100 px-1">installer_package_drafts</code>.
            </p>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Listado</p>
          </div>
          {loading ? (
            <p className="p-6 text-sm text-slate-500">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No hay borradores registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium text-slate-500">
                  <tr>
                    <th className="px-3 py-2.5" aria-label="Semáforo" />
                    <th className="px-3 py-2.5">Generado</th>
                    <th className="px-3 py-2.5">Estado</th>
                    <th className="px-3 py-2.5">Versión</th>
                    <th className="px-3 py-2.5">constructor_id</th>
                    <th className="px-3 py-2.5">target_client_id</th>
                    <th className="px-3 py-2.5">requested_by</th>
                    <th className="px-3 py-2.5">expires_at</th>
                    <th className="px-3 py-2.5 text-right">warnings</th>
                    <th className="px-3 py-2.5 text-right">blocked</th>
                    <th className="px-3 py-2.5">Confirmación humana</th>
                    <th className="px-3 py-2.5">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((row) => {
                    const sem = rowSemaphore(row);
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/80">
                        <td className="px-3 py-2.5">
                          <span
                            className={`inline-block h-2.5 w-2.5 rounded-full ${DOT[sem]}`}
                            title={
                              sem === "green"
                                ? "Revisión sin señales críticas (informativo)"
                                : sem === "amber"
                                  ? "Requiere atención / warnings"
                                  : "Expirado o rechazado"
                            }
                          />
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">
                          {formatDt(row.generatedAt)}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs text-slate-800">{row.status}</td>
                        <td className="px-3 py-2.5 text-slate-600">{row.packageVersion}</td>
                        <td className="max-w-[140px] truncate px-3 py-2.5 font-mono text-xs text-slate-600">
                          {row.constructorId ?? "—"}
                        </td>
                        <td className="max-w-[140px] truncate px-3 py-2.5 font-mono text-xs text-slate-600">
                          {row.targetClientId ?? "—"}
                        </td>
                        <td className="max-w-[120px] truncate px-3 py-2.5 font-mono text-xs text-slate-600">
                          {row.requestedBy ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">
                          {formatDt(row.expiresAt)}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">
                          {row.warningsCount}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">
                          {row.blockedActionsCount}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-slate-600">{row.humanConfirmationStatus}</td>
                        <td className="px-3 py-2.5">
                          <Link
                            href={`/admin/constructor/paquetes/${row.id}`}
                            className="inline-flex items-center gap-0.5 text-xs font-medium text-slate-900 underline-offset-2 hover:underline"
                          >
                            Ver detalle
                            <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
