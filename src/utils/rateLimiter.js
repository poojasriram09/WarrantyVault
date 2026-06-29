/**
 * Simple client-side rate limiter using sliding window.
 * Prevents excessive API calls from a single browser session.
 */
const windows = new Map();

export function checkRateLimit(key, maxRequests, windowMs) {
  const now = Date.now();
  if (!windows.has(key)) {
    windows.set(key, []);
  }

  const timestamps = windows.get(key).filter((t) => now - t < windowMs);
  windows.set(key, timestamps);

  if (timestamps.length >= maxRequests) {
    return false;
  }

  timestamps.push(now);
  return true;
}
