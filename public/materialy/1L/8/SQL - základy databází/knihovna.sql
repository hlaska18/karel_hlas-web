-- Knihovna: ukazkova databaze k procviceni SQL
-- Tri propojene tabulky: knihy, ctenari, vypujcky (cizi klice)

CREATE TABLE knihy (
    id           INTEGER PRIMARY KEY,
    nazev        TEXT    NOT NULL,
    autor        TEXT    NOT NULL,
    rok          INTEGER,
    zanr         TEXT,
    pocet_stran  INTEGER,
    dostupna     INTEGER            -- 1 = k dispozici, 0 = pujcena
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
 (1,  'Babicka',                     'Bozena Nemcova',       1855, 'roman',   240, 1),
 (2,  'Maj',                         'Karel Hynek Macha',    1836, 'poezie',   60, 1),
 (3,  'Kytice',                      'Karel Jaromir Erben',  1853, 'poezie',  140, 0),
 (4,  'R.U.R.',                      'Karel Capek',          1920, 'drama',    96, 1),
 (5,  'Bila nemoc',                  'Karel Capek',          1937, 'drama',   112, 1),
 (6,  'Osudy dobreho vojaka Svejka', 'Jaroslav Hasek',       1923, 'roman',   752, 0),
 (7,  'Povidky malostranske',        'Jan Neruda',           1878, 'povidky', 180, 1),
 (8,  'Krakatit',                    'Karel Capek',          1924, 'roman',   360, 1),
 (9,  'Temno',                       'Alois Jirasek',        1915, 'roman',   420, 0),
 (10, 'Pole orna a valecna',         'Vladislav Vancura',    1925, 'roman',   200, 1);

INSERT INTO ctenari (id, jmeno, trida) VALUES
 (1, 'Adam Novak',     '1.A'),
 (2, 'Bara Svobodova', '1.A'),
 (3, 'Cyril Dvorak',   '1.B'),
 (4, 'Dita Horakova',  '1.B'),
 (5, 'Eva Markova',    '1.A');

INSERT INTO vypujcky (id, kniha_id, ctenar_id, datum_vypujcky) VALUES
 (1, 3, 1, '2026-09-05'),
 (2, 6, 3, '2026-09-07'),
 (3, 9, 2, '2026-09-10');
