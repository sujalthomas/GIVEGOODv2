import { NextResponse } from 'next/server';
import { createSSRSassClient } from '@/lib/supabase/server';
import bangalorePincodes from '@/lib/maps/bangalore-pincodes.json';

export async function GET() {
  try {
    const supabaseClient = await createSSRSassClient();
    const supabase = supabaseClient.getSupabaseClient();

    // Get total approved volunteers
    const { count: volunteerCount } = await supabase
      .from('volunteers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');

    // Get total active feeders
    const { count: feederCount } = await supabase
      .from('feeders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Get unique pincodes (areas covered)
    const { data: uniquePincodes } = await supabase
      .from('feeders')
      .select('pincode')
      .eq('status', 'active');

    const areasCount = uniquePincodes 
      ? new Set(uniquePincodes.map((f: { pincode: string }) => f.pincode)).size 
      : 0;

    // Coverage calculation based on actual pincode database
    const totalBangalorePincodes = Object.keys(bangalorePincodes).length;
    const coveragePercent = Math.round((areasCount / totalBangalorePincodes) * 100);

    return NextResponse.json({
      volunteers: volunteerCount || 0,
      feeders: feederCount || 0,
      areas: areasCount,
      coverage: coveragePercent
    });

  } catch (error) {
    console.error('Error fetching map stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

