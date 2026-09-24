/**
 * Anglická verze lekcí virtuálního DB Browseru (`/sql?z=en`).
 *
 * Překládá se výklad, zadání, nápovědy a postupy. Referenční dotazy
 * i data zůstávají: tabulky a hodnoty jsou česky (knihy, 'román'…), protože
 * na nich stojí kontrola i materiály v bance. Anglický žák k nim dostane
 * slovníček (SLOVNICEK) – na hodině angličtiny je to i slovní zásoba.
 *
 * U úkolů, jejichž řešení je SQL nad vlastní databází žáka (lekce 19), je
 * anglické i řešení – tam na názvech nezáleží.
 */

import { jeAnglicky } from "@/lib/dbb/jazyk";
import type { LekceKurzu } from "@/lib/dbb/kurz";

type Lekce = { title: string; teach: string; example?: string };
type Ukol = { zadani: string; hint: string; reseni?: string; ceka?: string };

export const EN_LEKCE: Record<number, Lekce> = {
  1: {
    title: "What a database is, and SELECT",
    teach:
      "A database stores data in tables: a row is one record (say, one book), a column is one property (title, year…). You talk to a database in SQL, and the most important command is SELECT – it picks data out. The asterisk * means “all columns”. The practice database comes from a Czech school library, so its tables and columns have Czech names – the glossary below the tasks translates them.",
  },
  2: {
    title: "Choosing columns",
    teach:
      "You rarely need absolutely everything. After SELECT, list only the columns you care about, separated by commas – the result is easier to read. Order matters: the columns come out in the order you write them.",
  },
  3: {
    title: "The WHERE condition",
    teach:
      "WHERE lets only the rows that meet a condition into the result. Compare numbers with =, >, <, >=, <=. Put text in single quotes, e.g. zanr = 'poezie' – without them SQL would look for a column of that name. Conditions can be combined: AND holds when both are true, OR when either one is.",
  },
  4: {
    title: "Searching by part of a text: LIKE",
    teach:
      "The equals sign only finds an exact match. When you know only part of the text, use LIKE with % meaning “anything can go here”. 'A%' means starts with A, '%ová' ends in ová, '%Čapek%' contains Čapek anywhere.",
  },
  5: {
    title: "Sorting: ORDER BY",
    teach:
      "ORDER BY sorts the result by a column, smallest first; add DESC for the reverse order. Text can be sorted too – alphabetically. It combines nicely with WHERE: the condition always comes before the sorting.",
  },
  6: {
    title: "Counting: COUNT",
    teach:
      "Aggregate functions turn many rows into one number. COUNT(*) returns the number of rows in the result – handy for “how many…” questions.",
  },
  7: {
    title: "Average: AVG",
    teach:
      "AVG(column) calculates the average of the values in a column. Its relatives are SUM (total), MIN (smallest) and MAX (largest).",
  },
  8: {
    title: "Groups: GROUP BY",
    teach:
      "GROUP BY puts rows with the same value into groups, and the aggregate is calculated for each group separately. Typically: “how many of each” – counts by category. It is worth naming a column with a function using AS, otherwise the result header literally says COUNT(*).",
  },
  9: {
    title: "Joining two tables: JOIN",
    teach:
      "Data are often split into several tables linked by keys – a loan remembers only the book ID and the reader ID, not the full names. JOIN connects the tables: JOIN table ON condition, where the condition says the keys are equal. When a column has the same name in more than one table, write it with the table name: knihy.nazev.",
  },
  10: {
    title: "Joining three tables",
    teach:
      "You can chain several JOINs. The vypujcky table holds both IDs at once, so you can get from a reader to a book through it. Each JOIN has its own ON.",
  },
  11: {
    title: "Adding a row: INSERT",
    teach:
      "So far you have only read data. INSERT INTO adds a new row to a table: you say which table, which columns and what values. Text goes in single quotes, numbers without them. The order of the values must match the order of the columns.",
  },
  12: {
    title: "Changing a value: UPDATE",
    teach:
      "UPDATE rewrites values in rows that are already in the table. After SET you write what should change, and after WHERE which rows it applies to. If you leave WHERE out, the whole table changes – the most common and most expensive mistake in SQL.",
  },
  13: {
    title: "Deleting a row: DELETE",
    teach:
      "DELETE FROM deletes the rows that meet a condition. The same rule applies as with UPDATE, only harsher: without WHERE the whole table is emptied and you can't get it back. That is why people make a backup before deleting – and why DB Browser has the Revert Changes button: until you write your changes, it throws them away.",
  },
  14: {
    title: "DB Browser and the database structure",
    teach:
      "All this time you have been working in a replica of DB Browser for SQLite – the program people really use to work with databases. The queries from lessons 1–13 work in it unchanged; underneath it is still the same SQLite. What is new is everything around it: the Database Structure tab shows which tables the database has, which columns they are made of and what type each column is. INTEGER is a whole number, TEXT is text.",
  },
  15: {
    title: "Browse Data: a table like in Excel",
    teach:
      "The Browse Data tab shows what is in a table without writing a query. Pick the table at the top left and click a column header to sort. In the Filter box under a header, type what you are looking for: part of a text, or a condition such as >1900. Double-click a cell to overwrite it – the program sends the database an UPDATE for you, and you can see it in the SQL Log panel.",
  },
  16: {
    title: "Changes have to be written",
    teach:
      "A database is a file – here knihovna.db, which the course keeps in this browser (in the real program it sits on disk). Whatever you change exists only in the program's memory for now; you can tell because the Write Changes and Revert Changes buttons stop being grey. It only gets into the file through File → Write Changes (Ctrl+S). If you close the database with unwritten changes, the program asks – the Save button in that dialog does the same as Write Changes, Discard throws them away. Revert Changes throws away everything since the last write. To get the file onto your real computer, use File → Save a Copy to This Computer.",
  },
  17: {
    title: "Your own table: CREATE TABLE",
    teach:
      "So far you have worked with ready-made tables. CREATE TABLE makes a new one: after the table name come the columns in brackets, each with its type. PRIMARY KEY marks the column that uniquely identifies a row. REFERENCES table(column) turns a column into a link to another table – a foreign key. The Create Table button on the Database Structure tab does the same job.",
  },
  18: {
    title: "Join your table to a ready-made one",
    teach:
      "You know JOIN from lessons 9 and 10. Now, for the first time, you write it through a key you designed yourself: hodnoceni.kniha_id points to knihy.id. The method is the same – after ON you write which two columns belong together.",
  },
  19: {
    title: "Your own database",
    teach:
      "To finish, you will build a database from scratch. File → New Database asks for a file name and straight away offers a window for the first table – you can click it together, or close the window and write CREATE TABLE. The topic is up to you: games, sport, music, cars… At the end, don't forget to write the changes. Here you can use English names for your tables and columns.",
  },
  20: {
    title: "Detective story: Who took Krakatit?",
    teach:
      "On Thursday 16 October 2026 a first edition of Krakatit vanished from the school library. Everything you need is in the detektivka.db database: reports, people and their door chips, passages through doors and camera records. Work like a detective – every query takes you a step further. Times are stored as text such as 14:05, so between two times you search with BETWEEN '14:00' AND '15:00'. The records are in Czech; the glossary below the tasks translates what you need, including the report itself.",
  },
  21: {
    title: "Practice A: Workshop",
    teach:
      "The same commands as in lessons 1–13, only on different data: a stock of machine parts (dily), suppliers (dodavatele) and orders (objednavky). The last two tasks are about working in the program. Variant B (Building supplies) has its tasks built the same way – handy for a test.",
  },
  22: {
    title: "Practice B: Building supplies",
    teach:
      "Variant B of the Workshop: tasks built the same way on a building-supplies stock – materials (materialy), building sites (stavby) and deliveries to the sites (dodavky). The last two tasks are about working in the program.",
  },
};

export const EN_UKOLY: Record<string, Ukol> = {
  "1": { zadani: "List all the books (all columns).", hint: "Take the query from the example and change just one thing – the table name." },
  "2": {
    zadani: "List just the title and the author of every book (in that order).",
    hint: "Instead of the asterisk, put two columns after SELECT, separated by a comma. Their exact names are in the glossary below and on the Database Structure tab.",
  },
  "3": {
    zadani: "List the title and the year of the books published after 1900.",
    hint: "“After 1900” means the year has to be greater. And notice that you need two columns, not one.",
  },
  "3b": {
    zadani: "List the titles of the books that are novels (zanr 'román') and are also available (dostupna = 1).",
    hint: "Join the two conditions with AND. Mind the quotes around text – numbers don't get them.",
  },
  "4": {
    zadani: "List the title and the author of the books written by someone with the surname Čapek.",
    hint: "There is a first name before the surname and nothing after it – but you don't need to care if you put a % on both sides.",
  },
  "5": {
    zadani: "List the title and the year of the available books (dostupna = 1), sorted by year of publication, oldest first.",
    hint: "You need a condition and sorting in one query. The condition comes first. “Oldest first” is the usual smallest-first order, so you don't need DESC.",
  },
  "5b": {
    zadani: "List the titles of all the books in alphabetical order.",
    hint: "You can sort by a text column too – you write it exactly as with numbers.",
  },
  "6": { zadani: "Find out how many books there are in the database altogether.", hint: "It is exactly the query from the example, just on a different table." },
  "7": {
    zadani: "Find the average number of pages of the books.",
    hint: "Write the function just like MAX in the example – it only has a different name and works on a different column.",
  },
  "8": {
    zadani: "For each genre, list its name and the number of books in it.",
    hint: "The example counts readers by class; you need books by genre. Two things go after SELECT: what you group by and how many there are.",
  },
  "8b": {
    zadani: "For each genre, list its name and the average number of pages.",
    hint: "The same query as before – just use the average function from the previous lesson instead of counting rows.",
  },
  "9": {
    zadani: "List the date of each loan and the name of the reader who borrowed the book.",
    hint: "It is the example with two changes: you join the ctenari table and the key is called ctenar_id.",
  },
  "10": {
    zadani: "List who borrowed which book – the reader's name and the book title.",
    hint: "Start from the vypujcky table as in the example and join the second table in exactly the same way as the first. You only want the name and the title in the result.",
  },
  "10b": {
    zadani: "Find out how many books each reader has borrowed – the name and the number of loans.",
    hint: "Combine two things you already know: joining tables from this lesson and grouping from lesson 8.",
  },
  "11": {
    zadani:
      "Add a new book to the library: “Bylo nás pět” by Karel Poláček from 1946, genre 'román', 280 pages, available (1). Give it id 11.",
    hint: "Build it like the example, only with seven columns instead of three. Which is which – see the Database Structure tab. Availability is stored as a number, not as text.",
  },
  "12": {
    zadani: "Kytice is back in the library – set its availability (dostupna) to 1.",
    hint: "You change a single column of a single book. You find the row with a condition just like in a SELECT – by its title. Without WHERE you would make every book available.",
  },
  "12b": {
    zadani: "Someone has just borrowed both plays – set availability to 0 for all the books of the genre 'drama'.",
    hint: "This time the condition matches two books at once – and that's fine. UPDATE changes every row that meets it.",
  },
  "13": {
    zadani: "Máj has fallen apart and the library has thrown it out – delete it from the list of books.",
    hint: "Write the condition as in the previous lesson, by the book's title. And make sure once more that the WHERE is really there.",
  },
  "14a": {
    zadani: "Switch to the Database Structure tab and expand the knihy table.",
    hint: "The tabs are at the top, under the toolbar. You expand a table with the arrow to the left of its name.",
    reseni: "Click the Database Structure tab, then the arrow next to Tables and finally the arrow next to knihy.",
    ceka: "Waiting for you to expand the knihy table on the Database Structure tab.",
  },
  "14b": {
    zadani:
      "In the structure, find the two columns of the vypujcky table that point to other tables, and on the Execute SQL tab list just those two columns.",
    hint: "A column pointing to another table gives itself away with the ending _id and the word REFERENCES in the Schema column.",
  },
  "15a": {
    zadani: "On the Browse Data tab, show the knihy table and use a filter in the rok column to keep only books published after 1900.",
    hint: "In the Filter box under the rok header, write the condition just as after WHERE, only without the column name.",
    reseni: "Select the knihy table and type >1900 in the filter under the rok column.",
    ceka: "Waiting for a filter in the rok column on the Browse Data tab.",
  },
  "15b": {
    zadani: "Eva Marková has moved to class 1.B. Correct her class (trida) directly in the grid of the ctenari table.",
    hint: "Select the ctenari table, double-click the cell with Eva Marková's class, overwrite it and confirm with Enter.",
    reseni: "Table ctenari → double-click 1.A next to Eva Marková → type 1.B → Enter.",
    ceka: "Waiting for you to change Eva Marková's class in the grid of the ctenari table.",
  },
  "16a": {
    zadani:
      "Temno is back in the library – set its dostupna to 1. Then close the database WITHOUT saving (File → Close Database → Discard), open it again and check that the change has gone.",
    hint: "You know UPDATE from lesson 12. Reopen the database with File → Open Database.",
    reseni:
      "UPDATE knihy SET dostupna = 1 WHERE nazev = 'Temno';  → File → Close Database → Discard → File → Open Database → knihovna.db",
    ceka: "Waiting for the whole sequence: change Temno → Close Database → Discard → open it again.",
  },
  "16b": {
    zadani: "Make the change again and this time write it (Ctrl+S). If you now close and reopen the database, Temno stays available.",
    hint: "Write Changes is in the File menu and also on the toolbar at the top.",
    reseni: "UPDATE knihy SET dostupna = 1 WHERE nazev = 'Temno';  → File → Write Changes",
    ceka: "Waiting for you to write the change to Temno to the file.",
  },
  "16c": {
    zadani: "Change anything else and try Revert Changes – the database goes back to how it was after the last write.",
    hint: "Revert Changes is on the toolbar right next to Write Changes.",
    reseni: "For example UPDATE ctenari SET trida = '4.A';  → File → Revert Changes",
    ceka: "Waiting for you to undo a change with Revert Changes.",
  },
  "17a": {
    zadani:
      "The library wants to collect book ratings. Create a table hodnoceni (ratings) with the columns id (INTEGER PRIMARY KEY), kniha_id (INTEGER, a link to knihy.id) and hvezdy (stars, INTEGER).",
    hint: "Write the link to knihy after the column type: kniha_id INTEGER REFERENCES knihy(id).",
  },
  "17b": {
    zadani: "Insert three ratings into it: Babička (book 1) 5 stars, R.U.R. (book 4) 4 stars and Krakatit (book 8) 3 stars.",
    hint: "Leave out id – with INTEGER PRIMARY KEY the database fills it in itself. Several rows at once: VALUES (…), (…), (…).",
  },
  "17c": {
    zadani: "Write the changes so that the table and the ratings stay in the file.",
    hint: "Ctrl+S, or File → Write Changes.",
    reseni: "File → Write Changes",
  },
  "18a": {
    zadani: "For each rating, list the book title and the number of stars.",
    hint: "Select from hodnoceni and join knihy: JOIN knihy ON knihy.id = hodnoceni.kniha_id.",
  },
  "18b": { zadani: "Sort them from the best-rated book down.", hint: "Descending order: ORDER BY … DESC." },
  "19a": {
    zadani: "Create a new database (File → New Database).",
    hint: "Make up the file name yourself – games.db, for example.",
    reseni: "File → New Database → type a name → Save",
  },
  "19b": {
    zadani: "Create at least one table in it, insert at least 5 records and write the changes.",
    hint: "First CREATE TABLE (or the Create Table button), then INSERT INTO … VALUES and finally Ctrl+S.",
    reseni:
      "CREATE TABLE games (id INTEGER PRIMARY KEY, title TEXT, year INTEGER);\nINSERT INTO games (title, year) VALUES ('Minecraft', 2011), ('Tetris', 1984), ('Portal', 2007), ('Pac-Man', 1980), ('Doom', 1993);",
  },
  "19c": {
    zadani: "Write two SELECT queries of your own on your database that make sense.",
    hint: "For example all the records sorted by one column, and then only the ones that meet a condition.",
    reseni: "SELECT * FROM games ORDER BY year;\nSELECT title FROM games WHERE year > 2000;",
  },
  "19e": {
    zadani:
      "Download your database to your computer (File → Save a Copy to This Computer) and hand the file in the way your teacher tells you – in Teams, for example.",
    hint: "The downloaded file is in your computer's Downloads folder. You can open it in the real DB Browser for SQLite too.",
    reseni: "Open your database → File → Save a Copy to This Computer",
    ceka: "Waiting for you to download your database to your computer.",
  },
  "19d": {
    zadani: "Add a second table and link it to the first one with a foreign key (REFERENCES).",
    hint: "Just like hodnoceni.kniha_id in lesson 17. Don't forget to write the changes.",
    reseni: "CREATE TABLE game_ratings (\n  id INTEGER PRIMARY KEY,\n  game_id INTEGER REFERENCES games(id),\n  points INTEGER\n);",
    ceka: "Waiting for a second table with a foreign key whose rows join with the first table.",
  },

  "20a": {
    zadani: "Read the report from 16 October 2026 (the date is stored as '2026-10-16').",
    hint: "Select from the hlaseni table and use WHERE to keep a single date.",
  },
  "20b": {
    zadani: "List the chips that went through the study-room door (dvere 'studovna') on 16 October 2026 between 14:00 and 15:00.",
    hint: "Table pruchody. Three conditions joined with AND: the door, the date and the time BETWEEN.",
  },
  "20c": {
    zadani: "Find out who the chips belong to – list the name and the role of each suspect.",
    hint: "Join osoby with pruchody on the cip column and keep the conditions from the previous task.",
  },
  "20d": {
    zadani:
      "The report says someone carried the book out. Which of the suspects went through the exit (dvere 'východ') that day? List the name and the time.",
    hint: "The same join as in the previous task, just a different door. Careful – someone who was never in the study room also left through the exit, so keep only the suspects, e.g. osoby.cip IN ('C17', 'C42', 'C08').",
  },
  "20e": {
    zadani:
      "Check it on camera: list the records from the corridor by the exit (misto 'chodba u východu') between 14:45 and 15:00. Does the description fit the culprit?",
    hint: "Table kamera, a condition on the place (misto) and on the time.",
  },
  "20f": {
    zadani: "Close the case: write a query that returns only the culprit's name – one row, one column.",
    hint: "Put it together from the previous tasks, but keep only the jmeno column in the SELECT.",
  },

  A1: { zadani: "List all the parts (all columns).", hint: "The asterisk selects all columns." },
  A2: { zadani: "List just the name and the price of all the parts (in that order).", hint: "Separate the columns with a comma." },
  A3: { zadani: "List the name and the weight of the parts heavier than 1 kg.", hint: "A number in a condition goes without quotes." },
  A4: {
    zadani: "List the names of the steel parts (material 'ocel') that are in stock (skladem > 0).",
    hint: "AND joins two conditions; text goes in quotes.",
  },
  A5: { zadani: "List the name and the price of the parts with M8 in their name.", hint: "LIKE and the % sign for “anything before and after”." },
  A6: { zadani: "List the name and the price of all the parts, most expensive first.", hint: "ORDER BY … DESC sorts in descending order." },
  A7: { zadani: "Find out how many kinds of parts are made of steel.", hint: "COUNT(*) counts the rows that pass the condition." },
  A8: { zadani: "Find the average price of a part.", hint: "AVG calculates the average of a column." },
  A9: { zadani: "For each material, list its name and the number of parts made of it.", hint: "GROUP BY material and COUNT(*)." },
  A10: {
    zadani: "For each order, list the date and the name of the part ordered.",
    hint: "Join objednavky with dily: dily.id = objednavky.dil_id.",
  },
  A11: {
    zadani: "For each order, list the part name, the supplier name and the quantity.",
    hint: "Two JOINs: one to dily, the other to dodavatele.",
  },
  A12: {
    zadani: "Add a new part: id 11, 'Pružina' (spring), 'ocel', 0.05 kg, price 12, 200 in stock.",
    hint: "Text in quotes, numbers without them; decimals take a point: 0.05.",
  },
  A13: { zadani: "The flanges have arrived – set the stock (skladem) of 'Příruba' to 20.", hint: "UPDATE … SET … WHERE; find the row by its name." },
  A14: {
    zadani: "The supplier Kovolis (id 4) has closed down – delete all its orders.",
    hint: "DELETE FROM objednavky WHERE … – by the dodavatel_id column.",
  },
  A15: {
    zadani: "On the Browse Data tab, show the dily table and use a filter in the material column to keep only the steel parts.",
    hint: "In the Filter box under the material header, type ocel.",
    reseni: "Browse Data → table dily → type ocel in the filter under material.",
    ceka: "Waiting for a filter in the material column on the Browse Data tab.",
  },
  A16: {
    zadani: "The 30 mm shaft ('Hřídel 30 mm') has gone up in price – set its price to 690 and write the change to the file.",
    hint: "UPDATE, then Ctrl+S.",
    reseni: "UPDATE dily SET cena = 690 WHERE nazev = 'Hřídel 30 mm';  → File → Write Changes",
    ceka: "Waiting for you to write the new price to the dilna.db file.",
  },

  B1: { zadani: "List all the materials (all columns).", hint: "The asterisk selects all columns." },
  B2: { zadani: "List just the name and the price of all the materials (in that order).", hint: "Separate the columns with a comma." },
  B3: { zadani: "List the name and the price of the materials that cost more than 200 CZK.", hint: "A number in a condition goes without quotes." },
  B4: {
    zadani: "List the names of the walling materials (druh 'zdivo') that are in stock (skladem > 0).",
    hint: "AND joins two conditions; text goes in quotes.",
  },
  B5: { zadani: "List the name and the price of the materials with 25 kg in their name.", hint: "LIKE and the % sign for “anything before and after”." },
  B6: { zadani: "List the name and the price of all the materials, most expensive first.", hint: "ORDER BY … DESC sorts in descending order." },
  B7: { zadani: "Find out how many kinds of aggregate (druh 'kamenivo') there are in stock.", hint: "COUNT(*) counts the rows that pass the condition." },
  B8: { zadani: "Find the average price of a material.", hint: "AVG calculates the average of a column." },
  B9: { zadani: "For each type (druh), list its name and the number of materials.", hint: "GROUP BY druh and COUNT(*)." },
  B10: {
    zadani: "For each delivery, list the date and the name of the material delivered.",
    hint: "Join dodavky with materialy: materialy.id = dodavky.material_id.",
  },
  B11: {
    zadani: "For each delivery, list the material name, the site name and the quantity.",
    hint: "Two JOINs: one to materialy, the other to stavby.",
  },
  B12: {
    zadani: "Add a new material: id 11, 'Hydroizolační pás' (damp-proof membrane), 'izolace', unit 'm2', price 180, 60 in stock.",
    hint: "Text in quotes, numbers without them.",
  },
  B13: { zadani: "The lime has arrived – set the stock (skladem) of 'Vápno 25 kg' to 120.", hint: "UPDATE … SET … WHERE; find the row by its name." },
  B14: {
    zadani: "The garage (building site id 2) has been cancelled – delete all the deliveries to it.",
    hint: "DELETE FROM dodavky WHERE … – by the stavba_id column.",
  },
  B15: {
    zadani: "On the Browse Data tab, show the materialy table and use a filter in the druh column to keep only the boards (deska).",
    hint: "In the Filter box under the druh header, type deska.",
    reseni: "Browse Data → table materialy → type deska in the filter under druh.",
    ceka: "Waiting for a filter in the druh column on the Browse Data tab.",
  },
  B16: {
    zadani: "Cement has gone up in price – set the price of 'Cement 25 kg' to 175 and write the change to the file.",
    hint: "UPDATE, then Ctrl+S.",
    reseni: "UPDATE materialy SET cena = 175 WHERE nazev = 'Cement 25 kg';  → File → Write Changes",
    ceka: "Waiting for you to write the new price to the stavebniny.db file.",
  },
};

/** Slovníček českých názvů podle souboru – ukáže se v anglickém panelu kurzu. */
export const SLOVNICEK: Record<string, [string, string][]> = {
  "knihovna.db": [
    ["knihy", "books – nazev title, autor author, rok year, zanr genre, pocet_stran pages, dostupna available (1 yes, 0 no)"],
    ["ctenari", "readers – jmeno name, trida class"],
    ["vypujcky", "loans – kniha_id book id, ctenar_id reader id, datum_vypujcky date of the loan"],
    ["zanr", "román novel, poezie poetry, drama play, povídky short stories"],
    ["hodnoceni", "ratings (lesson 17) – hvezdy stars"],
  ],
  "dilna.db": [
    ["dily", "parts – nazev name, material, hmotnost_kg weight in kg, cena price in CZK, skladem in stock"],
    ["material", "ocel steel, bronz bronze, pryž rubber, litina cast iron, mosaz brass, hliník aluminium"],
    ["dodavatele", "suppliers – nazev name, mesto town"],
    ["objednavky", "orders – dil_id part id, dodavatel_id supplier id, mnozstvi quantity, datum date"],
  ],
  "stavebniny.db": [
    ["materialy", "materials – nazev name, druh type, jednotka unit, cena price in CZK, skladem in stock"],
    ["druh", "zdivo walling, pojivo binder, kamenivo aggregate, výztuž reinforcement, deska board, izolace insulation"],
    ["jednotka", "ks piece, pytel bag, t tonne, kg, m2 square metre"],
    ["stavby", "building sites – nazev name, mesto town"],
    ["dodavky", "deliveries – material_id, stavba_id site id, mnozstvi quantity, datum date"],
  ],
  "detektivka.db": [
    ["hlaseni", "reports – datum date, cas time, text"],
    ["osoby", "people – jmeno name, role, cip door chip"],
    ["role", "knihovnice librarian, školník caretaker, návštěva visitor, žák / žákyně pupil (boy / girl), učitel teacher"],
    ["pruchody", "passages through doors – cip chip, dvere door, datum date, cas time"],
    ["dvere", "studovna study room, jídelna canteen, dílna workshop, sborovna staffroom, východ exit, učebna classroom"],
    ["kamera", "camera – misto place, popis description; chodba u východu corridor by the exit, schodiště staircase"],
    [
      "report 2",
      "“The first edition of Krakatit (1924) has disappeared from the display case in the study room. At 14:00 the case was locked; at 15:05 I found it open and empty. Only a chip opens the lock, and anyone who got to the case had to go through the study-room door. Then someone carried the book out.”",
    ],
    ["camera words", "muž man, chlapec boy, taška bag, batoh rucksack, rameno shoulder, rychle quickly, běží runs"],
  ],
};

/** Lekce v aktuálním jazyce – česky beze změny, anglicky s přeloženými texty. */
export function prelozLekci(l: LekceKurzu): LekceKurzu {
  if (!jeAnglicky()) return l;
  const en = EN_LEKCE[l.id];
  return {
    ...l,
    title: en ? en.title : l.title,
    teach: en ? en.teach : l.teach,
    example: en && en.example ? en.example : l.example,
    ukoly: l.ukoly.map((u) => {
      const e = EN_UKOLY[u.klic];
      if (!e) return u;
      return {
        ...u,
        zadani: e.zadani,
        hint: e.hint,
        reseni: e.reseni !== undefined ? e.reseni : u.reseni,
        ceka: e.ceka !== undefined ? e.ceka : u.ceka,
      };
    }),
  };
}
