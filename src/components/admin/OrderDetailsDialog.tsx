import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Package, Truck, Calendar } from "lucide-react";

interface OrderDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: string;
    created_at: string;
    total_amount: number;
    status: string;
    payment_status: string;
    shipping_address: string;
    tracking_number: string | null;
    items: string;
    shipment?: {
      carrier: string | null;
      label_url: string | null;
      status: string | null;
      address_from: any;
      address_to: any;
    };
  } | null;
}

export const OrderDetailsDialog = ({
  open,
  onOpenChange,
  order,
}: OrderDetailsDialogProps) => {
  if (!order) return null;

  const addressFrom = order.shipment?.address_from;
  const addressTo = order.shipment?.address_to;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Détails de la commande #{order.id.slice(0, 8)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(order.created_at).toLocaleDateString("fr-FR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Montant total</p>
              <p className="font-bold text-lg">${order.total_amount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Statut commande</p>
              <Badge variant="outline">{order.status}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Statut paiement</p>
              <Badge variant={order.payment_status === "paid" ? "default" : "outline"}>
                {order.payment_status}
              </Badge>
            </div>
          </div>

          {order.tracking_number && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Numéro de suivi</p>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Truck className="h-4 w-4 text-primary" />
                <code className="font-mono text-sm">{order.tracking_number}</code>
              </div>
            </div>
          )}

          <Separator />

          {/* Shipping Addresses */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Adresses d'expédition
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Address From */}
              <div className="p-4 border rounded-lg bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <h4 className="font-semibold">Adresse de départ</h4>
                </div>
                {addressFrom ? (
                  <div className="space-y-1 text-sm">
                    {addressFrom.name && (
                      <p className="font-medium">{addressFrom.name}</p>
                    )}
                    {addressFrom.company && (
                      <p className="text-muted-foreground">{addressFrom.company}</p>
                    )}
                    <p>{addressFrom.street1}</p>
                    {addressFrom.street2 && <p>{addressFrom.street2}</p>}
                    <p>
                      {addressFrom.city}, {addressFrom.state} {addressFrom.zip}
                    </p>
                    <p>{addressFrom.country}</p>
                    {addressFrom.phone && (
                      <p className="text-muted-foreground">📞 {addressFrom.phone}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Adresse non disponible
                  </p>
                )}
              </div>

              {/* Address To */}
              <div className="p-4 border rounded-lg bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <h4 className="font-semibold">Adresse d'arrivée</h4>
                </div>
                {addressTo ? (
                  <div className="space-y-1 text-sm">
                    {addressTo.name && (
                      <p className="font-medium">{addressTo.name}</p>
                    )}
                    {addressTo.company && (
                      <p className="text-muted-foreground">{addressTo.company}</p>
                    )}
                    <p>{addressTo.street1}</p>
                    {addressTo.street2 && <p>{addressTo.street2}</p>}
                    <p>
                      {addressTo.city}, {addressTo.state} {addressTo.zip}
                    </p>
                    <p>{addressTo.country}</p>
                    {addressTo.phone && (
                      <p className="text-muted-foreground">📞 {addressTo.phone}</p>
                    )}
                    {addressTo.email && (
                      <p className="text-muted-foreground">📧 {addressTo.email}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Adresse non disponible
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Carrier Info */}
          {order.shipment?.carrier && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Transporteur
                </h3>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="text-base py-1">
                    {order.shipment.carrier}
                  </Badge>
                  {order.shipment.status && (
                    <Badge variant="secondary">{order.shipment.status}</Badge>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
