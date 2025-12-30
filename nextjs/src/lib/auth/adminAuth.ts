/**
 * Admin Authentication Utility
 * 
 * Provides authentication and authorization checks for admin API routes.
 * This ensures only authenticated users with proper permissions can access
 * sensitive administrative functions.
 * 
 * SECURITY BEHAVIOR:
 * - Production (NODE_ENV !== 'development'): Enforces admin role check
 * - Development (NODE_ENV === 'development'): Allows any authenticated user
 * 
 * To make a user admin, set their role in Supabase:
 * UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}' WHERE email = 'user@email.com';
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/types';
import crypto from 'crypto';

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

export interface AdminAuthResult {
  authorized: boolean;
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
  error?: string;
}

/**
 * Check if the current request is from an authenticated admin user
 * 
 * In production: Requires user to have 'admin' or 'super_admin' role
 * In development: Any authenticated user is allowed (for easier testing)
 * 
 * @returns AdminAuthResult with authorization status and user info
 */
export async function checkAdminAuth(): Promise<AdminAuthResult> {
  try {
    // SECURITY: Validate required environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing required Supabase environment variables');
      return {
        authorized: false,
        error: 'Server configuration error',
      };
    }
    
    const cookieStore = await cookies();
    
    const supabase = createServerClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore errors from Server Components
            }
          },
        },
      }
    );

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        authorized: false,
        error: 'Authentication required',
      };
    }

    // Check if user has admin role
    const userMetadata = user.user_metadata || {};
    const appMetadata = user.app_metadata || {};
    
    // Check various places where role might be stored
    const role = userMetadata.role || appMetadata.role || 'user';
    const isAdmin = role === 'admin' || role === 'super_admin';
    
    // SECURITY: Enforce admin role check in production
    // In development, allow any authenticated user for easier testing
    if (!isDevelopment && !isAdmin) {
      console.warn(`⚠️ Non-admin user attempted admin action: ${user.email} (role: ${role})`);
      return {
        authorized: false,
        user: { id: user.id, email: user.email, role },
        error: 'Admin privileges required',
      };
    }
    
    // Log bypass in development for visibility
    if (isDevelopment && !isAdmin) {
      console.log(`ℹ️ DEV MODE: Allowing non-admin user: ${user.email} (role: ${role})`);
    }

    return {
      authorized: true,
      user: {
        id: user.id,
        email: user.email,
        role,
      },
    };
  } catch (error) {
    console.error('Admin auth check failed:', error);
    return {
      authorized: false,
      error: 'Authentication check failed',
    };
  }
}

/**
 * Middleware wrapper for admin-only API routes
 * Returns an error response if not authorized, otherwise returns null
 * 
 * Usage in API route:
 * ```typescript
 * const authError = await requireAdminAuth();
 * if (authError) return authError;
 * // ... rest of your handler
 * ```
 */
export async function requireAdminAuth(): Promise<NextResponse | null> {
  const auth = await checkAdminAuth();
  
  if (!auth.authorized) {
    console.warn(`⚠️ Unauthorized admin access attempt: ${auth.error}`);
    return NextResponse.json(
      { 
        error: auth.error || 'Unauthorized',
        code: 'UNAUTHORIZED',
      },
      { status: 401 }
    );
  }
  
  console.log(`✅ Admin auth verified: ${auth.user?.email}`);
  return null;
}

/**
 * Get admin auth result without returning error response
 * Useful when you need the user info even on failure
 */
export async function getAdminAuth(): Promise<AdminAuthResult> {
  return checkAdminAuth();
}

/**
 * Check if a request has a valid API key (for server-to-server calls)
 * This is an alternative auth method for automated/cron jobs
 * 
 * SECURITY: Uses timing-safe comparison to prevent timing attacks
 */
export function checkApiKeyAuth(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  const expectedKey = process.env.ADMIN_API_KEY;
  
  // If no API key is configured, this method cannot be used
  if (!expectedKey) {
    return false;
  }
  
  // If no API key provided in request
  if (!apiKey) {
    return false;
  }
  
  // SECURITY: Use timing-safe comparison to prevent timing attacks
  // An attacker could use timing differences to infer the correct key character-by-character
  try {
    const apiKeyBuffer = Buffer.from(apiKey, 'utf8');
    const expectedKeyBuffer = Buffer.from(expectedKey, 'utf8');
    
    // Lengths must match for timingSafeEqual
    if (apiKeyBuffer.length !== expectedKeyBuffer.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(apiKeyBuffer, expectedKeyBuffer);
  } catch {
    // In case of any encoding issues, fail closed
    return false;
  }
}

/**
 * Combined auth check - either admin session OR valid API key
 * Useful for routes that might be called by both users and cron jobs
 */
export async function requireAdminOrApiKey(request: NextRequest): Promise<NextResponse | null> {
  // First check API key (for cron/server calls)
  if (checkApiKeyAuth(request)) {
    console.log('✅ API key auth verified');
    return null;
  }
  
  // Fall back to session auth
  return requireAdminAuth();
}

