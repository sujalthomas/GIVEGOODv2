import { NextResponse } from 'next/server';
import { createSPAClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    const supabase = createSPAClient();

    const { data: areas, error } = await supabase.rpc('get_area_stats');

    if (error) {
      console.error('Error fetching area stats:', error);
      return NextResponse.json({ error: 'Failed to fetch areas' }, { status: 500 });
    }

    return NextResponse.json({ areas: areas || [] });

  } catch (error) {
    console.error('Error in map/areas API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

