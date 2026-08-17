#!/bin/bash
# Nasnímá sadu stránek ve světlém i tmavém motivu pro srovnání před/po.
#
# Použití:  scripts/snimky-vzhledu.sh pred
#           scripts/snimky-vzhledu.sh po
#
# Vývojový server musí běžet na portu 3000.

set -u
STAV="${1:?zadej stav, napr. 'pred' nebo 'po'}"
KAM="${2:-/private/tmp/claude-501/-Users-karlik-macbook-Desktop-Web/67944336-e8d9-46b6-97c3-b5e0f7459ef0/scratchpad/vzhled}"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
ZAKLAD="http://localhost:3000"

mkdir -p "$KAM"

# stranka:adresa:vyska
STRANKY=(
  "uvod:/:1700"
  "banka:/#banka:1500"
  "predmety:/#predmety:1500"
  "sql:/sql:1500"
)

# Motiv se NESMÍ nechat na systému: tenhle Mac běží v tmavém režimu, takže
# bez vynucení vyjdou obě sady tmavé. Pomocná stránka /_motiv.html ho zapíše
# do localStorage (odkud ho bere next-themes) a přesměruje na cílovou adresu.
for polozka in "${STRANKY[@]}"; do
  nazev="${polozka%%:*}"
  zbytek="${polozka#*:}"
  cesta="${zbytek%%:*}"
  vyska="${zbytek##*:}"
  for motiv in svetly tmavy; do
    [ "$motiv" = "tmavy" ] && m=dark || m=light
    kam_enc="$(python3 -c 'import sys,urllib.parse;print(urllib.parse.quote(sys.argv[1],safe=""))' "$cesta")"
    soubor="$KAM/${STAV}-${nazev}-${motiv}.png"
    # Bez --user-data-dir: s čerstvým profilem se Chrome zasekává, a není ho
    # třeba – localStorage drží po dobu sezení, takže přechod z /_motiv.html
    # na cílovou stránku si motiv odnese.
    "$CHROME" --headless --disable-gpu --hide-scrollbars \
      --window-size=1280,"$vyska" --screenshot="$soubor" \
      --virtual-time-budget=8000 \
      "${ZAKLAD}/_motiv.html?m=${m}&kam=${kam_enc}" >/dev/null 2>&1
    if [ -f "$soubor" ]; then
      printf "  %-28s %6d kB\n" "$(basename "$soubor")" "$(( $(stat -f%z "$soubor") / 1024 ))"
    else
      printf "  %-28s NEPOVEDLO SE\n" "$(basename "$soubor")"
    fi
  done
done
