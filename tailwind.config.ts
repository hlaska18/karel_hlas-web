import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        // Nadpisy: systémová řada. `-apple-system` dá na Macu a iPhonu přímo
        // SF Pro, `Segoe UI Variable Display` na Windows 11 jeho nadpisový řez.
        // Nic se nestahuje a diakritika je jistá – u stažených písem bývá
        // háček nad „ě" první, co se odbude.
        display: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "Segoe UI Variable Display",
          "Segoe UI",
          "system-ui",
          "Roboto",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      // Prostrkání se s velikostí utahuje – velký text potřebuje míň mezer
      // než drobný. Jedno `tracking-tight` na všechno je proto kompromis,
      // který nesedí ani nahoře, ani dole.
      letterSpacing: {
        hero: "-0.032em",
        nadpis: "-0.022em",
        podnadpis: "-0.014em",
      },
      // Tři úrovně zaoblení místo šesti. Na webu bylo `rounded-lg` 9×,
      // `xl` 18×, `2xl` 29× a `3xl` 3× – nahodile podle toho, co se zrovna
      // hodilo. Poloměry jsou schválně větší, než je na webu zvykem; drobné
      // zaoblení působí kancelářsky.
      borderRadius: {
        stitek: "0.5rem", // drobné odznaky a štítky – 8 px
        ovladac: "0.75rem", // tlačítka a vstupy – 12 px
        karta: "1.25rem", // dlaždice a karty – 20 px
        panel: "1.75rem", // velké plochy a modaly – 28 px
      },
      colors: {
        // Vlastní malachitová řada – vědomý posun od defaultní Tailwind
        // `emerald` (kterou má každý AI web), o pár stupňů k modrozelené.
        accent: {
          50: "#edfdf7",
          100: "#d3f8ec",
          200: "#a8f0da",
          300: "#6fe3c2",
          400: "#35cba4",
          500: "#14b28b",
          600: "#0b9273",
          700: "#0a745d",
          800: "#0a5c4b",
          900: "#094c3f",
          950: "#032b23",
        },
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "0.9" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both",
        float: "float 6s ease-in-out infinite",
        "pulse-slow": "pulse-slow 5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
