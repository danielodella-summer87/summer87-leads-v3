/**
 * Contenido declarativo del preset controlado pickup_4x4 para package_payload.
 * No ejecuta integraciones ni escrituras externas; solo datos serializables para borrador/simulación.
 */

export const PICKUP_4X4_PRESET_KEY = "pickup_4x4" as const;

export function isPickup4x4Preset(value: string | undefined): boolean {
  return value === PICKUP_4X4_PRESET_KEY;
}

export function mergePickup4x4IntoPackagePayload(params: {
  baseInstallationManifest: Record<string, unknown>;
  constructorIdRaw: string | undefined;
}): {
  installation_manifest: Record<string, unknown>;
  client_identity: Record<string, unknown>;
  crm_modules_config: Record<string, unknown>;
  pipeline_config: Record<string, unknown>;
  lead_fields_config: Record<string, unknown>;
  permissions_config: Record<string, unknown>;
  ai_rules_config: Record<string, unknown>;
  reports_config: Record<string, unknown>;
  integrations_config: Record<string, unknown>;
  installer_decisions: Record<string, unknown>;
  activation_checklist: Record<string, unknown>;
} {
  const { baseInstallationManifest, constructorIdRaw } = params;

  return {
    installation_manifest: {
      ...baseInstallationManifest,
      preset: PICKUP_4X4_PRESET_KEY,
      targetClientName: "Pickup 4x4",
      sourceConstructorId: constructorIdRaw ?? baseInstallationManifest.sourceConstructorId,
    },
    client_identity: {
      clientName: "Pickup 4x4",
      businessType: "Venta, equipamiento y servicios para camionetas 4x4",
      country: "Uruguay",
      externalSystem: "Kore",
      integrationMode: "read_only_initial",
    },
    crm_modules_config: {
      modules: [
        { key: "clientes", label: "Clientes", enabled: true },
        { key: "vehiculos", label: "Vehículos", enabled: true },
        { key: "oportunidades", label: "Oportunidades", enabled: true },
        { key: "pipeline_comercial", label: "Pipeline comercial", enabled: true },
        { key: "agenda_tareas", label: "Agenda / tareas", enabled: true },
        { key: "postventa", label: "Postventa", enabled: true },
        { key: "reportes", label: "Reportes", enabled: true },
        { key: "integracion_kore", label: "Integración Kore read-only", enabled: true },
      ],
    },
    pipeline_config: {
      stages: [
        { key: "nuevo_contacto", label: "Nuevo contacto", order: 1 },
        { key: "consulta_calificada", label: "Consulta calificada", order: 2 },
        { key: "vehiculo_identificado", label: "Vehículo identificado", order: 3 },
        { key: "necesidad_detectada", label: "Necesidad detectada", order: 4 },
        { key: "presupuesto_enviado", label: "Presupuesto enviado", order: 5 },
        { key: "negociacion", label: "Negociación", order: 6 },
        { key: "venta_ganada", label: "Venta ganada", order: 7 },
        { key: "venta_perdida", label: "Venta perdida", order: 8 },
        { key: "postventa_seguimiento", label: "Postventa / seguimiento", order: 9 },
      ],
    },
    lead_fields_config: {
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
          fields: [
            "marca",
            "modelo",
            "año",
            "matricula",
            "tipo_uso",
            "accesorios_interes",
          ],
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
    permissions_config: {
      roles: [
        { key: "summer87_superadmin", label: "superadmin Summer87" },
        { key: "pickup_responsable_comercial", label: "responsable comercial Pickup" },
        { key: "vendedor", label: "vendedor" },
        { key: "lectura_gerencial", label: "lectura gerencial" },
        { key: "integracion_tecnica_ro", label: "integración técnica read-only" },
      ],
    },
    integrations_config: {
      integrations: [
        {
          system: "Kore",
          mode: "read_only",
          writeAllowed: false,
          syncDirection: "kore_to_summer87",
          status: "pending_credentials",
          notes: "No escribir en Kore en esta fase.",
        },
      ],
    },
    ai_rules_config: {
      rules: [
        "IA permitida solo para análisis, clasificación y recomendaciones.",
        "IA no puede enviar mensajes automáticos.",
        "IA no puede modificar Kore.",
        "IA no puede crear ventas ni documentos.",
        "IA no puede cambiar precios.",
      ],
    },
    reports_config: {
      reports: [
        { key: "oportunidades_por_etapa", label: "oportunidades por etapa" },
        { key: "clientes_activos", label: "clientes activos" },
        { key: "consultas_por_origen", label: "consultas por origen" },
        { key: "presupuestos_enviados", label: "presupuestos enviados" },
        { key: "ventas_ganadas_perdidas", label: "ventas ganadas/perdidas" },
        { key: "seguimiento_pendiente", label: "seguimiento pendiente" },
        { key: "datos_sincronizados_kore", label: "datos sincronizados desde Kore" },
      ],
    },
    activation_checklist: {
      steps: [
        "validar identidad cliente",
        "validar acceso Kore",
        "validar campos mínimos",
        "validar pipeline",
        "validar permisos",
        "validar política read-only",
        "simular preinstalación",
        "guardar snapshot",
        "aprobación humana final",
      ],
    },
    installer_decisions: {
      installationMode: "draft_only",
      tenantCreation: "blocked",
      userCreation: "blocked",
      externalWrites: "blocked",
      koreWrite: "blocked",
      requiresHumanConfirmation: true,
    },
  };
}
