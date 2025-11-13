import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get JWT token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify the JWT token and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('User authenticated:', user.id);

    const requestBody = await req.json();
    const { standardId, priceType } = requestBody;

    // Validate input parameters
    if (!standardId || typeof standardId !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid or missing standardId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(standardId)) {
      return new Response(JSON.stringify({ error: 'Invalid UUID format for standardId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate price type
    const validPriceTypes = ['one_time', 'monthly', 'annual'];
    if (!priceType || !validPriceTypes.includes(priceType)) {
      return new Response(JSON.stringify({ error: 'Invalid price type. Must be one_time, monthly, or annual' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get standard details using admin client
    const { data: standard, error: standardError } = await supabaseAdmin
      .from('standards')
      .select('*')
      .eq('id', standardId)
      .maybeSingle();

    if (standardError) {
      console.error('Error fetching standard:', standardError);
      return new Response(JSON.stringify({ error: 'Error fetching standard' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!standard) {
      console.error('Standard not found:', standardId);
      return new Response(JSON.stringify({ error: 'Standard not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the appropriate variant ID based on price type
    let variantId;
    let price;
    switch (priceType) {
      case 'one_time':
        variantId = standard.lemon_squeezy_variant_id_onetime;
        price = standard.price_one_time;
        break;
      case 'monthly':
        variantId = standard.lemon_squeezy_variant_id_monthly;
        price = standard.price_monthly;
        break;
      case 'annual':
        variantId = standard.lemon_squeezy_variant_id_annual;
        price = standard.price_annual;
        break;
      default:
        return new Response(JSON.stringify({ error: 'Invalid price type' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    if (!variantId) {
      return new Response(JSON.stringify({ error: 'Price type not available for this standard' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify Lemon Squeezy API key and store access
    const storeId = Deno.env.get('LEMON_SQUEEZY_STORE_ID');
    const apiKey = Deno.env.get('LEMON_SQUEEZY_API_KEY');
    
    console.log('Store ID:', storeId);
    console.log('Variant ID:', variantId);
    
    // First, verify the store exists and is accessible
    try {
      const storeCheckResponse = await fetch(`https://api.lemonsqueezy.com/v1/stores/${storeId}`, {
        headers: {
          'Accept': 'application/vnd.api+json',
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      
      if (!storeCheckResponse.ok) {
        const storeError = await storeCheckResponse.json();
        console.error('Store verification failed:', storeError);
        return new Response(JSON.stringify({ 
          error: 'Store verification failed',
          details: `Store ${storeId} is not accessible with the current API key. Please verify the store ID and API key in your Lemon Squeezy dashboard.`,
          lemonSqueezyError: storeError
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      console.log('Store verification successful');
    } catch (verifyError) {
      console.error('Store verification error:', verifyError);
      return new Response(JSON.stringify({ 
        error: 'Failed to verify store access',
        details: 'Please check your LEMON_SQUEEZY_API_KEY and LEMON_SQUEEZY_STORE_ID configuration'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const lemonSqueezyResponse = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Bearer ${Deno.env.get('LEMON_SQUEEZY_API_KEY')}`,
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: user.email,
              custom: {
                user_id: user.id,
                standard_id: standardId,
                price_type: priceType,
              },
            },
          },
          relationships: {
            store: {
              data: {
                type: 'stores',
                id: String(storeId),  // Ensure it's a string
              },
            },
            variant: {
              data: {
                type: 'variants',
                id: String(variantId),  // Ensure it's a string
              },
            },
          },
        },
      }),
    });

    const checkoutData = await lemonSqueezyResponse.json();
    
    if (!lemonSqueezyResponse.ok) {
      console.error('Lemon Squeezy error:', checkoutData);
      return new Response(JSON.stringify({ error: 'Failed to create checkout' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Checkout created successfully for user:', user.id);

    return new Response(
      JSON.stringify({ 
        checkoutUrl: checkoutData.data.attributes.url 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in create-lemon-squeezy-checkout:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
