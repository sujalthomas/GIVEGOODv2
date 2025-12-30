// Feeder types based on database schema

export type FeederStatus = 'pending' | 'active' | 'inactive' | 'removed' | 'needs_repair';
export type FeederType = 'pvc_pipe' | 'metal_bowl' | 'wooden_box' | 'custom';
export type VolunteerRole = 'builder' | 'refiller' | 'maintainer';
export type FeederCondition = 'good' | 'needs_cleaning' | 'needs_repair' | 'damaged';
export type FoodType = 'dry_kibble' | 'wet_food' | 'rice_mix' | 'other';

export interface Feeder {
  id: string;
  created_at: string;
  updated_at: string;
  
  // Location
  location_name: string;
  pincode: string;
  area_name: string | null;
  landmark: string | null;
  latitude: number;
  longitude: number;
  
  // Details
  status: FeederStatus;
  capacity_kg: number | null;
  installation_date: string | null;
  photo_url: string | null;
  additional_photos: string[];
  
  // Maintenance
  refill_frequency_days: number;
  last_refilled_at: string | null;
  next_refill_due: string | null;
  
  // Workflow
  submitted_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  
  // Metadata
  notes: string | null;
  feeder_type: FeederType;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface FeederWithVolunteers extends Feeder {
  volunteer_count: number;
  volunteer_ids: string[];
}

export interface VolunteerFeeder {
  id: string;
  volunteer_id: string;
  feeder_id: string;
  role: VolunteerRole;
  assigned_at: string;
  is_primary: boolean;
}

export interface FeederRefill {
  id: string;
  created_at: string;
  updated_at: string;
  
  feeder_id: string;
  refilled_by: string;
  refill_date: string;
  food_quantity_kg: number;
  food_type: FoodType;
  
  verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  photo_url: string | null;
  
  notes: string | null;
  feeder_condition: FeederCondition;
}

export interface FeederSubmission {
  location_name: string;
  pincode: string;
  area_name?: string;
  landmark?: string;
  latitude: number;
  longitude: number;
  capacity_kg?: number;
  installation_date?: string;
  photo_url?: string;
  feeder_type?: string;
  notes?: string;
}

export interface RefillSubmission {
  feeder_id: string;
  refill_date?: string;
  food_quantity_kg: number;
  food_type?: string;
  photo_url?: string;
  notes?: string;
  feeder_condition?: FeederCondition;
}

