import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  devIndicators: false,
  turbopack: {
    root: path.join(__dirname),
  },
  outputFileTracingRoot: path.join(__dirname),
  /**
   * El segmento de URL `constructor` choca con `Object.prototype.constructor` en el trie
   * del segment explorer de Next DevTools (objeto `children` plano → acceso dinámico
   * devuelve la función Object y el siguiente índice rompe con "reading 'paquetes'").
   * La carpeta real es `constructor-crm`; las URLs públicas siguen siendo `/admin/constructor/...`.
   */
  async rewrites() {
    return [
      { source: "/admin/constructor", destination: "/admin/constructor-crm" },
      { source: "/admin/constructor/:path*", destination: "/admin/constructor-crm/:path*" },
    ];
  },
};

export default nextConfig;
