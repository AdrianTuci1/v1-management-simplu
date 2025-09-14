import { db } from "../infrastructure/db";

export async function pruneAppointments(now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 21);

  const all = await db.table("appointments").toArray();

  const toDelete = all.filter(a => {
    const dateStr = a.date || a.startAt || a.startDate;
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d < start || d > end;
  });
  if (toDelete.length) {
    await db.table("appointments").bulkDelete(toDelete.map(a => a.resourceId || a.id));
  }

  const windowed = all.filter(a => {
    const dateStr = a.date || a.startAt || a.startDate;
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d >= start && d <= end;
  });

  if (windowed.length > 300) {
    const sorted = windowed.sort((a, b) => {
      const au = new Date(a.updatedAt || a.lastUpdated || a.timestamp || 0).getTime();
      const bu = new Date(b.updatedAt || b.lastUpdated || b.timestamp || 0).getTime();
      return bu - au;
    });
    const excess = sorted.slice(300);
    await db.table("appointments").bulkDelete(excess.map(a => a.resourceId || a.id));
  }
}

export async function prunePatients() {
  const appts = await db.table("appointments").toArray();
  const referenced = new Set(appts.map(a => a.patientId).filter(Boolean));

  const pts = await db.table("patients").toArray();

  const mustKeep = pts.filter(p => referenced.has(p.id || p.resourceId));
  const remainingSlots = Math.max(60 - mustKeep.length, 0);

  const others = pts
    .filter(p => !referenced.has(p.id || p.resourceId))
    .sort((a, b) => {
      const au = new Date(a.updatedAt || a.lastUpdated || a.timestamp || 0).getTime();
      const bu = new Date(b.updatedAt || b.lastUpdated || b.timestamp || 0).getTime();
      return bu - au;
    })
    .slice(0, remainingSlots);

  const keepIds = new Set([...mustKeep, ...others].map(p => p.resourceId || p.id));
  const toDelete = pts.filter(p => !keepIds.has(p.resourceId || p.id));
  if (toDelete.length) await db.table("patients").bulkDelete(toDelete.map(p => p.resourceId || p.id));
}

export async function runRetention() {
  await pruneAppointments();
  await prunePatients();
}


