import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, fetchPaymentDetails, extractUPIReference, paiseToRupees, RazorpayPayment } from '@/lib/razorpay/client';
import { createServerClient } from '@supabase/ssr';
import { applyRateLimit } from '@/lib/security/rateLimit';

// Disable body parsing to get raw body for signature verification
export const runtime = 'nodejs';

interface RazorpayPaymentEntity {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  method: string;
  captured: boolean;
  email: string | null;
  contact: string | null;
  notes: Record<string, string>;
  created_at: number;
  error_reason?: string;
  vpa?: string;
  bank?: string;
  wallet?: string;
}

interface RazorpayWebhookEvent {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment: {
      entity: RazorpayPaymentEntity;
    };
  };
  created_at: number;
}

export async function POST(request: NextRequest) {
  // SECURITY: Apply rate limiting (high limit for webhooks to allow Razorpay retries)
  const rateLimited = applyRateLimit(request, 'webhook');
  if (rateLimited) return rateLimited;
  
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    console.log('Webhook received - signature present:', !!signature);

    if (!signature) {
      console.error('Missing Razorpay signature header');
      return NextResponse.json(
        { error: 'Missing signature header' },
        { status: 400 }
      );
    }

    // SECURITY: Always verify webhook signature - NEVER skip this
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('❌ CRITICAL: RAZORPAY_WEBHOOK_SECRET is not configured');
      // Return 500 so Razorpay retries later when config is fixed
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Verify webhook signature - this is mandatory for security
    const isValidSignature = verifyWebhookSignature(rawBody, signature);

    if (!isValidSignature) {
      console.error('❌ Invalid Razorpay webhook signature - possible attack attempt');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    console.log('✅ Webhook signature verified successfully');

    // Parse webhook event
    const event: RazorpayWebhookEvent = JSON.parse(rawBody);

    console.log('Razorpay webhook received:', {
      event: event.event,
      payment_id: event.payload?.payment?.entity?.id,
      order_id: event.payload?.payment?.entity?.order_id,
    });

    // Initialize Supabase client (server-side)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.PRIVATE_SUPABASE_SERVICE_KEY!,
      {
        cookies: {
          get: () => undefined,
          set: () => {},
          remove: () => {},
        },
      }
    );

    // Handle different webhook events
    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event, supabase);
        break;

      case 'payment.failed':
        await handlePaymentFailed(event, supabase);
        break;

      case 'payment.authorized':
        await handlePaymentAuthorized(event, supabase);
        break;

      case 'order.paid':
        // This event fires after payment.captured, can be used as backup
        console.log('Order paid event received:', event.payload.payment.entity.order_id);
        break;

      default:
        console.log('Unhandled webhook event:', event.event);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ status: 'success' });

  } catch (error) {
    console.error('❌ Error processing Razorpay webhook:', error);
    // Return 500 for transient errors so Razorpay will retry
    // Only return 200 for permanent errors that won't be fixed by retrying
    return NextResponse.json(
      { status: 'error', message: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentCaptured(
  event: RazorpayWebhookEvent, 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
) {
  const paymentEntity = event.payload.payment.entity;
  const paymentId = paymentEntity.id;
  const orderId = paymentEntity.order_id;

  console.log('Processing payment.captured for:', { paymentId, orderId });

  // STEP 1: Idempotency Check - Prevent duplicate processing
  const { data: existingByPayment } = await supabase
    .from('donations')
    .select('id, status, payment_id')
    .eq('payment_id', paymentId)
    .single();

  if (existingByPayment?.status === 'completed') {
    console.log('✅ Payment already processed (by payment_id):', paymentId);
    return;
  }

  // Check if this specific event was already processed
  const { data: existingByEvent } = await supabase
    .from('donations')
    .select('id, razorpay_event_id')
    .eq('razorpay_event_id', event.entity)
    .single();

  if (existingByEvent) {
    console.log('✅ Event already processed (by event_id):', event.entity);
    return;
  }

  // STEP 2: Find donation by order_id
  const { data: donation, error: findError } = await supabase
    .from('donations')
    .select('*')
    .eq('order_id', orderId)
    .single();

  if (findError || !donation) {
    console.error('❌ Donation not found for order:', orderId);
    // Create a new donation record from webhook data (fallback scenario)
    const { error: insertError } = await supabase
      .from('donations')
      .insert({
        payment_id: paymentId,
        order_id: orderId,
        amount_inr: paiseToRupees(paymentEntity.amount),
        currency: paymentEntity.currency,
        provider: 'razorpay',
        status: 'completed',
        payment_method: paymentEntity.method,
        donor_email: paymentEntity.email || null,
        donor_phone: paymentEntity.contact || null,
        razorpay_event_id: event.entity,
        webhook_received_at: new Date(event.created_at * 1000).toISOString(),
        metadata: {
          source: 'webhook_fallback',
          payment_entity: paymentEntity,
          webhook_event: event.event,
        },
      });

    if (insertError) {
      console.error('❌ Error creating donation from webhook:', insertError);
    } else {
      console.log('✅ Created new donation from webhook:', paymentId);
    }
    return;
  }

  // STEP 3: Amount Verification (Anti-fraud measure)
  const expectedAmount = donation.metadata?.expected_amount;
  const actualAmount = paymentEntity.amount;

  if (expectedAmount && actualAmount !== expectedAmount) {
    console.error('❌ Amount mismatch!', {
      expected: expectedAmount,
      actual: actualAmount,
      orderId,
      paymentId,
    });
    // Mark as failed due to amount mismatch
    await supabase
      .from('donations')
      .update({
        status: 'failed',
        metadata: {
          ...(typeof donation.metadata === 'object' && donation.metadata !== null ? donation.metadata : {}),
          error: 'amount_mismatch',
          expected_amount: expectedAmount,
          actual_amount: actualAmount,
        },
      })
      .eq('id', donation.id);
    return;
  }

  // STEP 4: Fetch full payment details from Razorpay (includes expanded data)
  let fullPaymentDetails;
  try {
    fullPaymentDetails = await fetchPaymentDetails(paymentId);
  } catch (error) {
    console.error('Error fetching payment details in webhook:', error);
    fullPaymentDetails = paymentEntity; // Fallback to webhook data
  }

  // Extract UPI reference if available
  const upiReference = extractUPIReference(fullPaymentDetails);

  // Extract fee information for transparency
  // Note: fee and tax are only available when fetching full payment details from API
  const paymentDetails = fullPaymentDetails as RazorpayPayment;
  const totalFee = paymentDetails.fee || 0; // Total fee in paisa
  const taxAmount = paymentDetails.tax || 0; // GST in paisa
  const platformFee = totalFee - taxAmount; // Razorpay fee (before GST)
  
  const amountInRupees = paiseToRupees(paymentEntity.amount);
  const feeInRupees = paiseToRupees(platformFee);
  const taxInRupees = paiseToRupees(taxAmount);
  const netAmount = amountInRupees - paiseToRupees(totalFee); // What charity receives

  console.log('💰 Fee Breakdown:', {
    grossAmount: amountInRupees,
    platformFee: feeInRupees,
    gst: taxInRupees,
    totalFee: paiseToRupees(totalFee),
    netAmount: netAmount,
  });

  // STEP 5: Update donation to "completed" status
  const { error: updateError } = await supabase
    .from('donations')
    .update({
      payment_id: paymentId,
      status: 'completed',
      payment_method: paymentEntity.method,
      upi_reference: upiReference,
      razorpay_fee_inr: feeInRupees,
      tax_amount_inr: taxInRupees,
      net_amount_inr: netAmount,
      payment_method_details: {
        method: paymentEntity.method,
        email: paymentEntity.email,
        contact: paymentEntity.contact,
        vpa: fullPaymentDetails.vpa,
        bank: fullPaymentDetails.bank,
        wallet: fullPaymentDetails.wallet,
      },
      razorpay_event_id: event.entity,
      webhook_received_at: new Date(event.created_at * 1000).toISOString(),
      metadata: {
        ...(typeof donation.metadata === 'object' && donation.metadata !== null ? donation.metadata : {}),
        payment_id: fullPaymentDetails.id,
        payment_method: fullPaymentDetails.method,
        fee_breakdown: {
          total_fee_paisa: totalFee,
          platform_fee_paisa: platformFee,
          gst_paisa: taxAmount,
          net_amount_inr: netAmount,
        },
        payment_status: fullPaymentDetails.status,
        webhook_event: event.event,
        captured_at: new Date().toISOString(),
      },
    })
    .eq('id', donation.id);

  if (updateError) {
    console.error('❌ Error updating donation:', updateError);
  } else {
    console.log('✅ Payment captured successfully:', paymentId);
  }
}

async function handlePaymentFailed(
  event: RazorpayWebhookEvent, 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
) {
  const paymentEntity = event.payload.payment.entity;
  const orderId = paymentEntity.order_id;

  const { error } = await supabase
    .from('donations')
    .update({
      status: 'failed',
      payment_id: paymentEntity.id,
      razorpay_event_id: event.entity,
      webhook_received_at: new Date(event.created_at * 1000).toISOString(),
      metadata: {
        failure_reason: paymentEntity.error_reason || 'Payment failed',
        webhook_event: event.event,
      },
    })
    .eq('order_id', orderId);

  if (error) {
    console.error('Error updating failed payment:', error);
  } else {
    console.log('Payment failed:', paymentEntity.id);
  }
}

async function handlePaymentAuthorized(
  event: RazorpayWebhookEvent, 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
) {
  const paymentEntity = event.payload.payment.entity;
  const orderId = paymentEntity.order_id;

  const { error } = await supabase
    .from('donations')
    .update({
      status: 'authorized',
      payment_id: paymentEntity.id,
      payment_method: paymentEntity.method,
      razorpay_event_id: event.entity,
      webhook_received_at: new Date(event.created_at * 1000).toISOString(),
    })
    .eq('order_id', orderId);

  if (error) {
    console.error('Error updating authorized payment:', error);
  } else {
    console.log('Payment authorized:', paymentEntity.id);
  }
}

