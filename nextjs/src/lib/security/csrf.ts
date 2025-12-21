/**
 * CSRF Protection Utility
 * 
 * Next.js API routes are susceptible to CSRF attacks because they
 * accept cross-origin requests by default.
 * 
 * This module provides origin/referer checking as CSRF protection.
 * For full CSRF token-based protection, consider:
 * - next-csrf (npm package)
 * - Custom token implementation
 * 
 * Note: This is particularly important for state-changing operations
 * like creating donations, not for read operations.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Get allowed origins from environment
 * Falls back to common development origins
 * Uses Set to deduplicate origins
 */
function getAllowedOrigins(): string[] {
  const envOrigins = process.env.ALLOWED_ORIGINS;
  if (envOrigins) {
    return [...new Set(envOrigins.split(',').map(o => o.trim()))];
  }
  
  // Use Set to deduplicate origins (VERCEL_URL or NEXT_PUBLIC_APP_URL might match hardcoded values)
  const origins = new Set<string>([
    // Production domain (update this!)
    'https://givegoodclub.org',
    'https://www.givegoodclub.org',
  ]);
  
  // In development, also allow localhost
  if (process.env.NODE_ENV === 'development') {
    origins.add('http://localhost:3000');
    origins.add('http://localhost:3001');
    origins.add('http://127.0.0.1:3000');
  }
  
  // Vercel preview deployments
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    origins.add(`https://${vercelUrl}`);
  }
  
  // Next.js URL
  const nextUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (nextUrl) {
    origins.add(nextUrl);
  }
  
  return [...origins];
}

// Whether to enable strict mode (block requests without origin/referer)
// In production, you may want to set CSRF_STRICT_MODE=true
const isStrictMode = process.env.CSRF_STRICT_MODE === 'true';

/**
 * Check if the request origin is allowed
 * Returns null if allowed, or an error response if blocked
 * 
 * Options:
 * - strict: Override global strict mode for this check
 * 
 * Usage:
 * ```typescript
 * const csrfError = checkOrigin(request);
 * if (csrfError) return csrfError;
 * ```
 */
export function checkOrigin(req: NextRequest, options?: { strict?: boolean }): NextResponse | null {
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  const strict = options?.strict ?? isStrictMode;
  
  // Webhooks from payment providers won't have origin/referer
  // They should be verified via signature instead
  const isWebhook = req.nextUrl.pathname.includes('/webhooks/');
  if (isWebhook) {
    return null; // Skip origin check for webhooks
  }
  
  // API calls from server components won't have origin
  // Check if it looks like a server-side call
  const isServerSide = !origin && !referer;
  if (isServerSide) {
    if (strict) {
      // In strict mode, block requests without origin/referer
      // This prevents curl/direct API calls but may break some legitimate use cases
      console.warn('⚠️ CSRF Strict Mode: Blocked request without origin/referer');
      return NextResponse.json(
        { error: 'Origin or Referer header required', code: 'CSRF_BLOCKED' },
        { status: 403 }
      );
    }
    // Non-strict: Could be SSR or API route calling another API route
    console.log('ℹ️ Request without origin/referer (likely server-side)');
    return null;
  }
  
  const allowedOrigins = getAllowedOrigins();
  
  // Check origin header
  // SECURITY: Use strict equality only - startsWith is vulnerable to origin spoofing
  // e.g., "https://givegoodclub.org.evil.com".startsWith("https://givegoodclub.org") === true
  if (origin) {
    if (allowedOrigins.some(allowed => origin === allowed)) {
      return null; // Allowed
    }
    
    console.warn(`⚠️ CSRF: Blocked request from origin: ${origin}`);
    return NextResponse.json(
      { error: 'Invalid origin', code: 'CSRF_BLOCKED' },
      { status: 403 }
    );
  }
  
  // Fall back to referer check
  // SECURITY: Same strict equality check for referer origin
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const refererOrigin = refererUrl.origin;
      
      if (allowedOrigins.some(allowed => refererOrigin === allowed)) {
        return null; // Allowed
      }
      
      console.warn(`⚠️ CSRF: Blocked request from referer: ${referer}`);
      return NextResponse.json(
        { error: 'Invalid referer', code: 'CSRF_BLOCKED' },
        { status: 403 }
      );
    } catch {
      // Invalid referer URL
      console.warn(`⚠️ CSRF: Invalid referer URL: ${referer}`);
      return NextResponse.json(
        { error: 'Invalid referer', code: 'CSRF_BLOCKED' },
        { status: 403 }
      );
    }
  }
  
  // No origin or referer - could be a direct API call (curl, etc.)
  if (strict) {
    console.warn('⚠️ CSRF Strict Mode: Blocked request without origin/referer headers');
    return NextResponse.json(
      { error: 'Origin or Referer header required', code: 'CSRF_BLOCKED' },
      { status: 403 }
    );
  }
  
  console.log('ℹ️ Request without origin or referer headers');
  return null;
}

/**
 * Verify the request has the expected content type
 * This provides additional protection against simple form submissions
 */
export function checkContentType(
  req: NextRequest,
  expected: string = 'application/json'
): NextResponse | null {
  const contentType = req.headers.get('content-type');
  
  if (!contentType || !contentType.includes(expected)) {
    console.warn(`⚠️ Invalid content-type: ${contentType}, expected: ${expected}`);
    return NextResponse.json(
      { error: 'Invalid content type', code: 'INVALID_CONTENT_TYPE' },
      { status: 415 }
    );
  }
  
  return null;
}

/**
 * Combined CSRF protection for POST/PUT/DELETE requests
 * Checks both origin and content-type
 */
export function applyCsrfProtection(req: NextRequest): NextResponse | null {
  // Check origin first
  const originError = checkOrigin(req);
  if (originError) return originError;
  
  // For POST/PUT/PATCH, also verify content-type
  const method = req.method.toUpperCase();
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    const contentTypeError = checkContentType(req);
    if (contentTypeError) return contentTypeError;
  }
  
  return null;
}

