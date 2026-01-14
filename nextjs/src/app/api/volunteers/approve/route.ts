import { NextRequest, NextResponse } from 'next/server';
import { createSSRSassClient } from '@/lib/supabase/server';

interface ApproveRequest {
  volunteerId: string;
  status: 'approved' | 'rejected';
  rejectionReason?: string;
  feederIds?: string[];  // Optional array of feeder IDs to assign
  role?: 'builder' | 'refiller' | 'maintainer';  // Default: 'refiller'
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
    const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;
    if (!SUPER_ADMIN_EMAIL || user.email !== SUPER_ADMIN_EMAIL) {
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
      // Derive base URL from server-only env var or request headers (not NEXT_PUBLIC_ which is exposed to browser)
      const baseUrl = process.env.SITE_URL || request.headers.get('origin') || 'http://localhost:3000';
      // Call geocoding API in background (don't wait for it)
      fetch(`${baseUrl}/api/volunteers/geocode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volunteerId: volunteer.id, pincode: volunteer.pincode })
      }).catch(err => console.error('Geocoding failed:', err));
    }

    // If approved and feeders are provided, assign volunteer to feeders
    let feedersAssigned = 0;
    if (body.status === 'approved' && body.feederIds && body.feederIds.length > 0) {
      const role = body.role || 'refiller';
      
      // Build assignment records
      const assignments = body.feederIds.map((feederId, index) => ({
        volunteer_id: body.volunteerId,
        feeder_id: feederId,
        role: role,
        is_primary: index === 0  // First feeder is primary
      }));

      // Insert assignments (ignore duplicates)
      const { data: inserted, error: assignError } = await supabase
        .from('volunteer_feeders')
        .upsert(assignments, { 
          onConflict: 'volunteer_id,feeder_id',
          ignoreDuplicates: true 
        })
        .select();

      if (assignError) {
        console.error('Error assigning feeders to volunteer:', assignError);
        // Don't fail the approval, just log the error
      } else {
        feedersAssigned = inserted?.length || body.feederIds.length;
      }
    }

    return NextResponse.json({
      success: true,
      volunteer,
      feedersAssigned
    });

  } catch (error) {
    console.error('Error in approve-volunteer API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

