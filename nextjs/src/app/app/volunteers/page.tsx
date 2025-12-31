"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  UserCheck, Mail, MapPin, Calendar, Heart, Filter, Download,
  CheckCircle, XCircle, Clock, AlertTriangle
} from 'lucide-react';
import { createSPASassClient } from '@/lib/supabase/client';
import { useGlobal } from '@/lib/context/GlobalContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;

interface Volunteer {
  id: string;
  name: string;
  area: string;
  pincode: string;
  area_name: string | null;
  email: string | null;
  help_types: string[];
  status: 'pending' | 'approved' | 'rejected';
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [helpTypeFilter, setHelpTypeFilter] = useState<string>('all');
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const { user } = useGlobal();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is super admin
    if (user && user.email !== SUPER_ADMIN_EMAIL) {
      router.push('/app');
      return;
    }

    if (user) {
      fetchVolunteers();
    }
  }, [user, router]);

  const fetchVolunteers = async () => {
    try {
      const supabaseClient = await createSPASassClient();
      const supabase = supabaseClient.getSupabaseClient();

      const { data, error } = await supabase
        .from('volunteers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVolunteers((data || []) as Volunteer[]);
    } catch (error) {
      console.error('Error fetching volunteers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (volunteerId: string) => {
    setActionLoading(true);
    try {
      const response = await fetch('/api/volunteers/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volunteerId,
          status: 'approved'
        })
      });

      if (!response.ok) throw new Error('Failed to approve volunteer');

      await fetchVolunteers(); // Refresh list
    } catch (error) {
      console.error('Error approving volunteer:', error);
      toast({
        title: "Error",
        description: "Failed to approve volunteer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedVolunteer || !rejectionReason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a rejection reason.",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('/api/volunteers/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volunteerId: selectedVolunteer.id,
          status: 'rejected',
          rejectionReason: rejectionReason.trim()
        })
      });

      if (!response.ok) throw new Error('Failed to reject volunteer');

      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedVolunteer(null);
      await fetchVolunteers();
    } catch (error) {
      console.error('Error rejecting volunteer:', error);
      toast({
        title: "Error",
        description: "Failed to reject volunteer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getHelpTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      build: 'Build feeders',
      refill: 'Refill feeders',
      spread: 'Spread the word'
    };
    return labels[type] || type;
  };

  const filteredVolunteers = volunteers.filter(volunteer => {
    const matchesStatus = statusFilter === 'all' || volunteer.status === statusFilter;
    const matchesHelpType = helpTypeFilter === 'all' || volunteer.help_types.includes(helpTypeFilter);
    return matchesStatus && matchesHelpType;
  });

  const stats = {
    total: volunteers.length,
    pending: volunteers.filter(v => v.status === 'pending').length,
    approved: volunteers.filter(v => v.status === 'approved').length,
    rejected: volunteers.filter(v => v.status === 'rejected').length,
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Area', 'Pincode', 'Email', 'Help Types', 'Status', 'Submitted At'];
    const rows = volunteers.map(v => [
      v.name,
      v.area,
      v.pincode,
      v.email || 'N/A',
      v.help_types.map(getHelpTypeLabel).join('; '),
      v.status,
      new Date(v.created_at).toLocaleString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `volunteers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
            <UserCheck className="w-8 h-8 text-primary-600" />
            Volunteer Management
          </h1>
          <p className="text-gray-600 mt-1">
            Review and approve volunteer applications for Bangalore
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total</p>
                <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <UserCheck className="w-12 h-12 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter('pending')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Pending</p>
                <p className="text-3xl font-bold text-yellow-900">{stats.pending}</p>
              </div>
              <Clock className="w-12 h-12 text-yellow-600 opacity-50" />
            </div>
            {stats.pending > 0 && (
              <div className="mt-2 flex items-center gap-1 text-xs text-yellow-700">
                <AlertTriangle className="w-3 h-3" />
                Needs attention
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter('approved')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Approved</p>
                <p className="text-3xl font-bold text-green-900">{stats.approved}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter('rejected')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Rejected</p>
                <p className="text-3xl font-bold text-red-900">{stats.rejected}</p>
              </div>
              <XCircle className="w-12 h-12 text-red-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <CardTitle className="text-lg">Filters</CardTitle>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Status Filter */}
              <div className="flex gap-2">
                {(['all', 'pending', 'approved', 'rejected'] as StatusFilter[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === status
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                    {status !== 'all' && (
                      <span className="ml-1 text-xs opacity-75">
                        ({status === 'pending' ? stats.pending : status === 'approved' ? stats.approved : stats.rejected})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Help Type Filter */}
              <div className="flex gap-2">
                {['all', 'build', 'refill', 'spread'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setHelpTypeFilter(type)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${helpTypeFilter === type
                      ? 'bg-secondary-600 text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    {type === 'all' ? 'All Types' : getHelpTypeLabel(type)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Volunteers List */}
      <div className="grid gap-4">
        {filteredVolunteers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No volunteers found with the selected filter.</p>
            </CardContent>
          </Card>
        ) : (
          filteredVolunteers.map((volunteer, index) => (
            <motion.div
              key={volunteer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`hover:shadow-lg transition-shadow ${volunteer.status === 'pending' ? 'border-l-4 border-l-yellow-500' :
                volunteer.status === 'approved' ? 'border-l-4 border-l-green-500' :
                  'border-l-4 border-l-red-500'
                }`}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Volunteer Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                          {volunteer.name}
                          <Heart className="w-4 h-4 text-primary-500" />
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${volunteer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          volunteer.status === 'approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                          {volunteer.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>{volunteer.area}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary-400" />
                          <span className="font-mono font-semibold">{volunteer.pincode}</span>
                          {volunteer.area_name && (
                            <span className="text-xs text-gray-500">({volunteer.area_name})</span>
                          )}
                        </div>
                        {volunteer.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <a
                              href={`mailto:${volunteer.email}`}
                              className="text-primary-600 hover:underline"
                            >
                              {volunteer.email}
                            </a>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{new Date(volunteer.created_at).toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>

                      {/* Help Types */}
                      <div className="flex flex-wrap gap-2">
                        {volunteer.help_types.map((type) => (
                          <span
                            key={type}
                            className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                          >
                            {getHelpTypeLabel(type)}
                          </span>
                        ))}
                      </div>

                      {/* Geocoding Status */}
                      {volunteer.status === 'approved' && (
                        <div className="text-xs">
                          {volunteer.latitude && volunteer.longitude ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Geocoded: {volunteer.latitude.toFixed(4)}, {volunteer.longitude.toFixed(4)}
                            </span>
                          ) : (
                            <span className="text-yellow-600 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Geocoding pending...
                            </span>
                          )}
                        </div>
                      )}

                      {/* Rejection Reason */}
                      {volunteer.status === 'rejected' && volunteer.rejection_reason && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-xs font-semibold text-red-700">Rejection Reason:</p>
                          <p className="text-sm text-red-600 mt-1">{volunteer.rejection_reason}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {volunteer.status === 'pending' && (
                      <div className="flex gap-2 lg:flex-col">
                        <button
                          onClick={() => handleApprove(volunteer.id)}
                          disabled={actionLoading}
                          className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedVolunteer(volunteer);
                            setShowRejectDialog(true);
                          }}
                          disabled={actionLoading}
                          className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Volunteer Application</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting <strong>{selectedVolunteer?.name}</strong>&apos;s application.
              This will help improve future applications.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Pincode outside Bangalore area, Incomplete information, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={!rejectionReason.trim() || actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? 'Rejecting...' : 'Reject Application'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
