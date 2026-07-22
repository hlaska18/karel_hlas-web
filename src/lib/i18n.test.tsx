// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { ReactNode } from "react";
import { LanguageProvider, useLang } from "@/lib/i18n";
import { t } from "@/lib/content";

const wrapper = (lang: "cs" | "en") =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <LanguageProvider lang={lang}>{children}</LanguageProvider>;
  };

describe("useLang", () => {
  it("throws when used outside a LanguageProvider", () => {
    expect(() => renderHook(() => useLang())).toThrow(/LanguageProvider/);
  });

  it("exposes the current language and matching translations (cs)", () => {
    const { result } = renderHook(() => useLang(), { wrapper: wrapper("cs") });
    expect(result.current.lang).toBe("cs");
    expect(result.current.tr).toBe(t.cs);
  });

  it("exposes the current language and matching translations (en)", () => {
    const { result } = renderHook(() => useLang(), { wrapper: wrapper("en") });
    expect(result.current.lang).toBe("en");
    expect(result.current.tr).toBe(t.en);
  });
});

describe("LanguageProvider", () => {
  it("sets the document language attribute", () => {
    renderHook(() => useLang(), { wrapper: wrapper("en") });
    expect(document.documentElement.lang).toBe("en");
  });
});
