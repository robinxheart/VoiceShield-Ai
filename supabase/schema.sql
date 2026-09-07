CREATE TABLE IF NOT EXISTS public.call_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    filename TEXT,
    duration_seconds NUMERIC,
    deepfake_probability NUMERIC,
    aasist_spoof_score NUMERIC,
    bona_fide_probability NUMERIC,
    final_risk NUMERIC,
    level TEXT,
    model TEXT,
    status TEXT
);

ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own sessions"
    ON public.call_sessions
    FOR ALL
    USING (auth.uid() = user_id);