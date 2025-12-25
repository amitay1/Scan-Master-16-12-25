-- Scan-Master Database Schema
-- For offline/air-gapped factory deployments

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table (multi-tenant support)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    domain TEXT UNIQUE,
    plan TEXT DEFAULT 'enterprise',
    is_active BOOLEAN DEFAULT true,
    max_users INTEGER DEFAULT 999,
    max_sheets INTEGER DEFAULT 99999,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    full_name TEXT,
    certification_level TEXT,
    org_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Organization members junction table
CREATE TABLE IF NOT EXISTS org_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    user_id UUID NOT NULL REFERENCES profiles(id),
    role TEXT DEFAULT 'member',
    invited_by UUID REFERENCES profiles(id),
    joined_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Technique sheets table
CREATE TABLE IF NOT EXISTS technique_sheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    org_id UUID REFERENCES organizations(id),
    sheet_name TEXT NOT NULL,
    standard TEXT,
    data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    created_by TEXT,
    modified_by TEXT,
    status TEXT DEFAULT 'draft'
);

-- Standards table
CREATE TABLE IF NOT EXISTS standards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    version TEXT,
    category TEXT,
    is_free BOOLEAN DEFAULT true,
    price_one_time DECIMAL(10, 2),
    price_monthly DECIMAL(10, 2),
    price_annual DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    stripe_product_id TEXT,
    stripe_price_id_onetime TEXT,
    stripe_price_id_monthly TEXT,
    stripe_price_id_annual TEXT,
    lemon_squeezy_variant_id_onetime TEXT,
    lemon_squeezy_variant_id_monthly TEXT,
    lemon_squeezy_variant_id_annual TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User standard access table
CREATE TABLE IF NOT EXISTS user_standard_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    org_id UUID REFERENCES organizations(id),
    standard_id UUID NOT NULL,
    access_type TEXT NOT NULL DEFAULT 'full',
    purchase_date TIMESTAMP DEFAULT NOW(),
    expiry_date TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    stripe_payment_id TEXT,
    stripe_subscription_id TEXT,
    lemon_squeezy_order_id TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Standard bundles table
CREATE TABLE IF NOT EXISTS standard_bundles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    discount_percent DECIMAL(5, 2),
    is_active BOOLEAN DEFAULT true,
    stripe_product_id TEXT,
    stripe_price_id TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Purchase history table
CREATE TABLE IF NOT EXISTS purchase_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    org_id UUID REFERENCES organizations(id),
    standard_id UUID,
    bundle_id UUID,
    purchase_type TEXT,
    amount DECIMAL(10, 2),
    stripe_payment_intent_id TEXT,
    stripe_subscription_id TEXT,
    status TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_technique_sheets_user_id ON technique_sheets(user_id);
CREATE INDEX IF NOT EXISTS idx_technique_sheets_org_id ON technique_sheets(org_id);
CREATE INDEX IF NOT EXISTS idx_technique_sheets_status ON technique_sheets(status);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON org_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_user_standard_access_user_id ON user_standard_access(user_id);
CREATE INDEX IF NOT EXISTS idx_standards_code ON standards(code);
CREATE INDEX IF NOT EXISTS idx_standards_category ON standards(category);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_technique_sheets_updated_at ON technique_sheets;
CREATE TRIGGER update_technique_sheets_updated_at
    BEFORE UPDATE ON technique_sheets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
