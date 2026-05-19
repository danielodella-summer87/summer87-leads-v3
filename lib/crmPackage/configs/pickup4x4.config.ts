/**
 * Contrato demo local Pickup 4x4 — Opción C (12V-1 / 12V-2).
 * No importar desde pantallas operativas hasta 12W (loader + adapters).
 */

import type { CrmPackageConfig } from "../types";
import { CRM_PACKAGE_CONFIG_VERSION } from "../types";

export const pickup4x4CrmPackageConfig = {
  version: CRM_PACKAGE_CONFIG_VERSION,
  contract_id: "pickup4x4-2026-05-19-0001",
  client: {
    slug: "pickup4x4",
    name: "Pickup 4x4",
    businessType: "Venta y equipamiento 4x4",
    country: "UY",
  },
  source: {
    origin: "local_demo_config",
    preset_key: "pickup_4x4",
    installable_package_draft_id: null,
    generated_at: "2026-05-19T12:00:00.000Z",
  },
  activation: {
    status: "active",
    activated_at: "2026-05-19T12:05:00.000Z",
    activated_by: "summer87_superadmin",
    scope: "instance",
  },
  modules: [
    { key: "dashboard_comercial", enabled: true },
    { key: "leads87", enabled: true, label: "Leads" },
    { key: "agenda", enabled: true },
    { key: "reportes", enabled: true },
  ],
  lead_fields: {
    groups: [
      {
        group: "Cliente",
        fields: [
          "nombre",
          "telefono",
          "email",
          "localidad",
          "tipo_cliente",
          "origen",
          "estado_comercial",
        ],
      },
      {
        group: "Vehículo",
        fields: ["marca", "modelo", "año", "matricula", "tipo_uso", "accesorios_interes"],
      },
      {
        group: "Oportunidad",
        fields: [
          "producto_servicio",
          "presupuesto_estimado",
          "vendedor_responsable",
          "etapa",
          "proxima_accion",
          "fecha_limite",
          "observaciones",
        ],
      },
      {
        group: "Kore",
        fields: [
          "kore_cliente_id",
          "kore_documento_id",
          "ultima_sincronizacion",
          "fuente_dato",
          "confianza_dato",
        ],
      },
    ],
  },
  pipeline: {
    stages: [
      { key: "nuevo_contacto", label: "Nuevo contacto", order: 1 },
      { key: "consulta_calificada", label: "Consulta calificada", order: 2 },
      { key: "vehiculo_identificado", label: "Vehículo identificado", order: 3 },
      { key: "necesidad_detectada", label: "Necesidad detectada", order: 4 },
      { key: "presupuesto_enviado", label: "Presupuesto enviado", order: 5 },
      { key: "negociacion", label: "Negociación", order: 6 },
      { key: "venta_ganada", label: "Venta ganada", order: 7, terminal: "won" },
      { key: "venta_perdida", label: "Venta perdida", order: 8, terminal: "lost" },
      { key: "postventa_seguimiento", label: "Postventa / seguimiento", order: 9 },
    ],
  },
  activity_types: [
    { key: "llamada", label: "Llamada" },
    { key: "whatsapp", label: "WhatsApp" },
    { key: "email", label: "Email" },
    { key: "visita_showroom", label: "Visita a showroom" },
    { key: "instalacion", label: "Instalación de accesorios" },
  ],
  dashboards: {
    blocks: [
      { key: "pipeline_summary", enabled: true, order: 1 },
      { key: "oportunidades_por_etapa", enabled: true, order: 2 },
      { key: "ventas_ganadas_perdidas", enabled: true, order: 3 },
      { key: "seguimiento_pendiente", enabled: true, order: 4 },
    ],
  },
  reports: {
    catalog: [
      { key: "oportunidades_por_etapa", enabled: true, label: "Oportunidades por etapa" },
      { key: "ventas_ganadas_perdidas", enabled: true, label: "Ventas ganadas/perdidas" },
      { key: "presupuestos_enviados", enabled: true, label: "Presupuestos enviados" },
      { key: "consultas_por_origen", enabled: true, label: "Consultas por origen" },
      { key: "clientes_activos", enabled: true, label: "Clientes activos" },
      { key: "seguimiento_pendiente", enabled: true, label: "Seguimiento pendiente" },
      {
        key: "datos_sincronizados_kore",
        enabled: false,
        label: "Datos sincronizados desde Kore",
        reason: "pending_kore_credentials",
      },
    ],
  },
  labels: {
    entity_singular: "Cliente",
    entity_plural: "Clientes",
    lead_singular: "Lead",
    lead_plural: "Leads",
    lead_entity_relation: null,
    owner_types: ["lead"],
  },
  visibility_rules: {
    lead_detail: {
      hide_tabs: ["tecnico", "consultor"],
      hide_blocks: [
        "iniciativa_link",
        "relevamiento_visita",
        "servicios_especiales",
        "next_step_easy",
      ],
    },
    sidebar: {
      hide_modules: ["entidades", "socios"],
    },
  },
  role_permissions: [
    { role: "summer87_superadmin", permissions: ["*"] },
    {
      role: "pickup_responsable_comercial",
      label: "Responsable comercial Pickup",
      permissions: ["leads.*", "reports.read", "agenda.*"],
    },
    {
      role: "vendedor",
      label: "Vendedor",
      permissions: ["leads.read", "leads.update", "agenda.own"],
    },
    {
      role: "lectura_gerencial",
      label: "Lectura gerencial",
      permissions: ["reports.read", "dashboard.read"],
    },
    {
      role: "integracion_tecnica_ro",
      label: "Integración técnica read-only",
      permissions: ["integrations.read"],
    },
  ],
  ai_rules: {
    allow_send_messages: false,
    allow_external_writes: false,
    allow_price_changes: false,
    allow_document_creation: false,
    notes: "IA solo análisis, clasificación y recomendaciones.",
    rules_text: [
      "IA permitida solo para análisis, clasificación y recomendaciones.",
      "IA no puede enviar mensajes automáticos.",
      "IA no puede modificar Kore.",
      "IA no puede crear ventas ni documentos.",
      "IA no puede cambiar precios.",
    ],
  },
  branding: {
    logo_url: null,
    suite_name: "Pickup 4x4 CRM",
    primary_color: null,
  },
  integrations: [
    {
      system: "Kore",
      mode: "read_only",
      write_allowed: false,
      sync_direction: "kore_to_summer87",
      status: "pending_credentials",
      notes: "No escribir en Kore en esta fase.",
    },
  ],
  data_policy: {
    external_system: "Kore",
    integration_mode: "read_only_initial",
    write_allowed: false,
  },
  legacy_compatibility: {
    app_mode_required: "client_crm",
    fallback_strategy: "legacy_first",
    unknown_sections: "warn",
  },
  validation: {
    schema_version: CRM_PACKAGE_CONFIG_VERSION,
    validated_at: "2026-05-19T12:05:00.000Z",
    validator: "validateCrmPackageConfigShape",
    errors: [],
  },
  audit: {
    created_by: "constructor_ui",
    approval_chain: [
      {
        actor: "summer87_superadmin",
        action: "approved",
        at: "2026-05-19T11:55:00.000Z",
      },
    ],
    notes: "Contrato demo local Opción C. No replicar a cliente real sin 12W.",
  },
} satisfies CrmPackageConfig;
