"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, AlertCircle } from 'lucide-react';
import { useGlobal } from '@/lib/context/GlobalContext';
import { createSPASassClient } from '@/lib/supabase/client';
import FeederSubmissionForm from '@/components/FeederSubmissionForm';

export default function SubmitFeederPage() {
  const { user, loading: userLoading } = useGlobal();
  const router = useRouter();
  const [isApprovedVolunteer, setIsApprovedVolunteer] = useState(false);
  const [checking, setChecking] = useState(true);
  const isMountedRef = useRef(true);

  // Cleanup ref on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const checkVolunteerStatus = async () => {
      // Handle unauthenticated users after loading completes
      if (!user && !userLoading) {
        router.push('/auth/login?redirect=/app/submit-feeder');
        setChecking(false);
        return;
      }

      // Still loading user, wait
      if (!user) {
        return;
      }

      try {
        const supabaseClient = await createSPASassClient();
        const supabase = supabaseClient.getSupabaseClient();

        // User may not have email if authenticated via certain methods
        if (!user.email) {
          setIsApprovedVolunteer(false);
          setChecking(false);
          return;
        }

        const { data: volunteer } = await supabase
          .from('volunteers')
          .select('id, status')
          .eq('email', user.email)
          .eq('status', 'approved')
          .maybeSingle();

        setIsApprovedVolunteer(!!volunteer);
      } catch (error) {
        console.error('Error checking volunteer status:', error);
        setIsApprovedVolunteer(false);
      } finally {
        setChecking(false);
      }
    };

    checkVolunteerStatus();
  }, [user, userLoading, router]);

  if (userLoading || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen" role="status" aria-label="Loading">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" aria-hidden="true"></div>
        <span className="sr-only">Checking volunteer status...</span>
      </div>
    );
  }

  // User check now handled in useEffect, this is just a safety fallback
  if (!user) {
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
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" aria-hidden="true" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Volunteer Approval Required
          </h2>
          <p className="text-gray-600 mb-6">
            Only approved volunteers can submit feeders. Please sign up as a volunteer first and wait for admin approval.
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
    <div className="max-w-2xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2 mb-2">
          <Home className="w-8 h-8 text-primary-600" />
          Submit a New Feeder
        </h1>
        <p className="text-gray-600">
          Help us expand our feeder network across Bangalore. Your submission will be reviewed by our admin team.
        </p>
      </motion.div>

      <FeederSubmissionForm
        adminMode={false}
        onSuccess={() => {
          setTimeout(() => {
            if (isMountedRef.current) {
              router.push('/app');
            }
          }, 3000);
        }}
      />

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">Tips for Feeder Placement:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Choose a safe, accessible location</li>
          <li>• Near a wall or tree for protection</li>
          <li>• Away from heavy traffic</li>
          <li>• Consider local animal population</li>
          <li>• Take a clear photo of the proposed location</li>
        </ul>
      </div>
    </div>
  );
}

