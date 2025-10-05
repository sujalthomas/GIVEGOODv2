"use client";
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, TrendingUp, CheckCircle, Sparkles } from 'lucide-react';
import { createSPASassClient } from '@/lib/supabase/client';

interface Activity {
  id: string;
  type: 'donation' | 'milestone' | 'verification';
  message: string;
  amount?: number;
  timestamp: string;
  icon: 'heart' | 'trending' | 'check' | 'sparkle';
}

export default function LiveActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivity();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchRecentActivity, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRecentActivity = async () => {
    try {
      const supabaseClient = await createSPASassClient();
      const supabase = supabaseClient.getSupabaseClient();

      // Fetch recent completed donations
      const { data: donations, error } = await supabase
        .from('donations')
        .select('id, amount_inr, purpose, anonymous, donor_name, created_at, status')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Convert to activity format
      const activityList: Activity[] = [];
      
      donations?.forEach((donation) => {
        const donorName = donation.anonymous 
          ? 'Someone special' 
          : (donation.donor_name ? donation.donor_name.split(' ')[0] : 'A generous donor');
        
        const purposeLabels: { [key: string]: string } = {
          feeder_construction: 'building feeders',
          medical_aid: 'medical aid',
          general: 'supporting our mission',
          food_supplies: 'food supplies',
        };
        
        const purposeText = donation.purpose ? (purposeLabels[donation.purpose] || 'helping animals') : 'helping animals';

        activityList.push({
          id: donation.id,
          type: 'donation',
          message: `${donorName} donated ₹${donation.amount_inr.toLocaleString()} for ${purposeText}`,
          amount: donation.amount_inr,
          timestamp: donation.created_at,
          icon: 'heart',
        });
      });

      setActivities(activityList);
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = (icon: string) => {
    switch (icon) {
      case 'heart':
        return <Heart className="w-5 h-5 text-primary-600" />;
      case 'trending':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'check':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'sparkle':
        return <Sparkles className="w-5 h-5 text-yellow-600" />;
      default:
        return <Heart className="w-5 h-5 text-primary-600" />;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <h3 className="text-xl font-bold text-gray-900">Live Activity</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <motion.div
          className="w-2 h-2 bg-green-500 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
        <h3 className="text-xl font-bold text-gray-900">Live Activity</h3>
      </div>

      {/* Activity Feed */}
      <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
        <AnimatePresence>
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className="flex gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  {getIcon(activity.icon)}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 font-medium">
                  {activity.message}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {getTimeAgo(activity.timestamp)}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* View All Link */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <a
          href="/transparency"
          className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center justify-center gap-2 group"
        >
          View Complete Ledger
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </a>
      </div>
    </div>
  );
}


