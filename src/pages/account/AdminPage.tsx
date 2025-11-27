import { useEffect, useState } from 'react';
import { useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { ProductsSection } from '@/components/admin/ProductsSection';
import { OrdersList } from '@/components/admin/OrdersList';
import { CustomersList } from '@/components/admin/CustomersList';
import { DashboardSection } from '@/components/admin/DashboardSection';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { lang } = useParams<{ lang: string }>();

  useEffect(() => {
    const checkAdminStatus = async () => {
      setLoading(true);
      
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate(`/${lang}/auth`);
          return;
        }
        
        // Check if user has admin role
        const { data: adminRole, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching role:', error);
          setIsAdmin(false);
          return;
        }
        
        if (!adminRole) {
          toast({
            title: "Accès refusé",
            description: "Vous n'avez pas les privilèges administrateur",
            variant: "destructive"
          });
          navigate(`/${lang}`);
          return;
        }
        
        setIsAdmin(true);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAdminStatus();
  }, [navigate, toast, lang]);

  if (loading) {
    return (
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <main className="flex-1 p-8 bg-background">
          <Routes>
            <Route path="/" element={<Navigate to={`/${lang}/account/admin/dashboard`} replace />} />
            <Route path="/dashboard" element={<DashboardSection />} />
            <Route path="/products" element={<ProductsSection />} />
            <Route path="/orders" element={<OrdersList />} />
            <Route path="/customers" element={<CustomersList />} />
          </Routes>
        </main>
      </div>
  );
}
