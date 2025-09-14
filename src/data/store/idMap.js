import { db } from "../infrastructure/db";
import { clearOptimistic } from "./optimistic";

export async function mapTempToPermId(resourceType, tempId, permId) {
  await db.table("idMap").put({ tempId, permId, resourceType });

  const store = db.table(resourceType);
  const temp = await store.get(tempId);
  if (temp) {
    const cleared = clearOptimistic(temp);
    await store.delete(tempId);
    await store.put({ ...cleared, id: permId, resourceId: permId });
  }

  await rewriteReferences(tempId, permId);
}

export async function rewriteReferences(tempId, permId) {
  // exemplu: appointments.patientId poate referi pacienți
  try {
    const appts = await db.table("appointments").where("patientId").equals(tempId).toArray();
    if (appts.length) {
      await db.transaction("rw", db.table("appointments"), async () => {
        for (const a of appts) {
          await db.table("appointments").put({ ...a, patientId: permId });
        }
      });
    }
  } catch (_) {}
}


