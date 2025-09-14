import { db } from "./db";
import { clearOptimistic } from "../store/optimistic";
import { mapTempToPermId } from "../store/idMap";
import { runRetention } from "../policies/retention";

export async function handleResourceEvent(ev) {
  const { type, resourceType, data, id, clientId, tempId } = normalizeEvent(ev);
  const store = db.table(resourceType);

  switch (type) {
    case "create":
      if (clientId) {
        await mapTempToPermId(resourceType, clientId, data.id || id);
      } else if (tempId) {
        await mapTempToPermId(resourceType, tempId, data.id || id);
      } else {
        await store.put(clearOptimistic(data));
      }
      break;
    case "update":
      await store.put(clearOptimistic(data));
      break;
    case "delete":
      await store.delete(id || data?.id);
      break;
    default:
      break;
  }

  await runRetention();
}

function normalizeEvent(ev) {
  if (!ev) return { };
  // Support shapes from websocketClient and worker messages
  const type = ev.type?.startsWith("resource_") ? ev.type.replace("resource_", "") : ev.type;
  return {
    type,
    resourceType: ev.resourceType || ev.data?.resourceType,
    data: ev.data || ev.payload?.data || ev,
    id: ev.id || ev.resourceId || ev.data?.id,
    clientId: ev.clientId || ev.tempId || ev.data?.clientId,
    tempId: ev.tempId
  };
}


