import { NextRequest, NextResponse } from 'next/server';
import { createDonationOrder } from '@/lib/razorpay/client';
import { createSPASassClient } from '@/lib/supabase/client';

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

    // Validate phone format if provided (strip spaces and dashes first)
    if (body.donorPhone && body.donorPhone.trim()) {
      const cleanedPhone = body.donorPhone.replace(/[\s-]/g, ''); // Remove spaces and dashes
      if (!isValidPhone(cleanedPhone)) {
        return NextResponse.json(
          { error: 'Invalid phone format. Use 10-digit Indian mobile number' },
          { status: 400 }
        );
      }
      // Update body with cleaned phone
      body.donorPhone = cleanedPhone;
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

    // Initialize Supabase client
    const supabaseClient = await createSPASassClient();
    const supabase = supabaseClient.getSupabaseClient();

    // Get current user if authenticated
    const { data: { user } } = await supabase.auth.getUser();

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
        created_by: user?.id,
        metadata: {
          razorpay_receipt: razorpayOrder.receipt,
          expected_amount: razorpayOrder.amount, // For verification in webhook
        },
      })
      .select()
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
      donationId: donation.id,
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

function isValidPhone(phone: string): boolean {
  // Accepts formats: +91XXXXXXXXXX or XXXXXXXXXX (10 digits)
  const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
  return phoneRegex.test(phone);
}

