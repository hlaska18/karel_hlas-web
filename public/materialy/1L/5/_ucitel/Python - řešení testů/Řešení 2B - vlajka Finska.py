# CZ: Referenční řešení – test B, úloha 2: vlajka Finska (3 obdélníky).
# EN: Reference solution – test B, task 2: flag of Finland (3 rectangles).
# CZ: Bílá vlajka s tmavě modrým skandinávským křížem posunutým k žerdi.
# EN: White flag with a dark blue Nordic cross shifted towards the hoist.

import tkinter
canvas = tkinter.Canvas()
canvas.pack()
x = 30
y = 30
sirka = 210   # šířka / width
vyska = 100   # výška / height

# CZ: 1) bílé pozadí přes celou vlajku  |  EN: 1) white background over the whole flag
canvas.create_rectangle(x, y, x + sirka, y + vyska, fill='white')
# CZ: 2) vodorovné rameno kříže (na střed, tloušťka 30)  |  EN: 2) horizontal arm of the cross (centred, thickness 30)
canvas.create_rectangle(x, y + 35, x + sirka, y + 65, fill='darkblue')
# CZ: 3) svislé rameno kříže (posunuté k žerdi, tloušťka 30)  |  EN: 3) vertical arm (shifted to the hoist, thickness 30)
canvas.create_rectangle(x + 55, y, x + 85, y + vyska, fill='darkblue')

tkinter.mainloop()
