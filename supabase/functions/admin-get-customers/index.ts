import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: adminRole } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!adminRole) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all users using admin API
    const { data: { users }, error: listError } = await supabaseClient.auth.admin.listUsers();

    if (listError) {
      throw listError;
    }

    // For each user, fetch their profile and order stats
    const customersWithData = await Promise.all(
      users.map(async (authUser) => {
        // Fetch profile
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('first_name, last_name, phone_number')
          .eq('id', authUser.id)
          .single();

        // Fetch order stats
        const { data: orders } = await supabaseClient
          .from('orders')
          .select('total_amount')
          .eq('user_id', authUser.id);

        const ordersCount = orders?.length || 0;
        const totalSpent = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;

        return {
          id: authUser.id,
          email: authUser.email || '',
          created_at: authUser.created_at,
          profile: profile || null,
          orders_count: ordersCount,
          total_spent: totalSpent,
        };
      })
    );

    return new Response(
      JSON.stringify({ customers: customersWithData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in admin-get-customers:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
