
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AccountLayout } from "@/components/account/AccountLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { supabase } from '@/integrations/supabase/client';
import { AddProductForm } from '@/components/admin/AddProductForm';
import { ProductList } from '@/components/admin/ProductList';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminStatus = async () => {
      setLoading(true);
      
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/en/auth');
          return;
        }
        
        // Get profile with admin status
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching profile:', error);
          setIsAdmin(false);
          return;
        }
        
        if (!profile?.is_admin) {
          toast({
            title: "Access Denied",
            description: "You don't have admin privileges",
            variant: "destructive"
          });
          navigate('/en');
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
  }, [navigate, toast]);

  if (loading) {
    return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect via the useEffect
  }

  return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <Tabs defaultValue="add-product">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="add-product">Add New Product</TabsTrigger>
            <TabsTrigger value="manage-products">Manage Products</TabsTrigger>
          </TabsList>
          <TabsContent value="add-product">
            <Card className="p-6">
              <AddProductForm />
            </Card>
          </TabsContent>
          <TabsContent value="manage-products">
            <Card className="p-6">
              <ProductList />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}
