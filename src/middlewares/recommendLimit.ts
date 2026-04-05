const userLastRecommend = new Map<number, number[]>();

const MAX_RECOMMENDS = 3;
const TIME_WINDOW = 60_000; // 1 minute
const CLEANUP_INTERVAL = 5 * 60_000; // 5 minutes

/**
 * Returns true if the user can make a recommend request.
 * Returns remaining cooldown in seconds if blocked.
 */
export function checkRecommendLimit(userId: number): true | number {
  const now = Date.now();
  const timestamps = userLastRecommend.get(userId) || [];

  // Remove expired entries
  const recent = timestamps.filter((t) => now - t < TIME_WINDOW);

  if (recent.length >= MAX_RECOMMENDS) {
    const oldestInWindow = recent[0];
    const waitMs = TIME_WINDOW - (now - oldestInWindow);
    return Math.ceil(waitMs / 1000);
  }

  recent.push(now);
  userLastRecommend.set(userId, recent);
  return true;
}

// Periodic cleanup of stale entries
setInterval(() => {
  const now = Date.now();
  for (const [userId, timestamps] of userLastRecommend) {
    const recent = timestamps.filter((t) => now - t < TIME_WINDOW);
    if (recent.length === 0) {
      userLastRecommend.delete(userId);
    }
  }
}, CLEANUP_INTERVAL);
