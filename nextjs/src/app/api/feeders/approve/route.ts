import { NextRequest, NextResponse } from 'next/server';
import { createSSRSassClient } from '@/lib/supabase/server';

interface ApproveFeederRequest {
  feederId: string;
  status: 'active' | 'rejected' | 'inactive';
  rejectionReason?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ApproveFeederRequest = await request.json();

    if (!body.feederId || !body.status) {
      return NextResponse.json(
        { error: 'Missing required fields: feederId, status' },
        { status: 400 }
      );
    }

    if (body.status === 'rejected' && !body.rejectionReason) {
      return NextResponse.json(
        { error: 'Rejection reason is required when rejecting a feeder' },
        { status: 400 }
      );
    }

    const supabaseClient = await createSSRSassClient();
    const supabase = supabaseClient.getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check super admin
    const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;
    if (!SUPER_ADMIN_EMAIL || user.email !== SUPER_ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Fetch current feeder to check existing installation_date
    const { data: existingFeeder } = await supabase
      .from('feeders')
      .select('installation_date')
      .eq('id', body.feederId)
      .single();

    // Update feeder status
    const updateData: {
      status: string;
      reviewed_by: string;
      reviewed_at: string;
      rejection_reason?: string;
      installation_date?: string;
    } = {
      status: body.status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString()
    };

    if (body.status === 'rejected') {
      updateData.rejection_reason = body.rejectionReason;
    } else if (body.status === 'active') {
      // Set installation date only if not already set
      if (!existingFeeder?.installation_date) {
        updateData.installation_date = new Date().toISOString().split('T')[0];
      }
    }

    const { data: feeder, error: updateError } = await supabase
      .from('feeders')
      .update(updateData)
      .eq('id', body.feederId)
      .select()
      .single();

    if (updateError || !feeder) {
      console.error('Error updating feeder:', updateError);
      // PGRST116 means no rows matched - feeder not found
      if (updateError?.code === 'PGRST116' || !feeder) {
        return NextResponse.json(
          { error: 'Feeder not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to update feeder status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      feeder,
      message: body.status === 'active' ? 'Feeder approved and activated!' : 'Feeder rejected.'
    });

  } catch (error) {
    console.error('Error in approve-feeder API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

