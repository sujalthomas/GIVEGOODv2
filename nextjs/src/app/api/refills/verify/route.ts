import { NextRequest, NextResponse } from 'next/server';
import { createSSRSassClient } from '@/lib/supabase/server';

interface VerifyRefillRequest {
  refillId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyRefillRequest = await request.json();

    if (!body.refillId) {
      return NextResponse.json({ error: 'Missing refill ID' }, { status: 400 });
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

    // Verify the refill
    const { data: refill, error: updateError } = await supabase
      .from('feeder_refills')
      .update({
        verified: true,
        verified_by: user.id,
        verified_at: new Date().toISOString()
      })
      .eq('id', body.refillId)
      .select()
      .single();

    if (updateError) {
      console.error('Error verifying refill:', updateError);
      // PGRST116 means no rows matched - refill not found
      if (updateError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Refill not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to verify refill' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      refill,
      message: 'Refill verified successfully!'
    });

  } catch (error) {
    console.error('Error in verify-refill API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

