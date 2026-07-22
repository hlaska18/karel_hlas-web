// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Win = typeof window & { docx?: { renderAsync: ReturnType<typeof vi.fn> } };

/**
 * jsdom does not actually fetch/execute <script src>, so we intercept the
 * append and decide whether the "load" succeeds (fires onload) or fails
 * (fires onerror) to exercise both branches of the lazy CDN loader.
 */
function stubScriptLoading(mode: "load" | "error") {
  return vi.spyOn(document.head, "appendChild").mockImplementation(((node: Node) => {
    const s = node as HTMLScriptElement;
    queueMicrotask(() => {
      if (mode === "error") s.onerror?.(new Event("error"));
      else s.onload?.(new Event("load"));
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("loads the CDN scripts, fetches the file, and renders into the container", async () => {
    const renderDocx = await freshRenderDocx();
    const renderAsync = vi.fn().mockResolvedValue(undefined);
    const append = stubScriptLoading("load");
    (window as Win).docx = { renderAsync };

    const blob = new Blob(["doc"]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200, blob: () => Promise.resolve(blob) }),
    );

    const container = document.createElement("div");
    container.innerHTML = "<p>old</p>";

    await renderDocx("/materialy/a.docx", container);

    expect(fetch).toHaveBeenCalledWith("/materialy/a.docx");
    // Both JSZip and docx-preview scripts are requested.
    const srcs = append.mock.calls.map((c) => (c[0] as HTMLScriptElement).src);
    expect(srcs.some((s) => s.includes("jszip"))).toBe(true);
    expect(srcs.some((s) => s.includes("docx-preview"))).toBe(true);
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
    const append = stubScriptLoading("load");
    (window as Win).docx = { renderAsync: vi.fn().mockResolvedValue(undefined) };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200, blob: () => Promise.resolve(new Blob()) }),
    );

    await renderDocx("/materialy/a.docx", document.createElement("div"));
    await renderDocx("/materialy/b.docx", document.createElement("div"));

    // 2 distinct scripts, appended once each despite two renders.
    expect(append).toHaveBeenCalledTimes(2);
  });

  it("rejects when a CDN script fails to load", async () => {
    const renderDocx = await freshRenderDocx();
    stubScriptLoading("error");
    vi.stubGlobal("fetch", vi.fn());

    await expect(renderDocx("/materialy/a.docx", document.createElement("div"))).rejects.toThrow(
      /Nepodařilo se načíst/,
    );
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
    stubScriptLoading("load");
    (window as Win).docx = { renderAsync: vi.fn() };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));

    await expect(
      renderDocx("/materialy/missing.docx", document.createElement("div")),
    ).rejects.toThrow(/404/);
  });
});
