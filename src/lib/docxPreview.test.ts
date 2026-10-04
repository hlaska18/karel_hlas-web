// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Win = typeof window & {
  docx?: { renderAsync: ReturnType<typeof vi.fn> };
  JSZip?: unknown;
};

/**
 * jsdom does not actually fetch/execute <script src>, so we intercept the
 * append and decide whether the "load" succeeds (fires onload) or fails
 * (fires onerror). A successful load also exposes the library's global, as
 * the real script would – `docx` only when `docxGlobal` is given, so a test
 * can simulate a script that loads but never defines its global.
 */
function stubScriptLoading(mode: "load" | "error", docxGlobal?: Win["docx"]) {
  return vi.spyOn(document.head, "appendChild").mockImplementation(((node: Node) => {
    const s = node as HTMLScriptElement;
    queueMicrotask(() => {
      if (mode === "error") {
        s.onerror?.(new Event("error"));
        return;
      }
      if (s.src.includes("jszip")) (window as Win).JSZip = {};
      if (s.src.includes("docx-preview") && docxGlobal) (window as Win).docx = docxGlobal;
      s.onload?.(new Event("load"));
    });
    return node;
  }) as typeof document.head.appendChild);
}

// Fresh module (and thus a fresh script cache) per test.
async function freshRenderDocx() {
  vi.resetModules();
  return (await import("@/lib/docxPreview")).renderDocx;
}

describe("renderDocx", () => {
  beforeEach(() => {
    delete (window as Win).docx;
    delete (window as Win).JSZip;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("loads the libraries from the site's own copy, fetches the file, and renders", async () => {
    const renderDocx = await freshRenderDocx();
    const renderAsync = vi.fn().mockResolvedValue(undefined);
    const append = stubScriptLoading("load", { renderAsync });

    const blob = new Blob(["doc"]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200, blob: () => Promise.resolve(blob) }),
    );

    const container = document.createElement("div");
    container.innerHTML = "<p>old</p>";

    await renderDocx("/materialy/a.docx", container);

    expect(fetch).toHaveBeenCalledWith("/materialy/a.docx", { signal: undefined });
    // Both JSZip and docx-preview come from /vendor (own copy), not the CDN.
    const srcs = append.mock.calls.map((c) => (c[0] as HTMLScriptElement).src);
    expect(srcs.some((s) => s.includes("/vendor/jszip@"))).toBe(true);
    expect(srcs.some((s) => s.includes("/vendor/docx-preview@"))).toBe(true);
    expect(srcs.some((s) => s.includes("cdn.jsdelivr.net"))).toBe(false);
    expect(container.innerHTML).toBe("");
    expect(renderAsync).toHaveBeenCalledWith(
      blob,
      container,
      null,
      expect.objectContaining({ inWrapper: true, breakPages: true }),
    );
  });

  it("caches each script so it is only appended once across calls", async () => {
    const renderDocx = await freshRenderDocx();
    const append = stubScriptLoading("load", { renderAsync: vi.fn().mockResolvedValue(undefined) });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200, blob: () => Promise.resolve(new Blob()) }),
    );

    await renderDocx("/materialy/a.docx", document.createElement("div"));
    await renderDocx("/materialy/b.docx", document.createElement("div"));

    // 2 distinct scripts, appended once each despite two renders.
    expect(append).toHaveBeenCalledTimes(2);
  });

  it("falls back to the CDN and rejects when both fail to load", async () => {
    const renderDocx = await freshRenderDocx();
    const append = stubScriptLoading("error");
    vi.stubGlobal("fetch", vi.fn());

    await expect(renderDocx("/materialy/a.docx", document.createElement("div"))).rejects.toThrow(
      /Nepodařilo se načíst/,
    );
    const srcs = append.mock.calls.map((c) => (c[0] as HTMLScriptElement).src);
    expect(srcs[0]).toContain("/vendor/jszip@");
    expect(srcs[1]).toContain("cdn.jsdelivr.net/npm/jszip@");
  });

  it("throws when the docx-preview global never appears", async () => {
    const renderDocx = await freshRenderDocx();
    stubScriptLoading("load");
    // window.docx intentionally left undefined.
    vi.stubGlobal("fetch", vi.fn());

    await expect(renderDocx("/materialy/b.docx", document.createElement("div"))).rejects.toThrow(
      /docx-preview/,
    );
  });

  it("throws a helpful error when the file download fails", async () => {
    const renderDocx = await freshRenderDocx();
    stubScriptLoading("load", { renderAsync: vi.fn() });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));

    await expect(
      renderDocx("/materialy/missing.docx", document.createElement("div")),
    ).rejects.toThrow(/404/);
  });
});
