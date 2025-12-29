"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield, Calendar, CheckCircle, TrendingUp, ExternalLink, Anchor, Copy, Check } from 'lucide-react';
import { createSPASassClient } from '@/lib/supabase/client';

interface Transaction {
  id: string;
  payment_id: string; // Full payment ID for copying
  hash: string; // Truncated display version
  date: string;
  recipient: string;
  category: string;
  status: string;
  amount: number;
  netAmount: number;
  anchored: boolean;
  batchId?: string;
  txSignature?: string;
}

export default function TransparencyLedger() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({ total: 0, verified: 0, amount: 0, netAmount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      const supabaseClient = await createSPASassClient();
      const supabase = supabaseClient.getSupabaseClient();

      // Fetch donations with batch info
      const { data: donations, error } = await supabase
        .from('donations')
        .select(`
          id, 
          payment_id, 
          amount_inr, 
          net_amount_inr, 
          purpose, 
          created_at, 
          status, 
          anonymous,
          anchored,
          anchor_batch_id,
          anchor_batches(onchain_tx_signature)
        `)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Type assertion: columns exist but types may be stale
      type DonationData = {
        id: string;
        payment_id: string;
        amount_inr: number;
        net_amount_inr: number | null;
        purpose: string | null;
        created_at: string;
        status: string;
        anonymous: boolean | null;
        anchored: boolean | null;
        anchor_batch_id: string | null;
        anchor_batches: { onchain_tx_signature: string | null } | null;
      };
      const donationData = (donations || []) as unknown as DonationData[];

      // Map to transaction format
      const txns: Transaction[] = donationData.map((d) => ({
        id: d.id,
        payment_id: d.payment_id || '', // Full payment ID for copying
        hash: (d.payment_id || '').slice(0, 10), // Truncated for display
        date: new Date(d.created_at).toISOString().split('T')[0],
        recipient: getRecipientName(d.purpose),
        category: getCategoryLabel(d.purpose),
        status: 'Verified',
        amount: d.amount_inr,
        netAmount: d.net_amount_inr || d.amount_inr,
        anchored: d.anchored || false,
        batchId: d.anchor_batch_id || undefined,
        txSignature: d.anchor_batches?.onchain_tx_signature || undefined,
      }));

      setTransactions(txns);

      // Calculate stats
      const total = donationData.length;
      const verified = donationData.filter((d) => d.status === 'completed').length;
      const amount = donationData.reduce((sum, d) => sum + d.amount_inr, 0);
      const netAmount = donationData.reduce((sum, d) => sum + (d.net_amount_inr || d.amount_inr), 0);
      setStats({ total, verified, amount, netAmount });
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const getRecipientName = (purpose: string | null) => {
    if (!purpose) return 'Give Good Club';
    
    const recipients: { [key: string]: string } = {
      feeder_construction: 'Street Animal Feeders',
      medical_aid: 'Animal Medical Fund',
      general: 'Give Good Operations',
      food_supplies: 'Food Supply Program',
    };
    return recipients[purpose] || 'Give Good Club';
  };

  const getCategoryLabel = (purpose: string | null) => {
    if (!purpose) return 'General';
    
    const labels: { [key: string]: string } = {
      feeder_construction: 'Infrastructure',
      medical_aid: 'Healthcare',
      general: 'Operations',
      food_supplies: 'Food',
    };
    return labels[purpose] || 'General';
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-3xl shadow-2xl p-8 md:p-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-3xl shadow-2xl p-8 md:p-12">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-green-600" />
            <h2 className="text-3xl font-bold text-gray-900">
              Blockchain Transparency Ledger
            </h2>
          </div>
          <p className="text-gray-600">
            All transactions are cryptographically verified and publicly auditable
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-4 shadow-lg"
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                ₹{stats.amount.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Raised</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-xl p-4 shadow-lg border-2 border-green-500"
        >
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-green-700">
                ₹{stats.netAmount.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 font-semibold">Net to Charity</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-4 shadow-lg"
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-blue-600" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.verified}</div>
              <div className="text-sm text-gray-600">Verified Transactions</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-xl p-4 shadow-lg"
        >
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-purple-600" />
            <div>
              <div className="text-2xl font-bold text-gray-900">24/7</div>
              <div className="text-sm text-gray-600">Real-time Updates</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Transaction Hash
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Recipient
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-blue-700">
                  Blockchain
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  Amount
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-green-700">
                  Net to Charity
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((txn, index) => (
                <motion.tr
                  key={txn.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <code className="text-sm text-orange-600 font-mono bg-orange-50 px-2 py-1 rounded">
                        {txn.hash}
                      </code>
                      <button
                        onClick={() => copyToClipboard(txn.payment_id, txn.id)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Copy full payment ID"
                      >
                        {copiedId === txn.id ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Calendar className="w-4 h-4" />
                      {txn.date}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                    {txn.recipient}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                      {txn.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600 font-medium">
                        {txn.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1">
                      {txn.anchored && txn.txSignature ? (
                        <a
                          href={`https://solscan.io/tx/${txn.txSignature}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors"
                          title="View on Solana Explorer"
                        >
                          <Anchor className="w-4 h-4" />
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400" title="Pending blockchain anchor">
                          <Anchor className="w-4 h-4 text-gray-300" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-lg font-bold text-gray-900">
                      ₹{txn.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-lg font-bold text-green-700">
                      ₹{txn.netAmount.toLocaleString()}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* View Complete Ledger Button */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <a
            href="/transactions"
            className="flex items-center justify-center gap-2 text-primary-600 hover:text-primary-700 font-semibold group"
          >
            View Complete Ledger
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </a>
        </div>
      </div>
    </div>
  );
}


