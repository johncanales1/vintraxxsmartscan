/**
 * rate-limit — small in-memory leaky-bucket helper for gateway hot paths.
 *
 * Two callers use it today:
 *   • handleAuth   — caps failed auth-code attempts per JT/T 808 device
 *                    identifier to defeat brute-force of the auth-code space.
 *   • handleRegister — caps registration storms from a single source IP.
 *
 * The buckets are PROCESS-LOCAL (Map). With one gateway pod this is the
 * truth; with multiple pods, an attacker could fan out across pods to
 * triple their effective rate. That's an acceptable tradeoff at the
 * scale we run today — Phase 6 (Redis-backed pubsub) will lift the limit
 * to a shared store. We size buckets conservatively so even per-pod
 * limits are tight enough to make brute-force infeasible.
 *
 * Memory bound: each bucket carries a single number + a Date; the Map's
 * overhead per entry is ~50 bytes. We sweep entries that haven't been
 * touched in BUCKET_GC_MS to keep the store size bounded.
 */

interface Bucket {
  /** Number of "tokens" used in the current window. */
  count: number;
  /** Window start (ms epoch). */
  windowStart: number;
}

interface LimiterOpts {
  /** Max events permitted per window. */
  capacity: number;
  /** Window length in ms. */
  windowMs: number;
}

const BUCKET_GC_MS = 60 * 60 * 1000; // 1h
const GC_INTERVAL_MS = 5 * 60 * 1000; // 5min

export class RateLimiter {
  private buckets = new Map<string, Bucket>();
  private lastTouch = new Map<string, number>();
  private gcTimer: NodeJS.Timeout;

  constructor(private opts: LimiterOpts) {
    this.gcTimer = setInterval(() => this.gc(), GC_INTERVAL_MS);
    // Don't keep the gateway alive on this alone.
    this.gcTimer.unref();
  }

  /**
   * Returns `true` if the event is permitted (bucket has capacity), `false`
   * if rate-limited. Always counts the event toward the bucket — callers
   * shouldn't keep retrying.
   */
  tryConsume(key: string): boolean {
    const now = Date.now();
    let bucket = this.buckets.get(key);
    if (!bucket || now - bucket.windowStart >= this.opts.windowMs) {
      bucket = { count: 0, windowStart: now };
      this.buckets.set(key, bucket);
    }
    bucket.count += 1;
    this.lastTouch.set(key, now);

    return bucket.count <= this.opts.capacity;
  }

  /**
   * Reset the bucket for `key` — call after a SUCCESSFUL operation so that
   * a successful login (etc.) doesn't penalise the next legitimate attempt.
   */
  reset(key: string): void {
    this.buckets.delete(key);
    this.lastTouch.delete(key);
  }

  private gc(): void {
    const cutoff = Date.now() - BUCKET_GC_MS;
    for (const [key, ts] of this.lastTouch) {
      if (ts < cutoff) {
        this.buckets.delete(key);
        this.lastTouch.delete(key);
      }
    }
  }

  /** Test hook + graceful shutdown. */
  stop(): void {
    clearInterval(this.gcTimer);
  }
}

// ── Pre-configured limiters used by gateway handlers ────────────────────────

/**
 * Auth-code attempts: 5 per minute per device identifier. The legitimate
 * device sends one auth attempt per session and reconnects every few
 * minutes at most, so 5/min absorbs a flapping cell tower without ever
 * hitting the limit. A brute-force at 5 attempts/min would need ~3.6
 * trillion years to walk a 32-bit code space — well past the operational
 * horizon.
 */
export const authCodeLimiter = new RateLimiter({
  capacity: 5,
  windowMs: 60_000,
});

/**
 * Registration attempts: 30 per minute per source IP. Reconnects across a
 * carrier NAT gateway can produce bursts of 5-10 from the same shared IP
 * legitimately; 30/min keeps single-host floods (a stuck embedded device
 * looping registration) detectable without blocking real fleets.
 */
export const registrationLimiter = new RateLimiter({
  capacity: 30,
  windowMs: 60_000,
});
