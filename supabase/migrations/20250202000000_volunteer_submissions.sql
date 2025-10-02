-- Create volunteers table for Give Good Club submissions
CREATE TABLE IF NOT EXISTS public.volunteers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    area TEXT NOT NULL,
    email TEXT,
    help_types TEXT[] NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert (public volunteer form)
CREATE POLICY "Anyone can submit volunteer form"
    ON public.volunteers
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Policy: Only authenticated users can view (for dashboard)
CREATE POLICY "Authenticated users can view volunteers"
    ON public.volunteers
    FOR SELECT
    TO authenticated
    USING (true);

-- Create index for faster queries
CREATE INDEX idx_volunteers_created_at ON public.volunteers(created_at DESC);
CREATE INDEX idx_volunteers_email ON public.volunteers(email);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_volunteers_updated_at
    BEFORE UPDATE ON public.volunteers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Add comment
COMMENT ON TABLE public.volunteers IS 'Stores volunteer form submissions for Give Good Club';

