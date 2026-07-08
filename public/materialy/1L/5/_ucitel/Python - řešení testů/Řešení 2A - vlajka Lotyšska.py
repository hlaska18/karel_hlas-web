# Referenční řešení – test A, úloha 2: vlajka Lotyšska (pouze 2 obdélníky)
# Vlajka Lotyšska = tmavě červená s bílým pruhem uprostřed, poměr pruhů 2:1:2.
# Trik na 2 obdélníky: nakreslíme celou plochu červeně a přes ni jen bílý
# prostřední pruh (prostřední pětina výšky).

import tkinter
canvas = tkinter.Canvas()
canvas.pack()
x = 30
y = 30
sirka = 210
vyska = 100

# 1) celá plocha vlajky tmavě červená
canvas.create_rectangle(x, y, x + sirka, y + vyska, fill='darkred')
# 2) bílý prostřední pruh (2:1:2 → od 2/5 do 3/5 výšky)
canvas.create_rectangle(x, y + vyska * 2 // 5, x + sirka, y + vyska * 3 // 5, fill='white')

tkinter.mainloop()
