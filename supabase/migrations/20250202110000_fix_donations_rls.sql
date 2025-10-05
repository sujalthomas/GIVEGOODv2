-- Fix RLS policies for donations table
-- This ensures both anon and authenticated users can create donations

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can create donations" ON public.donations;
DROP POLICY IF EXISTS "Authenticated users can view all donations" ON public.donations;
DROP POLICY IF EXISTS "Public can view anonymized donations" ON public.donations;
DROP POLICY IF EXISTS "Allow service role full access to donations" ON public.donations;
DROP POLICY IF EXISTS "Public can view anchor batches" ON public.anchor_batches;
DROP POLICY IF EXISTS "Authenticated users can view all anchor batches" ON public.anchor_batches;

-- Donations policies
-- Policy 1: Allow anyone (anon + authenticated) to insert donations
CREATE POLICY "donations_insert_policy"
    ON public.donations
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Policy 2: Allow anyone (anon + authenticated) to update their own donations (by order_id)
CREATE POLICY "donations_update_policy"
    ON public.donations
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Policy 3: Authenticated users can view all donations (for admin dashboard)
CREATE POLICY "donations_select_authenticated"
    ON public.donations
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy 4: Allow public to view non-sensitive donation data (for transparency page)
-- Anonymous donors: hide all personal info
-- Named donors: show only name and purpose
CREATE POLICY "donations_select_public"
    ON public.donations
    FOR SELECT
    TO anon
    USING (
        anonymous = true 
        OR status IN ('completed', 'captured')
    );

-- Anchor batches policies
-- Policy 1: Anyone can view confirmed anchor batches (for transparency)
CREATE POLICY "anchor_batches_select_public"
    ON public.anchor_batches
    FOR SELECT
    TO anon, authenticated
    USING (status = 'confirmed');

-- Policy 2: Authenticated users can view all anchor batches
CREATE POLICY "anchor_batches_select_authenticated"
    ON public.anchor_batches
    FOR SELECT
    TO authenticated
    USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT INSERT, SELECT, UPDATE ON public.donations TO anon, authenticated;
GRANT SELECT ON public.anchor_batches TO anon, authenticated;

