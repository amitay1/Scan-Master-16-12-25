import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('X-Signature');
    const body = await req.text();
    
    // Verify webhook signature
    const secret = Deno.env.get('LEMON_SQUEEZY_WEBHOOK_SECRET');
    if (secret && signature) {
      const hmac = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      
      const expectedSignature = await crypto.subtle.sign(
        "HMAC",
        hmac,
        new TextEncoder().encode(body)
      );
      
      const expectedHex = Array.from(new Uint8Array(expectedSignature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      if (signature !== expectedHex) {
        console.error('Invalid webhook signature');
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const event = JSON.parse(body);
    console.log('Lemon Squeezy webhook event:', event.meta.event_name);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const customData = event.meta?.custom_data;
    const userId = customData?.user_id;
    const standardId = customData?.standard_id;
    const priceType = customData?.price_type;

    // Validate required webhook data
    if (!userId || !standardId) {
      console.error('Missing user_id or standard_id in webhook data');
      return new Response(JSON.stringify({ error: 'Missing required data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate UUID formats
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId) || !uuidRegex.test(standardId)) {
      console.error('Invalid UUID format in webhook data');
      return new Response(JSON.stringify({ error: 'Invalid data format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate price type if provided
    if (priceType) {
      const validPriceTypes = ['one_time', 'monthly', 'annual'];
      if (!validPriceTypes.includes(priceType)) {
        console.error('Invalid price_type in webhook data:', priceType);
        return new Response(JSON.stringify({ error: 'Invalid price type' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Validate event structure
    if (!event.meta?.event_name || !event.data?.id) {
      console.error('Invalid webhook event structure');
      return new Response(JSON.stringify({ error: 'Invalid event structure' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle different event types
    switch (event.meta.event_name) {
      case 'order_created': {
        // Payment successful
        const isSubscription = priceType === 'monthly' || priceType === 'annual';
        let expiryDate = null;
        
        if (isSubscription) {
          const now = new Date();
          expiryDate = priceType === 'monthly' 
            ? new Date(now.setMonth(now.getMonth() + 1))
            : new Date(now.setFullYear(now.getFullYear() + 1));
        }

        // Insert access record
        const { error: accessError } = await supabaseAdmin
          .from('user_standard_access')
          .upsert({
            user_id: userId,
            standard_id: standardId,
            access_type: isSubscription ? 'subscription' : 'purchased',
            purchase_date: new Date().toISOString(),
            expiry_date: expiryDate,
            is_active: true,
            lemon_squeezy_order_id: event.data.id,
          });

        if (accessError) {
          console.error('Error creating access:', accessError);
          throw accessError;
        }

        // Insert purchase history
        const { error: historyError } = await supabaseAdmin
          .from('purchase_history')
          .insert({
            user_id: userId,
            standard_id: standardId,
            purchase_type: priceType,
            amount: event.data.attributes.total / 100, // Convert cents to dollars
            lemon_squeezy_order_id: event.data.id,
            status: 'completed',
          });

        if (historyError) {
          console.error('Error creating purchase history:', historyError);
        }

        console.log(`Access granted for user ${userId} to standard ${standardId}`);
        break;
      }

      case 'subscription_cancelled': {
        // Deactivate access
        const { error: deactivateError } = await supabaseAdmin
          .from('user_standard_access')
          .update({ is_active: false })
          .eq('user_id', userId)
          .eq('standard_id', standardId)
          .eq('lemon_squeezy_order_id', event.data.id);

        if (deactivateError) {
          console.error('Error deactivating access:', deactivateError);
        }
        break;
      }

      case 'subscription_payment_success': {
        // Renew subscription
        const renewalDate = new Date();
        const newExpiryDate = priceType === 'monthly'
          ? new Date(renewalDate.setMonth(renewalDate.getMonth() + 1))
          : new Date(renewalDate.setFullYear(renewalDate.getFullYear() + 1));

        const { error: renewError } = await supabaseAdmin
          .from('user_standard_access')
          .update({ 
            expiry_date: newExpiryDate,
            is_active: true 
          })
          .eq('user_id', userId)
          .eq('standard_id', standardId)
          .eq('lemon_squeezy_order_id', event.data.id);

        if (renewError) {
          console.error('Error renewing subscription:', renewError);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in lemon-squeezy-webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
