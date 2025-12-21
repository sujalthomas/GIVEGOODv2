/**
 * Admin Authentication Utility
 * 
 * Provides authentication and authorization checks for admin API routes.
 * This ensures only authenticated users with proper permissions can access
 * sensitive administrative functions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/types';

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
 * For now, any authenticated user is considered an admin.
 * In production, you should add role-based checks using user metadata
 * or a separate admin_users table.
 * 
 * @returns AdminAuthResult with authorization status and user info
 */
export async function checkAdminAuth(): Promise<AdminAuthResult> {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
    // Option 1: Check user metadata (set during registration or by admin)
    const userMetadata = user.user_metadata || {};
    const appMetadata = user.app_metadata || {};
    
    // Check various places where role might be stored
    const role = userMetadata.role || appMetadata.role || 'user';
    const isAdmin = role === 'admin' || role === 'super_admin';

    // For development/early stage: allow any authenticated user
    // TODO: Uncomment the isAdmin check for production
    // if (!isAdmin) {
    //   return {
    //     authorized: false,
    //     user: { id: user.id, email: user.email, role },
    //     error: 'Admin privileges required',
    //   };
    // }

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
 */
export function checkApiKeyAuth(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  const expectedKey = process.env.ADMIN_API_KEY;
  
  // If no API key is configured, this method cannot be used
  if (!expectedKey) {
    return false;
  }
  
  return apiKey === expectedKey;
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

