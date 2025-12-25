-- Add Lemon Squeezy variant IDs to standards table
ALTER TABLE public.standards 
ADD COLUMN IF NOT EXISTS lemon_squeezy_variant_id_onetime TEXT,
ADD COLUMN IF NOT EXISTS lemon_squeezy_variant_id_monthly TEXT,
ADD COLUMN IF NOT EXISTS lemon_squeezy_variant_id_annual TEXT;

-- Add Lemon Squeezy order ID to user_standard_access table
ALTER TABLE public.user_standard_access
ADD COLUMN IF NOT EXISTS lemon_squeezy_order_id TEXT;