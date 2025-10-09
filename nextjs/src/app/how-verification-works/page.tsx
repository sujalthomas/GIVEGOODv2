/**
 * How Verification Works Page
 * 
 * Comprehensive guide explaining blockchain verification
 * for donors in simple, accessible language
 */

'use client';

import { motion } from 'framer-motion';
import { 
  Shield, 
  CheckCircle, 
  Anchor, 
  Lock,
  Search,
  FileText,
  Download,
  ArrowRight,
  HelpCircle,
  ExternalLink,
  Copy,
  Zap,
  Globe,
} from 'lucide-react';
import Link from 'next/link';

export default function HowVerificationWorksPage() {
  
  const downloadPDFGuide = () => {
    // This will trigger the PDF generation
    window.open('/api/download/verification-guide', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5"></div>
        <div className="relative max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Shield className="w-20 h-20 text-blue-600 mx-auto mb-6" />
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              How Verification Works
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Understanding blockchain-powered donation transparency in simple terms.
              Every rupee is tracked, verified, and permanently recorded.
            </p>
            
            {/* Download PDF Button */}
            <button
              onClick={downloadPDFGuide}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              <Download className="w-5 h-5" />
              Download Complete Guide (PDF)
            </button>
          </motion.div>
        </div>
      </section>

      {/* The Process - Step by Step */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            The Complete Verification Process
          </h2>

          {/* Step 1 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex gap-6 mb-12"
          >
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold">
                1
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                You Make a Donation
              </h3>
              <p className="text-gray-700 text-lg mb-4">
                When you donate, we capture complete transaction details through our 
                secure Razorpay payment gateway. This includes:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                <li>Your payment amount</li>
                <li>Payment ID (starts with &ldquo;pay_&rdquo;)</li>
                <li>Donation ID (unique UUID)</li>
                <li>Timestamp</li>
                <li>Payment gateway fees (we show you the exact net amount)</li>
              </ul>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-600">
                <p className="text-sm text-blue-900">
                  <strong>💡 Pro Tip:</strong> Save your Payment ID or Donation ID! 
                  You&apos;ll need it to verify your donation later.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Step 2 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="flex gap-6 mb-12"
          >
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold">
                2
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <Zap className="w-6 h-6 text-purple-600" />
                Cryptographic Hashing
              </h3>
              <p className="text-gray-700 text-lg mb-4">
                Your donation data is converted into a unique cryptographic fingerprint 
                called a &ldquo;hash&rdquo;. Think of it as a tamper-proof digital signature.
              </p>
              <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-green-400 overflow-x-auto">
                <div className="mb-2 text-gray-400"> Example donation data:</div>
                <div>Donation ID: 2ee6c6b4-033b-47d3-bf29-01a4cb453054</div>
                <div>Amount: ₹5,000</div>
                <div>Date: 2025-01-10</div>
                <div className="mt-2 text-gray-400"> Becomes hash:</div>
                <div className="break-all">9ef9c8dbd3679119f33e9a05e07697f82feee8c9...</div>
              </div>
              <p className="text-sm text-gray-600 mt-3">
                ⚡ <strong>SHA-256 encryption</strong> ensures even the tiniest change 
                in data completely changes the hash.
              </p>
            </div>
          </motion.div>

          {/* Step 3 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex gap-6 mb-12"
          >
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-2xl font-bold">
                3
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <Globe className="w-6 h-6 text-green-600" />
                Merkle Tree Batching
              </h3>
              <p className="text-gray-700 text-lg mb-4">
                Your donation is grouped with others into a &ldquo;batch&rdquo; and organized 
                into a special data structure called a Merkle Tree. This allows efficient 
                verification of thousands of donations at once.
              </p>
              
              {/* Visual Tree Diagram */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                <div className="text-center mb-6">
                  <div className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg font-bold">
                    Merkle Root (Batch #123)
                  </div>
                </div>
                <div className="flex justify-center gap-4 mb-4">
                  <div className="text-center">
                    <div className="bg-green-400 text-white px-3 py-1 rounded text-sm">Hash AB</div>
                  </div>
                  <div className="text-center">
                    <div className="bg-green-400 text-white px-3 py-1 rounded text-sm">Hash CD</div>
                  </div>
                </div>
                <div className="flex justify-center gap-2">
                  <div className="bg-green-200 px-2 py-1 rounded text-xs">Your Donation</div>
                  <div className="bg-green-200 px-2 py-1 rounded text-xs">Donation B</div>
                  <div className="bg-green-200 px-2 py-1 rounded text-xs">Donation C</div>
                  <div className="bg-green-200 px-2 py-1 rounded text-xs">Donation D</div>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mt-3">
                🌳 Your donation gets a unique &ldquo;proof path&rdquo; that connects it 
                to the batch root.
              </p>
            </div>
          </motion.div>

          {/* Step 4 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex gap-6 mb-12"
          >
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-orange-600 text-white rounded-full flex items-center justify-center text-2xl font-bold">
                4
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <Anchor className="w-6 h-6 text-orange-600" />
                Blockchain Anchoring
              </h3>
              <p className="text-gray-700 text-lg mb-4">
                The Merkle Root (representing all donations in the batch) is permanently 
                recorded on the Solana blockchain. This makes it:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex gap-3 items-start">
                  <Lock className="w-5 h-5 text-orange-600 flex-shrink-0 mt-1" />
                  <div>
                    <strong className="text-gray-900">Immutable</strong>
                    <p className="text-sm text-gray-600">Cannot be altered or deleted</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <Globe className="w-5 h-5 text-orange-600 flex-shrink-0 mt-1" />
                  <div>
                    <strong className="text-gray-900">Public</strong>
                    <p className="text-sm text-gray-600">Anyone can view on Solscan</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <CheckCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-1" />
                  <div>
                    <strong className="text-gray-900">Verifiable</strong>
                    <p className="text-sm text-gray-600">Cryptographically provable</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <Zap className="w-5 h-5 text-orange-600 flex-shrink-0 mt-1" />
                  <div>
                    <strong className="text-gray-900">Fast</strong>
                    <p className="text-sm text-gray-600">Confirmed in seconds</p>
                  </div>
                </div>
              </div>
              
              <a
                href="https://solscan.io?cluster=devnet"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 text-orange-600 hover:text-orange-700 font-semibold"
              >
                View on Solscan Explorer
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </motion.div>

          {/* Step 5 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex gap-6"
          >
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-red-600 text-white rounded-full flex items-center justify-center text-2xl font-bold">
                5
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <Search className="w-6 h-6 text-red-600" />
                You Verify Your Donation
              </h3>
              <p className="text-gray-700 text-lg mb-4">
                Use our verification tool to prove your donation is on the blockchain:
              </p>
              <ol className="list-decimal list-inside space-y-3 text-gray-700 mb-4 ml-4">
                <li>Enter your <strong>Payment ID</strong> or <strong>Donation ID</strong></li>
                <li>We fetch your donation data and Merkle proof</li>
                <li>We verify the proof against the blockchain</li>
                <li>You get a ✅ confirmation with blockchain link</li>
              </ol>
              
              <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-4 border-l-4 border-red-600">
                <p className="text-sm text-gray-900">
                  <strong>🔐 What makes this trustworthy?</strong><br />
                  Even if our database is compromised, the blockchain record remains 
                  unchanged. Anyone can independently verify donations on Solscan.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How to Verify - Practical Guide */}
      <section className="py-16 px-6 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            How to Verify Your Donation (Step-by-Step)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Option 1 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mb-4">
                <Copy className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Option 1: Using Payment ID</h3>
              <ol className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">1.</span>
                  <span>Find your Payment ID on the success page or email receipt (starts with &ldquo;pay_&rdquo;)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">2.</span>
                  <span>Click the copy icon to copy the full ID</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">3.</span>
                  <span>Go to <Link href="/transparency" className="text-blue-600 hover:underline">Transparency Page</Link></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">4.</span>
                  <span>Paste your Payment ID in the verifier</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">5.</span>
                  <span>Click &ldquo;Verify&rdquo; ✅</span>
                </li>
              </ol>
            </div>

            {/* Option 2 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Option 2: Using Donation ID</h3>
              <ol className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-purple-600">1.</span>
                  <span>Find your Donation ID on the success page (UUID format)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-purple-600">2.</span>
                  <span>Copy the full ID</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-purple-600">3.</span>
                  <span>Go to <Link href="/transparency" className="text-purple-600 hover:underline">Transparency Page</Link></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-purple-600">4.</span>
                  <span>Paste your Donation ID in the verifier</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-purple-600">5.</span>
                  <span>Click &ldquo;Verify&rdquo; ✅</span>
                </li>
              </ol>
            </div>
          </div>

          {/* What You'll See */}
          <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-2xl font-bold mb-6 text-center">What You&apos;ll See After Verification</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-bold text-green-600 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  If Your Donation is Verified:
                </h4>
                <ul className="space-y-2 text-gray-700 text-sm ml-6">
                  <li>✅ Donation found in database</li>
                  <li>✅ Included in Batch #[ID]</li>
                  <li>✅ Merkle proof valid</li>
                  <li>✅ On blockchain (with Solscan link)</li>
                  <li>💰 Amount and date displayed</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-bold text-orange-600 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  If Pending:
                </h4>
                <ul className="space-y-2 text-gray-700 text-sm ml-6">
                  <li>⏳ Donation found but not yet batched</li>
                  <li>📦 Waiting to be included in next batch</li>
                  <li>⏰ Usually batched within 24 hours</li>
                  <li>🔄 Check back later</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div className="border-l-4 border-blue-600 pl-6 py-3">
              <h3 className="text-xl font-bold mb-2">Why blockchain?</h3>
              <p className="text-gray-700">
                Blockchain provides an immutable, public ledger that no one can alter—not 
                even us. This ensures complete transparency and builds trust.
              </p>
            </div>

            <div className="border-l-4 border-purple-600 pl-6 py-3">
              <h3 className="text-xl font-bold mb-2">How long until my donation is on the blockchain?</h3>
              <p className="text-gray-700">
                Donations are grouped into batches daily. Your donation should be anchored 
                to the blockchain within 24 hours. You can verify it anytime after that.
              </p>
            </div>

            <div className="border-l-4 border-green-600 pl-6 py-3">
              <h3 className="text-xl font-bold mb-2">What if I lose my Payment ID?</h3>
              <p className="text-gray-700">
                You can find it in your email receipt, on the donation success page, or in 
                the public transaction ledger if you remember the approximate date and amount.
              </p>
            </div>

            <div className="border-l-4 border-orange-600 pl-6 py-3">
              <h3 className="text-xl font-bold mb-2">Can donations be removed from the blockchain?</h3>
              <p className="text-gray-700">
                No. Once a batch is anchored, it&apos;s permanently on the Solana blockchain. 
                This immutability is a key feature that ensures trust.
              </p>
            </div>

            <div className="border-l-4 border-red-600 pl-6 py-3">
              <h3 className="text-xl font-bold mb-2">Is my personal information on the blockchain?</h3>
              <p className="text-gray-700">
                No. Only cryptographic hashes are stored on the blockchain, not your personal 
                data. Your privacy is protected while maintaining transparency.
              </p>
            </div>

            <div className="border-l-4 border-pink-600 pl-6 py-3">
              <h3 className="text-xl font-bold mb-2">What happens to payment gateway fees?</h3>
              <p className="text-gray-700">
                We show you exactly how much goes to the charity after Razorpay fees. On your 
                success page and in our ledger, you&apos;ll see both the gross amount and net 
                amount received.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Verify Your Donation?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Experience the transparency of blockchain-powered donations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/transparency"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              <Search className="w-5 h-5" />
              Verify a Donation
            </Link>
            <Link
              href="/donate"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 transition-colors border-2 border-white"
            >
              Make a Donation
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

