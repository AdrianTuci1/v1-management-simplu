export function makeTempId(prefix = "tmp_") {
  try {
    return `${prefix}${crypto.randomUUID()}`;
  } catch (_) {
    return `${prefix}${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}

export function applyOptimistic(doc, action, tempId) {
  const updatedAt = new Date().toISOString();
  return {
    ...doc,
    _optimistic: true,
    _pending: { action, tempId },
    updatedAt
  };
}

export function clearOptimistic(doc) {
  if (!doc) return doc;
  const { _optimistic, _pending, ...rest } = doc;
  return rest;
}


