"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Check, AlertCircle, Loader2, PawPrint, Utensils, Stethoscope } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRazorpay } from '@/hooks/useRazorpay';
import type { RazorpayOptions } from '@/lib/types/razorpay.d';

interface DonationFormData {
  amount: number;
  customAmount: string;
  donorName: string;
  donorEmail: string;
  donorPhone: string;
  purpose: string;
  dedicationMessage: string;
  anonymous: boolean;
}

// Format phone number to display format (with +91 prefix)
function formatPhoneDisplay(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');

  // Remove leading 91 if present (we'll add +91 prefix in display)
  const cleanDigits = digits.startsWith('91') && digits.length > 10
    ? digits.slice(2)
    : digits;

  // Limit to 10 digits
  const limitedDigits = cleanDigits.slice(0, 10);

  // Format as: XXXXX XXXXX (5-5 pattern)
  if (limitedDigits.length > 5) {
    return `${limitedDigits.slice(0, 5)} ${limitedDigits.slice(5)}`;
  }
  return limitedDigits;
}

// Get raw phone number for API submission
function getPhoneForSubmission(displayValue: string): string | undefined {
  const digits = displayValue.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  return undefined;
}

export default function DonatePage() {
  const router = useRouter();
  const { isLoaded: razorpayLoaded } = useRazorpay();

  const [formData, setFormData] = useState<DonationFormData>({
    amount: 500,
    customAmount: '',
    donorName: '',
    donorEmail: '',
    donorPhone: '',
    purpose: 'feeder_construction',
    dedicationMessage: '',
    anonymous: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presetAmounts = [
    { value: 500, label: '₹500', desc: 'Feed 10 dogs for a day' },
    { value: 1000, label: '₹1,000', desc: 'Build 2 feeders' },
    { value: 2500, label: '₹2,500', desc: 'Build 5 feeders' },
    { value: 5000, label: '₹5,000', desc: 'Build 10 feeders' },
  ];

  const purposes = [
    { value: 'feeder_construction', label: 'Build Feeders', icon: Utensils, color: 'text-primary-600', bg: 'bg-primary-50' },
    { value: 'medical_aid', label: 'Medical Aid', icon: Stethoscope, color: 'text-accent-700', bg: 'bg-accent-50' },
    { value: 'general', label: 'Where Needed Most', icon: Heart, color: 'text-secondary-600', bg: 'bg-secondary-100' },
  ];

  const handleAmountSelect = (amount: number) => {
    setFormData({ ...formData, amount, customAmount: '' });
  };

  const handleCustomAmountChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData({ ...formData, customAmount: value, amount: numValue });
  };

  const getSelectedAmount = () => {
    return formData.customAmount ? parseFloat(formData.customAmount) : formData.amount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const selectedAmount = getSelectedAmount();

      // Validation
      if (selectedAmount < 10) {
        throw new Error('Minimum donation amount is ₹10');
      }

      if (selectedAmount > 100000) {
        throw new Error('Maximum donation amount is ₹1,00,000. Please contact us for larger donations.');
      }

      if (!formData.anonymous) {
        if (!formData.donorName.trim()) {
          throw new Error('Please enter your name');
        }
        if (!formData.donorEmail.trim()) {
          throw new Error('Please enter your email');
        }
      }

      // Get properly formatted phone number
      const phoneForSubmission = getPhoneForSubmission(formData.donorPhone);

      // Create order
      const orderResponse = await fetch('/api/donations/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: selectedAmount,
          donorName: formData.anonymous ? undefined : formData.donorName,
          donorEmail: formData.anonymous ? undefined : formData.donorEmail,
          donorPhone: phoneForSubmission,
          purpose: formData.purpose,
          dedicationMessage: formData.dedicationMessage || undefined,
          anonymous: formData.anonymous,
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || 'Failed to create donation order');
      }

      const orderData = await orderResponse.json();

      // Open Razorpay checkout
      if (!razorpayLoaded || !window.Razorpay) {
        throw new Error('Payment gateway not loaded. Please refresh and try again.');
      }

      const options: RazorpayOptions = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Give Good Club',
        description: `Donation for ${purposes.find(p => p.value === formData.purpose)?.label || 'Animal Welfare'}`,
        image: '/icon.png',
        order_id: orderData.orderId,
        handler: async (response) => {
          // Payment successful - just redirect to success page
          // Webhook will handle all verification and DB updates
          setLoading(false);
          router.push(`/donate/success?orderId=${response.razorpay_order_id}&paymentId=${response.razorpay_payment_id}`);
        },
        prefill: {
          name: formData.anonymous ? undefined : formData.donorName,
          email: formData.anonymous ? undefined : formData.donorEmail,
          contact: phoneForSubmission,
        },
        notes: {
          purpose: formData.purpose,
          anonymous: formData.anonymous ? 'true' : 'false',
        },
        theme: {
          color: '#E07856', // Primary color from theme-givegood
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setError('Payment cancelled. You can try again.');
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (err) {
      console.error('Donation error:', err);
      const error = err as Error;
      setError(error.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-4">
            <PawPrint className="w-10 h-10 text-primary-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Make a Difference Today
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Every donation helps us build feeders, provide medical care, and create a kinder world for street animals.
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start"
          >
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Amount Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Impact</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {presetAmounts.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handleAmountSelect(preset.value)}
                  className={`p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${formData.amount === preset.value && !formData.customAmount
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                    }`}
                >
                  <div className="text-2xl font-bold text-gray-900">{preset.label}</div>
                  <div className="text-sm text-gray-600 mt-1">{preset.desc}</div>
                </button>
              ))}
            </div>

            <div>
              <label htmlFor="customAmount" className="block text-sm font-medium text-gray-700 mb-2">
                Or enter custom amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">₹</span>
                <input
                  type="number"
                  id="customAmount"
                  value={formData.customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
                  min="10"
                  max="100000"
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">Minimum: ₹10 | Maximum: ₹1,00,000</p>
            </div>
          </motion.div>

          {/* Purpose Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Where should we use it?</h2>

            <div className="grid md:grid-cols-3 gap-4">
              {purposes.map((purpose) => {
                const Icon = purpose.icon;
                return (
                  <button
                    key={purpose.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, purpose: purpose.value })}
                    className={`p-6 rounded-xl border-2 transition-all text-left ${formData.purpose === purpose.value
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300'
                      }`}
                  >
                    <div className={`w-12 h-12 ${purpose.bg} rounded-full flex items-center justify-center mb-3`}>
                      <Icon className={`w-6 h-6 ${purpose.color}`} />
                    </div>
                    <div className="font-semibold text-gray-900">{purpose.label}</div>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Donor Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Information</h2>

            <div className="mb-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.anonymous}
                  onChange={(e) => setFormData({ ...formData, anonymous: e.target.checked })}
                  className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-gray-700">Make this an anonymous donation</span>
              </label>
            </div>

            <AnimatePresence>
              {!formData.anonymous && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <label htmlFor="donorName" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="donorName"
                      required={!formData.anonymous}
                      value={formData.donorName}
                      onChange={(e) => setFormData({ ...formData, donorName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label htmlFor="donorEmail" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="donorEmail"
                      required={!formData.anonymous}
                      value={formData.donorEmail}
                      onChange={(e) => setFormData({ ...formData, donorEmail: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="john@example.com"
                    />
                    <p className="text-sm text-gray-500 mt-1">For your donation receipt</p>
                  </div>

                  <div>
                    <label htmlFor="donorPhone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number (Optional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium select-none">
                        +91
                      </span>
                      <input
                        type="tel"
                        id="donorPhone"
                        value={formData.donorPhone}
                        onChange={(e) => {
                          const formatted = formatPhoneDisplay(e.target.value);
                          setFormData({ ...formData, donorPhone: formatted });
                        }}
                        className="w-full pl-14 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="98765 43210"
                        maxLength={11} // 10 digits + 1 space
                      />
                    </div>
                    {(() => {
                      const digits = formData.donorPhone.replace(/\D/g, '');
                      if (digits.length > 0 && digits.length < 10) {
                        return (
                          <p className="text-xs text-amber-600 mt-1">
                            Please enter all 10 digits ({digits.length}/10)
                          </p>
                        );
                      }
                      if (digits.length === 10) {
                        return (
                          <p className="text-xs text-green-600 mt-1">
                            ✓ Valid phone number
                          </p>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-4">
              <label htmlFor="dedicationMessage" className="block text-sm font-medium text-gray-700 mb-2">
                Dedication Message (Optional)
              </label>
              <textarea
                id="dedicationMessage"
                rows={3}
                value={formData.dedicationMessage}
                onChange={(e) => setFormData({ ...formData, dedicationMessage: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                placeholder="In loving memory of..."
              />
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <button
              type="submit"
              disabled={loading || !razorpayLoaded}
              className="w-full bg-primary-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : !razorpayLoaded ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading payment gateway...</span>
                </>
              ) : (
                <>
                  <Heart className="w-5 h-5" />
                  <span>Donate ₹{getSelectedAmount().toLocaleString('en-IN')}</span>
                </>
              )}
            </button>

            <p className="text-center text-sm text-gray-500 mt-4">
              🔒 Secure payment powered by Razorpay. Your donation is tax-deductible under 80G.
            </p>
          </motion.div>
        </form>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 grid md:grid-cols-3 gap-6 text-center"
        >
          {[
            { icon: Heart, text: '100% of your donation goes to animals' },
            { icon: Check, text: 'Transparent, blockchain-verified donations' },
            { icon: PawPrint, text: '1000+ dogs fed daily' },
          ].map((item, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-2">
                <item.icon className="w-6 h-6 text-primary-600" />
              </div>
              <p className="text-sm text-gray-600">{item.text}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

