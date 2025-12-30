import { NextResponse } from 'next/server';
import { createSSRSassClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabaseClient = await createSSRSassClient();
    const supabase = supabaseClient.getSupabaseClient();

    const { data: feeders, error } = await supabase
      .from('feeders')
      .select('*')
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching feeders:', error);
      return NextResponse.json({ error: 'Failed to fetch feeders' }, { status: 500 });
    }

    return NextResponse.json({ feeders: feeders || [] });

  } catch (error) {
    console.error('Error in map/feeders API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

