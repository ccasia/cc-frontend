// Last known tab counts per user, so a refresh shows them at once and updates them when fresh data arrives.
const key = (userId) => `cc-campaign-counts:${userId}`;

export function readCountCache(userId) {
  try {
    return JSON.parse(localStorage.getItem(key(userId))) || {};
  } catch (error) {
    return {};
  }
}

export function writeCountCache(userId, patch) {
  try {
    localStorage.setItem(key(userId), JSON.stringify({ ...readCountCache(userId), ...patch }));
  } catch (error) {
    // Storage full or blocked; counts just load fresh next time.
  }
}
