-- Update Inspector Profiles Schema Migration
-- This migration updates the profiles table to support full inspector profile functionality
-- with all required fields for certification tracking

-- Drop the existing profiles table and recreate with the new schema
-- WARNING: This will delete existing profile data. In production, you should migrate the data first.
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create the new inspector profiles table with all required fields
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- Links to user/session (could be auth user ID or device ID)
  name TEXT NOT NULL,
  initials TEXT NOT NULL,
  certification_level TEXT NOT NULL,
  certification_number TEXT NOT NULL,
  certifying_organization TEXT NOT NULL,
  employee_id TEXT,
  department TEXT,
  email TEXT,
  phone TEXT,
  signature TEXT, -- Base64 encoded signature image
  is_default BOOLEAN DEFAULT false,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_default ON profiles(is_default);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inspector profiles
CREATE POLICY "Users can view their own profiles" ON profiles
  FOR SELECT USING (user_id = auth.uid() OR id = auth.uid());

CREATE POLICY "Users can insert their own profiles" ON profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own profiles" ON profiles
  FOR UPDATE USING (user_id = auth.uid() OR id = auth.uid());

CREATE POLICY "Users can delete their own profiles" ON profiles
  FOR DELETE USING (user_id = auth.uid() OR id = auth.uid());

-- Policy for organization-wide access
CREATE POLICY "Org members can view org profiles" ON profiles
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- Recreate the org_members table foreign key reference
-- (This was dropped when we dropped the profiles table)
-- Note: You may need to recreate org_members if it had foreign keys to profiles
DO $$
BEGIN
  -- Check if org_members exists and has the user_id column
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'org_members'
  ) THEN
    -- Re-add the foreign key constraint if it exists
    ALTER TABLE org_members DROP CONSTRAINT IF EXISTS org_members_user_id_fkey;
    ALTER TABLE org_members DROP CONSTRAINT IF EXISTS org_members_invited_by_fkey;

    ALTER TABLE org_members ADD CONSTRAINT org_members_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

    ALTER TABLE org_members ADD CONSTRAINT org_members_invited_by_fkey
      FOREIGN KEY (invited_by) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add comment to table for documentation
COMMENT ON TABLE profiles IS 'Inspector profiles with full certification tracking support. Each profile stores inspector credentials, certification information, and optional signature data.';
COMMENT ON COLUMN profiles.user_id IS 'Links profile to a user session or authenticated user. For anonymous users, this is a device-specific UUID stored in localStorage.';
COMMENT ON COLUMN profiles.signature IS 'Base64 encoded signature image for reports and documents.';
COMMENT ON COLUMN profiles.is_default IS 'Indicates if this is the default profile for the user. Only one profile per user should be marked as default.';
