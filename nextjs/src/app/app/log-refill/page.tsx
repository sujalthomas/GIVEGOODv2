"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Droplets, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useGlobal } from '@/lib/context/GlobalContext';
import { createSPASassClient } from '@/lib/supabase/client';
import RefillLogForm from '@/components/RefillLogForm';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const SUPER_ADMIN_EMAIL = 'sujalt1811@gmail.com';

interface RecentRefill {
  id: string;
  refill_date: string;
  food_quantity_kg: number;
  food_type: string;
  verified: boolean;
  feeders: {
    location_name: string;
    area_name: string | null;
  };
}

export default function LogRefillPage() {
  const { user, loading: userLoading } = useGlobal();
  const router = useRouter();
  const [isApprovedVolunteer, setIsApprovedVolunteer] = useState(false);
  const [checking, setChecking] = useState(true);
  const [stats, setStats] = useState({ assignedFeeders: 0, totalRefills: 0, thisMonth: 0 });
  const [recentRefills, setRecentRefills] = useState<RecentRefill[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkVolunteerStatus = async () => {
      if (!user) {
        setChecking(false);
        return;
      }

      try {
        const supabaseClient = await createSPASassClient();
        const supabase = supabaseClient.getSupabaseClient();

        // Check if admin
        const adminCheck = user.email === SUPER_ADMIN_EMAIL;
        setIsAdmin(adminCheck);

        // Get volunteer data
        const { data: volunteer } = await supabase
          .from('volunteers')
          .select('id, status')
          .eq('email', user.email)
          .maybeSingle();

        if (!volunteer || volunteer.status !== 'approved') {
          setIsApprovedVolunteer(false);
          setChecking(false);
          return;
        }

        setIsApprovedVolunteer(true);

        // Fetch volunteer stats
        const { count: assignedCount } = await supabase
          .from('volunteer_feeders')
          .select('*', { count: 'exact', head: true })
          .eq('volunteer_id', volunteer.id);

        const { count: totalRefills } = await supabase
          .from('feeder_refills')
          .select('*', { count: 'exact', head: true })
          .eq('refilled_by', volunteer.id);

        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        firstDayOfMonth.setHours(0, 0, 0, 0);

        const { count: monthlyRefills } = await supabase
          .from('feeder_refills')
          .select('*', { count: 'exact', head: true })
          .eq('refilled_by', volunteer.id)
          .gte('refill_date', firstDayOfMonth.toISOString());

        setStats({
          assignedFeeders: assignedCount || 0,
          totalRefills: totalRefills || 0,
          thisMonth: monthlyRefills || 0
        });

        // Fetch recent refills
        const { data: refills } = await supabase
          .from('feeder_refills')
          .select(`
            id,
            refill_date,
            food_quantity_kg,
            food_type,
            verified,
            feeders (
              location_name,
              area_name
            )
          `)
          .eq('refilled_by', volunteer.id)
          .order('refill_date', { ascending: false })
          .limit(5);

        setRecentRefills((refills || []) as RecentRefill[]);

      } catch (error) {
        console.error('Error checking volunteer status:', error);
        setIsApprovedVolunteer(false);
      } finally {
        setChecking(false);
      }
  };

  useEffect(() => {
    checkVolunteerStatus();
  }, [user]);

  if (userLoading || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/auth/login?redirect=/app/log-refill');
    return null;
  }

  if (!isApprovedVolunteer) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 text-center"
        >
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Volunteer Approval Required
          </h2>
          <p className="text-gray-600 mb-6">
            Only approved volunteers can log refills. Please sign up as a volunteer first and wait for admin approval.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push('/')}
              className="bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors"
            >
              Go to Homepage
            </button>
            <button
              onClick={() => router.push('/app')}
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-300 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2 mb-2">
          <Droplets className="w-8 h-8 text-primary-600" />
          Log a Refill
        </h1>
        <p className="text-gray-600">
          Track your feeder maintenance activities and help us monitor our impact.
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-900">{stats.assignedFeeders}</div>
              <div className="text-sm text-blue-700 mt-1">Assigned Feeders</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-900">{stats.totalRefills}</div>
              <div className="text-sm text-green-700 mt-1">Total Refills Logged</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-900">{stats.thisMonth}</div>
              <div className="text-sm text-purple-700 mt-1">This Month</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Refill Form */}
      <RefillLogForm 
        adminMode={isAdmin}
        onSuccess={() => {
          checkVolunteerStatus(); // Refresh stats
        }}
      />

      {/* Recent Refills */}
      {recentRefills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Your Recent Refills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentRefills.map((refill) => (
                <div
                  key={refill.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {refill.feeders.location_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(refill.refill_date).toLocaleDateString('en-IN')} - {refill.food_quantity_kg} kg {refill.food_type.replace('_', ' ')}
                    </p>
                  </div>
                  {refill.verified ? (
                    <div className="flex items-center gap-1 text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      <span>Verified</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-yellow-600 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>Pending</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

