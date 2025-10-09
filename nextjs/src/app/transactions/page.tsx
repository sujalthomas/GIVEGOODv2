/**
 * Full Transactions Page
 * 
 * Complete, paginated view of all donation transactions
 * with filtering, sorting, and blockchain status
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Anchor, 
  ExternalLink,
  ArrowLeft,
  Search,
  Download,
  Copy,
  Check,
} from 'lucide-react';
import { createSPASassClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Transaction {
  id: string;
  payment_id: string;
  date: string;
  recipient: string;
  category: string;
  status: string;
  amount: number;
  netAmount: number;
  anchored: boolean;
  batchId?: string;
  txSignature?: string;
  donor_name?: string;
  anonymous: boolean;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'anchored' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const itemsPerPage = 20;

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const supabaseClient = await createSPASassClient();
      const supabase = supabaseClient.getSupabaseClient();

      let query = supabase
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
          donor_name,
          anchored,
          anchor_batch_id,
          anchor_batches(onchain_tx_signature)
        `, { count: 'exact' })
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filter === 'anchored') {
        query = query.eq('anchored', true);
      } else if (filter === 'pending') {
        query = query.eq('anchored', false);
      }

      // Apply search
      if (searchTerm) {
        query = query.or(`payment_id.ilike.%${searchTerm}%,id.ilike.%${searchTerm}%`);
      }

      // Pagination
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data: donations, error, count } = await query;

      if (error) throw error;

      type DonationData = {
        id: string;
        payment_id: string;
        amount_inr: number;
        net_amount_inr: number | null;
        purpose: string | null;
        created_at: string;
        status: string;
        anonymous: boolean | null;
        donor_name: string | null;
        anchored: boolean | null;
        anchor_batch_id: string | null;
        anchor_batches: { onchain_tx_signature: string | null } | null;
      };
      const donationData = (donations || []) as unknown as DonationData[];

      const txns: Transaction[] = donationData.map((d) => ({
        id: d.id,
        payment_id: d.payment_id,
        date: new Date(d.created_at).toISOString().split('T')[0],
        recipient: getRecipientName(d.purpose),
        category: getCategoryLabel(d.purpose),
        status: 'Verified',
        amount: d.amount_inr,
        netAmount: d.net_amount_inr || d.amount_inr,
        anchored: d.anchored || false,
        batchId: d.anchor_batch_id || undefined,
        txSignature: d.anchor_batches?.onchain_tx_signature || undefined,
        donor_name: d.donor_name || undefined,
        anonymous: d.anonymous || false,
      }));

      setTransactions(txns);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, searchTerm, page]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const getRecipientName = (purpose: string | null) => {
    if (!purpose) return 'Give Good Club';
    const recipients: { [key: string]: string } = {
      feeder_construction: 'Feeder Construction',
      food_supplies: 'Food Supplies',
      medical_aid: 'Medical Aid',
      emergency_rescue: 'Emergency Rescue',
      general: 'General Support',
    };
    return recipients[purpose] || 'Give Good Club';
  };

  const getCategoryLabel = (purpose: string | null) => {
    if (!purpose) return 'General';
    const labels: { [key: string]: string } = {
      feeder_construction: 'Construction',
      food_supplies: 'Food',
      medical_aid: 'Medical',
      emergency_rescue: 'Rescue',
      general: 'General',
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

  const exportToCSV = () => {
    const headers = ['Date', 'Payment ID', 'Donor', 'Amount', 'Net Amount', 'Category', 'Blockchain Status'];
    const rows = transactions.map(t => [
      t.date,
      t.payment_id,
      t.anonymous ? 'Anonymous' : (t.donor_name || 'Anonymous'),
      t.amount,
      t.netAmount,
      t.category,
      t.anchored ? 'On Blockchain' : 'Pending',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Complete Transaction Ledger
          </h1>
          <p className="text-gray-600">
            View all donation transactions with real-time blockchain status
          </p>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by payment ID or donation ID..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => { setFilter('all'); setPage(1); }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => { setFilter('anchored'); setPage(1); }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                  filter === 'anchored'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Anchor className="w-4 h-4" />
                On Blockchain
              </button>
              <button
                onClick={() => { setFilter('pending'); setPage(1); }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'pending'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending
              </button>
            </div>

            {/* Export */}
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Showing {transactions.length} of {totalCount} transactions
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading transactions...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Payment ID
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Donor
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Recipient
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Category
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
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Calendar className="w-4 h-4" />
                            {txn.date}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <code className="text-xs text-orange-600 font-mono bg-orange-50 px-2 py-1 rounded">
                              {txn.payment_id.slice(0, 12)}...
                            </code>
                            <button
                              onClick={() => copyToClipboard(txn.payment_id, txn.payment_id)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              title="Copy payment ID"
                            >
                              {copiedId === txn.payment_id ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800">
                          {txn.anonymous ? 'Anonymous' : (txn.donor_name || 'Anonymous')}
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
                          <span className="text-base font-semibold text-gray-900">
                            ₹{txn.amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-base font-semibold text-green-700">
                            ₹{txn.netAmount.toLocaleString()}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      Page {page} of {totalPages}
                    </span>
                  </div>

                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

