import { readFile } from "node:fs/promises";
import path from "node:path";
import { BookOpen, AlertTriangle, FileText, Info } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import {
  ManualSectionAccordion,
  type ManualSection,
} from "@/components/constructor/ManualSectionAccordion";

/**
 * CONSTRUCTOR-OPERATIONS-4 — Render del manual operativo real desde Markdown.
 *
 * Server Component: lee el archivo Markdown fuente (OPERATIONS-1) con fs/promises,
 * lo parsea por secciones de nivel 2 (## ...) y entrega cada sección a un componente
 * client colapsable (ManualSectionAccordion) que la renderiza con react-markdown.
 *
 * Fuente de verdad: docs/constructor-crm/CONSTRUCTOR-OPERATIONS-1-...md (NO se duplica
 * el contenido en JSX). Protegido por app/admin/constructor-crm/layout.tsx (403 en
 * client_crm). No ejecuta SQL, no activa motores, no escribe datos.
 */

const MANUAL_RELATIVE_PATH =
  "docs/constructor-crm/CONSTRUCTOR-OPERATIONS-1-manual-operativo-uso-constructor-crm.md";

const SEMAFORO: { color: string; dot: string; label: string }[] = [
  { color: "border-green-200 bg-green-50 text-green-800", dot: "bg-green-600", label: "VERDE: listo para avanzar" },
  { color: "border-amber-200 bg-amber-50 text-amber-800", dot: "bg-amber-500", label: "AMARILLO: revisar antes de seguir" },
  { color: "border-red-200 bg-red-50 text-red-800", dot: "bg-red-600", label: "ROJO: detenerse" },
];

/**
 * Parsea el Markdown en secciones por headings de nivel 2 (`## `), respetando los
 * bloques de código (```), para no confundir comentarios `#`/`##` dentro de code.
 * El preámbulo (título H1 + intro) se descarta: la pantalla tiene un header fijo.
 */
function parseManualSections(markdown: string): ManualSection[] {
  const lines = markdown.split("\n");
  const sections: ManualSection[] = [];
  let current: { title: string; lines: string[] } | null = null;
  let inFence = false;
  let index = 0;

  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
    }
    const heading = !inFence ? /^##\s+(.+?)\s*$/.exec(line) : null;
    if (heading) {
      if (current) {
        sections.push({
          id: `sec-${index}`,
          title: current.title,
          body: current.lines.join("\n").trim(),
        });
        index += 1;
      }
      current = { title: heading[1], lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }

  if (current) {
    sections.push({
      id: `sec-${index}`,
      title: current.title,
      body: current.lines.join("\n").trim(),
    });
  }

  return sections;
}

export default async function ManualOperativoPage() {
  let sections: ManualSection[] = [];
  let readError = false;

  try {
    const fullPath = path.join(process.cwd(), MANUAL_RELATIVE_PATH);
    const markdown = await readFile(fullPath, "utf8");
    sections = parseManualSections(markdown);
  } catch {
    readError = true;
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* ── Header fijo ──────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold tracking-wide text-white">
            <BookOpen className="h-3 w-3" />
            Constructor CRM
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Manual operativo del Constructor CRM
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-500">
            Desde la venta de un nuevo CRM hasta la activación en cliente.
          </p>

          {/* Aviso interno */}
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-800">
              Este manual es interno. No ejecuta SQL, no activa motores y no crea
              CRM operativo.
            </p>
          </div>
        </div>

        {/* ── Cómo usar este manual + semáforo ─────────────────────────────── */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Info className="h-4 w-4 text-slate-500" />
              Cómo usar este manual
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
              <li>• Primero leé el flujo completo (venta → activación).</li>
              <li>• Luego seguí las secciones por orden.</li>
              <li>
                • <strong className="text-slate-900">No ejecutes SQL</strong> sin
                confirmación humana.
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-slate-900">Semáforo operativo</h2>
            <div className="mt-3 space-y-2">
              {SEMAFORO.map((s) => (
                <div
                  key={s.label}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${s.color}`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
                  {s.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Referencia a la fuente de verdad ─────────────────────────────── */}
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
          <div>
            <p className="text-sm text-slate-600">
              Contenido renderizado desde el archivo fuente del repositorio (fuente de
              verdad única):
            </p>
            <p className="mt-1 font-mono text-xs text-slate-800">
              {MANUAL_RELATIVE_PATH}
            </p>
          </div>
        </div>

        {/* ── Manual real en bloques colapsables ───────────────────────────── */}
        {readError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
            No se pudo leer el archivo del manual en{" "}
            <span className="font-mono">{MANUAL_RELATIVE_PATH}</span>. Verificá que el
            archivo exista en el repositorio. El contenido completo siempre está
            disponible en ese archivo.
          </div>
        ) : sections.length === 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
            El archivo del manual no contiene secciones de nivel 2 (
            <span className="font-mono">## </span>) para mostrar.
          </div>
        ) : (
          <ManualSectionAccordion sections={sections} />
        )}
      </div>
    </PageContainer>
  );
}
