import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const jwt = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (!roles || !roles.some(r => r.role === 'admin')) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { period } = await req.json();
    const now = new Date();
    let startDate: Date;

    if (period === 'week') {
      const dayOfWeek = now.getDay();
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      startDate = new Date(now.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    // Get total revenue and orders
    const { data: orders } = await supabaseClient
      .from('orders')
      .select('total_amount, created_at, payment_status')
      .eq('payment_status', 'succeeded')
      .gte('created_at', startDate.toISOString());

    const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
    const totalOrders = orders?.length || 0;

    // Get new customers
    const { count: newCustomers } = await supabaseClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString());

    // Get top products
    const { data: orderItems } = await supabaseClient
      .from('order_items')
      .select('product_id, quantity, price_at_time, products(name)')
      .gte('created_at', startDate.toISOString());

    const productStats = new Map<string, { name: string; count: number; revenue: number }>();
    
    orderItems?.forEach(item => {
      const productName = (item.products as any)?.name || 'Unknown';
      const existing = productStats.get(productName);
      if (existing) {
        existing.count += item.quantity;
        existing.revenue += Number(item.price_at_time) * item.quantity;
      } else {
        productStats.set(productName, {
          name: productName,
          count: item.quantity,
          revenue: Number(item.price_at_time) * item.quantity,
        });
      }
    });

    const topProducts = Array.from(productStats.values())
      .sort((a, b) => b.revenue - a.revenue);

    // Get weekly/monthly/yearly revenue breakdown
    const revenueByPeriod = new Map<string, number>();
    orders?.forEach(order => {
      const date = new Date(order.created_at);
      let key: string;
      
      if (period === 'week') {
        key = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
      } else if (period === 'month') {
        key = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      } else {
        key = date.getFullYear().toString();
      }
      
      revenueByPeriod.set(key, (revenueByPeriod.get(key) || 0) + Number(order.total_amount));
    });

    const monthlyRevenue = period === 'week' || period === 'month'
      ? Array.from(revenueByPeriod.entries()).map(([month, revenue]) => ({ month, revenue }))
      : [];

    const yearlyRevenue = period === 'year'
      ? Array.from(revenueByPeriod.entries()).map(([year, revenue]) => ({ year: parseInt(year), revenue }))
      : [];

    return new Response(
      JSON.stringify({
        totalRevenue,
        totalOrders,
        newCustomers: newCustomers || 0,
        topProducts,
        monthlyRevenue,
        yearlyRevenue,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
