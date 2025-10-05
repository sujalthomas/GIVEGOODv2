# Razorpay Payment Integration - Complete Implementation Guide

A comprehensive guide for implementing Razorpay payment gateway in a Next.js application with webhook verification and order management.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Installation](#installation)
4. [Architecture Overview](#architecture-overview)
5. [Step-by-Step Implementation](#step-by-step-implementation)
6. [Webhook Configuration](#webhook-configuration)
7. [Testing](#testing)
8. [Security Best Practices](#security-best-practices)

---

## Prerequisites

Before implementing Razorpay integration, ensure you have:

- **Razorpay Account**: Sign up at [razorpay.com](https://razorpay.com)
- **API Keys**: Get your `Key ID` and `Key Secret` from Dashboard → Settings → API Keys
- **Webhook Secret**: Generate from Dashboard → Settings → Webhooks
- **Node.js**: Version 18+ recommended
- **Database**: MongoDB for storing orders
- **Email Service**: Optional - for sending confirmations (Mailtrap for testing)

---

## Environment Setup

Create a `.env.local` file in your project root with the following variables:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx

# Database
MONGODB_URI=mongodb://localhost:27017/your-db-name

# NextAuth (for authentication)
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# Email Service (Optional - for order confirmations)
MAILTRAP_USER=your_mailtrap_user
MAILTRAP_PASS=your_mailtrap_password
```

⚠️ **Important**: 
- `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` should NEVER be exposed to the client
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` is the only Razorpay variable that should be public

---

## Installation

Install required dependencies:

```bash
npm install razorpay mongoose nodemailer
npm install --save-dev @types/nodemailer
```

**Dependencies**:
- `razorpay`: Official Razorpay Node.js SDK
- `mongoose`: MongoDB ODM for order management
- `nodemailer`: For sending email confirmations

---

## Architecture Overview

The payment flow consists of 4 main components:

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌──────────────┐
│   Client    │─────▶│   Backend   │─────▶│  Razorpay   │─────▶│   Webhook    │
│  (Browser)  │      │  API Route  │      │   Server    │      │  Handler     │
└─────────────┘      └─────────────┘      └─────────────┘      └──────────────┘
      │                     │                     │                     │
      │  1. Create Order    │  2. Create Order    │  3. Payment Event   │
      │  Request            │  in Razorpay        │  Notification       │
      │────────────────────▶│────────────────────▶│────────────────────▶│
      │                     │                     │                     │
      │  4. Open Payment    │                     │                     │
      │  Modal              │                     │                     │
      │◀────────────────────│                     │                     │
      │                     │                     │                     │
      │                     │  5. Verify & Update │                     │
      │                     │  Order Status       │                     │
      │                     │◀────────────────────────────────────────────│
```

---

## Step-by-Step Implementation

### Step 1: Database Models

Create the Order model to track payment status:

**File**: `models/Order.ts`

```typescript
import mongoose, { Schema, model, models } from "mongoose";

export interface IOrder {
  _id?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  variant: {
    type: string;
    price: number;
    license: "personal" | "commercial";
  };
  razorpayOrderId: string;        // Razorpay order ID
  razorpayPaymentId?: string;     // Razorpay payment ID (after payment)
  amount: number;
  status: "pending" | "completed" | "failed";
  createdAt?: Date;
  updatedAt?: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variant: {
      type: { type: String, required: true },
      price: { type: Number, required: true },
      license: { type: String, required: true, enum: ["personal", "commercial"] },
    },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String },
    amount: { type: Number, required: true },
    status: {
      type: String,
      required: true,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Order = models?.Order || model<IOrder>("Order", orderSchema);
export default Order;
```

**Key Points**:
- `razorpayOrderId`: Stored immediately when order is created
- `razorpayPaymentId`: Updated via webhook after successful payment
- `status`: Tracks order lifecycle (pending → completed/failed)

---

### Step 2: Load Razorpay Checkout Script

Add the Razorpay checkout script to your root layout:

**File**: `app/layout.tsx`

```typescript
import Script from "next/script";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Load Razorpay SDK */}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
        {children}
      </body>
    </html>
  );
}
```

**Why `lazyOnload`?**
- Doesn't block page rendering
- Loads after page becomes interactive
- Saves bandwidth for users who don't make purchases

---

### Step 3: Create Order API Route

This backend route initializes a Razorpay order and stores it in your database.

**File**: `app/api/orders/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Razorpay from "razorpay";
import Order from "@/models/Order";
import { connectToDatabase } from "@/lib/db";

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    // 1. Verify user authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse request body
    const { productId, variant } = await req.json();
    await connectToDatabase();

    // 3. Create Razorpay order
    const order = await razorpay.orders.create({
      amount: Math.round(variant.price * 100), // Convert to paise (INR) or cents (USD)
      currency: "USD",                          // or "INR"
      receipt: `receipt_${Date.now()}`,        // Unique receipt identifier
      notes: {
        productId: productId.toString(),       // Store metadata
      },
    });

    // 4. Store order in database with "pending" status
    const newOrder = await Order.create({
      userId: session.user.id,
      productId,
      variant,
      razorpayOrderId: order.id,
      amount: variant.price,
      status: "pending",
    });

    // 5. Return order details to client
    return NextResponse.json({
      orderId: order.id,                       // Razorpay order ID
      amount: order.amount,
      currency: order.currency,
      dbOrderId: newOrder._id,                 // Database order ID
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
```

**Critical Points**:
- **Amount Conversion**: Razorpay expects amounts in the smallest currency unit (paise for INR, cents for USD)
  - ₹10.00 → 1000 paise
  - $10.00 → 1000 cents
- **Receipt**: Should be unique for each order (used for reconciliation)
- **Notes**: Optional metadata that appears in Razorpay dashboard

---

### Step 4: Client-Side Payment Integration

Integrate Razorpay checkout on your product/checkout page:

**File**: `app/products/[id]/page.tsx`

```typescript
"use client";

import { useSession } from "next-auth/react";
import { apiClient } from "@/lib/api-client";

export default function ProductPage() {
  const { data: session } = useSession();

  const handlePurchase = async (variant: ImageVariant) => {
    // 1. Check authentication
    if (!session) {
      alert("Please login to make a purchase");
      return;
    }

    try {
      // 2. Create order via API
      const { orderId, amount } = await apiClient.createOrder({
        productId: product._id,
        variant,
      });

      // 3. Configure Razorpay checkout options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,  // Public key
        amount,                                          // Amount in paise/cents
        currency: "USD",
        name: "ImageKit Shop",                           // Your business name
        description: `${product.name} - ${variant.type} Version`,
        order_id: orderId,                               // Razorpay order ID from step 2
        
        // Success handler
        handler: function (response: any) {
          // Payment successful - Razorpay returns:
          // - response.razorpay_order_id
          // - response.razorpay_payment_id
          // - response.razorpay_signature
          
          // Webhook will handle verification, just redirect user
          alert("Payment successful!");
          window.location.href = "/orders";
        },
        
        // Pre-fill user data
        prefill: {
          email: session.user.email,
        },
        
        // Theme customization
        theme: {
          color: "#3399cc"
        }
      };

      // 4. Open Razorpay checkout modal
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
      
    } catch (error) {
      console.error(error);
      alert("Payment failed");
    }
  };

  return (
    <button onClick={() => handlePurchase(selectedVariant)}>
      Buy Now
    </button>
  );
}
```

**Important Notes**:
- **Don't verify payment on client**: Client-side verification can be tampered with
- **Use webhooks**: Always verify payment status server-side via webhooks
- **Handler function**: Only use for UX (redirects, success messages), not for business logic

---

### Step 5: Webhook Handler (Critical!)

The webhook verifies payment authenticity and updates order status.

**File**: `app/api/webhook/razorpay/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import Order from "@/models/Order";
import { connectToDatabase } from "@/lib/db";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    // 1. Get raw request body (required for signature verification)
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    // 2. Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // 3. Parse event data
    const event = JSON.parse(body);
    await connectToDatabase();

    // 4. Handle payment.captured event
    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;

      // 5. Update order in database
      const order = await Order.findOneAndUpdate(
        { razorpayOrderId: payment.order_id },
        {
          razorpayPaymentId: payment.id,
          status: "completed",
        }
      ).populate([
        { path: "userId", select: "email" },
        { path: "productId", select: "name" },
      ]);

      // 6. Send confirmation email (optional)
      if (order) {
        const transporter = nodemailer.createTransport({
          host: "sandbox.smtp.mailtrap.io",
          port: 2525,
          auth: {
            user: process.env.MAILTRAP_USER,
            pass: process.env.MAILTRAP_PASS,
          },
        });

        await transporter.sendMail({
          from: '"ImageKit Shop" <noreply@imagekitshop.com>',
          to: order.userId.email,
          subject: "Payment Confirmation - ImageKit Shop",
          text: `
Thank you for your purchase!

Order Details:
- Order ID: ${order._id.toString().slice(-6)}
- Product: ${order.productId.name}
- Version: ${order.variant.type}
- License: ${order.variant.license}
- Price: $${order.amount.toFixed(2)}

Your image is now available in your orders page.
Thank you for shopping with ImageKit Shop!
          `.trim(),
        });
      }
    }

    // 7. Respond to Razorpay
    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
```

**Security Deep Dive**:

#### Signature Verification
Razorpay sends a signature in the `x-razorpay-signature` header. You must verify it:

```typescript
// What Razorpay does:
signature = HMAC_SHA256(webhook_secret, request_body)

// What you do:
expectedSignature = HMAC_SHA256(YOUR_WEBHOOK_SECRET, request_body)

if (signature === expectedSignature) {
  // Request is authentic
} else {
  // Request is forged - reject it
}
```

**Why this matters**:
- Prevents attackers from sending fake payment notifications
- Ensures only Razorpay can trigger order completion
- Critical for financial security

---

## Webhook Configuration

### Step 1: Set Up Webhook in Razorpay Dashboard

1. Go to **Razorpay Dashboard** → **Settings** → **Webhooks**
2. Click **Add New Webhook**
3. Enter your webhook URL:
   - **Development**: Use [ngrok](https://ngrok.com) to expose localhost
     ```bash
     ngrok http 3000
     # Use URL: https://abc123.ngrok.io/api/webhook/razorpay
     ```
   - **Production**: `https://yourdomain.com/api/webhook/razorpay`
4. Select **Active Events**:
   - ☑️ `payment.captured`
   - ☑️ `payment.failed` (optional but recommended)
5. Enter **Secret** (auto-generated or custom)
6. Save and copy the webhook secret to your `.env.local`

### Step 2: Test Webhook Locally

Use ngrok for local testing:

```bash
# Terminal 1: Start your Next.js app
npm run dev

# Terminal 2: Start ngrok tunnel
ngrok http 3000

# Copy the ngrok URL (e.g., https://abc123.ngrok.io)
# Add it to Razorpay Dashboard as: https://abc123.ngrok.io/api/webhook/razorpay
```

### Step 3: Webhook Events Reference

| Event | Trigger | Use Case |
|-------|---------|----------|
| `payment.captured` | Payment successful | Update order status, grant access, send email |
| `payment.failed` | Payment failed | Mark order as failed, notify user |
| `order.paid` | Order fully paid | Alternative to payment.captured |
| `refund.created` | Refund initiated | Handle refund logic |

**Recommended Event**: `payment.captured` (most reliable for order completion)

---

## Testing

### Test Mode

Razorpay provides test credentials for development:

1. Use test API keys (start with `rzp_test_`)
2. Use test payment methods:
   - **Card**: `4111 1111 1111 1111`
   - **CVV**: Any 3 digits
   - **Expiry**: Any future date
   - **OTP**: Any 6 digits (for test mode)

### Testing Checklist

- [ ] Order creation succeeds
- [ ] Payment modal opens with correct details
- [ ] Successful payment triggers webhook
- [ ] Order status updates to "completed"
- [ ] Email confirmation sent (if implemented)
- [ ] Failed payment is handled gracefully
- [ ] Signature verification works
- [ ] Invalid signatures are rejected

### Webhook Testing Tool

Test webhooks manually in Razorpay Dashboard:
1. Go to **Webhooks** → Select your webhook
2. Click **Send Test Webhook**
3. Choose event type (e.g., `payment.captured`)
4. Check your server logs

---

## Security Best Practices

### 1. Environment Variables
```bash
# ✅ DO: Keep secrets server-side only
RAZORPAY_KEY_SECRET=secret_xyz
RAZORPAY_WEBHOOK_SECRET=secret_abc

# ✅ DO: Only expose public keys
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_123

# ❌ DON'T: Never expose secrets in client
NEXT_PUBLIC_RAZORPAY_KEY_SECRET=secret_xyz  # WRONG!
```

### 2. Always Verify Signatures
```typescript
// ❌ DON'T: Trust webhook data without verification
const event = await req.json();
updateOrder(event.payload);  // DANGEROUS!

// ✅ DO: Always verify signature first
const signature = req.headers.get("x-razorpay-signature");
if (signature !== expectedSignature) {
  return NextResponse.json({ error: "Invalid" }, { status: 400 });
}
```

### 3. Use HTTPS in Production
- Webhooks should ONLY be sent to HTTPS endpoints
- Razorpay enforces this for production mode

### 4. Idempotency
Handle duplicate webhook deliveries:

```typescript
const existingOrder = await Order.findOne({ 
  razorpayPaymentId: payment.id 
});

if (existingOrder?.status === "completed") {
  // Already processed, skip
  return NextResponse.json({ received: true });
}

// Otherwise, process it
await Order.updateOne(...);
```

### 5. Amount Verification
```typescript
// Verify amount hasn't been tampered with
const order = await Order.findOne({ razorpayOrderId: payment.order_id });
const expectedAmount = Math.round(order.amount * 100);

if (payment.amount !== expectedAmount) {
  // Amount mismatch - potential fraud
  console.error("Amount mismatch!");
  return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
}
```

---

## Common Issues & Solutions

### Issue 1: Webhook not receiving events
**Solution**:
- Check webhook URL is correct and accessible
- Verify HTTPS in production
- Check firewall settings
- Use ngrok for local testing

### Issue 2: Signature verification fails
**Solution**:
- Ensure you're using raw request body (not parsed JSON)
- Verify webhook secret is correct
- Check for trailing whitespace in `.env.local`

### Issue 3: Order status not updating
**Solution**:
- Check MongoDB connection
- Verify `razorpayOrderId` matches
- Add logging to webhook handler
- Test webhook manually from Razorpay Dashboard

### Issue 4: Payment modal not opening
**Solution**:
- Verify Razorpay script is loaded
- Check browser console for errors
- Ensure `NEXT_PUBLIC_RAZORPAY_KEY_ID` is set
- Verify order creation response has `orderId`

---

## Advanced Features

### Refunds
```typescript
const refund = await razorpay.payments.refund(payment_id, {
  amount: 1000, // Amount in paise/cents
  notes: { reason: "Customer request" }
});
```

### Subscriptions
```typescript
const subscription = await razorpay.subscriptions.create({
  plan_id: "plan_xxxxx",
  customer_notify: 1,
  total_count: 12,
});
```

### International Payments
```typescript
const order = await razorpay.orders.create({
  amount: 1000,
  currency: "USD", // Supports 100+ currencies
  receipt: "receipt_1",
});
```

---

## Summary

**Implementation Checklist**:
1. ✅ Install dependencies (`razorpay`, `mongoose`, `nodemailer`)
2. ✅ Set up environment variables
3. ✅ Create Order model with Razorpay fields
4. ✅ Load Razorpay SDK in layout
5. ✅ Create order API route
6. ✅ Integrate Razorpay checkout on client
7. ✅ Implement webhook handler with signature verification
8. ✅ Configure webhook in Razorpay Dashboard
9. ✅ Test with test credentials
10. ✅ Deploy and switch to live credentials

**Key Takeaways**:
- **Never trust client-side**: Always verify payments server-side
- **Webhooks are critical**: They're your source of truth for payment status
- **Signature verification is mandatory**: Prevents fraud
- **Use test mode extensively**: Before going live
- **Handle edge cases**: Duplicates, failures, timeouts

---

## Resources

- [Razorpay API Documentation](https://razorpay.com/docs/api/)
- [Webhook Signature Verification](https://razorpay.com/docs/webhooks/validate-test/)
- [Razorpay Node.js SDK](https://github.com/razorpay/razorpay-node)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

**Last Updated**: Based on implementation from this repository
**Stack**: Next.js 15, Razorpay SDK v2.9.2, MongoDB with Mongoose

