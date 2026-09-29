/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig = {
  reactStrictMode: true,
  // Banka čte public/materialy při sestavení (getBankItems), a Next proto
  // přibaloval celou složku (~75 MB, 399 souborů) do serverové funkce
  // homepage i /en – v každém nasazení znovu. Vercel pak hlásil 75 %
  // bezplatného limitu Function Storage (29. 9. 2026). Stránky jsou
  // předgenerované a soubory se stahují jako statické z CDN, funkce je
  // nepotřebuje.
  outputFileTracingExcludes: {
    "/": ["public/materialy/**/*"],
    "/en": ["public/materialy/**/*"],
    "/*": ["public/materialy/**/*"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
