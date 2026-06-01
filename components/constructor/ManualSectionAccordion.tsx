"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * CONSTRUCTOR-OPERATIONS-4 — Bloques colapsables por sección del manual operativo.
 *
 * Parte interactiva (client). Recibe secciones ya parseadas en el Server Component
 * (page.tsx) desde el Markdown real OPERATIONS-1; aquí solo se renderiza/colapsa.
 * El cuerpo de cada sección se renderiza con react-markdown + remark-gfm (sin
 * dangerouslySetInnerHTML).
 */

export type ManualSection = {
  id: string;
  title: string;
  body: string;
};

/** Secciones abiertas por defecto (las primeras N). */
const DEFAULT_OPEN_COUNT = 3;

const MARKDOWN_COMPONENTS = {
  h1: (props: React.ComponentPropsWithoutRef<"h1">) => (
    <h2 className="mt-4 text-xl font-semibold text-slate-900" {...props} />
  ),
  h2: (props: React.ComponentPropsWithoutRef<"h2">) => (
    <h3 className="mt-4 text-lg font-semibold text-slate-900" {...props} />
  ),
  h3: (props: React.ComponentPropsWithoutRef<"h3">) => (
    <h4 className="mt-3 text-base font-semibold text-slate-800" {...props} />
  ),
  h4: (props: React.ComponentPropsWithoutRef<"h4">) => (
    <h5 className="mt-3 text-sm font-semibold text-slate-800" {...props} />
  ),
  p: (props: React.ComponentPropsWithoutRef<"p">) => (
    <p className="mt-3 text-sm leading-relaxed text-slate-600" {...props} />
  ),
  ul: (props: React.ComponentPropsWithoutRef<"ul">) => (
    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600" {...props} />
  ),
  ol: (props: React.ComponentPropsWithoutRef<"ol">) => (
    <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600" {...props} />
  ),
  li: (props: React.ComponentPropsWithoutRef<"li">) => (
    <li className="marker:text-slate-400" {...props} />
  ),
  strong: (props: React.ComponentPropsWithoutRef<"strong">) => (
    <strong className="font-semibold text-slate-900" {...props} />
  ),
  a: (props: React.ComponentPropsWithoutRef<"a">) => (
    <a className="font-medium text-slate-700 underline underline-offset-2 hover:text-slate-900" {...props} />
  ),
  hr: () => <hr className="my-5 border-slate-200" />,
  blockquote: (props: React.ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      className="mt-3 rounded-r-lg border-l-4 border-amber-400 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800 [&>p]:mt-0 [&>p]:text-amber-800"
      {...props}
    />
  ),
  pre: (props: React.ComponentPropsWithoutRef<"pre">) => (
    <pre
      className="mt-3 overflow-x-auto rounded-xl bg-slate-900 px-4 py-3 text-xs leading-relaxed text-slate-100 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-slate-100"
      {...props}
    />
  ),
  code: (props: React.ComponentPropsWithoutRef<"code">) => (
    <code
      className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-slate-800"
      {...props}
    />
  ),
  table: (props: React.ComponentPropsWithoutRef<"table">) => (
    <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm" {...props} />
    </div>
  ),
  thead: (props: React.ComponentPropsWithoutRef<"thead">) => (
    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500" {...props} />
  ),
  th: (props: React.ComponentPropsWithoutRef<"th">) => (
    <th className="border-b border-slate-200 px-3 py-2 font-medium" {...props} />
  ),
  td: (props: React.ComponentPropsWithoutRef<"td">) => (
    <td className="border-b border-slate-100 px-3 py-2 align-top text-slate-600" {...props} />
  ),
};

export function ManualSectionAccordion({ sections }: { sections: ManualSection[] }) {
  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set(sections.slice(0, DEFAULT_OPEN_COUNT).map((s) => s.id))
  );

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allOpen = openIds.size === sections.length;

  const setAll = (open: boolean) => {
    setOpenIds(open ? new Set(sections.map((s) => s.id)) : new Set());
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setAll(!allOpen)}
          className="text-xs font-medium text-slate-500 underline underline-offset-2 hover:text-slate-800"
        >
          {allOpen ? "Colapsar todo" : "Expandir todo"}
        </button>
      </div>

      {sections.map((section) => {
        const isOpen = openIds.has(section.id);
        return (
          <div
            key={section.id}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
          >
            <button
              type="button"
              onClick={() => toggle(section.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left"
            >
              <span className="text-base font-semibold text-slate-900">
                {section.title}
              </span>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isOpen && (
              <div className="border-t border-slate-100 px-6 pb-6 pt-1">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
                  {section.body}
                </ReactMarkdown>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
