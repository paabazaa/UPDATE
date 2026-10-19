// Small in-memory rate limiter. Counts reset when the server restarts.
export function createRateLimiter() {
  const hits = new Map();
  return function allow(key, limit, windowMs) {
    const now = Date.now();
    const recent = (hits.get(key) || []).filter(time => now - time < windowMs);
    if (recent.length >= limit) {
      hits.set(key, recent);
      return false;
    }
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > 5000) {
      for (const [name, times] of hits) if (!times.some(time => now - time < windowMs)) hits.delete(name);
    }
    return true;
  };
}
