/**
 * Rate Limiting Utility
 * 
 * Simple in-memory rate limiter for API protection.
 * 
 * For production with multiple server instances, use:
 * - Vercel KV (https://vercel.com/docs/storage/vercel-kv)
 * - Upstash Redis (https://upstash.com/)
 * - Cloudflare Rate Limiting
 * 
 * This in-memory implementation works for:
 * - Development
 * - Single-instance deployments
 * - Serverless (with caveats - each cold start resets counters)
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store - will reset on server restart
// For production, use Redis or Vercel KV
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
const CLEANUP_INTERVAL = 60000; // 1 minute
let lastCleanup = Date.now();

function cleanupOldEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  
  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Custom key generator (defaults to IP address) */
  keyGenerator?: (req: NextRequest) => string;
  /** Custom error message */
  message?: string;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  limit: 60,
  windowMs: 60000, // 1 minute
  message: 'Too many requests. Please try again later.',
};

/**
 * Get client identifier for rate limiting
 * Uses X-Forwarded-For header in production (behind Vercel/Cloudflare)
 */
function getClientId(req: NextRequest): string {
  // Vercel provides the real IP in x-forwarded-for
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  // Fallback to x-real-ip
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Last resort - use a hash of headers to identify client
  return 'unknown';
}

/**
 * Check rate limit for a request
 * Returns null if allowed, or an error response if rate limited
 */
export function checkRateLimit(
  req: NextRequest,
  config: Partial<RateLimitConfig> = {}
): NextResponse | null {
  cleanupOldEntries();
  
  const { limit, windowMs, keyGenerator, message } = {
    ...DEFAULT_CONFIG,
    ...config,
  };
  
  const clientId = keyGenerator ? keyGenerator(req) : getClientId(req);
  const key = `${req.nextUrl.pathname}:${clientId}`;
  const now = Date.now();
  
  let entry = rateLimitStore.get(key);
  
  if (!entry || entry.resetTime < now) {
    // Create new entry
    entry = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, entry);
    return null; // Allowed
  }
  
  // Increment count
  entry.count++;
  
  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    
    console.warn(`⚠️ Rate limit exceeded: ${clientId} on ${req.nextUrl.pathname}`);
    
    return NextResponse.json(
      {
        error: message,
        code: 'RATE_LIMITED',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(entry.resetTime / 1000).toString(),
        },
      }
    );
  }
  
  return null; // Allowed
}

/**
 * Rate limit configuration presets for different endpoints
 */
export const RATE_LIMIT_PRESETS = {
  // Donation creation - generous limit
  donation: {
    limit: 10,
    windowMs: 60000, // 10 donations per minute per IP
    message: 'Too many donation attempts. Please wait a minute.',
  },
  
  // Verification API - more generous for transparency
  verification: {
    limit: 30,
    windowMs: 60000, // 30 checks per minute
    message: 'Too many verification requests. Please slow down.',
  },
  
  // Admin APIs - stricter limits
  admin: {
    limit: 20,
    windowMs: 60000, // 20 admin actions per minute
    message: 'Too many admin requests. Please wait.',
  },
  
  // Webhook endpoint - high limit (Razorpay may retry)
  webhook: {
    limit: 100,
    windowMs: 60000, // 100 webhooks per minute
    message: 'Webhook rate limit exceeded.',
  },
  
  // General API - default
  general: {
    limit: 60,
    windowMs: 60000, // 60 requests per minute
    message: 'Too many requests. Please try again later.',
  },
} as const;

/**
 * Higher-level function to apply rate limiting to an API route
 * 
 * Usage:
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   const rateLimited = applyRateLimit(req, 'donation');
 *   if (rateLimited) return rateLimited;
 *   // ... rest of handler
 * }
 * ```
 */
export function applyRateLimit(
  req: NextRequest,
  preset: keyof typeof RATE_LIMIT_PRESETS = 'general'
): NextResponse | null {
  return checkRateLimit(req, RATE_LIMIT_PRESETS[preset]);
}

