-- Knihovna: ukázková databáze k procvičení SQL
-- Tři propojené tabulky: knihy, ctenari, vypujcky (cizí klíče)

CREATE TABLE knihy (
    id           INTEGER PRIMARY KEY,
    nazev        TEXT    NOT NULL,
    autor        TEXT    NOT NULL,
    rok          INTEGER,
    zanr         TEXT,
    pocet_stran  INTEGER,
    dostupna     INTEGER            -- 1 = k dispozici, 0 = půjčená
);

CREATE TABLE ctenari (
    id     INTEGER PRIMARY KEY,
    jmeno  TEXT NOT NULL,
    trida  TEXT
);

CREATE TABLE vypujcky (
    id              INTEGER PRIMARY KEY,
    kniha_id        INTEGER REFERENCES knihy(id),
    ctenar_id       INTEGER REFERENCES ctenari(id),
    datum_vypujcky  TEXT
);

INSERT INTO knihy (id, nazev, autor, rok, zanr, pocet_stran, dostupna) VALUES
 (1,  'Babička',                       'Božena Němcová',       1855, 'román',   240, 1),
 (2,  'Máj',                           'Karel Hynek Mácha',    1836, 'poezie',   60, 1),
 (3,  'Kytice',                        'Karel Jaromír Erben',  1853, 'poezie',  140, 0),
 (4,  'R.U.R.',                        'Karel Čapek',          1920, 'drama',    96, 1),
 (5,  'Bílá nemoc',                    'Karel Čapek',          1937, 'drama',   112, 1),
 (6,  'Osudy dobrého vojáka Švejka',   'Jaroslav Hašek',       1923, 'román',   752, 0),
 (7,  'Povídky malostranské',          'Jan Neruda',           1878, 'povídky', 180, 1),
 (8,  'Krakatit',                      'Karel Čapek',          1924, 'román',   360, 1),
 (9,  'Temno',                         'Alois Jirásek',        1915, 'román',   420, 0),
 (10, 'Pole orná a válečná',           'Vladislav Vančura',    1925, 'román',   200, 1);

INSERT INTO ctenari (id, jmeno, trida) VALUES
 (1, 'Adam Novák',     '1.A'),
 (2, 'Bára Svobodová', '1.A'),
 (3, 'Cyril Dvořák',   '1.B'),
 (4, 'Dita Horáková',  '1.B'),
 (5, 'Eva Marková',    '1.A');

INSERT INTO vypujcky (id, kniha_id, ctenar_id, datum_vypujcky) VALUES
 (1,3,1,'2026-09-05'),(2,6,3,'2026-09-07'),(3,9,2,'2026-09-10'),
 (4,1,1,'2026-09-12'),(5,4,4,'2026-09-15'),(6,1,5,'2026-09-18'),
 (7,8,3,'2026-09-20'),(8,10,1,'2026-09-24'),(9,4,2,'2026-10-01'),
 (10,7,5,'2026-10-03'),(11,1,3,'2026-10-06'),(12,5,4,'2026-10-09')
;
