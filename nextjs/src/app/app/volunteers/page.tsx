"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { UserCheck, Mail, MapPin, Calendar, Heart, Filter, Download } from 'lucide-react';
import { createSPASassClient } from '@/lib/supabase/client';
import { useGlobal } from '@/lib/context/GlobalContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const SUPER_ADMIN_EMAIL = 'sujalt1811@gmail.com';

interface Volunteer {
  id: string;
  name: string;
  area: string;
  email: string | null;
  help_types: string[];
  created_at: string;
}

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const { user } = useGlobal();
  const router = useRouter();

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

      setVolunteers(data || []);
    } catch (error) {
      console.error('Error fetching volunteers:', error);
    } finally {
      setLoading(false);
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
    if (filter === 'all') return true;
    return volunteer.help_types.includes(filter);
  });

  const stats = {
    total: volunteers.length,
    builders: volunteers.filter(v => v.help_types.includes('build')).length,
    refillers: volunteers.filter(v => v.help_types.includes('refill')).length,
    spreaders: volunteers.filter(v => v.help_types.includes('spread')).length,
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Area', 'Email', 'Help Types', 'Submitted At'];
    const rows = volunteers.map(v => [
      v.name,
      v.area,
      v.email || 'N/A',
      v.help_types.map(getHelpTypeLabel).join('; '),
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
            Volunteer Submissions
          </h1>
          <p className="text-gray-600 mt-1">
            Manage and track all volunteer sign-ups for Give Good Club
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600">{stats.total}</div>
                <div className="text-sm text-gray-600 mt-1">Total Volunteers</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary-600">{stats.builders}</div>
                <div className="text-sm text-gray-600 mt-1">Want to Build</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-accent-700">{stats.refillers}</div>
                <div className="text-sm text-gray-600 mt-1">Want to Refill</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-500">{stats.spreaders}</div>
                <div className="text-sm text-gray-600 mt-1">Want to Spread</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <CardTitle className="text-lg">Filter by Interest</CardTitle>
            </div>
            <div className="flex gap-2">
              {['all', 'build', 'refill', 'spread'].map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === filterType
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filterType === 'all' ? 'All' : getHelpTypeLabel(filterType)}
                </button>
              ))}
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
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        {volunteer.name}
                        <Heart className="w-4 h-4 text-primary-500" />
                      </h3>
                      <div className="flex flex-col gap-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{volunteer.area}</span>
                        </div>
                        {volunteer.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <a
                              href={`mailto:${volunteer.email}`}
                              className="text-primary-600 hover:underline"
                            >
                              {volunteer.email}
                            </a>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(volunteer.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                      </div>
                    </div>
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
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

