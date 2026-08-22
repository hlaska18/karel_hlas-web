/**
 * Změří kontrast textu proti skutečně vykreslenému pozadí na zadané stránce.
 *
 * Vkládá se do prohlížeče (javascript_tool) a vrací seznam prvků pod prahem
 * podle WCAG AA: 4,5 pro běžný text, 3,0 pro velký (24 px a víc, nebo 18,66 px
 * tučně).
 *
 * Pozadí se hledá průchodem nahoru, dokud se nenajde neprůhledná plocha –
 * skleněné povrchy mají `background-color: transparent` a barvu nesou
 * v přechodu, takže brát vlastní `backgroundColor` prvku by lhalo.
 *
 * Motiv NIKDY nepřepínat přeřazením třídy za běhu: next-themes ji vzápětí
 * vrátí a měří se rozpůlený stav. Vždy localStorage + čisté načtení stránky.
 */
(() => {
  function jas(c) {
    const [r, g, b] = c.map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  const rozloz = (s) => (s.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number);

  function pozadiZa(el) {
    let e = el;
    while (e) {
      const b = getComputedStyle(e).backgroundColor;
      const m = b.match(/[\d.]+/g);
      if (m && (m.length < 4 || parseFloat(m[3]) > 0.55)) return rozloz(b);
      e = e.parentElement;
    }
    return [255, 255, 255];
  }

  const propadlo = [];
  document
    .querySelectorAll("p,span,a,h1,h2,h3,h4,h5,li,button,label,td,th,code,summary")
    .forEach((el) => {
      if (!el.offsetParent || !el.textContent.trim()) return;
      const st = getComputedStyle(el);
      if (parseFloat(st.opacity) < 0.6) return;
      const f = jas(rozloz(st.color));
      const p = jas(pozadiZa(el));
      const k = (Math.max(f, p) + 0.05) / (Math.min(f, p) + 0.05);
      const velikost = parseFloat(st.fontSize);
      const tucne = parseInt(st.fontWeight, 10) >= 700;
      const prah = velikost >= 24 || (velikost >= 18.66 && tucne) ? 3 : 4.5;
      if (k < prah) {
        propadlo.push({
          text: el.textContent.trim().slice(0, 40),
          kontrast: +k.toFixed(2),
          prah,
          velikost,
        });
      }
    });

  const de = document.documentElement;
  return {
    adresa: location.pathname,
    motiv: de.classList.contains("dark") ? "tmavý" : "světlý",
    sirka: de.clientWidth,
    vodorovnyPresah: de.scrollWidth > de.clientWidth,
    propadlo: propadlo.length,
    ukazka: propadlo.slice(0, 8),
  };
})();
