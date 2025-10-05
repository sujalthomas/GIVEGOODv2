"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { XCircle, ArrowRight, RefreshCw, Mail } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function DonationFailurePage() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');

  const getErrorMessage = () => {
    switch (reason) {
      case 'verification_failed':
        return 'Payment verification failed. This could be a temporary issue.';
      case 'verification_error':
        return 'We encountered an error while verifying your payment.';
      case 'payment_failed':
        return 'The payment was not successful. Please try again.';
      default:
        return 'Something went wrong with your donation.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* Error Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-full mb-6"
          >
            <XCircle className="w-16 h-16 text-red-600" />
          </motion.div>

          {/* Error Message */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            Payment Unsuccessful
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-gray-600 mb-8"
          >
            {getErrorMessage()}
          </motion.p>

          {/* Error Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl shadow-lg p-8 mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What went wrong?</h2>
            <div className="text-left space-y-3 text-gray-700">
              <p>Common reasons for payment failure:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Insufficient balance in your account</li>
                <li>Payment timeout or network issues</li>
                <li>Incorrect payment details entered</li>
                <li>Bank or payment method restrictions</li>
                <li>Payment cancelled by user</li>
              </ul>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
          >
            <Link
              href="/donate"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all transform hover:scale-105"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Try Again
            </Link>

            <Link
              href="mailto:support@givegoodclub.org?subject=Donation%20Payment%20Issue"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-primary-600 border-2 border-primary-600 rounded-xl font-semibold hover:bg-primary-50 transition-all"
            >
              <Mail className="w-5 h-5 mr-2" />
              Contact Support
            </Link>
          </motion.div>

          {/* Alternative Options */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="bg-secondary-100 rounded-2xl p-6"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">Alternative Ways to Help</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <Link
                href="/auth/register"
                className="p-4 bg-white rounded-xl hover:shadow-md transition-all text-center"
              >
                <div className="font-semibold text-gray-900 mb-2">Volunteer with Us</div>
                <p className="text-gray-600">Join our community and help build feeders</p>
              </Link>
              <Link
                href="/#features"
                className="p-4 bg-white rounded-xl hover:shadow-md transition-all text-center"
              >
                <div className="font-semibold text-gray-900 mb-2">Spread the Word</div>
                <p className="text-gray-600">Share our mission on social media</p>
              </Link>
            </div>
          </motion.div>

          {/* Return to Home */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
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

          {/* Support Note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-sm text-gray-500 mt-6"
          >
            If you were charged but still see this page, don&apos;t worry. Contact us at{' '}
            <a href="mailto:support@givegoodclub.org" className="text-primary-600 hover:underline">
              support@givegoodclub.org
            </a>{' '}
            and we&apos;ll sort it out.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}

