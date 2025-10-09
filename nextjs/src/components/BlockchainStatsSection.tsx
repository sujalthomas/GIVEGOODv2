/**
 * Blockchain Stats Section for Landing Page
 * 
 * Shows high-level blockchain integration stats
 * to build trust and transparency
 */

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Anchor, Shield, TrendingUp, Zap } from 'lucide-react';

interface BlockchainStats {
  batchesAnchored: number;
  donationsSecured: number;
  amountSecured: number;
  blockchainCost: number;
}

export default function BlockchainStatsSection() {
  const [stats, setStats] = useState<BlockchainStats>({
    batchesAnchored: 0,
    donationsSecured: 0,
    amountSecured: 0,
    blockchainCost: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/blockchain/stats');
      if (response.ok) {
        const data = await response.json();
        setStats({
          batchesAnchored: data.statistics.totalBatchesAnchored,
          donationsSecured: data.statistics.totalDonationsAnchored,
          amountSecured: data.statistics.totalAmountAnchored,
          blockchainCost: data.statistics.totalSolSpent,
        });
      }
    } catch (error) {
      console.error('Error fetching blockchain stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null; // Don't show anything while loading
  }

  // Only show if we have blockchain data
  if (stats.batchesAnchored === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-blue-600 to-purple-600 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Anchor className="w-10 h-10 text-white" />
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Blockchain-Verified Transparency
            </h2>
          </div>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto">
            Every donation is permanently recorded on the Solana blockchain with cryptographic proof
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Batches Anchored */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-full">
                <Anchor className="w-6 h-6 text-white" />
              </div>
              <div className="text-xs text-blue-100 uppercase tracking-wider">
                On Blockchain
              </div>
            </div>
            <div className="text-4xl font-bold text-white mb-2">
              {stats.batchesAnchored}
            </div>
            <div className="text-blue-100 text-sm">
              Batches Anchored
            </div>
          </motion.div>

          {/* Donations Secured */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-full">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="text-xs text-blue-100 uppercase tracking-wider">
                Verified
              </div>
            </div>
            <div className="text-4xl font-bold text-white mb-2">
              {stats.donationsSecured}
            </div>
            <div className="text-blue-100 text-sm">
              Donations Secured
            </div>
          </motion.div>

          {/* Amount Secured */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-full">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="text-xs text-blue-100 uppercase tracking-wider">
                Total Value
              </div>
            </div>
            <div className="text-4xl font-bold text-white mb-2">
              ₹{(stats.amountSecured / 1000).toFixed(0)}k
            </div>
            <div className="text-blue-100 text-sm">
              Amount Secured
            </div>
          </motion.div>

          {/* Blockchain Cost */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-full">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="text-xs text-blue-100 uppercase tracking-wider">
                Transparent Cost
              </div>
            </div>
            <div className="text-4xl font-bold text-white mb-2">
              {(stats.blockchainCost * 1000).toFixed(2)}
            </div>
            <div className="text-blue-100 text-sm">
              mSOL Spent
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <a
            href="/transparency"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg"
          >
            <Shield className="w-5 h-5" />
            View Full Transparency Report
          </a>
        </motion.div>
      </div>
    </section>
  );
}

