// Společné stavební kameny obou dokumentů (řešení a návod) – styly, odstavce,
// kód, tabulky a seznamy v docx-js.
const d = require("docx");

const SIRKA = 9638; // A4 s okraji 2 cm, v DXA
const MODRA = "365F91";
const MODRA2 = "4F81BD";
const SEDA = "595959";

const styly = {
  default: { document: { run: { font: "Calibri", size: 22 } } },
  paragraphStyles: [
    {
      id: "Heading1",
      name: "Heading 1",
      basedOn: "Normal",
      next: "Normal",
      quickFormat: true,
      run: { size: 30, bold: true, color: MODRA },
      paragraph: { spacing: { before: 360, after: 120 }, keepNext: true, outlineLevel: 0 },
    },
    {
      id: "Heading2",
      name: "Heading 2",
      basedOn: "Normal",
      next: "Normal",
      quickFormat: true,
      run: { size: 24, bold: true, color: MODRA2 },
      paragraph: { spacing: { before: 240, after: 80 }, keepNext: true, outlineLevel: 1 },
    },
    {
      id: "Heading3",
      name: "Heading 3",
      basedOn: "Normal",
      next: "Normal",
      quickFormat: true,
      run: { size: 22, bold: true, color: "243F60" },
      paragraph: { spacing: { before: 200, after: 60 }, keepNext: true, outlineLevel: 2 },
    },
  ],
};

const cislovani = {
  config: [
    {
      reference: "odrazky",
      levels: [
        {
          level: 0,
          format: d.LevelFormat.BULLET,
          text: "•",
          alignment: d.AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 360, hanging: 260 } } },
        },
      ],
    },
    {
      reference: "kroky",
      levels: [
        {
          level: 0,
          format: d.LevelFormat.DECIMAL,
          text: "%1.",
          alignment: d.AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 360, hanging: 300 } } },
        },
      ],
    },
  ],
};

let instance = 0;
/** Nové číslování kroků – každý seznam začíná od 1. */
const novyCislovanySeznam = () => ++instance;

/**
 * Text s inline kódem: části v `…` se sázejí neproporcionálním písmem.
 * Vrací pole TextRunů.
 */
function behy(text, zaklad = {}) {
  const casti = String(text).split(/`([^`]*)`/);
  return casti
    .map((c, i) =>
      c === ""
        ? null
        : i % 2 === 1
          ? new d.TextRun({ ...zaklad, text: c, font: "Consolas", size: 19, shading: { type: d.ShadingType.CLEAR, fill: "EEF2F7", color: "auto" } })
          : new d.TextRun({ ...zaklad, text: c }),
    )
    .filter(Boolean);
}

const odstavec = (text, volby = {}) =>
  new d.Paragraph({ children: behy(text, volby.run || {}), spacing: { after: 100 }, ...(volby.odstavec || {}) });

const slaby = (text) => odstavec(text, { run: { color: SEDA, size: 20 } });

const nadpis = (text, uroven) =>
  new d.Paragraph({
    heading: [d.HeadingLevel.HEADING_1, d.HeadingLevel.HEADING_2, d.HeadingLevel.HEADING_3][uroven - 1],
    children: [new d.TextRun(text)],
  });

const odrazka = (text) =>
  new d.Paragraph({ numbering: { reference: "odrazky", level: 0 }, children: behy(text), spacing: { after: 60 } });

/**
 * Krok postupu. Číslo je napsané přímo v textu, ne přes automatické
 * číslování: to se sice ve Wordu restartuje, ale náhled na Macu i Google
 * Dokumenty restart ignorují a číslovaly by přes celé úkoly dál.
 */
const citace = new Map();
const krok = (text, inst, velikost) => {
  const n = (citace.get(inst) || 0) + 1;
  citace.set(inst, n);
  const run = velikost ? { size: velikost } : {};
  return new d.Paragraph({
    children: [new d.TextRun({ ...run, text: `${n}.\t` })].concat(behy(text, run)),
    tabStops: [{ type: d.TabStopType.LEFT, position: 340 }],
    indent: { left: 340, hanging: 340 },
    spacing: { after: 60 },
  });
};

/** Blok kódu: řádky s šedým podkladem. */
function kod(text) {
  const radky = String(text).split("\n");
  return radky.map(
    (r, i) =>
      new d.Paragraph({
        children: [new d.TextRun({ text: r.length ? r : " ", font: "Consolas", size: 19 })],
        shading: { type: d.ShadingType.CLEAR, fill: "F2F2F2", color: "auto" },
        spacing: { before: i === 0 ? 40 : 0, after: i === radky.length - 1 ? 100 : 0 },
        indent: { left: 120, right: 120 },
      }),
  );
}

const okraj = { style: d.BorderStyle.SINGLE, size: 4, color: "BFC7D1" };
const okraje = { top: okraj, bottom: okraj, left: okraj, right: okraj, insideHorizontal: okraj, insideVertical: okraj };

/**
 * Tabulka. `sloupce` jsou šířky v DXA (součet = SIRKA), `radky` pole polí
 * obsahu – obsah buňky je řetězec nebo pole odstavců. První řádek je hlavička,
 * když `hlavicka` je true.
 */
function tabulka(sloupce, radky, { hlavicka = true, prvniSloupecTucne = false } = {}) {
  return new d.Table({
    width: { size: SIRKA, type: d.WidthType.DXA },
    columnWidths: sloupce,
    borders: okraje,
    rows: radky.map(
      (radek, ri) =>
        new d.TableRow({
          tableHeader: hlavicka && ri === 0,
          cantSplit: false,
          children: radek.map((obsah, ci) => {
            const jeHlavicka = hlavicka && ri === 0;
            const tucne = jeHlavicka || (prvniSloupecTucne && ci === 0);
            const deti = Array.isArray(obsah)
              ? obsah
              : [new d.Paragraph({ children: behy(obsah, { bold: tucne, size: jeHlavicka ? 20 : 21 }), spacing: { after: 40 } })];
            return new d.TableCell({
              width: { size: sloupce[ci], type: d.WidthType.DXA },
              shading: jeHlavicka
                ? { type: d.ShadingType.CLEAR, fill: "DCE6F1", color: "auto" }
                : prvniSloupecTucne && ci === 0
                  ? { type: d.ShadingType.CLEAR, fill: "F3F6FA", color: "auto" }
                  : undefined,
              margins: { top: 60, bottom: 60, left: 100, right: 100 },
              children: deti,
            });
          }),
        }),
    ),
  });
}

const mezera = () => new d.Paragraph({ children: [], spacing: { after: 60 } });

function zapati(nazev) {
  return {
    default: new d.Footer({
      children: [
        new d.Paragraph({
          alignment: d.AlignmentType.RIGHT,
          children: [
            new d.TextRun({ text: `${nazev} · strana `, color: SEDA, size: 18 }),
            new d.TextRun({ children: [d.PageNumber.CURRENT], color: SEDA, size: 18 }),
          ],
        }),
      ],
    }),
  };
}

const vlastnostiStrany = {
  page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } },
};

module.exports = {
  d,
  SIRKA,
  styly,
  cislovani,
  novyCislovanySeznam,
  behy,
  odstavec,
  slaby,
  nadpis,
  odrazka,
  krok,
  kod,
  tabulka,
  mezera,
  zapati,
  vlastnostiStrany,
};
