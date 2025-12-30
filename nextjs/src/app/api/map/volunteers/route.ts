import { NextResponse } from 'next/server';
import { createSSRSassClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabaseClient = await createSSRSassClient();
    const supabase = supabaseClient.getSupabaseClient();

    const { data: volunteers, error } = await supabase
      .from('volunteers')
      .select('id, name, area, pincode, area_name, help_types, latitude, longitude, status')
      .eq('status', 'approved')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (error) {
      console.error('Error fetching volunteers:', error);
      return NextResponse.json({ error: 'Failed to fetch volunteers' }, { status: 500 });
    }

    return NextResponse.json({ volunteers: volunteers || [] });

  } catch (error) {
    console.error('Error in map/volunteers API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

