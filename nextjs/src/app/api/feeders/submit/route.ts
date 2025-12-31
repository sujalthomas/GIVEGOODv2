import { NextRequest, NextResponse } from 'next/server';
import { createSSRSassClient } from '@/lib/supabase/server';
import type { FeederSubmission as BaseFeederSubmission } from '@/lib/types/feeder';

interface FeederSubmission extends BaseFeederSubmission {
  skipApproval?: boolean; // Admin can bypass approval
}

export async function POST(request: NextRequest) {
  try {
    const body: FeederSubmission = await request.json();

    // Validate required fields
    if (!body.location_name || !body.pincode || !body.latitude || !body.longitude) {
      return NextResponse.json(
        { error: 'Missing required fields: location_name, pincode, latitude, longitude' },
        { status: 400 }
      );
    }

    // Validate Bangalore pincode
    if (!/^560\d{3}$/.test(body.pincode)) {
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
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    // Get volunteer ID for current user
    const { data: volunteer } = await supabase
      .from('volunteers')
      .select('id, status')
      .eq('email', user.email || '')
      .eq('status', 'approved')
      .maybeSingle();

    if (!volunteer) {
      return NextResponse.json(
        { error: 'Only approved volunteers can submit feeders. Please sign up as a volunteer first.' },
        { status: 403 }
      );
    }

    // Check if user is admin for skipApproval
    const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;
    const isAdmin = SUPER_ADMIN_EMAIL && user.email === SUPER_ADMIN_EMAIL;
    const finalStatus = (body.skipApproval && isAdmin) ? 'active' : 'pending';

    // Create feeder
    const { data: feeder, error: insertError } = await supabase
      .from('feeders')
      .insert({
        location_name: body.location_name,
        pincode: body.pincode,
        area_name: body.area_name,
        landmark: body.landmark,
        latitude: body.latitude,
        longitude: body.longitude,
        capacity_kg: body.capacity_kg,
        installation_date: finalStatus === 'active' ? new Date().toISOString().split('T')[0] : body.installation_date,
        photo_url: body.photo_url,
        feeder_type: body.feeder_type || 'pvc_pipe',
        notes: body.notes,
        submitted_by: volunteer.id,
        status: finalStatus,
        reviewed_by: finalStatus === 'active' ? user.id : null,
        reviewed_at: finalStatus === 'active' ? new Date().toISOString() : null
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating feeder:', insertError);
      return NextResponse.json(
        { error: 'Failed to create feeder' },
        { status: 500 }
      );
    }

    // Auto-assign submitter as primary volunteer for this feeder
    let volunteerAssigned = true;
    const { error: assignError } = await supabase
      .from('volunteer_feeders')
      .insert({
        volunteer_id: volunteer.id,
        feeder_id: feeder.id,
        role: 'builder',
        is_primary: true
      });

    if (assignError) {
      console.error('Error assigning volunteer to feeder:', assignError);
      volunteerAssigned = false;
    }

    return NextResponse.json({
      success: true,
      feeder,
      message: 'Feeder submitted successfully! Pending admin approval.',
      volunteerAssigned
    });

  } catch (error) {
    console.error('Error in submit-feeder API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

