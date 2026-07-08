# CZ: Referenční řešení – test A, úloha 2: vlajka Lotyšska (pouze 2 obdélníky).
# EN: Reference solution – test A, task 2: flag of Latvia (only 2 rectangles).
# CZ: Vlajka = tmavě červená s bílým pruhem uprostřed, poměr pruhů 2:1:2.
# EN: Flag = dark red with a white stripe in the middle, stripe ratio 2:1:2.
# CZ: Trik na 2 obdélníky: celá plocha červeně, přes ni jen bílý prostřední pruh.
# EN: Two-rectangle trick: fill the whole area red, then draw the middle white stripe.

import tkinter
canvas = tkinter.Canvas()
canvas.pack()
x = 30
y = 30
sirka = 210   # šířka / width
vyska = 100   # výška / height

# CZ: 1) celá plocha vlajky tmavě červená  |  EN: 1) whole flag dark red
canvas.create_rectangle(x, y, x + sirka, y + vyska, fill='darkred')
# CZ: 2) bílý prostřední pruh (2/5 až 3/5 výšky)  |  EN: 2) white middle stripe (2/5 to 3/5 of height)
canvas.create_rectangle(x, y + vyska * 2 // 5, x + sirka, y + vyska * 3 // 5, fill='white')

tkinter.mainloop()
