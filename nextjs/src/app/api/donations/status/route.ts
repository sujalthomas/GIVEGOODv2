/**
 * Donation Status API Route
 * 
 * Allows checking the status of a donation by order_id.
 * Used by the success page to poll for payment confirmation.
 * 
 * SECURITY NOTE: Razorpay order IDs are not designed as secrets.
 * TODO: Consider adding a cryptographically secure status_token to donations
 * table for improved security. For now, we rely on:
 * - Rate limiting to prevent enumeration attacks
 * - The fact that only the donor receives the order_id from Razorpay checkout
 * - Limited sensitive data exposure (no PII returned)
 * 
 * We use the admin client to bypass RLS since this is a legitimate use case.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerAdminClient } from '@/lib/supabase/serverAdminClient';
import { applyRateLimit } from '@/lib/security/rateLimit';

export async function GET(request: NextRequest) {
  // Apply rate limiting to prevent order_id enumeration
  const rateLimited = applyRateLimit(request, 'verification');
  if (rateLimited) return rateLimited;

  const searchParams = request.nextUrl.searchParams;
  const orderId = searchParams.get('orderId');

  if (!orderId) {
    return NextResponse.json(
      { error: 'orderId is required' },
      { status: 400 }
    );
  }

  // Validate order_id format (Razorpay order IDs start with 'order_')
  if (!orderId.startsWith('order_')) {
    return NextResponse.json(
      { error: 'Invalid order ID format' },
      { status: 400 }
    );
  }

  try {
    // Use admin client to bypass RLS
    const supabase = await createServerAdminClient();

    const { data, error } = await supabase
      .from('donations')
      .select('id, status, amount_inr, payment_id, razorpay_fee_inr, tax_amount_inr, net_amount_inr, created_at')
      .eq('order_id', orderId)
      .single();

    // Handle Supabase errors with proper distinction
    if (error) {
      // PGRST116 = "No rows returned" - this is a "not found" case
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Donation not found' },
          { status: 404 }
        );
      }
      // Any other error is a database/server issue
      console.error('Database error fetching donation status:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    // Data check (shouldn't happen after error check, but defensive)
    if (!data) {
      return NextResponse.json(
        { error: 'Donation not found' },
        { status: 404 }
      );
    }

    // Return donation status (limited data - no PII exposed)
    return NextResponse.json({
      id: data.id,
      status: data.status,
      amount_inr: data.amount_inr,
      payment_id: data.payment_id,
      razorpay_fee_inr: data.razorpay_fee_inr,
      tax_amount_inr: data.tax_amount_inr,
      net_amount_inr: data.net_amount_inr,
      created_at: data.created_at,
    });

  } catch (error) {
    console.error('Unexpected error in donation status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

