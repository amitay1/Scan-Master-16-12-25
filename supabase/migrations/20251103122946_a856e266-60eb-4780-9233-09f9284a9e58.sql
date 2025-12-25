-- Create standards licensing system tables

-- Standards table
CREATE TABLE standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  version TEXT,
  category TEXT,
  is_free BOOLEAN DEFAULT FALSE,
  price_one_time DECIMAL(10,2),
  price_monthly DECIMAL(10,2),
  price_annual DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB,
  stripe_product_id TEXT,
  stripe_price_id_onetime TEXT,
  stripe_price_id_monthly TEXT,
  stripe_price_id_annual TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User standard access table
CREATE TABLE user_standard_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  standard_id UUID REFERENCES standards(id) ON DELETE CASCADE NOT NULL,
  access_type TEXT CHECK (access_type IN ('free', 'purchased', 'trial', 'subscription')) NOT NULL,
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expiry_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  stripe_payment_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, standard_id)
);

-- Standard bundles table
CREATE TABLE standard_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  discount_percent DECIMAL(5,2),
  is_active BOOLEAN DEFAULT TRUE,
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bundle standards junction table
CREATE TABLE bundle_standards (
  bundle_id UUID REFERENCES standard_bundles(id) ON DELETE CASCADE,
  standard_id UUID REFERENCES standards(id) ON DELETE CASCADE,
  PRIMARY KEY (bundle_id, standard_id)
);

-- Purchase history table
CREATE TABLE purchase_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  standard_id UUID REFERENCES standards(id) ON DELETE CASCADE,
  bundle_id UUID REFERENCES standard_bundles(id) ON DELETE CASCADE,
  purchase_type TEXT,
  amount DECIMAL(10,2),
  stripe_payment_intent_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_standard_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE standard_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for standards (everyone can view available standards)
CREATE POLICY "Anyone can view active standards"
ON standards FOR SELECT
USING (is_active = true);

-- RLS Policies for user_standard_access
CREATE POLICY "Users can view their own standard access"
ON user_standard_access FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for bundles (everyone can view)
CREATE POLICY "Anyone can view active bundles"
ON standard_bundles FOR SELECT
USING (is_active = true);

CREATE POLICY "Anyone can view bundle standards"
ON bundle_standards FOR SELECT
USING (true);

-- RLS Policies for purchase history
CREATE POLICY "Users can view their own purchase history"
ON purchase_history FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Insert initial standards
INSERT INTO standards (code, name, description, version, category, is_free, price_one_time, price_monthly, price_annual, is_active) VALUES
('MIL-STD-2154', 'MIL-STD-2154 (Original, 1982)', 'Military Standard - Ultrasonic Inspection', '1982', 'Military', true, NULL, NULL, NULL, true),
('AMS-STD-2154E', 'AMS-STD-2154E (Revision E, 2019)', 'Aerospace Materials Standard - Ultrasonic Inspection', '2019', 'Aerospace', false, 199.00, 19.00, 190.00, true),
('ASTM-E-114', 'ASTM E-114', 'Standard Practice for Ultrasonic Pulse-Echo Examination', 'Latest', 'Industrial', false, 149.00, 14.00, 140.00, true);

-- Function to automatically grant free standard access to new users
CREATE OR REPLACE FUNCTION public.grant_free_standards()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_standard_access (user_id, standard_id, access_type, is_active)
  SELECT NEW.id, s.id, 'free', true
  FROM public.standards s
  WHERE s.is_free = true;
  RETURN NEW;
END;
$$;

-- Trigger to grant free standards to new users
CREATE TRIGGER on_user_created_grant_standards
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.grant_free_standards();

-- Function to check standard access (for backend validation)
CREATE OR REPLACE FUNCTION public.has_standard_access(_user_id uuid, _standard_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_standard_access usa
    JOIN public.standards s ON s.id = usa.standard_id
    WHERE usa.user_id = _user_id
      AND s.code = _standard_code
      AND usa.is_active = true
      AND (usa.expiry_date IS NULL OR usa.expiry_date > NOW())
  )
$$;