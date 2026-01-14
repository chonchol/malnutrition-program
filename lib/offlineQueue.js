import { get, set, del } from "idb-keyval";

const QUEUE_KEY = "mh-offline-queue";

export async function queueAssessment(data) {
  const current = (await get(QUEUE_KEY)) || [];
  current.push({ ...data, queuedAt: new Date().toISOString() });
  await set(QUEUE_KEY, current);
}

export async function getQueuedAssessments() {
  return ((await get(QUEUE_KEY)) || []).sort(
    (a, b) => new Date(a.queuedAt) - new Date(b.queuedAt)
  );
}

export async function clearQueue() {
  await del(QUEUE_KEY);
}
