// Extended volunteer types

export type VolunteerStatus = 'pending' | 'approved' | 'rejected';

export interface VolunteerExtended {
  id: string;
  name: string;
  area: string;
  email: string | null;
  help_types: string[];
  created_at: string;
  updated_at: string;
  
  // New fields
  pincode: string;
  area_name: string | null;
  status: VolunteerStatus;
  latitude: number | null;
  longitude: number | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  city: string;
}

export interface AreaStats {
  pincode: string;
  area_name: string;
  volunteer_count: number;
  feeder_count: number;
  active_feeder_count: number;
  total_refills_30d: number;
  avg_coverage_percent: number;
}

export interface MapMarkerData {
  id: string;
  type: 'volunteer' | 'feeder';
  latitude: number;
  longitude: number;
  name: string;
  area: string;
  pincode: string;
  status: string;
  metadata: Record<string, unknown>;
}

