import { NextRequest, NextResponse } from 'next/server';
import { createDonationOrder } from '@/lib/razorpay/client';
import { createServerAdminClient } from '@/lib/supabase/serverAdminClient';
import { applyRateLimit } from '@/lib/security/rateLimit';
import { applyCsrfProtection } from '@/lib/security/csrf';

// Request body schema
interface CreateOrderRequest {
  amount: number; // Amount in INR
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  purpose?: string;
  campaignId?: string;
  dedicationMessage?: string;
  anonymous?: boolean;
}

export async function POST(request: NextRequest) {
  // SECURITY: Apply CSRF protection
  const csrfError = applyCsrfProtection(request);
  if (csrfError) return csrfError;
  
  // SECURITY: Apply rate limiting to prevent abuse
  const rateLimited = applyRateLimit(request, 'donation');
  if (rateLimited) return rateLimited;
  
  try {
    // Parse request body
    const body: CreateOrderRequest = await request.json();

    // Validate required fields
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Validate amount limits (min ₹10, max ₹100,000)
    if (body.amount < 10) {
      return NextResponse.json(
        { error: 'Minimum donation amount is ₹10' },
        { status: 400 }
      );
    }

    if (body.amount > 100000) {
      return NextResponse.json(
        { error: 'Maximum donation amount is ₹1,00,000. Please contact us for larger donations.' },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (body.donorEmail && !isValidEmail(body.donorEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Clean and validate phone format if provided (phone is optional)
    if (body.donorPhone && typeof body.donorPhone === 'string') {
      // Remove all non-digits
      let digits = body.donorPhone.replace(/\D/g, '');
      
      // Handle various formats:
      // +919876543210 → 919876543210 (12 digits)
      // 919876543210 → 919876543210 (12 digits)
      // 09876543210 → 09876543210 (11 digits)
      // 9876543210 → 9876543210 (10 digits)
      
      // Strip leading 91 if present and results in 10 digits
      if (digits.startsWith('91') && digits.length === 12) {
        digits = digits.slice(2);
      }
      
      // Strip leading 0 if present
      if (digits.startsWith('0') && digits.length === 11) {
        digits = digits.slice(1);
      }
      
      // Accept any 10-digit number (be lenient - phone is optional)
      if (digits.length === 10) {
        body.donorPhone = `+91${digits}`;
        console.log('Phone saved: +91****' + digits.slice(-2)); // Mask PII
      } else if (digits.length > 0) {
        // Has some digits but not exactly 10 - just skip
        console.log('Skipping phone (invalid length):', digits.length, 'digits');
        body.donorPhone = undefined;
      } else {
        body.donorPhone = undefined;
      }
    } else {
      body.donorPhone = undefined;
    }

    // Create Razorpay order
    const razorpayOrder = await createDonationOrder({
      amount: body.amount,
      currency: 'INR',
      notes: {
        donor_name: body.donorName,
        donor_email: body.donorEmail,
        donor_phone: body.donorPhone,
        purpose: body.purpose || 'general',
        campaign_id: body.campaignId,
        anonymous: body.anonymous ? 'true' : 'false',
      },
    });

    // Initialize Supabase admin client (bypasses RLS for server-side donation creation)
    const supabase = await createServerAdminClient();

    // Create minimal donation record with "pending" status
    // Webhook will update this with payment details when payment is captured
    const { data: donation, error: dbError } = await supabase
      .from('donations')
      .insert({
        amount_inr: body.amount,
        currency: 'INR',
        provider: 'razorpay',
        payment_id: razorpayOrder.id, // Temporarily use order ID, webhook will update with actual payment ID
        order_id: razorpayOrder.id,
        status: 'pending',
        donor_name: body.anonymous ? null : body.donorName,
        donor_email: body.anonymous ? null : body.donorEmail,
        donor_phone: body.anonymous ? null : body.donorPhone,
        anonymous: body.anonymous || false,
        purpose: body.purpose || 'general',
        dedication_message: body.dedicationMessage,
        campaign_id: body.campaignId,
        metadata: {
          razorpay_receipt: razorpayOrder.receipt,
          expected_amount: razorpayOrder.amount, // For verification in webhook
        },
      })
      .select('id')
      .single();

    if (dbError) {
      console.error('Error creating donation record:', dbError);
      return NextResponse.json(
        { error: 'Failed to create donation record' },
        { status: 500 }
      );
    }

    // Return order details to frontend
    return NextResponse.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount, // Amount in paise
      currency: razorpayOrder.currency,
      donationId: donation?.id,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });

  } catch (error) {
    console.error('Error in create-order API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper validation functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
}

