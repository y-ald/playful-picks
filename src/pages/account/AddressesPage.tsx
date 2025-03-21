
import { AccountLayout } from "@/components/account/AccountLayout";
import { AddressList } from "@/components/account/AddressList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfile } from "@/hooks/useProfile";
import { Loader2 } from "lucide-react";

export default function AddressesPage() {
  const { loading } = useProfile();

  return (
    <AccountLayout>
      <Card>
        <CardHeader>
          <CardTitle>Manage Addresses</CardTitle>
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
      </Card>
    </AccountLayout>
  );
}
