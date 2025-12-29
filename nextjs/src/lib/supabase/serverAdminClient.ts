import { createServerClient } from '@supabase/ssr'

/**
 * Creates a Supabase client with service role key (bypasses RLS).
 * Use this for server-side operations that need admin access.
 * NOTE: We don't use Database generic here because it causes type inference issues
 * with the __InternalSupabase type. The client is untyped but we add types at call sites.
 */
export async function createServerAdminClient() {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.PRIVATE_SUPABASE_SERVICE_KEY!,
        {
            cookies: {
                getAll: () => [],
                setAll: () => {},
            },
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
            db: {
                schema: 'public'
            },
        }
    )
}