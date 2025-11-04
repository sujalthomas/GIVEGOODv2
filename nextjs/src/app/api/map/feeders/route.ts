import { NextResponse } from 'next/server';
import { createSPAClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    const supabase = createSPAClient();

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

