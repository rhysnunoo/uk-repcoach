-- Add summary column to calls table for AI-generated TLDR
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS summary TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.calls.summary IS 'AI-generated summary/TLDR of the call scoring';
