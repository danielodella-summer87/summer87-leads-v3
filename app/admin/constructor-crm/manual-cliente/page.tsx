"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";

const MANUAL_PLAIN_TEXT = `Manual breve de uso — CRM Operativo Summer87
Guía simple para usuarios del cliente durante el piloto o uso inicial.

ANTES DE ENTREGAR: completar URL, usuario, método de acceso, responsable y canal de soporte.

--- Propósito del manual ---
Este manual ayuda a usar el CRM operativo durante el piloto o la etapa inicial.
Incluye Leads, Agenda y Reportes. Algunas funciones avanzadas las gestiona Summer87.

--- Qué es este CRM ---
Herramienta para ordenar oportunidades comerciales, ver leads, actividades y reportes.
Durante el piloto puede haber datos de prueba o datos controlados.

--- Qué puede hacer el usuario ---
Dashboard: resumen inicial.
Leads: revisar oportunidades.
Agenda: actividades y seguimientos.
Reportes: avance comercial.
Soporte: canal definido con Summer87.

--- Qué no está incluido ---
No modificar configuración interna, usuarios, roles, herramientas de fábrica.
No importaciones masivas sin coordinación. IA e integraciones salvo acuerdo.

--- Cómo entrar al CRM ---
URL del CRM: ___
Usuario: ___
Método de acceso: ___
Responsable de soporte: ___
Canal de soporte: ___
Horario de soporte: ___
Usar siempre la URL de Summer87. No compartir acceso.

--- Primer recorrido ---
1 Entrar 2 Dashboard 3 Leads 4 Detalle lead 5 Agenda 6 Pendientes 7 Reportes 8 Anotar dudas

--- Datos piloto ---
Dato incorrecto/duplicado/sensible: avisar soporte. No cargar bases completas sin autorización.

--- Reportar problemas ---
Pantalla, qué intentabas, qué pasó, captura, fecha/hora, si se repite, si afecta a todos.

--- Feedback ---
Menú claro, leads útiles, agenda útil, reportes faltantes, datos que faltan o sobran.

--- Mensaje final ---
El CRM se ajustará con tu feedback. Summer87 acompaña el proceso.
`;

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-700">{children}</div>
    </section>
  );
}

export default function ManualClientePage() {
  const [copied, setCopied] = useState(false);
  const [copyPending, setCopyPending] = useState(false);

  const handleCopy = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      setCopyPending(true);
      return;
    }
    try {
      await navigator.clipboard.writeText(MANUAL_PLAIN_TEXT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopyPending(true);
    }
  }, []);

  return (
    <PageContainer className="max-w-4xl">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Vista interna Summer87
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              Manual breve de uso — CRM Operativo Summer87
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Guía simple para usuarios del cliente durante el piloto o uso inicial.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleCopy()}
              disabled={copyPending}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" aria-hidden />
                  Copiado
                </>
              ) : copyPending ? (
                "Próximamente"
              ) : (
                <>
                  <Copy className="h-4 w-4" aria-hidden />
                  Copiar texto del manual
                </>
              )}
            </button>
            <Link
              href="/admin/constructor-crm"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Volver al Constructor
            </Link>
          </div>
        </div>

        <div
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="note"
        >
          <strong>Antes de entregar:</strong> completar URL, usuario, método de acceso,
          responsable y canal de soporte.
        </div>

        <SectionCard title="Propósito del manual">
          <p>
            Este manual ayuda al usuario del cliente a usar el CRM operativo de forma práctica
            durante el <strong>piloto</strong> o la etapa inicial de uso.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Leads</strong> — oportunidades y seguimiento comercial
            </li>
            <li>
              <strong>Agenda</strong> — llamadas, reuniones y tareas
            </li>
            <li>
              <strong>Reportes</strong> — resumen del avance
            </li>
          </ul>
          <p>
            Algunas funciones avanzadas (configuración, usuarios, integraciones) las gestiona el
            equipo de <strong>Summer87</strong>. Si hace falta un cambio, se pide por el canal de
            soporte acordado.
          </p>
        </SectionCard>

        <SectionCard title="Qué es este CRM">
          <p>
            Es una herramienta para <strong>ordenar oportunidades comerciales</strong> y el día a
            día del seguimiento: ver leads, actividades en la agenda y reportes de avance.
          </p>
          <p>
            El foco es <strong>operar mejor</strong> el proceso comercial, no reemplazar en esta
            etapa todos los sistemas de la empresa.
          </p>
          <p>
            Durante el piloto puede haber <strong>datos de prueba</strong>, muestra o datos reales
            depurados que Summer87 haya explicado. Ante dudas sobre el tipo de datos, consultar
            antes de decisiones importantes.
          </p>
        </SectionCard>

        <SectionCard title="Qué puede hacer el usuario cliente">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[280px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-900">
                  <th className="py-2 pr-3 font-semibold">Área</th>
                  <th className="py-2 pr-3 font-semibold">Qué puede hacer</th>
                  <th className="py-2 font-semibold">Para qué sirve</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                <tr className="border-b border-slate-100">
                  <td className="py-2 pr-3 font-medium">Dashboard</td>
                  <td className="py-2 pr-3">Ver resumen inicial</td>
                  <td className="py-2">Vista rápida del estado general</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 pr-3 font-medium">Leads / Summer87 Leads</td>
                  <td className="py-2 pr-3">Revisar oportunidades</td>
                  <td className="py-2">Seguimiento del embudo comercial</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 pr-3 font-medium">Agenda</td>
                  <td className="py-2 pr-3">Ver actividades y seguimientos</td>
                  <td className="py-2">Planificar el día</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 pr-3 font-medium">Reportes</td>
                  <td className="py-2 pr-3">Consultar avance</td>
                  <td className="py-2">Entender volumen y estados</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-medium">Soporte</td>
                  <td className="py-2 pr-3">Pedir ayuda</td>
                  <td className="py-2">Dudas y mejoras vía canal acordado</td>
                </tr>
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Qué no está incluido en esta etapa">
          <ul className="list-disc space-y-2 pl-5">
            <li>No modificar configuración interna del sistema.</li>
            <li>No crear ni borrar usuarios desde el CRM.</li>
            <li>No cambiar roles ni permisos.</li>
            <li>No usar herramientas de fábrica del menú de trabajo diario del cliente.</li>
            <li>No importaciones masivas sin coordinar con Summer87.</li>
            <li>Integraciones automáticas, IA y emails avanzados solo si están acordados.</li>
          </ul>
          <p className="text-slate-600">
            Si una opción no aparece en el menú del cliente, no corresponde a su perfil en esta
            etapa.
          </p>
        </SectionCard>

        <SectionCard title="Cómo entrar al CRM">
          <p className="text-slate-600">Completar antes de entregar al cliente final:</p>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            {[
              ["URL del CRM", ""],
              ["Usuario", ""],
              ["Método de acceso", ""],
              ["Responsable de soporte", ""],
              ["Canal de soporte", ""],
              ["Horario de soporte", ""],
            ].map(([label]) => (
              <div key={label} className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2">
                <dt className="text-xs font-semibold text-slate-500">{label}</dt>
                <dd className="mt-1 min-h-[1.25rem] text-sm text-slate-400">_________________________</dd>
              </div>
            ))}
          </dl>
          <ul className="mt-4 list-disc space-y-1 pl-5">
            <li>Usar siempre la URL enviada por Summer87.</li>
            <li>No compartir usuario ni contraseña.</li>
            <li>Si no puede entrar, contactar soporte.</li>
          </ul>
        </SectionCard>

        <SectionCard title="Primer recorrido recomendado">
          <ol className="list-decimal space-y-2 pl-5">
            <li>Entrar al CRM con su usuario.</li>
            <li>Mirar el Dashboard.</li>
            <li>Abrir Leads y recorrer el listado.</li>
            <li>Abrir un lead y revisar su información.</li>
            <li>Abrir Agenda y ver actividades pendientes o próximas.</li>
            <li>Revisar actividades vencidas si aparecen.</li>
            <li>Abrir Reportes.</li>
            <li>Anotar dudas o mejoras.</li>
          </ol>
        </SectionCard>

        <SectionCard title="Dashboard">
          <p>Primera pantalla al entrar: resumen general.</p>
          <p className="font-medium text-slate-800">Qué mirar:</p>
          <ul className="list-disc pl-5">
            <li>Volumen general</li>
            <li>Actividad reciente</li>
            <li>Accesos a Leads, Agenda y Reportes</li>
            <li>Alertas si existen</li>
          </ul>
          <p>
            En piloto, contadores en cero pueden deberse a datos de prueba. No tomar esos números
            como definitivos hasta confirmación de Summer87.
          </p>
        </SectionCard>

        <SectionCard title="Leads / Summer87 Leads">
          <p>
            Un <strong>lead</strong> es una oportunidad o contacto comercial en seguimiento.
          </p>
          <p className="font-medium text-slate-800">Acciones básicas:</p>
          <ul className="list-disc pl-5">
            <li>Ver listado, buscar o filtrar si la pantalla lo permite</li>
            <li>Abrir detalle, revisar estado y contacto</li>
            <li>Anotar datos faltantes</li>
          </ul>
          <p>No importar bases completas ni datos sensibles sin autorización.</p>
        </SectionCard>

        <SectionCard title="Agenda">
          <p>Actividades: llamadas, reuniones, tareas de seguimiento.</p>
          <p className="font-medium text-slate-800">Acciones básicas:</p>
          <ul className="list-disc pl-5">
            <li>Ver pendientes y vencidas</li>
            <li>Leer nota, fecha y lugar</li>
            <li>Usar como apoyo al seguimiento diario</li>
          </ul>
          <p>En demo controlada, no crear actividades críticas sin autorización de Summer87.</p>
        </SectionCard>

        <SectionCard title="Reportes">
          <p>Resumen del avance comercial. Dependen de la cantidad de datos cargados.</p>
          <p className="font-medium text-slate-800">Qué mirar:</p>
          <ul className="list-disc pl-5">
            <li>Cantidad de leads y por estado</li>
            <li>Actividades pendientes o realizadas</li>
            <li>Resumen semanal si existe</li>
          </ul>
          <p>Pedir a Summer87 los reportes específicos que el negocio necesite.</p>
        </SectionCard>

        <SectionCard title="Datos durante el piloto">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-2 text-left font-semibold">Caso</th>
                  <th className="py-2 text-left font-semibold">Qué hacer</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Dato incorrecto", "Avisar soporte"],
                  ["Dato duplicado", "Avisar soporte"],
                  ["Falta un dato", "Anotarlo en feedback"],
                  ["Dato sensible visible", "Avisar de inmediato"],
                  ["No entiende un dato", "Pedir explicación"],
                ].map(([c, a]) => (
                  <tr key={c} className="border-b border-slate-100">
                    <td className="py-2 pr-3">{c}</td>
                    <td className="py-2">{a}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Buenas prácticas">
          <ul className="list-disc space-y-1 pl-5">
            <li>Entrar con su propio usuario; no compartir acceso.</li>
            <li>Revisar Leads y Agenda con la frecuencia acordada.</li>
            <li>Anotar dudas al momento.</li>
            <li>No modificar información crítica sin estar seguro.</li>
            <li>Reportar errores con captura.</li>
            <li>Distinguir datos de prueba de datos reales.</li>
          </ul>
        </SectionCard>

        <SectionCard title="Cómo reportar errores o dudas">
          <ul className="list-disc pl-5">
            <li>Pantalla usada</li>
            <li>Qué intentaba hacer</li>
            <li>Qué ocurrió</li>
            <li>Captura de pantalla</li>
            <li>Fecha y hora</li>
            <li>Si se repite y si afecta a todos</li>
          </ul>
          <blockquote className="mt-3 rounded-lg border-l-4 border-slate-300 bg-slate-50 px-4 py-2 text-sm italic text-slate-700">
            Estaba en Agenda, abrí una actividad y no vi el responsable. Captura adjunta. Me pasó
            hoy a las 10:30.
          </blockquote>
        </SectionCard>

        <SectionCard title="Qué feedback necesitamos del cliente">
          <ol className="list-decimal space-y-1 pl-5">
            <li>¿Entiende qué hacer al entrar?</li>
            <li>¿El menú es claro?</li>
            <li>¿Leads representa su proceso?</li>
            <li>¿Agenda ayuda al seguimiento?</li>
            <li>¿Qué reporte falta?</li>
            <li>¿Qué dato sobra o falta?</li>
            <li>¿Qué pantalla no entendió?</li>
            <li>¿Qué acción esperaba y no pudo?</li>
            <li>¿Qué haría falta para usarlo una semana?</li>
          </ol>
        </SectionCard>

        <SectionCard title="Límites del piloto">
          <p>
            No es la versión final; puede haber datos limitados y funciones no disponibles por
            diseño. Summer87 ajusta según acuerdo. El piloto es colaboración, no examen.
          </p>
        </SectionCard>

        <SectionCard title="Responsabilidades">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-2 text-left font-semibold">Actor</th>
                  <th className="py-2 text-left font-semibold">Responsabilidad</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Usuario cliente", "Usar el CRM y reportar"],
                  ["Responsable cliente", "Centralizar feedback"],
                  ["Summer87", "Soporte y ajustes acordados"],
                ].map(([a, r]) => (
                  <tr key={a} className="border-b border-slate-100">
                    <td className="py-2 pr-3 font-medium">{a}</td>
                    <td className="py-2">{r}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Glosario simple">
          <dl className="grid gap-2 sm:grid-cols-2">
            {[
              ["Lead", "Oportunidad o contacto en seguimiento"],
              ["Estado", "Etapa del lead en el proceso"],
              ["Agenda", "Actividades con fechas"],
              ["Actividad", "Llamada, reunión, tarea"],
              ["Reporte", "Resumen de avance"],
              ["Dashboard", "Pantalla inicial"],
              ["Piloto", "Prueba controlada"],
              ["Datos de prueba", "Ejemplos, no necesariamente reales"],
            ].map(([t, d]) => (
              <div key={t}>
                <dt className="font-semibold text-slate-900">{t}</dt>
                <dd className="text-slate-600">{d}</dd>
              </div>
            ))}
          </dl>
        </SectionCard>

        <SectionCard title="Checklist rápido del usuario">
          <ul className="space-y-2">
            {[
              "Pudo entrar al CRM",
              "Vio el menú",
              "Abrió Leads, Agenda y Reportes",
              "Entendió si los datos son de prueba",
              "Sabe cómo reportar dudas",
              "Sabe qué no está incluido",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-0.5 inline-block h-4 w-4 shrink-0 rounded border border-slate-300 bg-white" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Mensaje final">
          <p>
            Gracias por participar del piloto. El CRM se ajustará con el feedback del equipo. Lo
            valioso es detectar qué ayuda en el día a día y qué falta.
          </p>
          <p>
            <strong>Summer87</strong> acompaña el proceso. El piloto sirve para construir algo
            útil juntos, no para exigir perfección desde el primer día.
          </p>
        </SectionCard>

        <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-6">
          <button
            type="button"
            onClick={() => void handleCopy()}
            disabled={copyPending}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copyPending ? "Próximamente" : copied ? "Copiado" : "Copiar texto del manual"}
          </button>
          <Link
            href="/admin/constructor-crm"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Constructor
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
