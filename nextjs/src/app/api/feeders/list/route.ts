import { NextRequest, NextResponse } from 'next/server';
import { createSSRSassClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status'); // Filter by status
    const pincode = searchParams.get('pincode'); // Filter by pincode

    const supabaseClient = await createSSRSassClient();
    const supabase = supabaseClient.getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Build query
    let query = supabase
      .from('feeders')
      .select(`
        *,
        volunteer_feeders (
          id,
          volunteer_id,
          role,
          is_primary,
          volunteers (
            id,
            name,
            email
          )
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters - unauthenticated users can only see active feeders (ignore status param)
    if (!user) {
      query = query.eq('status', 'active');
    } else if (status) {
      query = query.eq('status', status);
    }
    
    if (pincode) {
      query = query.eq('pincode', pincode);
    }

    const { data: feeders, error } = await query;

    if (error) {
      console.error('Error fetching feeders:', error);
      return NextResponse.json({ error: 'Failed to fetch feeders' }, { status: 500 });
    }

    return NextResponse.json({ feeders: feeders || [] });

  } catch (error) {
    console.error('Error in feeders/list API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

