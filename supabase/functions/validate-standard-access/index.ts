import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    // Get authorization header and extract Bearer token
    const authHeader = req.headers.get('Authorization') ?? '';
    console.log('Auth header present:', !!authHeader, 'length:', authHeader.length);

    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      console.log('Invalid Authorization format - expected Bearer token');
      return new Response(JSON.stringify({ 
        error: 'Unauthorized - Invalid Authorization format' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const bearerToken = match[1];
    if (!bearerToken || bearerToken === 'null' || bearerToken === 'undefined') {
      console.log('Bearer token is empty or invalid');
      return new Response(JSON.stringify({ 
        error: 'Unauthorized - Invalid token value' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create client with service role for database queries
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Create client with user's token for auth verification
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: `Bearer ${bearerToken}` },
        },
      }
    );

    // Verify the user's JWT token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.log('Auth error:', authError?.message || 'No user found');
      return new Response(JSON.stringify({ 
        error: 'Unauthorized - Invalid token',
        details: authError?.message 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('User authenticated successfully:', {
      userId: user.id,
      tokenLength: bearerToken.length,
      tokenPrefix: bearerToken.substring(0, 20) + '...'
    });

    const requestBody = await req.json();
    const { standardCode } = requestBody;

    // Validate standard code
    if (!standardCode || typeof standardCode !== 'string') {
      return new Response(JSON.stringify({ 
        hasAccess: false,
        error: 'Invalid or missing standard code' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate standard code format (alphanumeric with dashes, max 50 chars)
    if (standardCode.length > 50 || !/^[A-Za-z0-9\-]+$/.test(standardCode)) {
      return new Response(JSON.stringify({ 
        hasAccess: false,
        error: 'Invalid standard code format' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get standard by code (use admin client for reliable queries)
    const { data: standard, error: standardError } = await supabaseAdmin
      .from('standards')
      .select('id, is_free')
      .eq('code', standardCode)
      .maybeSingle();

    if (standardError) {
      console.error('Error fetching standard:', standardError);
      return new Response(JSON.stringify({ 
        hasAccess: false,
        error: 'Error fetching standard' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!standard) {
      return new Response(JSON.stringify({ 
        hasAccess: false,
        error: 'Standard not found' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Free standards are always accessible
    if (standard.is_free) {
      return new Response(
        JSON.stringify({ 
          hasAccess: true,
          accessType: 'free',
          expiryDate: null
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check user access (use admin client for reliable queries)
    const { data: access, error: accessError } = await supabaseAdmin
      .from('user_standard_access')
      .select('*')
      .eq('user_id', user.id)
      .eq('standard_id', standard.id)
      .eq('is_active', true)
      .maybeSingle();

    if (accessError) {
      console.error('Error checking access:', accessError);
      return new Response(
        JSON.stringify({ 
          hasAccess: false,
          accessType: null,
          expiryDate: null,
          error: 'Error checking access'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!access) {
      return new Response(
        JSON.stringify({ 
          hasAccess: false,
          accessType: null,
          expiryDate: null
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if subscription expired
    if (access.expiry_date) {
      const now = new Date();
      const expiryDate = new Date(access.expiry_date);
      
      if (expiryDate <= now) {
        return new Response(
          JSON.stringify({ 
            hasAccess: false,
            accessType: access.access_type,
            expiryDate: access.expiry_date,
            expired: true
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        hasAccess: true,
        accessType: access.access_type,
        expiryDate: access.expiry_date
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in validate-standard-access:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
