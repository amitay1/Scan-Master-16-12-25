-- Multi-tenant schema migration
-- This adds organization support to the application

-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier
  domain TEXT UNIQUE, -- Custom domain support
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'pro', 'enterprise')),
  is_active BOOLEAN DEFAULT true,
  max_users INTEGER DEFAULT 5, -- User limit per plan
  max_sheets INTEGER DEFAULT 100, -- Sheet limit per plan
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add org_id to existing tables
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE public.technique_sheets 
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE public.user_standard_access 
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE public.purchase_history 
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Create org_members junction table
CREATE TABLE IF NOT EXISTS public.org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by UUID REFERENCES profiles(id),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_domain ON organizations(domain);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON org_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_technique_sheets_org_id ON technique_sheets(org_id);

-- Helper function to get current user's org_id
CREATE OR REPLACE FUNCTION public.get_user_org_id(user_uuid UUID)
RETURNS UUID AS $$
  SELECT org_id FROM public.profiles WHERE id = user_uuid LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Helper function to check if user belongs to org
CREATE OR REPLACE FUNCTION public.user_belongs_to_org(user_uuid UUID, check_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members 
    WHERE user_id = user_uuid 
    AND org_id = check_org_id
  );
$$ LANGUAGE SQL STABLE;

-- Helper function to get user's role in org
CREATE OR REPLACE FUNCTION public.get_user_org_role(user_uuid UUID, check_org_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.org_members 
  WHERE user_id = user_uuid 
  AND org_id = check_org_id 
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at 
  BEFORE UPDATE ON organizations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE technique_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_standard_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Users can view their organization" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Org owners can update organization" ON organizations
  FOR UPDATE USING (
    id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Org members policies
CREATE POLICY "Users can view org members" ON org_members
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage org members" ON org_members
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Technique sheets policies with org isolation
CREATE POLICY "Users can view their org's sheets" ON technique_sheets
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    ) OR user_id = auth.uid()
  );

CREATE POLICY "Users can create sheets in their org" ON technique_sheets
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    ) OR user_id = auth.uid()
  );

CREATE POLICY "Users can update their own sheets" ON technique_sheets
  FOR UPDATE USING (
    (user_id = auth.uid()) OR 
    (org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    ))
  );

CREATE POLICY "Users can delete their own sheets" ON technique_sheets
  FOR DELETE USING (
    (user_id = auth.uid()) OR 
    (org_id IN (
      SELECT org_id FROM org_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    ))
  );

-- User standard access policies
CREATE POLICY "Users can view their org's standard access" ON user_standard_access
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    ) OR user_id = auth.uid()
  );

-- Purchase history policies
CREATE POLICY "Users can view their org's purchases" ON purchase_history
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    ) OR user_id = auth.uid()
  );

-- Profiles policies
CREATE POLICY "Users can view profiles in their org" ON profiles
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    ) OR id = auth.uid()
  );

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Create default organization for existing users
DO $$
BEGIN
  -- Only run if there are existing profiles without org_id
  IF EXISTS (SELECT 1 FROM profiles WHERE org_id IS NULL LIMIT 1) THEN
    -- Create a default organization
    INSERT INTO organizations (name, slug, plan)
    VALUES ('Default Organization', 'default-org', 'free')
    ON CONFLICT (slug) DO NOTHING;
    
    -- Assign all existing users to the default org
    UPDATE profiles 
    SET org_id = (SELECT id FROM organizations WHERE slug = 'default-org')
    WHERE org_id IS NULL;
    
    -- Add all existing users as members
    INSERT INTO org_members (org_id, user_id, role)
    SELECT 
      (SELECT id FROM organizations WHERE slug = 'default-org'),
      id,
      'member'
    FROM profiles
    WHERE org_id = (SELECT id FROM organizations WHERE slug = 'default-org')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;