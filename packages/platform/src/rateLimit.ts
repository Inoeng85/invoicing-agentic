type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

/** Simple in-memory rate limit (per process). Returns true when allowed. */
export function rateLimitKey(key: string, maxHits: number, windowMs: number): boolean {
  let now = Date.now()
  let bucket = buckets.get(key)
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (bucket.count >= maxHits) return false
  bucket.count += 1
  return true
}

export function clientIp(request: Request): string {
  let forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown'
  return 'local'
}
