/**
 * Transparency Page
 * 
 * Comprehensive transparency dashboard showing:
 * - Real-time donation statistics
 * - Blockchain anchoring status
 * - Transaction history
 * - Verification tools
 * - Trust metrics
 */

'use client';

import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  TrendingUp, 
  Lock, 
  Eye, 
  CheckCircle,
  Anchor,
  Activity,
  DollarSign,
} from 'lucide-react';
import TransparencyLedger from '@/components/TransparencyLedger';
import DonationVerifier from '@/components/DonationVerifier';

export default function TransparencyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5"></div>
        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <Shield className="w-16 h-16 text-blue-600" />
              <h1 className="text-5xl font-bold text-gray-900">
                Complete Transparency
              </h1>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Every donation is tracked, verified, and permanently recorded on the Solana blockchain.
              See exactly where your money goes and verify it yourself.
            </p>
          </motion.div>

          {/* Trust Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-lg border-2 border-blue-100"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-blue-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Verification</div>
                  <div className="text-2xl font-bold text-blue-600">100%</div>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                All donations cryptographically verified
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-100"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Anchor className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">On Blockchain</div>
                  <div className="text-2xl font-bold text-purple-600">Permanent</div>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Immutable records on Solana
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-6 shadow-lg border-2 border-green-100"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-green-100 rounded-full">
                  <Eye className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Visibility</div>
                  <div className="text-2xl font-bold text-green-600">Real-time</div>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Track every transaction live
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl p-6 shadow-lg border-2 border-orange-100"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-orange-100 rounded-full">
                  <Lock className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Security</div>
                  <div className="text-2xl font-bold text-orange-600">Bank-grade</div>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Military-grade encryption
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            How Our Transparency Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">1. Donation Made</h3>
              <p className="text-gray-600">
                You make a donation through our secure Razorpay payment gateway. 
                We capture the full transaction details including fees.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">2. Merkle Tree Batching</h3>
              <p className="text-gray-600">
                Donations are grouped into batches and organized into a cryptographic 
                Merkle tree for efficient verification.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Anchor className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">3. Blockchain Anchor</h3>
              <p className="text-gray-600">
                The Merkle root is permanently recorded on the Solana blockchain, 
                making it immutable and publicly verifiable.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Donation Verifier Section */}
      <section id="verify-donation" className="py-16 px-6 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Verify Your Donation</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Enter your donation ID or Razorpay payment ID to cryptographically 
              verify that your donation is recorded on the blockchain.
            </p>
          </motion.div>
          <Suspense fallback={<div className="text-center">Loading...</div>}>
            <DonationVerifier />
          </Suspense>
        </div>
      </section>

      {/* Transaction Ledger */}
      <section className="py-16 px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <h2 className="text-3xl font-bold">Transaction Ledger</h2>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Real-time view of all donations with blockchain anchoring status. 
              Click the anchor icon to view the transaction on Solscan.
            </p>
          </motion.div>
          <TransparencyLedger />
        </div>
      </section>
    </div>
  );
}

