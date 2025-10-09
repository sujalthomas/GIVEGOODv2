/**
 * Verification Guide PDF Download API
 * 
 * Generates and serves a PDF guide for donors
 * explaining how to verify their donations
 */

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // HTML content for PDF (simplified version)
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Donation Verification Guide - Give Good Club</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    h1 {
      color: #2563eb;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 10px;
      margin-bottom: 30px;
    }
    h2 {
      color: #7c3aed;
      margin-top: 30px;
      margin-bottom: 15px;
    }
    h3 {
      color: #059669;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    .step {
      background: #f3f4f6;
      padding: 20px;
      margin: 20px 0;
      border-left: 4px solid #2563eb;
      border-radius: 4px;
    }
    .step-number {
      display: inline-block;
      width: 30px;
      height: 30px;
      background: #2563eb;
      color: white;
      text-align: center;
      line-height: 30px;
      border-radius: 50%;
      font-weight: bold;
      margin-right: 10px;
    }
    .tip {
      background: #dbeafe;
      border-left: 4px solid #3b82f6;
      padding: 15px;
      margin: 15px 0;
    }
    .warning {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 15px 0;
    }
    ul {
      margin-left: 20px;
    }
    li {
      margin: 8px 0;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    code {
      background: #1f2937;
      color: #10b981;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
    .highlight {
      background: #fef9c3;
      padding: 2px 4px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <h1>🛡️ How to Verify Your Donation</h1>
  <p><strong>Give Good Club - Blockchain-Powered Transparency Guide</strong></p>
  
  <h2>📋 What You'll Need</h2>
  <ul>
    <li><strong>Payment ID</strong> (starts with "pay_") OR</li>
    <li><strong>Donation ID</strong> (UUID format, e.g., 2ee6c6b4-033b...)</li>
    <li>Internet connection to access our verification tool</li>
  </ul>

  <div class="tip">
    <strong>💡 Where to Find Your IDs:</strong><br>
    - Check your donation success page immediately after payment<br>
    - Look in your email receipt (if you provided an email)<br>
    - Browse the public transaction ledger (if you remember date/amount)
  </div>

  <h2>🔐 Understanding Blockchain Verification</h2>
  
  <div class="step">
    <span class="step-number">1</span>
    <strong>You Make a Donation</strong><br>
    When you donate, we capture complete transaction details through Razorpay payment gateway.
    This includes your payment amount, Payment ID, Donation ID, timestamp, and payment gateway fees.
  </div>

  <div class="step">
    <span class="step-number">2</span>
    <strong>Cryptographic Hashing</strong><br>
    Your donation data is converted into a unique cryptographic fingerprint (hash) using SHA-256 encryption.
    Even the tiniest change in data completely changes the hash, making it tamper-proof.
  </div>

  <div class="step">
    <span class="step-number">3</span>
    <strong>Merkle Tree Batching</strong><br>
    Your donation is grouped with others into a "batch" and organized into a Merkle Tree.
    This allows efficient verification of thousands of donations at once. Your donation gets a 
    unique "proof path" that connects it to the batch root.
  </div>

  <div class="step">
    <span class="step-number">4</span>
    <strong>Blockchain Anchoring</strong><br>
    The Merkle Root (representing all donations in the batch) is permanently recorded on the 
    Solana blockchain. This makes it:
    <ul>
      <li><strong>Immutable</strong> - Cannot be altered or deleted</li>
      <li><strong>Public</strong> - Anyone can view on Solscan</li>
      <li><strong>Verifiable</strong> - Cryptographically provable</li>
      <li><strong>Fast</strong> - Confirmed in seconds</li>
    </ul>
  </div>

  <div class="step">
    <span class="step-number">5</span>
    <strong>You Verify Your Donation</strong><br>
    Use our verification tool to prove your donation is on the blockchain. We fetch your donation 
    data, verify the Merkle proof, and provide a direct link to the blockchain transaction.
  </div>

  <h2>📝 Step-by-Step Verification Instructions</h2>

  <h3>Option 1: Using Payment ID</h3>
  <ol>
    <li>Find your Payment ID (starts with "pay_")</li>
    <li>Click the copy icon to copy the full ID</li>
    <li>Visit: <strong>https://yourwebsite.com/transparency</strong></li>
    <li>Paste your Payment ID in the verifier</li>
    <li>Click "Verify" ✅</li>
  </ol>

  <h3>Option 2: Using Donation ID</h3>
  <ol>
    <li>Find your Donation ID (UUID format)</li>
    <li>Copy the full ID</li>
    <li>Visit: <strong>https://yourwebsite.com/transparency</strong></li>
    <li>Paste your Donation ID in the verifier</li>
    <li>Click "Verify" ✅</li>
  </ol>

  <h2>✅ What You'll See After Verification</h2>

  <h3>If Your Donation is Verified:</h3>
  <ul>
    <li>✅ Donation found in database</li>
    <li>✅ Included in Batch #[ID]</li>
    <li>✅ Merkle proof valid</li>
    <li>✅ On blockchain (with Solscan link)</li>
    <li>💰 Amount and date displayed</li>
  </ul>

  <h3>If Pending:</h3>
  <ul>
    <li>⏳ Donation found but not yet batched</li>
    <li>📦 Waiting to be included in next batch</li>
    <li>⏰ Usually batched within 24 hours</li>
    <li>🔄 Check back later</li>
  </ul>

  <h2>❓ Frequently Asked Questions</h2>

  <h3>Why blockchain?</h3>
  <p>
    Blockchain provides an immutable, public ledger that no one can alter—not even us. 
    This ensures complete transparency and builds trust.
  </p>

  <h3>How long until my donation is on the blockchain?</h3>
  <p>
    Donations are grouped into batches daily. Your donation should be anchored to the 
    blockchain within 24 hours.
  </p>

  <h3>What if I lose my Payment ID?</h3>
  <p>
    You can find it in your email receipt, on the donation success page, or in the public 
    transaction ledger if you remember the approximate date and amount.
  </p>

  <h3>Can donations be removed from the blockchain?</h3>
  <p>
    No. Once a batch is anchored, it's permanently on the Solana blockchain. This immutability 
    is a key feature that ensures trust.
  </p>

  <h3>Is my personal information on the blockchain?</h3>
  <p>
    No. Only cryptographic hashes are stored on the blockchain, not your personal data. 
    Your privacy is protected while maintaining transparency.
  </p>

  <div class="warning">
    <strong>🔐 Security Note:</strong><br>
    Even if our database is compromised, the blockchain record remains unchanged. 
    Anyone can independently verify donations on Solscan.
  </div>

  <h2>🔗 Useful Links</h2>
  <ul>
    <li><strong>Verification Tool:</strong> https://yourwebsite.com/transparency</li>
    <li><strong>Transaction Ledger:</strong> https://yourwebsite.com/transactions</li>
    <li><strong>Solana Explorer:</strong> https://solscan.io</li>
    <li><strong>Contact Support:</strong> support@yourwebsite.com</li>
  </ul>

  <div class="footer">
    <p><strong>Give Good Club</strong> - Blockchain-Powered Donation Transparency</p>
    <p>Every donation matters. Every rupee is tracked.</p>
    <p>© 2025 Give Good Club. All rights reserved.</p>
  </div>
</body>
</html>
    `;

    // Return HTML that can be printed as PDF
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': 'inline; filename="donation-verification-guide.html"',
      },
    });

  } catch (error) {
    console.error('Error generating verification guide:', error);
    return NextResponse.json(
      { error: 'Failed to generate verification guide' },
      { status: 500 }
    );
  }
}

