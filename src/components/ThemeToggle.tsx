"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { ICON_BUTTON } from "@/lib/styles";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { tr } = useLang();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={tr.ui.theme}
      title={tr.ui.theme}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={ICON_BUTTON}
    >
      {mounted && isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}
