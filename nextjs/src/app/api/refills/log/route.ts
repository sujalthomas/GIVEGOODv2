import { NextRequest, NextResponse } from 'next/server';
import { createSSRSassClient } from '@/lib/supabase/server';

interface LogRefillRequest {
  feeder_id: string;
  food_quantity_kg: number;
  food_type?: string;
  photo_url?: string;
  notes?: string;
  feeder_condition?: string;
  verifyImmediately?: boolean; // Admin can skip verification
}

export async function POST(request: NextRequest) {
  try {
    const body: LogRefillRequest = await request.json();

    // Validate required fields
    if (!body.feeder_id || !body.food_quantity_kg) {
      return NextResponse.json(
        { error: 'Missing required fields: feeder_id, food_quantity_kg' },
        { status: 400 }
      );
    }

    // Validate food quantity
    if (body.food_quantity_kg <= 0 || body.food_quantity_kg > 100) {
      return NextResponse.json(
        { error: 'Food quantity must be between 0 and 100 kg' },
        { status: 400 }
      );
    }

    const supabaseClient = await createSSRSassClient();
    const supabase = supabaseClient.getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - Please login' }, { status: 401 });
    }

    // Get volunteer ID
    const { data: volunteer } = await supabase
      .from('volunteers')
      .select('id, status')
      .eq('email', user.email || '')
      .eq('status', 'approved')
      .maybeSingle();

    if (!volunteer) {
      return NextResponse.json(
        { error: 'Only approved volunteers can log refills' },
        { status: 403 }
      );
    }

    // Check if volunteer is assigned to this feeder
    const { data: assignment } = await supabase
      .from('volunteer_feeders')
      .select('*')
      .eq('volunteer_id', volunteer.id)
      .eq('feeder_id', body.feeder_id)
      .maybeSingle();

    // Auto-assign if not already assigned (flexibility)
    if (!assignment) {
      const { error: assignError } = await supabase
        .from('volunteer_feeders')
        .insert({
          volunteer_id: volunteer.id,
          feeder_id: body.feeder_id,
          role: 'refiller'
        });
      if (assignError) {
        console.warn('Auto-assignment failed:', assignError);
        // Continue - not critical for refill logging
      }
    }

    // Check if user is admin for verifyImmediately
    const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;
    const isAdmin = SUPER_ADMIN_EMAIL && user.email === SUPER_ADMIN_EMAIL;
    const shouldVerify = !!(body.verifyImmediately && isAdmin);

    // Log the refill
    const { data: refill, error: insertError } = await supabase
      .from('feeder_refills')
      .insert({
        feeder_id: body.feeder_id,
        refilled_by: volunteer.id,
        food_quantity_kg: body.food_quantity_kg,
        food_type: body.food_type || 'dry_kibble',
        photo_url: body.photo_url,
        notes: body.notes,
        feeder_condition: body.feeder_condition || 'good',
        verified: shouldVerify,
        verified_by: shouldVerify ? user.id : null,
        verified_at: shouldVerify ? new Date().toISOString() : null
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error logging refill:', insertError);
      return NextResponse.json(
        { error: 'Failed to log refill' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      refill,
      message: 'Refill logged successfully! Pending admin verification.'
    });

  } catch (error) {
    console.error('Error in log-refill API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

