"use client";
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Calendar, CheckCircle, TrendingUp } from 'lucide-react';
import { createSPASassClient } from '@/lib/supabase/client';

interface Transaction {
  id: string;
  hash: string;
  date: string;
  recipient: string;
  category: string;
  status: string;
  amount: number;
}

export default function TransparencyLedger() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({ total: 0, verified: 0, amount: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const supabaseClient = await createSPASassClient();
      const supabase = supabaseClient.getSupabaseClient();

      const { data: donations, error } = await supabase
        .from('donations')
        .select('id, payment_id, amount_inr, purpose, created_at, status, anonymous')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;

      // Map to transaction format
      const txns: Transaction[] = (donations || []).map((d) => ({
        id: d.id,
        hash: d.payment_id.slice(0, 10),
        date: new Date(d.created_at).toISOString().split('T')[0],
        recipient: getRecipientName(d.purpose),
        category: getCategoryLabel(d.purpose),
        status: 'Verified',
        amount: d.amount_inr,
      }));

      setTransactions(txns);

      // Calculate stats
      const total = donations?.length || 0;
      const verified = donations?.filter(d => d.status === 'completed').length || 0;
      const amount = donations?.reduce((sum, d) => sum + d.amount_inr, 0) || 0;
      setStats({ total, verified, amount });
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
              <div className="text-sm text-gray-600">Total Verified</div>
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
          transition={{ delay: 0.3 }}
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
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  Amount
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
                    <code className="text-sm text-orange-600 font-mono bg-orange-50 px-2 py-1 rounded">
                      {txn.hash}
                    </code>
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
                  <td className="px-6 py-4 text-right">
                    <span className="text-lg font-bold text-gray-900">
                      ₹{txn.amount.toLocaleString()}
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
            href="/transparency"
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


