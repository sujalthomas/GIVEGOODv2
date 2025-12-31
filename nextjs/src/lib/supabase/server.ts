import {createServerClient} from '@supabase/ssr'
import {SupabaseClient} from '@supabase/supabase-js';
import {cookies} from 'next/headers'
import {ClientType, SassClient} from "@/lib/supabase/unified";
import {Database} from "@/lib/types";

export async function createSSRClient() {
    const cookieStore = await cookies()

    return createServerClient<Database, "public", Database["public"]>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            }
        }
    )
}



export async function createSSRSassClient() {
    const client = await createSSRClient();
    // createSSRClient returns SupabaseClient which matches SassClient constructor type
    return new SassClient(
        client as unknown as SupabaseClient<Database, "public", "public">, 
        ClientType.SERVER
    );
}