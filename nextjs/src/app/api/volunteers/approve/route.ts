import { NextRequest, NextResponse } from 'next/server';
import { createSSRSassClient } from '@/lib/supabase/server';

interface ApproveRequest {
  volunteerId: string;
  status: 'approved' | 'rejected';
  rejectionReason?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ApproveRequest = await request.json();

    // Validate input
    if (!body.volunteerId || !body.status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (body.status === 'rejected' && !body.rejectionReason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Get authenticated admin user
    const supabaseClient = await createSSRSassClient();
    const supabase = supabaseClient.getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is super admin
    const SUPER_ADMIN_EMAIL = 'sujalt1811@gmail.com';
    if (user.email !== SUPER_ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Update volunteer status
    const { data: volunteer, error: updateError } = await supabase
      .from('volunteers')
      .update({
        status: body.status,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: body.rejectionReason || null
      })
      .eq('id', body.volunteerId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating volunteer:', updateError);
      return NextResponse.json(
        { error: 'Failed to update volunteer status' },
        { status: 500 }
      );
    }

    // If approved, trigger geocoding
    if (body.status === 'approved' && volunteer.pincode) {
      // Call geocoding API in background (don't wait for it)
      fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/volunteers/geocode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volunteerId: volunteer.id, pincode: volunteer.pincode })
      }).catch(err => console.error('Geocoding failed:', err));
    }

    return NextResponse.json({
      success: true,
      volunteer
    });

  } catch (error) {
    console.error('Error in approve-volunteer API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

