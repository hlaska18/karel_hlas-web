# Referenční řešení – test B, úloha 2: vlajka Finska (3 obdélníky)
# Bílá vlajka s tmavě modrým skandinávským křížem posunutým k žerdi.
# 1 obdélník = bílé pozadí, 2 obdélníky = vodorovné a svislé rameno kříže.

import tkinter
canvas = tkinter.Canvas()
canvas.pack()
x = 30
y = 30
sirka = 210
vyska = 100

# 1) bílé pozadí přes celou vlajku
canvas.create_rectangle(x, y, x + sirka, y + vyska, fill='white')
# 2) vodorovné rameno kříže (svisle na střed, tloušťka 30)
canvas.create_rectangle(x, y + 35, x + sirka, y + 65, fill='darkblue')
# 3) svislé rameno kříže (posunuté k žerdi, tloušťka 30)
canvas.create_rectangle(x + 55, y, x + 85, y + vyska, fill='darkblue')

tkinter.mainloop()
