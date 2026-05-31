/**
 * Punto de entrada del runtime read-only del Constructor (CONSTRUCTOR-RUNTIME-1).
 * Reexporta el helper y sus tipos. Sin efectos secundarios.
 */

export {
  buildConstructorRuntimeConfig,
  CONSTRUCTOR_RUNTIME_CONFIG_SCHEMA_VERSION,
} from "./constructorRuntimeConfig";

export type {
  ConstructorRuntimeStatus,
  ConstructorRuntimeModule,
  ConstructorRuntimeConfig,
  BuildConstructorRuntimeConfigInput,
} from "./constructorRuntimeConfig";
