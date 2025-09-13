# 📘 Extensii Arhitectură: Optimistic UI, Offline Queue, Retenție IndexedDB, înlocuire ID temporare

Acest document adaugă la arhitectura existentă (Command + Repository + Invoker + IndexedDB + WebSocket) următoarele capabilități:
- **Actualizări optimistice în UI**
- **Coadă pentru offline** (cu retry & backoff)
- **Politici de retenție / limitare IndexedDB** (max 300 programări în fereastra [astăzi, +3 săptămâni], max 60 pacienți)
- **Înlocuirea ID-urilor temporare** cu ID-uri permanente la confirmare WS/HTTP

---

## 🗂 Structură fișiere adițională

/src/data
├── infrastructure
│ ├── apiClient.ts
│ ├── db.ts
│ ├── websocketClient.ts
│ └── netStatus.ts # detectă online/offline
├── policies
│ ├── retention.ts # prune/compaction IndexedDB
│ └── conflict.ts # reguli de rezolvare conflicte
├── queue
│ └── offlineQueue.ts # coada de comenzi (persistată)
├── store
│ └── optimistic.ts # utilitare optimistic updates
└── repository
└── ResourceRepository.ts

yaml
Copy code

---

## 🗃️ IndexedDB: colecții necesare

În `db.ts` adaugă store-uri suplimentare:

```ts
db.version(2).stores({
  appointments: "id, startAt, endAt, updatedAt", // programări
  patients: "id, name, updatedAt",
  // mapare ID temporar ↔ permanent
  idMap: "tempId, permId, resourceType",
  // coada offline
  queue: "++seq, createdAt, status, resourceType, action, payload, tempId",
  // metadate locale
  meta: "key"
});
Note:

idMap permite înlocuirea tuturor referințelor după confirmare.

queue păstrează comenzi ne-trimise / de retry.

meta poate stoca timbre de timp pentru rulări de retenție, versiuni, etc.

⚡ Optimistic UI (principii)
La add/update/delete, aplică imediat în IndexedDB + emite update către UI.

Marchează entity cu un flag local: _optimistic: true, _version, _pending: {action, tempId?}.

Trimite cererea la API (sau pune în coadă dacă offline).

La confirmare:

Elimină _optimistic/_pending.

Înlocuiește ID-ul temporar cu ID-ul permanent în toate store-urile relevante.

Re-scrie entitatea cu payload-ul “oficial”.

Utilitar minimal (store/optimistic.ts)
ts
Copy code
export function makeTempId(prefix = "tmp_") {
  return `${prefix}${crypto.randomUUID()}`;
}

export function applyOptimistic<T extends { id: string }>(doc: T, action: "create"|"update"|"delete", tempId?: string) {
  return {
    ...doc,
    _optimistic: true,
    _pending: { action, tempId },
    updatedAt: new Date().toISOString()
  };
}

export function clearOptimistic<T>(doc: T) {
  const { _optimistic, _pending, ...rest } = doc as any;
  return rest as T;
}
📶 Offline Queue
Când să cozi:
Dacă navigator.onLine === false sau fetch a eșuat cu erori de rețea → push în queue.

Fiecare item în queue conține:

resourceType, action (create|update|delete), payload, tempId?

status (pending|retrying|failed), retryCount, nextAttemptAt

Retry & backoff:
Ex. backoff exponențial: nextAttemptAt = now + Math.min(2^retryCount * 1000, 5 * 60 * 1000)

Procesor coadă (queue/offlineQueue.ts)
ts
Copy code
export async function enqueue(item) { await db.queue.add({...item, status: "pending", createdAt: Date.now(), retryCount: 0 }); }

export async function processQueue(apiRequest) {
  const now = Date.now();
  const batch = await db.queue
    .where("status").anyOf("pending", "retrying")
    .and(q => !q.nextAttemptAt || q.nextAttemptAt <= now)
    .limit(20)
    .toArray();

  for (const q of batch) {
    try {
      await db.queue.update(q.seq, { status: "retrying" });
      const result = await apiRequest(q.resourceType, q.action, q.payload);
      // succes: update IndexedDB + idMap dacă e cazul
      if (q.action === "create" && q.tempId && result?.id) {
        await mapTempToPermId(q.resourceType, q.tempId, result.id);
      }
      await db.queue.delete(q.seq);
    } catch (e) {
      const retryCount = (q.retryCount ?? 0) + 1;
      const nextAttemptAt = Date.now() + Math.min(2 ** retryCount * 1000, 5 * 60 * 1000);
      await db.queue.update(q.seq, { status: "pending", retryCount, nextAttemptAt });
    }
  }
}

// rulează la: onOnline, la interval (ex. 15s), la confirmări WS
Detectare online/offline (infrastructure/netStatus.ts)
ts
Copy code
export function registerNetHandlers(onOnline: () => void) {
  window.addEventListener("online", onOnline);
}
🔁 Înlocuirea ID-urilor temporare
Mapare în idMap
ts
Copy code
export async function mapTempToPermId(resourceType: string, tempId: string, permId: string) {
  await db.idMap.put({ tempId, permId, resourceType });
  // 1) Update în store-ul resursei principale
  const store = db.table(resourceType); // ex: "appointments"
  const temp = await store.get(tempId);
  if (temp) {
    await store.delete(tempId);
    await store.put({ ...temp, id: permId, _optimistic: false, _pending: undefined });
  }
  // 2) Update referințe (ex. programări care referă pacienți sau invers)
  await rewriteReferences(tempId, permId);
}

async function rewriteReferences(tempId: string, permId: string) {
  // exemplu: dacă appointments conține `patientId`
  const appts = await db.appointments.where("patientId").equals(tempId).toArray();
  await db.transaction("rw", db.appointments, async () => {
    for (const a of appts) await db.appointments.put({ ...a, patientId: permId });
  });
}
Surse de confirmare:
WebSocket: mesaj {"type":"create","data":{id:"perm", clientId:"temp"}}

HTTP: răspunsul POST cu id permanent

Ambele ar trebui să invoce mapTempToPermId(...).

🧹 Retenție / Limitare IndexedDB
Reguli:
Programări: se păstrează doar în fereastra [azi, azi + 21 zile] și max 300 bucăți.

Pacienți: max 60 intrări (prioritizează cei referențiați de programări în fereastra activă, apoi cei mai recenți).

Implementare (policies/retention.ts)
ts
Copy code
export async function pruneAppointments(now = new Date()) {
  const start = new Date(now);
  start.setHours(0,0,0,0);
  const end = new Date(start);
  end.setDate(end.getDate() + 21);

  // 1) Șterge în afara ferestrei
  const all = await db.appointments.toArray();
  const toDelete = all.filter(a => new Date(a.startAt) < start || new Date(a.startAt) > end);
  await db.appointments.bulkDelete(toDelete.map(a => a.id));

  // 2) Limitează la 300 în fereastră, păstrând cele mai recente by updatedAt
  const windowed = await db.appointments
    .filter(a => new Date(a.startAt) >= start && new Date(a.startAt) <= end)
    .toArray();

  if (windowed.length > 300) {
    const sorted = windowed.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    const excess = sorted.slice(300);
    await db.appointments.bulkDelete(excess.map(a => a.id));
  }
}

export async function prunePatients() {
  const appts = await db.appointments.toArray();
  const referenced = new Set(appts.map(a => a.patientId).filter(Boolean));

  const pts = await db.patients.toArray();
  // păstrează întâi pacienții referențiați
  const mustKeep = pts.filter(p => referenced.has(p.id));
  const remainingSlots = Math.max(60 - mustKeep.length, 0);

  // dintre ceilalți, păstrează cei mai recenți până la 60
  const others = pts.filter(p => !referenced.has(p.id))
                    .sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                    .slice(0, remainingSlots);

  const keepIds = new Set([...mustKeep, ...others].map(p => p.id));
  const toDelete = pts.filter(p => !keepIds.has(p.id));
  if (toDelete.length) await db.patients.bulkDelete(toDelete.map(p => p.id));
}

export async function runRetention() {
  await pruneAppointments();
  await prunePatients();
}
Când rulezi retenția:

După fiecare sync la GetCommand (post-fetch).

Periodic (ex. la 10 minute) dacă aplicația rămâne deschisă.

După confirmări WS care adaugă multe entries.

🤝 Rezolvarea conflictelor (policies/conflict.ts)
Propunere simplă (deterministică):

Last-Write-Wins pe updatedAt (serverul e autoritar).

Dacă există _optimistic: true local și serverul respinge: rollback + notificare.

Pentru update concurent: aplică versiunea serverului și marchează local conflict: true dacă payload-ul diferă pe câmpuri critice → UI poate arăta un badge.

ts
Copy code
export function shouldAcceptServer(local: any, remote: any) {
  const lu = new Date(local?.updatedAt || 0).getTime();
  const ru = new Date(remote?.updatedAt || 0).getTime();
  return ru >= lu; // serverul “câștigă” dacă e mai recent sau egal
}
🧠 Flux complet pentru create cu ID temporar (UI → WS)
Componenta creează tempId = makeTempId().

Repository:

Scrie în IndexedDB appointments.put(applyOptimistic({...data, id: tempId}, "create", tempId)).

Dacă online → POST la /api/resources cu payload (poate include clientId: tempId).

Dacă offline → enqueue({ action:"create", resourceType:"appointments", payload:data, tempId }).

La HTTP success cu id permanent:

mapTempToPermId("appointments", tempId, permId) → rescrie entitatea și toate referințele.

La WS event (de confirmare/creare):

Dacă vine { clientId: tempId, id: permId } → rulează mapTempToPermId.

Altfel, dacă vine update pe permId → put peste doc local (șterge _optimistic).

🧱 Repository: schemă de implementare pentru optimistic + offline
ts
Copy code
async add(resource: T, opts?: { optimistic?: boolean }) {
  const isOnline = navigator.onLine;
  const tempId = (resource as any).id ?? makeTempId();

  const localDoc = applyOptimistic({ ...resource, id: tempId } as any, "create", tempId);
  await db.table(this.store).put(localDoc);

  const send = async () => {
    const result = await this.request("", { method: "POST", body: JSON.stringify({ ...resource, clientId: tempId }) });
    // mapare temp → perm
    if (result?.id && tempId !== result.id) {
      await mapTempToPermId(this.store, tempId, result.id);
    } else {
      await db.table(this.store).put(clearOptimistic({ ...result, id: result.id }));
    }
    return result;
  };

  if (!isOnline) {
    await enqueue({ resourceType: this.store, action: "create", payload: resource, tempId });
    return { ...localDoc };
  }

  try {
    return await send();
  } catch (e) {
    // eșec – pune în coadă & lasă optimistic, UI arată pending
    await enqueue({ resourceType: this.store, action: "create", payload: resource, tempId });
    throw e;
  }
}
Similar pentru update și delete: salvează backup, aplică optimistic, dacă eșuează → enqueue + eventual rollback pentru delete.

🧵 Integrare WebSocket
Mesajele WS pot avea formatele:

{"type":"create","resourceType":"appointments","data":{...},"clientId":"tmp_x"}

{"type":"update","resourceType":"appointments","data":{...}}

{"type":"delete","resourceType":"appointments","id":"..."}

Handler WS:

ts
Copy code
ws.onmessage = async (msg) => {
  const ev = JSON.parse(msg.data);
  const store = db.table(ev.resourceType);
  switch (ev.type) {
    case "create":
      if (ev.clientId && await db.idMap.get({ tempId: ev.clientId })) return; // deja mapat
      if (ev.clientId) await mapTempToPermId(ev.resourceType, ev.clientId, ev.data.id);
      else await store.put(clearOptimistic(ev.data));
      break;
    case "update":
      await store.put(clearOptimistic(ev.data));
      break;
    case "delete":
      await store.delete(ev.id);
      break;
  }
  await runRetention(); // menține limitele
};
🧰 Recomandări UX
Afișează status-uri: pending, synced, failed la nivel de rând.

Dezambiguizează acțiuni în curs (spinner la butonul “Save”).

Notifică utilizatorul la rollback sau când un update a fost suprascris de server (conflict badge).

✅ Checklist implementare
 db.ts: stores noi (idMap, queue, meta) + indexuri utile (updatedAt, startAt).

 offlineQueue.ts: enqueue, process, backoff, hook pe online.

 optimistic.ts: generator tempId, flag-uri, clear.

 retention.ts: prune appointments & patients; hook-uri (post-sync, periodic).

 ResourceRepository.ts: add/update/remove cu optimistic + enqueue; confirmare HTTP.

 WebSocket handler: confirmări create/update/delete, mapare temp→perm, runRetention.

 conflict.ts: regulă LWW + marcaj conflict pentru UI.

 Componente: afișează _optimistic/_pending/conflict.