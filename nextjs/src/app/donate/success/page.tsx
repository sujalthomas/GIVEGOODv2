"use client";
import React, { useEffect, useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Heart, Share2, ArrowRight, Sparkles, Loader2, Shield } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Confetti from '@/components/Confetti';
import DonationVerifier from '@/components/DonationVerifier';

interface DonationStatus {
  status: 'pending' | 'completed' | 'failed';
  amount_inr: number;
  id: string;
  payment_id?: string;
  razorpay_fee_inr?: number;
  tax_amount_inr?: number;
  net_amount_inr?: number;
}

function DonationSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');
  const paymentId = searchParams.get('paymentId');
  
  const [showConfetti, setShowConfetti] = useState(false);
  const [donationStatus, setDonationStatus] = useState<DonationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pollCount, setPollCount] = useState(0);
  const maxPollAttempts = 30; // Poll for up to 30 seconds (30 attempts * 1 second)

  // Poll for payment completion
  useEffect(() => {
    if (!orderId) {
      setIsLoading(false);
      return;
    }

    const checkPaymentStatus = async () => {
      try {
        // Use API route to check donation status (bypasses RLS)
        const response = await fetch(`/api/donations/status?orderId=${orderId}`);
        
        if (!response.ok) {
          console.error('Error fetching donation status:', response.status);
          return false;
        }

        const donation = await response.json() as DonationStatus;
        setDonationStatus(donation);

        if (donation.status === 'completed') {
          setIsLoading(false);
          setShowConfetti(true);
          // Stop polling
          return true;
        } else if (donation.status === 'failed') {
          setIsLoading(false);
          router.push('/donate/failure?reason=payment_failed');
          return true;
        }

        return false;
      } catch (error) {
        console.error('Error checking payment status:', error);
        return false;
      }
    };

    // Initial check
    checkPaymentStatus();

    // Poll every 1 second
    const pollInterval = setInterval(async () => {
      setPollCount((prev) => {
        const newCount = prev + 1;
        
        if (newCount >= maxPollAttempts) {
          // Timeout - stop polling
          setIsLoading(false);
          clearInterval(pollInterval);
          return prev;
        }
        
        return newCount;
      });

      const completed = await checkPaymentStatus();
      if (completed) {
        clearInterval(pollInterval);
      }
    }, 1000);

    return () => clearInterval(pollInterval);
  }, [orderId, router]);

  useEffect(() => {
    // Stop confetti after 5 seconds
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  const handleShare = () => {
    const text = `I just donated ₹${amount} to Give Good Club to help feed street animals! Join me in spreading kindness. 🐕❤️`;
    const url = 'https://givegoodclub.org/donate';

    if (navigator.share) {
      navigator.share({
        title: 'I just donated to Give Good Club!',
        text,
        url,
      }).catch((err) => console.log('Error sharing:', err));
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(`${text}\n${url}`);
      alert('Share text copied to clipboard!');
    }
  };

  // Loading state while waiting for webhook
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center max-w-md"
        >
          <Loader2 className="w-16 h-16 text-primary-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Your Donation...</h2>
          <p className="text-gray-600 mb-4">
            Please wait while we confirm your payment. This usually takes a few seconds.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="mb-2">💡 <strong>Tip:</strong> Don&apos;t close this page!</p>
            <p>We&apos;re verifying your payment with our payment gateway.</p>
          </div>
          {pollCount > 15 && (
            <p className="text-sm text-gray-500 mt-4">
              Taking longer than usual? Don&apos;t worry, your payment is safe. 
              <Link href="/app" className="text-primary-600 hover:underline ml-1">
                Check your donations
              </Link>
            </p>
          )}
        </motion.div>
      </div>
    );
  }

  // Timeout state (webhook took too long)
  if (!donationStatus && pollCount >= maxPollAttempts) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-10 h-10 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Processing...</h2>
          <p className="text-gray-600 mb-4">
            Your payment is being processed. This is taking longer than usual, but don&apos;t worry!
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800 mb-4">
            <p className="mb-2">✅ <strong>Your payment was successful!</strong></p>
            <p>We&apos;re just waiting for final confirmation from our payment gateway.</p>
            <p className="mt-2">Payment ID: <code className="text-xs">{paymentId}</code></p>
          </div>
          <Link
            href="/app"
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all"
          >
            View Your Donations
          </Link>
        </motion.div>
      </div>
    );
  }

  const amount = donationStatus?.amount_inr || 0;
  const donationId = donationStatus?.id;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      {showConfetti && <Confetti active={true} />}
      
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6"
          >
            <CheckCircle className="w-16 h-16 text-green-600" />
          </motion.div>

          {/* Thank You Message */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            Thank You! 🎉
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-gray-600 mb-8"
          >
            Your donation of <span className="font-bold text-primary-600">₹{amount.toLocaleString()}</span> has been received successfully!
          </motion.p>

          {/* Transparency Section - Fee Breakdown */}
          {donationStatus?.net_amount_inr && donationStatus?.razorpay_fee_inr && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="bg-gradient-to-br from-blue-50 to-green-50 border border-blue-200 rounded-2xl shadow-md p-6 mb-8"
            >
              <div className="flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-bold text-gray-900">Transparency Breakdown</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                We believe in complete transparency. Here&apos;s exactly where your donation goes:
              </p>
              
              <div className="space-y-2 bg-white rounded-lg p-4 text-sm">
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-gray-700">Your generous donation:</span>
                  <span className="font-bold text-gray-900">₹{amount.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center text-gray-600">
                  <span className="flex items-center">
                    <span className="text-xs mr-1">−</span> Payment processing fee:
                  </span>
                  <span>₹{donationStatus.razorpay_fee_inr.toFixed(2)}</span>
                </div>
                
                {donationStatus.tax_amount_inr && donationStatus.tax_amount_inr > 0 && (
                  <div className="flex justify-between items-center text-gray-600">
                    <span className="flex items-center">
                      <span className="text-xs mr-1">−</span> GST on processing fee:
                    </span>
                    <span>₹{donationStatus.tax_amount_inr.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-2 border-t-2 border-green-200">
                  <span className="font-bold text-green-700">Amount to Give Good Club:</span>
                  <span className="font-bold text-green-700 text-lg">
                    ₹{donationStatus.net_amount_inr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 mt-3 text-center">
                💚 100% of the net amount goes directly to helping street animals
              </p>
            </motion.div>
          )}

          {/* Impact Statement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl shadow-lg p-8 mb-8"
          >
            <div className="flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-primary-600 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">Your Impact</h2>
            </div>
            <p className="text-gray-700 text-lg mb-4">
              Your generosity will help us:
            </p>
            <ul className="text-left space-y-3 max-w-md mx-auto">
              {getImpactStatements(amount).map((statement, index) => (
                <li key={index} className="flex items-start">
                  <Sparkles className="w-5 h-5 text-primary-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{statement}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Donation ID */}
          {donationId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-secondary-100 rounded-xl p-4 mb-8"
            >
              <p className="text-sm text-gray-600 mb-1">Donation ID (for your records)</p>
              <p className="text-sm font-mono text-gray-800 break-all">{donationId}</p>
              <p className="text-xs text-gray-500 mt-2">
                You&apos;ll receive a receipt via email shortly. This donation is tax-deductible under 80G.
              </p>
            </motion.div>
          )}

          {/* Blockchain Verification Widget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-lg p-6 mb-8 border border-blue-200"
          >
            <div className="flex items-center justify-center mb-4">
              <Shield className="w-7 h-7 text-blue-600 mr-2" />
              <h3 className="text-xl font-bold text-gray-900">Verify on Blockchain</h3>
            </div>
            <p className="text-sm text-gray-600 text-center mb-4">
              Your donation will be permanently recorded on the Solana blockchain within 24 hours.
              Use your Donation ID or Payment ID to verify it&apos;s included.
            </p>
            <div className="bg-white rounded-xl p-4">
              <Suspense fallback={<div className="text-center text-gray-500">Loading verifier...</div>}>
                <DonationVerifier 
                  initialValue={donationId || ''} 
                  autoVerify={!!donationId}
                />
              </Suspense>
            </div>
            <div className="mt-4 text-center">
              <Link
                href="/how-verification-works"
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                Learn how blockchain verification works →
              </Link>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
          >
            <button
              onClick={handleShare}
              className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all transform hover:scale-105"
            >
              <Share2 className="w-5 h-5 mr-2" />
              Share Your Kindness
            </button>

            <Link
              href="/transparency"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-primary-600 border-2 border-primary-600 rounded-xl font-semibold hover:bg-primary-50 transition-all"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Verify Your Donation
            </Link>
          </motion.div>

          {/* Next Steps */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl p-6"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">What Happens Next?</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="font-bold text-primary-600">1</span>
                </div>
                <p className="text-gray-700">You&apos;ll receive a receipt via email within 24 hours</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="font-bold text-primary-600">2</span>
                </div>
                <p className="text-gray-700">Your donation will be verified on the blockchain</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="font-bold text-primary-600">3</span>
                </div>
                <p className="text-gray-700">We&apos;ll send updates on how your donation is making an impact</p>
              </div>
            </div>
          </motion.div>

          {/* Return to Home */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-8"
          >
            <Link
              href="/"
              className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
            >
              <ArrowRight className="w-5 h-5 mr-2 rotate-180" />
              Return to Homepage
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

// Helper function to generate impact statements based on amount
function getImpactStatements(amount: number): string[] {
  const statements: string[] = [];

  if (amount >= 500) {
    const feeders = Math.floor(amount / 250);
    statements.push(`Build ${feeders} feeder${feeders > 1 ? 's' : ''} for street dogs`);
  }

  if (amount >= 100) {
    const dogs = Math.floor(amount / 50);
    statements.push(`Feed approximately ${dogs} dog${dogs > 1 ? 's' : ''} for a day`);
  }

  statements.push('Support our community of volunteers');
  statements.push('Help spread awareness about animal welfare');

  return statements.slice(0, 4); // Return max 4 statements
}

// Wrapper component with Suspense boundary
export default function DonationSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-xl text-gray-700">Loading your donation details...</p>
        </div>
      </div>
    }>
      <DonationSuccessContent />
    </Suspense>
  );
}
