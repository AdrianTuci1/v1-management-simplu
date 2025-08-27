## Ghid: Actualizări optimistice între Drawer și View (și pentru alte resurse)

### Scop
Implementarea unui flux coerent de actualizări optimistice astfel încât:
- Crearea/actualizarea/ștergerea în Drawer să apară imediat în View (ex. `OperationsPeople.jsx`).
- Să existe ID temporar valid pentru IndexedDB, fără erori Dexie.
- La următorul răspuns API sau eveniment WebSocket, înregistrările temporare să fie înlocuite cu cele reale și temporarele să fie curățate automat.

---

## Ce s-a schimbat

### 1) Data layer: `ResourceRepository.js`
- Asigurare cheie validă în IndexedDB pentru optimistice:
  - La `add()` și `update()` se creează fallback optimist cu `resourceId` valid folosind `generateTempId(...)` dacă API-ul nu întoarce date concrete.
  - Normalizează mereu `resourceId` (fallback la `id` sau temp id).
- Curățare optimistice după fetch reușit:
  - Metodă nouă `clearOptimisticEntries()` care șterge toate intrările cu `_isOptimistic === true` din tabelul curent.
  - Apelată automat în `query()` (bulk) și `getById()` după ce se scriu datele noi în IndexedDB.
- Tratare răspunsuri 201/202/empty-body:
  - Dacă serverul confirmă fără payload util, se folosește intrare optimistă locală, evitând erorile de cheie din Dexie.

Fișiere relevante:
- `src/data/repositories/ResourceRepository.js`
- `src/lib/utils.js` (generator ID temporar)

### 2) Hook partajat: `usePatients.js`
- Stare partajată la nivel de modul:
  - `sharedPatients`, `sharedStats` + `subscribers` (set de callback-uri) pentru a sincroniza mai multe instanțe ale hook-ului.
  - Orice `add/update/delete` sau reconciliere din WebSocket actualizează `sharedPatients` și notifică toți abonații, astfel `OperationsPeople.jsx` se actualizează instant.
- Actualizări optimistice în memorie:
  - `addPatient`: transformă UI și inserează în `sharedPatients` în față.
  - `updatePatient`: mapează în `sharedPatients` după `id` și aplică modificările.
  - `deletePatient`: filtrează local intrarea.
- Reconciliere prin WebSocket:
  - La `resource_created|updated|deleted`, înlocuiește intrările temporare cu cele reale (match după `tempId` sau euristic după email/telefon/nume), apoi persistă în IndexedDB și notifică abonații.
- Încărcare inițială și sincronizare:
  - Orice rezultat `get/search/paginated` resetează `sharedPatients`, notifică abonații și ulterior `ResourceRepository` curăță optimisticele când sosesc date reale.

Fișier relevant:
- `src/hooks/usePatients.js`

### 3) UI View: `OperationsPeople.jsx`
- Prioritizare vizuală a înregistrărilor optimiste:
  - Sortarea existentă este păstrată, apoi este stabilită o secundară care aduce `_isOptimistic === true` în față pentru feedback imediat.
  - Badging „în curs” lângă nume pentru elementele optimiste.
- Deschiderea drawer-ului cu date corecte:
  - Se apelează `openDrawer({ type: 'edit-person', data: patient })`, aliniat cu `MainDrawer.jsx` care pasează `content?.data` spre `PatientDrawer` ca `patientData`.

Fișiere relevante:
- `src/components/views/OperationsPeople.jsx`
- `src/components/drawers/MainDrawer.jsx`
- `src/components/drawers/PatientDrawer.jsx`

---

## Cum funcționează cap-coadă (pacienți)
1) Drawer (ex. `PatientDrawer`) apelează `addPatient`/`updatePatient`/`deletePatient`.
2) `patientService` → `ResourceRepository`:
   - Dacă API-ul nu întoarce încă payload util, se creează intrare optimistă cu `resourceId` temporar și se scrie în IndexedDB.
3) `usePatients`:
   - Actualizează `sharedPatients` optimist și notifică toți abonații → `OperationsPeople.jsx` re-render imediat.
4) La următorul `get/query` sau `getById`, `ResourceRepository` scrie date reale și curăță intrările temporare.
5) La evenimente WebSocket (create/update/delete), `usePatients` înlocuiește intrarea temporară cu cea finală (după `tempId` sau euristic), scrie în IndexedDB și notifică abonații.

---

## Extindere pentru alte resurse (ex. produse, utilizatori, tratamente, roluri)
Repetă același pattern:
1) Repository-ul resursei (prin `ResourceRepository`):
   - Nu necesită cod suplimentar dacă folosește deja `ResourceRepository`; toate optimizările sunt centralizate acolo.
2) Hook-ul specific (ex. `useProducts`, `useUsers`, etc.):
   - Adaugă un `sharedState` la nivel de modul și un set de `subscribers` similar celui din `usePatients`.
   - La `add/update/delete`, actualizează optimist `sharedState` și notifică abonații.
   - La WebSocket (folosește `onResourceMessage('<resourceName>')`): înlocuiește intrările temporare cu cele reale, persistă și notifică abonații.
3) View-uri:
   - Prioritizează `_isOptimistic` în listări și marchează vizual item-urile în curs.
   - Asigură-te că deschiderea drawer-ului transmite `data` și nu alt key.

Sugestie: pentru a evita duplicarea, poți extrage un mini-helper generic de „shared resource hook state” (într-un util) folosit de toate hook-urile de resurse.

---

## Recomandări practice
- Persistă întotdeauna `resourceId` (cheie Dexie) pentru orice element, fie real, fie temporar.
- Evită dependința exclusivă de WebSocket pentru feedback UI; optimistele sunt folosite pentru instantaneitate, iar reconcilierea vine ulterior.
- Curăță optimisticele imediat ce `query/getById` aduc date reale (deja implementat în `ResourceRepository`).
- La reconcilierea din WebSocket, încearcă mai întâi match pe `tempId`; dacă lipsește, folosește o euristică stabilă (email/telefon/nume) înainte să adaugi un nou rând.

---

## Checklist de integrare
- Repository (prin `ResourceRepository`):
  - [x] Fallback optimist cu `resourceId` valid pentru 201/202/empty payload.
  - [x] Normalizare `resourceId` la toate scrierile.
  - [x] `clearOptimisticEntries()` după fetch-uri reușite.
- Hook (`usePatients` exemplu):
  - [x] Stare partajată + `subscribers` pentru propagare inter-instanțe.
  - [x] Actualizări optimiste în `sharedPatients` la add/update/delete.
  - [x] Reconciliere WebSocket (înlocuire temp → real, persistare, notificare).
- View (`OperationsPeople.jsx`):
  - [x] Sortare care aduce `_isOptimistic` în față.
  - [x] Badge vizual „în curs”.
  - [x] Pasare corectă a datelor în drawer: `openDrawer({ type: 'edit-person', data: patient })`.

---

## Testare rapidă
1) Creează un pacient nou din Drawer:
   - Ar trebui să apară imediat în listă cu badge „în curs”.
   - Fără erori Dexie; `resourceId` temporar e prezent.
2) Primește răspuns API + eveniment socket:
   - Intrarea se înlocuiește cu ID real; badge dispare.
   - Intrările temporare se curăță la următorul `get/query` (automat).
3) Editare/Ștergere:
   - Efectele sunt vizibile imediat; reconcilierea confirmă ulterior.

---



