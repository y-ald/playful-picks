
import { AddressList } from "@/components/account/AddressList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfile } from "@/hooks/useProfile";
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Link } from "react-router-dom";
import { Loader2, Home } from 'lucide-react';

export default function AddressesPage() {
  const { loading } = useProfile();
  const { lang } = useParams<{ lang: string }>();

  return (
      <Card>
        <CardHeader>
          <CardTitle>Manage Addresses</CardTitle>``
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <AddressList />
          )}
        </CardContent>
        <Link to={`/${lang}`}>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
              Home
          </Button>
        </Link>
      </Card>
  );
}
