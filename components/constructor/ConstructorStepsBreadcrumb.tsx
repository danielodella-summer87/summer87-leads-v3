"use client";

import { Fragment } from "react";
import Link from "next/link";

const ITEMS = [
  { id: "empresa", label: "Empresa", href: "/admin/constructor/empresa" },
  { id: "cuestionario", label: "Cuestionario", href: "/admin/constructor/cuestionario" },
  { id: "documentos", label: "Documentos", href: "/admin/constructor/documentos" },
  { id: "diagnostico", label: "Diagnóstico", href: "/admin/constructor/diagnostico" },
  { id: "proceso-pipeline", label: "Proceso y pipeline", href: "/admin/constructor/proceso-pipeline" },
  { id: "motores-ia", label: "Motores IA", href: "/admin/constructor/motores-ia" },
  { id: "reportes", label: "Reportes", href: "/admin/constructor/reportes" },
  { id: "auditoria", label: "Auditoría final", href: "/admin/constructor/auditoria" },
] as const;

export type ConstructorStepsBreadcrumbCurrentId = (typeof ITEMS)[number]["id"];

type ConstructorStepsBreadcrumbProps = {
  currentStepId: ConstructorStepsBreadcrumbCurrentId;
};

/**
 * Breadcrumb horizontal de las etapas del Constructor (navegación entre pasos).
 */
export function ConstructorStepsBreadcrumb({ currentStepId }: ConstructorStepsBreadcrumbProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
      <Link href="/admin/constructor" className="hover:text-slate-800 transition-colors">
        ← Constructor CRM
      </Link>
      <span>/</span>
      {ITEMS.map((item, i) => (
        <Fragment key={item.id}>
          {currentStepId === item.id ? (
            <span className="font-medium text-slate-800">{item.label}</span>
          ) : (
            <Link href={item.href} className="hover:text-slate-800 transition-colors">
              {item.label}
            </Link>
          )}
          {i < ITEMS.length - 1 ? <span>/</span> : null}
        </Fragment>
      ))}
    </div>
  );
}
