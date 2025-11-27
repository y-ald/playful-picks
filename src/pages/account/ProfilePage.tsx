import { ProfileForm } from "@/components/account/ProfileForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountLayout } from "@/components/account/AccountLayout";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { loading } = useProfile();
  const [email, setEmail] = useState<string | null>(null);

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
    <AccountLayout>
      <Card>
        <CardHeader>
          <CardTitle>Informations du profil</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="mb-6 p-4 bg-muted rounded-lg">
                <h3 className="text-sm font-medium mb-1">Adresse email</h3>
                <p className="text-foreground font-medium">{email || 'Chargement...'}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  L'adresse email ne peut pas être modifiée
                </p>
              </div>
              <ProfileForm />
            </>
          )}
        </CardContent>
      </Card>
    </AccountLayout>
  );
}
