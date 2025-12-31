import { NextRequest, NextResponse } from 'next/server';
import { createSSRSassClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const feederId = searchParams.get('feederId');
    const verified = searchParams.get('verified');
    const volunteerId = searchParams.get('volunteerId');

    const supabaseClient = await createSSRSassClient();
    const supabase = supabaseClient.getSupabaseClient();

    // Build query
    let query = supabase
      .from('feeder_refills')
      .select(`
        *,
        feeders (
          id,
          location_name,
          pincode,
          area_name
        ),
        volunteers (
          id,
          name,
          email
        )
      `)
      .order('refill_date', { ascending: false });

    // Apply filters
    if (feederId) {
      query = query.eq('feeder_id', feederId);
    }
    if (verified !== null && verified !== '') {
      query = query.eq('verified', verified === 'true');
    }
    if (volunteerId) {
      query = query.eq('refilled_by', volunteerId);
    }

    const { data: refills, error } = await query;

    if (error) {
      console.error('Error fetching refills:', error);
      return NextResponse.json({ error: 'Failed to fetch refills' }, { status: 500 });
    }

    return NextResponse.json({ refills: refills || [] });

  } catch (error) {
    console.error('Error in refills/list API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

