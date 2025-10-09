"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Heart, Mail, Phone, Calendar, IndianRupee, Filter, 
  Download, TrendingUp, Users, CreditCard, CheckCircle,
  Clock, XCircle, DollarSign, Target, Wallet
} from 'lucide-react';
import { createSPASassClient } from '@/lib/supabase/client';
import { useGlobal } from '@/lib/context/GlobalContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const SUPER_ADMIN_EMAIL = 'sujalt1811@gmail.com';

interface Donation {
  id: string;
  amount_inr: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  donor_name: string | null;
  donor_email: string | null;
  donor_phone: string | null;
  anonymous: boolean;
  purpose: string;
  payment_method: string | null;
  provider: string;
  payment_id: string;
  order_id: string;
  created_at: string;
  webhook_received_at: string | null;
  razorpay_fee_inr?: number;
  tax_amount_inr?: number;
  net_amount_inr?: number;
}

export default function DonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [purposeFilter, setPurposeFilter] = useState<string>('all');
  const { user } = useGlobal();
  const router = useRouter();

  useEffect(() => {
    // Check if user is super admin
    if (user && user.email !== SUPER_ADMIN_EMAIL) {
      router.push('/app');
      return;
    }

    if (user) {
      fetchDonations();
    }
  }, [user, router]);

  const fetchDonations = async () => {
    try {
      const supabaseClient = await createSPASassClient();
      const supabase = supabaseClient.getSupabaseClient();

      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDonations((data || []) as Donation[]);
    } catch (error) {
      console.error('Error fetching donations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPurposeLabel = (purpose: string) => {
    const labels: { [key: string]: string } = {
      feeder_construction: 'Build Feeders',
      medical_aid: 'Medical Aid',
      general: 'General Support',
      food_supplies: 'Food Supplies',
    };
    return labels[purpose] || purpose;
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      completed: 'text-green-600 bg-green-100',
      pending: 'text-yellow-600 bg-yellow-100',
      failed: 'text-red-600 bg-red-100',
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  const getStatusIcon = (status: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      completed: <CheckCircle className="w-4 h-4" />,
      pending: <Clock className="w-4 h-4" />,
      failed: <XCircle className="w-4 h-4" />,
    };
    return icons[status] || <Clock className="w-4 h-4" />;
  };

  // Calculate stats
  const stats = useMemo(() => {
    const completed = donations.filter(d => d.status === 'completed');
    const totalAmount = completed.reduce((sum, d) => sum + d.amount_inr, 0);
    const totalNetAmount = completed.reduce((sum, d) => sum + (d.net_amount_inr || d.amount_inr), 0);
    const totalFees = totalAmount - totalNetAmount;
    const avgDonation = completed.length > 0 ? totalAmount / completed.length : 0;
    
    const purposeBreakdown = completed.reduce((acc, d) => {
      acc[d.purpose] = (acc[d.purpose] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const paymentMethods = completed.reduce((acc, d) => {
      const method = d.payment_method || 'unknown';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    // Monthly trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentDonations = completed.filter(
      d => new Date(d.created_at) >= thirtyDaysAgo
    );

    return {
      total: donations.length,
      completed: completed.length,
      pending: donations.filter(d => d.status === 'pending').length,
      failed: donations.filter(d => d.status === 'failed').length,
      totalAmount,
      totalNetAmount,
      totalFees,
      avgDonation,
      purposeBreakdown,
      paymentMethods,
      recentCount: recentDonations.length,
      recentAmount: recentDonations.reduce((sum, d) => sum + d.amount_inr, 0),
      recentNetAmount: recentDonations.reduce((sum, d) => sum + (d.net_amount_inr || d.amount_inr), 0),
    };
  }, [donations]);

  // Filtering
  const filteredDonations = useMemo(() => {
    return donations.filter(donation => {
      const matchesStatus = statusFilter === 'all' || donation.status === statusFilter;
      const matchesPurpose = purposeFilter === 'all' || donation.purpose === purposeFilter;
      return matchesStatus && matchesPurpose;
    });
  }, [donations, statusFilter, purposeFilter]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      'Donation ID',
      'Date',
      'Amount (₹)',
      'Status',
      'Donor Name',
      'Email',
      'Phone',
      'Purpose',
      'Payment Method',
      'Payment ID',
      'Anonymous'
    ];
    
    const rows = donations.map(d => [
      d.id,
      new Date(d.created_at).toLocaleString(),
      d.amount_inr,
      d.status,
      d.anonymous ? 'Anonymous' : (d.donor_name || 'N/A'),
      d.anonymous ? 'Hidden' : (d.donor_email || 'N/A'),
      d.anonymous ? 'Hidden' : (d.donor_phone || 'N/A'),
      getPurposeLabel(d.purpose),
      d.payment_method || 'N/A',
      d.payment_id,
      d.anonymous ? 'Yes' : 'No'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `donations_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (user?.email !== SUPER_ADMIN_EMAIL) {
    return null;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Heart className="w-8 h-8 text-primary-600" />
            Donation Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Track and manage all donations for Give Good Club
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm opacity-90">Total Raised (Gross)</div>
                  <div className="text-3xl font-bold mt-1">
                    ₹{stats.totalAmount.toLocaleString()}
                  </div>
                  <div className="text-xs opacity-75 mt-1 space-y-0.5">
                    <div>Net: ₹{stats.totalNetAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    <div>Fees: ₹{stats.totalFees.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    <div className="mt-1">{stats.completed} donations</div>
                  </div>
                </div>
                <DollarSign className="w-12 h-12 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-90">Average Donation</div>
                  <div className="text-3xl font-bold mt-1">
                    ₹{Math.round(stats.avgDonation).toLocaleString()}
                  </div>
                  <div className="text-xs opacity-75 mt-1">
                    Per contribution
                  </div>
                </div>
                <TrendingUp className="w-12 h-12 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm opacity-90">Last 30 Days</div>
                  <div className="text-3xl font-bold mt-1">
                    ₹{stats.recentAmount.toLocaleString()}
                  </div>
                  <div className="text-xs opacity-75 mt-1 space-y-0.5">
                    <div>Net: ₹{stats.recentNetAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    <div className="mt-1">{stats.recentCount} donations</div>
                  </div>
                </div>
                <Calendar className="w-12 h-12 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-90">Total Donors</div>
                  <div className="text-3xl font-bold mt-1">{stats.total}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {stats.pending} pending
                  </div>
                </div>
                <Users className="w-12 h-12 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Amount in Wallet - Highlighted Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-6"
      >
        <Card className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 text-white border-4 border-green-300 shadow-2xl">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-6 h-6" />
                  <div className="text-lg font-semibold opacity-90">💰 Amount in Wallet (Net to Charity)</div>
                </div>
                <div className="text-5xl font-bold mt-2">
                  ₹{stats.totalNetAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <div className="text-sm opacity-90 mt-3 flex items-center gap-4">
                  <span>✅ After all payment fees deducted</span>
                  <span className="opacity-75">|</span>
                  <span>📊 Fees paid: ₹{stats.totalFees.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                  <DollarSign className="w-16 h-16" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Breakdown Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Purpose Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary-600" />
                Donations by Purpose
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.purposeBreakdown).map(([purpose, count]) => {
                  const percentage = stats.completed > 0 
                    ? Math.round((count / stats.completed) * 100) 
                    : 0;
                  return (
                    <div key={purpose} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{getPurposeLabel(purpose)}</span>
                        <span className="text-gray-600">{count} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary-600" />
                Payment Methods Used
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.paymentMethods).map(([method, count]) => {
                  const percentage = stats.completed > 0 
                    ? Math.round((count / stats.completed) * 100) 
                    : 0;
                  return (
                    <div key={method} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium capitalize">{method}</span>
                        <span className="text-gray-600">{count} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-secondary-600 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <CardTitle className="text-lg">Filter Donations</CardTitle>
            </div>
            <div className="flex flex-wrap gap-4">
              {/* Status Filter */}
              <div className="flex gap-2">
                {['all', 'completed', 'pending', 'failed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter === status
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
              {/* Purpose Filter */}
              <select
                value={purposeFilter}
                onChange={(e) => setPurposeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                <option value="all">All Purposes</option>
                {Object.keys(stats.purposeBreakdown).map((purpose) => (
                  <option key={purpose} value={purpose}>
                    {getPurposeLabel(purpose)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Donations List */}
      <div className="grid gap-4">
        {filteredDonations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No donations found with the selected filters.</p>
            </CardContent>
          </Card>
        ) : (
          filteredDonations.map((donation, index) => (
            <motion.div
              key={donation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Donor Info */}
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {donation.anonymous ? 'Anonymous Donor' : (donation.donor_name || 'Unknown')}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(donation.status)}`}>
                          {getStatusIcon(donation.status)}
                          {donation.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        {!donation.anonymous && donation.donor_email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <a
                              href={`mailto:${donation.donor_email}`}
                              className="text-primary-600 hover:underline"
                            >
                              {donation.donor_email}
                            </a>
                          </div>
                        )}
                        {!donation.anonymous && donation.donor_phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <span>{donation.donor_phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(donation.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        {donation.payment_method && (
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            <span className="capitalize">{donation.payment_method}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-gray-500 font-mono">
                        ID: {donation.id.slice(0, 8)}... | Payment: {donation.payment_id}
                      </div>
                    </div>

                    {/* Right: Amount & Purpose */}
                    <div className="flex flex-col items-end gap-2 lg:min-w-[200px]">
                      <div className="text-3xl font-bold text-primary-600 flex items-center">
                        <IndianRupee className="w-6 h-6" />
                        {donation.amount_inr.toLocaleString()}
                      </div>
                      <span className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm font-medium">
                        {getPurposeLabel(donation.purpose)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Summary Footer */}
      <Card className="bg-gradient-to-r from-primary-50 to-secondary-50">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Showing {filteredDonations.length} of {donations.length} donations
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Total amount from filtered donations: ₹
              {filteredDonations
                .filter(d => d.status === 'completed')
                .reduce((sum, d) => sum + d.amount_inr, 0)
                .toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

