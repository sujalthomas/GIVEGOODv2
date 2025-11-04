-- =====================================================
-- BANGALORE VOLUNTEER & FEEDER MANAGEMENT SYSTEM
-- Complete database schema migration
-- =====================================================

-- =====================================================
-- 1. UPDATE VOLUNTEERS TABLE
-- =====================================================

-- Add new columns to existing volunteers table
ALTER TABLE public.volunteers 
  ADD COLUMN IF NOT EXISTS pincode VARCHAR(6) NOT NULL DEFAULT '560001',
  ADD COLUMN IF NOT EXISTS area_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8),
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT 'Bangalore';

-- Create indexes for volunteers
CREATE INDEX IF NOT EXISTS idx_volunteers_status ON public.volunteers(status);
CREATE INDEX IF NOT EXISTS idx_volunteers_pincode ON public.volunteers(pincode);
CREATE INDEX IF NOT EXISTS idx_volunteers_area_name ON public.volunteers(area_name);
CREATE INDEX IF NOT EXISTS idx_volunteers_location ON public.volunteers 
  USING GIST (point(longitude, latitude)) WHERE longitude IS NOT NULL AND latitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_volunteers_reviewed_by ON public.volunteers(reviewed_by) WHERE reviewed_by IS NOT NULL;

-- Update RLS policies for volunteers (already has basic policies, adding new ones)
DROP POLICY IF EXISTS "Public can view approved volunteers" ON public.volunteers;
CREATE POLICY "Public can view approved volunteers"
  ON public.volunteers
  FOR SELECT
  TO anon
  USING (status = 'approved');

-- Policy: Authenticated users can update volunteers (for approval workflow)
DROP POLICY IF EXISTS "Authenticated users can update volunteers" ON public.volunteers;
CREATE POLICY "Authenticated users can update volunteers"
  ON public.volunteers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 2. CREATE FEEDERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.feeders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Location details
  location_name VARCHAR(255) NOT NULL,
  pincode VARCHAR(6) NOT NULL,
  area_name VARCHAR(255),
  landmark TEXT,
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  
  -- Feeder details
  status VARCHAR(20) NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'active', 'inactive', 'removed', 'needs_repair')),
  capacity_kg NUMERIC(5, 2) CHECK (capacity_kg IS NULL OR capacity_kg > 0),
  installation_date DATE,
  photo_url TEXT,
  additional_photos JSONB DEFAULT '[]'::jsonb,
  
  -- Maintenance schedule
  refill_frequency_days INTEGER DEFAULT 7 CHECK (refill_frequency_days > 0),
  last_refilled_at TIMESTAMPTZ,
  next_refill_due TIMESTAMPTZ,
  
  -- Submission workflow
  submitted_by UUID REFERENCES public.volunteers(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Metadata
  notes TEXT,
  feeder_type VARCHAR(50) DEFAULT 'pvc_pipe',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for feeders
CREATE INDEX idx_feeders_status ON public.feeders(status);
CREATE INDEX idx_feeders_pincode ON public.feeders(pincode);
CREATE INDEX idx_feeders_area_name ON public.feeders(area_name);
CREATE INDEX idx_feeders_location ON public.feeders USING GIST (point(longitude, latitude));
CREATE INDEX idx_feeders_next_refill ON public.feeders(next_refill_due) 
  WHERE status = 'active' AND next_refill_due IS NOT NULL;
CREATE INDEX idx_feeders_submitted_by ON public.feeders(submitted_by) WHERE submitted_by IS NOT NULL;
CREATE INDEX idx_feeders_created_at ON public.feeders(created_at DESC);

-- Enable RLS on feeders
ALTER TABLE public.feeders ENABLE ROW LEVEL SECURITY;

-- Feeders RLS policies
CREATE POLICY "Public can view active feeders"
  ON public.feeders
  FOR SELECT
  TO anon
  USING (status = 'active');

CREATE POLICY "Authenticated users can view all feeders"
  ON public.feeders
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Approved volunteers can submit feeders"
  ON public.feeders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    submitted_by IN (
      SELECT id FROM public.volunteers WHERE status = 'approved'
    )
  );

CREATE POLICY "Authenticated users can update feeders"
  ON public.feeders
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 3. CREATE VOLUNTEER_FEEDERS JUNCTION TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.volunteer_feeders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id UUID NOT NULL REFERENCES public.volunteers(id) ON DELETE CASCADE,
  feeder_id UUID NOT NULL REFERENCES public.feeders(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'refiller'
    CHECK (role IN ('builder', 'refiller', 'maintainer')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_primary BOOLEAN DEFAULT FALSE,
  
  UNIQUE(volunteer_id, feeder_id)
);

-- Indexes for junction table
CREATE INDEX idx_volunteer_feeders_volunteer ON public.volunteer_feeders(volunteer_id);
CREATE INDEX idx_volunteer_feeders_feeder ON public.volunteer_feeders(feeder_id);
CREATE INDEX idx_volunteer_feeders_primary ON public.volunteer_feeders(feeder_id, is_primary) WHERE is_primary = true;

-- Enable RLS
ALTER TABLE public.volunteer_feeders ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated can view volunteer_feeders"
  ON public.volunteer_feeders
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can manage volunteer_feeders"
  ON public.volunteer_feeders
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 4. CREATE FEEDER_REFILLS TABLE (MOST IMPORTANT)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.feeder_refills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Refill details
  feeder_id UUID NOT NULL REFERENCES public.feeders(id) ON DELETE CASCADE,
  refilled_by UUID NOT NULL REFERENCES public.volunteers(id) ON DELETE SET NULL,
  refill_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  food_quantity_kg NUMERIC(5, 2) NOT NULL CHECK (food_quantity_kg > 0 AND food_quantity_kg <= 100),
  food_type VARCHAR(100) DEFAULT 'dry_kibble',
  
  -- Verification
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  photo_url TEXT,
  
  -- Condition reporting
  notes TEXT,
  feeder_condition VARCHAR(50) DEFAULT 'good'
    CHECK (feeder_condition IN ('good', 'needs_cleaning', 'needs_repair', 'damaged'))
);

-- Indexes for refills
CREATE INDEX idx_refills_feeder ON public.feeder_refills(feeder_id);
CREATE INDEX idx_refills_volunteer ON public.feeder_refills(refilled_by);
CREATE INDEX idx_refills_date ON public.feeder_refills(refill_date DESC);
CREATE INDEX idx_refills_verified ON public.feeder_refills(verified);
CREATE INDEX idx_refills_created_at ON public.feeder_refills(created_at DESC);

-- Enable RLS
ALTER TABLE public.feeder_refills ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Public can view verified refills"
  ON public.feeder_refills
  FOR SELECT
  TO anon
  USING (verified = true);

CREATE POLICY "Authenticated can view all refills"
  ON public.feeder_refills
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Approved volunteers can log refills"
  ON public.feeder_refills
  FOR INSERT
  TO authenticated
  WITH CHECK (
    refilled_by IN (
      SELECT id FROM public.volunteers WHERE status = 'approved'
    )
  );

CREATE POLICY "Authenticated can update refills"
  ON public.feeder_refills
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 5. TRIGGERS & FUNCTIONS
-- =====================================================

-- Function to auto-update next_refill_due when refill is logged
CREATE OR REPLACE FUNCTION public.update_feeder_refill_schedule()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.feeders 
  SET 
    last_refilled_at = NEW.refill_date,
    next_refill_due = NEW.refill_date + (refill_frequency_days || ' days')::INTERVAL,
    updated_at = NOW()
  WHERE id = NEW.feeder_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_refill_schedule ON public.feeder_refills;
CREATE TRIGGER trigger_update_refill_schedule
  AFTER INSERT ON public.feeder_refills
  FOR EACH ROW
  EXECUTE FUNCTION public.update_feeder_refill_schedule();

-- Function to auto-update timestamps
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_feeders_timestamp ON public.feeders;
CREATE TRIGGER set_feeders_timestamp
  BEFORE UPDATE ON public.feeders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS set_refills_timestamp ON public.feeder_refills;
CREATE TRIGGER set_refills_timestamp
  BEFORE UPDATE ON public.feeder_refills
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();

-- =====================================================
-- 6. HELPER VIEWS & FUNCTIONS
-- =====================================================

-- View: Feeders with volunteer counts
CREATE OR REPLACE VIEW public.feeders_with_volunteers AS
SELECT 
  f.*,
  COUNT(DISTINCT vf.volunteer_id) as volunteer_count,
  ARRAY_AGG(DISTINCT vf.volunteer_id) FILTER (WHERE vf.volunteer_id IS NOT NULL) as volunteer_ids
FROM public.feeders f
LEFT JOIN public.volunteer_feeders vf ON f.id = vf.feeder_id
GROUP BY f.id;

-- Function: Get area statistics
CREATE OR REPLACE FUNCTION public.get_area_stats(p_pincode VARCHAR DEFAULT NULL)
RETURNS TABLE (
  pincode VARCHAR,
  area_name VARCHAR,
  volunteer_count BIGINT,
  feeder_count BIGINT,
  active_feeder_count BIGINT,
  total_refills_30d BIGINT,
  avg_coverage_percent NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(v.pincode, f.pincode) as pincode,
    COALESCE(v.area_name, f.area_name) as area_name,
    COUNT(DISTINCT v.id) as volunteer_count,
    COUNT(DISTINCT f.id) as feeder_count,
    COUNT(DISTINCT f.id) FILTER (WHERE f.status = 'active') as active_feeder_count,
    COUNT(DISTINCT r.id) FILTER (WHERE r.refill_date >= NOW() - INTERVAL '30 days') as total_refills_30d,
    -- Simple coverage calculation (can be enhanced)
    CASE 
      WHEN COUNT(DISTINCT f.id) > 0 THEN 
        LEAST(100, COUNT(DISTINCT f.id) * 10)::NUMERIC
      ELSE 0
    END as avg_coverage_percent
  FROM public.volunteers v
  FULL OUTER JOIN public.feeders f ON v.pincode = f.pincode
  LEFT JOIN public.feeder_refills r ON f.id = r.feeder_id
  WHERE 
    (p_pincode IS NULL OR v.pincode = p_pincode OR f.pincode = p_pincode)
    AND (v.status = 'approved' OR v.status IS NULL)
    AND (f.status IN ('active', 'needs_repair') OR f.status IS NULL)
  GROUP BY COALESCE(v.pincode, f.pincode), COALESCE(v.area_name, f.area_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get feeders needing refill
CREATE OR REPLACE FUNCTION public.get_feeders_needing_refill()
RETURNS TABLE (
  id UUID,
  location_name VARCHAR,
  area_name VARCHAR,
  pincode VARCHAR,
  last_refilled_at TIMESTAMPTZ,
  next_refill_due TIMESTAMPTZ,
  days_overdue INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.location_name,
    f.area_name,
    f.pincode,
    f.last_refilled_at,
    f.next_refill_due,
    EXTRACT(DAY FROM NOW() - f.next_refill_due)::INTEGER as days_overdue
  FROM public.feeders f
  WHERE 
    f.status = 'active'
    AND f.next_refill_due < NOW()
  ORDER BY f.next_refill_due ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.feeders IS 'Pet feeders across Bangalore with location and maintenance tracking';
COMMENT ON TABLE public.volunteer_feeders IS 'Many-to-many relationship between volunteers and feeders they maintain';
COMMENT ON TABLE public.feeder_refills IS 'Log of all feeder refills with verification status';
COMMENT ON COLUMN public.volunteers.pincode IS 'Bangalore pincode (560xxx format)';
COMMENT ON COLUMN public.volunteers.status IS 'Approval status: pending, approved, rejected';
COMMENT ON COLUMN public.feeders.next_refill_due IS 'Auto-calculated based on last refill + frequency';
COMMENT ON FUNCTION public.update_feeder_refill_schedule() IS 'Automatically updates feeder refill schedule when new refill is logged';

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON public.feeders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.volunteer_feeders TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.feeder_refills TO authenticated;
GRANT SELECT ON public.feeders_with_volunteers TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_area_stats TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_feeders_needing_refill TO authenticated;

-- =====================================================
-- END OF MIGRATION
-- =====================================================

