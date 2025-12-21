import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay instance (server-side only)
export function getRazorpayInstance() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials not configured');
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// Types for better TypeScript support
export interface DonationOrderParams {
  amount: number; // Amount in rupees (will be converted to paise)
  currency?: string;
  receipt?: string;
  notes?: {
    donor_name?: string;
    donor_email?: string;
    donor_phone?: string;
    purpose?: string;
    campaign_id?: string;
    [key: string]: string | undefined;
  };
}

export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number; // Amount in paise
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string | null;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

export interface RazorpayPayment {
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
  fee?: number; // Total fee charged by Razorpay (in paisa)
  tax?: number; // GST on the fee (in paisa)
  vpa?: string; // UPI VPA
  upi?: {
    payer_account_type: string;
    vpa: string;
  };
  bank?: string;
  wallet?: string;
  card_id?: string;
}

/**
 * Create a Razorpay order for donation
 */
export async function createDonationOrder(
  params: DonationOrderParams
): Promise<RazorpayOrder> {
  const razorpay = getRazorpayInstance();

  // Convert rupees to paise (Razorpay uses paise)
  const amountInPaise = Math.round(params.amount * 100);

  // Generate receipt ID
  const receipt = params.receipt || `donation_${Date.now()}`;

  const options = {
    amount: amountInPaise,
    currency: params.currency || 'INR',
    receipt,
    notes: params.notes || {},
  };

  try {
    // @ts-expect-error - Razorpay SDK types are incompatible with custom notes structure
    const order = await razorpay.orders.create(options);
    return order as unknown as RazorpayOrder;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw new Error('Failed to create payment order');
  }
}

/**
 * Fetch payment details by payment ID
 */
export async function fetchPaymentDetails(
  paymentId: string
): Promise<RazorpayPayment> {
  const razorpay = getRazorpayInstance();

  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment as unknown as RazorpayPayment;
  } catch (error) {
    console.error('Error fetching payment details:', error);
    throw new Error('Failed to fetch payment details');
  }
}

/**
 * Verify payment signature (for client-side payment verification)
 * This is used after payment completion on the frontend
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  try {
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    return generatedSignature === signature;
  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return false;
  }
}

/**
 * Verify webhook signature
 * Razorpay sends webhooks with signature in headers
 * 
 * @param webhookBody - Raw request body as string
 * @param signature - Signature from x-razorpay-signature header
 * @param secret - Webhook secret (pass validated secret to avoid race conditions)
 */
export function verifyWebhookSignature(
  webhookBody: string,
  signature: string,
  secret?: string
): boolean {
  try {
    // Use passed secret or fall back to env (for backward compatibility)
    const webhookSecret = secret || process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('Webhook secret not provided');
      return false;
    }
    
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(webhookBody)
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Extract UPI reference from payment object
 */
export function extractUPIReference(payment: RazorpayPayment): string | null {
  if (payment.method === 'upi') {
    return payment.vpa || payment.upi?.vpa || null;
  }
  return null;
}

/**
 * Get payment method details as string
 */
export function getPaymentMethodString(payment: RazorpayPayment): string {
  const method = payment.method;
  
  if (method === 'upi' && payment.vpa) {
    return `UPI (${payment.vpa})`;
  }
  if (method === 'netbanking' && payment.bank) {
    return `Netbanking (${payment.bank})`;
  }
  if (method === 'wallet' && payment.wallet) {
    return `Wallet (${payment.wallet})`;
  }
  if (method === 'card') {
    return 'Card';
  }
  
  return method || 'Unknown';
}

/**
 * Format amount from paise to rupees
 */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/**
 * Format amount from rupees to paise
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

