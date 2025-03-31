
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import { User, Map, LogOut, ShoppingBag } from "lucide-react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active: boolean;
}

function NavItem({ to, icon, children, active }: NavItemProps) {
  return (
    <Link to={to}>
      <Button
        variant={active ? "default" : "ghost"}
        className={cn(
          "w-full justify-start gap-2",
          active ? "bg-primary text-primary-foreground" : ""
        )}
      >
        {icon}
        {children}
      </Button>
    </Link>
  );
}

export function AccountNav() {
  const location = useLocation();
  const { lang } = useParams<{ lang: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === `/${lang}${path}`;
  };

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();
          
        setIsAdmin(!!data?.is_admin);
      }
    };
    
    checkAdminStatus();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast({
        title: "Error",
        description: "Could not sign out. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
    
    navigate(`/${lang}`);
  };

  return (
    <div className="w-full space-y-2">
      <NavItem
        to={`/${lang}/account`}
        icon={<User size={18} />}
        active={isActive("/account")}
      >
        Profile
      </NavItem>
      
      <NavItem
        to={`/${lang}/account/addresses`}
        icon={<Map size={18} />}
        active={isActive("/account/addresses")}
      >
        Addressese
      </NavItem>
      
      {isAdmin && (
        <NavItem
          to={`/${lang}/account/admin`}
          icon={<ShoppingBag size={18} />}
          active={isActive("/account/admin")}
        >
          Admin
        </NavItem>
      )}
      
      <Button 
        variant="outline" 
        className="w-full justify-start gap-2 text-destructive hover:text-destructive mt-4"
        onClick={handleLogout}
      >
        <LogOut size={18} />
        Sign Out
      </Button>
    </div>
  );
}
