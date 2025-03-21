
import { useState } from 'react';
import { PlusCircle, Edit, Trash2, Check, Home } from 'lucide-react';
import { useProfile, AddressData } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AddressForm } from './AddressForm';
import { Badge } from '@/components/ui/badge';

export function AddressList() {
  const { addresses, deleteAddress, setDefaultAddress } = useProfile();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressData | null>(null);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);

  const handleEdit = (address: AddressData) => {
    setEditingAddress(address);
  };

  const handleDelete = (id: string) => {
    setAddressToDelete(id);
  };

  const confirmDelete = async () => {
    if (addressToDelete) {
      await deleteAddress(addressToDelete);
      setAddressToDelete(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    await setDefaultAddress(id);
  };

  const closeDialogs = () => {
    setShowAddForm(false);
    setEditingAddress(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Your Addresses</h3>
        <Button 
          onClick={() => setShowAddForm(true)}
          size="sm"
          variant="outline"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add New Address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          You haven't added any addresses yet
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <Card key={address.id} className={address.is_default ? "border-primary" : ""}>
              <CardContent className="p-4">
                <div className="flex justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">{address.street_address}</p>
                      {address.is_default && (
                        <Badge variant="outline" className="text-xs">
                          <Home className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {address.city}, {address.state} {address.postal_code}
                    </p>
                    <p className="text-sm text-muted-foreground">{address.country}</p>
                  </div>
                  <div className="flex space-x-2">
                    {!address.is_default && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleSetDefault(address.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEdit(address)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDelete(address.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Address Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Address</DialogTitle>
          </DialogHeader>
          <AddressForm onComplete={closeDialogs} />
        </DialogContent>
      </Dialog>

      {/* Edit Address Dialog */}
      <Dialog 
        open={!!editingAddress} 
        onOpenChange={(open) => !open && setEditingAddress(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Address</DialogTitle>
          </DialogHeader>
          {editingAddress && (
            <AddressForm address={editingAddress} onComplete={closeDialogs} />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={!!addressToDelete} 
        onOpenChange={(open) => !open && setAddressToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this address? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
