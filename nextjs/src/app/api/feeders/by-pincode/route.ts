import { NextRequest, NextResponse } from 'next/server';
import { createSSRSassClient } from '@/lib/supabase/server';

interface FeederWithVolunteerCount {
  id: string;
  location_name: string;
  area_name: string | null;
  pincode: string;
  status: string;
  latitude: number;
  longitude: number;
  volunteer_count: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pincode = searchParams.get('pincode');

    if (!pincode) {
      return NextResponse.json(
        { error: 'Missing required parameter: pincode' },
        { status: 400 }
      );
    }

    // Validate Bangalore pincode format
    if (!/^560\d{3}$/.test(pincode)) {
      return NextResponse.json(
        { error: 'Invalid Bangalore pincode. Must start with 560' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabaseClient = await createSSRSassClient();
    const supabase = supabaseClient.getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check super admin
    const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;
    if (!SUPER_ADMIN_EMAIL || user.email !== SUPER_ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Fetch active feeders for this pincode
    const { data: feeders, error: feedersError } = await supabase
      .from('feeders')
      .select('id, location_name, area_name, pincode, status, latitude, longitude')
      .eq('pincode', pincode)
      .eq('status', 'active')
      .order('location_name', { ascending: true });

    if (feedersError) {
      console.error('Error fetching feeders:', feedersError);
      return NextResponse.json(
        { error: 'Failed to fetch feeders' },
        { status: 500 }
      );
    }

    // Get volunteer counts for each feeder
    const feederIds = (feeders || []).map(f => f.id);
    
    const volunteerCounts: Record<string, number> = {};
    if (feederIds.length > 0) {
      const { data: assignments } = await supabase
        .from('volunteer_feeders')
        .select('feeder_id')
        .in('feeder_id', feederIds);

      // Count volunteers per feeder
      (assignments || []).forEach(a => {
        volunteerCounts[a.feeder_id] = (volunteerCounts[a.feeder_id] || 0) + 1;
      });
    }

    // Combine feeders with volunteer counts
    const feedersWithCounts: FeederWithVolunteerCount[] = (feeders || []).map(f => ({
      ...f,
      volunteer_count: volunteerCounts[f.id] || 0
    }));

    return NextResponse.json({
      success: true,
      feeders: feedersWithCounts,
      total: feedersWithCounts.length
    });

  } catch (error) {
    console.error('Error in feeders-by-pincode API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
