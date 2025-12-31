import {createBrowserClient} from '@supabase/ssr'
import {SupabaseClient} from '@supabase/supabase-js';
import {ClientType, SassClient} from "@/lib/supabase/unified";
import {Database} from "@/lib/types";

export function createSPAClient() {
    return createBrowserClient<Database, "public", Database["public"]>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}

export async function createSPASassClient() {
    const client = createSPAClient();
    // createBrowserClient returns SupabaseClient which matches SassClient constructor type
    return new SassClient(
        client as unknown as SupabaseClient<Database, "public", "public">, 
        ClientType.SPA
    );
}

export async function createSPASassClientAuthenticated() {
    const client = createSPAClient();
    const user = await client.auth.getSession();
    if (!user.data || !user.data.session) {
        window.location.href = '/auth/login';
    }
    // createBrowserClient returns SupabaseClient which matches SassClient constructor type
    return new SassClient(
        client as unknown as SupabaseClient<Database, "public", "public">, 
        ClientType.SPA
    );
}