import { db } from "../infrastructure/db";
import { mapTempToPermId } from "../store/idMap";

export async function enqueue(item) {
  return db.table("queue").add({
    ...item,
    status: "pending",
    createdAt: Date.now(),
    retryCount: 0
  });
}

export async function processQueue(apiRequest) {
  const now = Date.now();
  const batch = await db.table("queue")
    .where("status").anyOf("pending", "retrying")
    .and(q => !q.nextAttemptAt || q.nextAttemptAt <= now)
    .limit(20)
    .toArray();

  for (const q of batch) {
    try {
      await db.table("queue").update(q.seq, { status: "retrying" });
      const result = await apiRequest(q.resourceType, q.action, q.payload, q.targetId);
      // succes: dacă e create cu tempId, mapează ID-urile
      if (q.action === "create" && q.tempId && result?.id) {
        await mapTempToPermId(q.resourceType, q.tempId, result.id);
      }
      await db.table("queue").delete(q.seq);
    } catch (e) {
      const retryCount = (q.retryCount ?? 0) + 1;
      const nextAttemptAt = Date.now() + Math.min(2 ** retryCount * 1000, 5 * 60 * 1000);
      await db.table("queue").update(q.seq, { status: "pending", retryCount, nextAttemptAt });
    }
  }
}


