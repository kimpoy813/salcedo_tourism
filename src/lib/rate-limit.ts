type BucketEntry = {
  count: number;
  resetAt: number;
};

type GlobalRateLimit = {
  __cedoRateBuckets?: Map<string, BucketEntry>;
};

const g = globalThis as unknown as GlobalRateLimit;

function getBuckets(): Map<string, BucketEntry> {
  if (!g.__cedoRateBuckets) {
    g.__cedoRateBuckets = new Map<string, BucketEntry>();
  }
  return g.__cedoRateBuckets;
}

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const buckets = getBuckets();

  // Periodic cleanup to avoid unbounded map growth
  if (buckets.size > 5000) {
    for (const [k, v] of buckets.entries()) {
      if (v.resetAt <= now) buckets.delete(k);
    }
  }

  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    const entry = { count: 1, resetAt: now + windowMs };
    buckets.set(key, entry);
    return { allowed: true, remaining: Math.max(0, maxRequests - 1), resetAt: entry.resetAt };
  }

  if (current.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - current.count),
    resetAt: current.resetAt,
  };
}

export function getClientThrottleKey(req: Request, scope: string): string {
  // Hash client IP transiently for rate-limiting only; NEVER persisted to analytics or visitor tables
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  return `${scope}:${forwarded}`;
}
