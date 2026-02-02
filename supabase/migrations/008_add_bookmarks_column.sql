-- Add bookmarks column to calls table
-- Bookmarks allow managers and reps to mark important moments in call recordings

ALTER TABLE calls
ADD COLUMN IF NOT EXISTS bookmarks JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN calls.bookmarks IS 'Array of bookmarks with start_time, end_time, note, tag, created_at, created_by';

-- Create index for faster bookmark queries (GIN index for JSONB)
CREATE INDEX IF NOT EXISTS idx_calls_bookmarks ON calls USING GIN (bookmarks);
