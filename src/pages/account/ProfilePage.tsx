import { ProfileForm } from "@/components/account/ProfileForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Link } from "react-router-dom";
import { Loader2, Home } from 'lucide-react';

export default function ProfilePage() {
  const { loading } = useProfile();
  const [email, setEmail] = useState<string | null>(null);
  const { lang } = useParams<{ lang: string }>();

  useEffect(() => {
    const getEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email);
      }
    };
    
    getEmail();
  }, []);

  return (
      <div className="space-y-6">
        <Link to={`/${lang}`}>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Home
          </Button>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-1">Email Address</h3>
                  <p className="text-muted-foreground">{email || 'Loading...'}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Email address cannot be changed
                  </p>
                </div>
                <ProfileForm />
              </>
            )}
          </CardContent>
        </Card>
      </div>
  );
}
