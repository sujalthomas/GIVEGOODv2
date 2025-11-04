import { useState, useEffect } from 'react';

interface VolunteerData {
  id: string;
  name: string;
  area: string;
  pincode: string;
  help_types: string[];
  latitude: number;
  longitude: number;
}

interface FeederData {
  id: string;
  location_name: string;
  pincode: string;
  latitude: number;
  longitude: number;
  status: string;
  last_refilled_at: string | null;
  next_refill_due: string | null;
}

interface MapStats {
  volunteers: number;
  feeders: number;
  areas: number;
  coverage: number;
}

export function useMapData() {
  const [volunteers, setVolunteers] = useState<VolunteerData[]>([]);
  const [feeders, setFeeders] = useState<FeederData[]>([]);
  const [stats, setStats] = useState<MapStats>({ volunteers: 0, feeders: 0, areas: 0, coverage: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMapData();
  }, []);

  const fetchMapData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [volunteersRes, feedersRes, statsRes] = await Promise.all([
        fetch('/api/map/volunteers'),
        fetch('/api/map/feeders'),
        fetch('/api/map/stats')
      ]);

      if (!volunteersRes.ok || !feedersRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch map data');
      }

      const volunteersData = await volunteersRes.json();
      const feedersData = await feedersRes.json();
      const statsData = await statsRes.json();

      setVolunteers(volunteersData.volunteers || []);
      setFeeders(feedersData.feeders || []);
      setStats(statsData);

    } catch (err) {
      console.error('Error fetching map data:', err);
      setError('Failed to load map data');
    } finally {
      setLoading(false);
    }
  };

  return { volunteers, feeders, stats, loading, error, refetch: fetchMapData };
}

