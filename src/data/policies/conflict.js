export function shouldAcceptServer(localDoc, remoteDoc) {
  const lu = new Date(localDoc?.updatedAt || localDoc?.lastUpdated || 0).getTime();
  const ru = new Date(remoteDoc?.updatedAt || remoteDoc?.lastUpdated || 0).getTime();
  return ru >= lu;
}


