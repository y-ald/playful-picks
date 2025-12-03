import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Package, Truck, Calendar, CreditCard, ExternalLink, Mail, Clock } from "lucide-react";
import { useState } from "react";

interface Shipment {
  id: string;
  carrier: string | null;
  label_url: string | null;
  status: string | null;
  address_from: any;
  address_to: any;
  tracking_number: string | null;
  metadata: any;
}

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
    shipping_method: string | null;
    shipment?: Shipment | null;
  } | null;
  onStatusUpdate?: (orderId: string, status: string) => void;
}

export const OrderDetailsDialog = ({
  open,
  onOpenChange,
  order,
  onStatusUpdate,
}: OrderDetailsDialogProps) => {
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  if (!order) return null;

  const addressFrom = order.shipment?.address_from;
  const addressTo = order.shipment?.address_to;
  const metadata = order.shipment?.metadata;

  // Parse shipping address if stored as JSON
  let parsedShippingAddress: any = null;
  try {
    parsedShippingAddress = JSON.parse(order.shipping_address);
  } catch {
    parsedShippingAddress = null;
  }

  // Parse items if stored as JSON
  let parsedItems: any[] = [];
  try {
    parsedItems = JSON.parse(order.items || "[]");
  } catch {
    parsedItems = [];
  }

  const handleStatusChange = () => {
    if (selectedStatus && onStatusUpdate) {
      onStatusUpdate(order.id, selectedStatus);
      setSelectedStatus("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="h-6 w-6 text-primary" />
            Commande #{order.id.startsWith("order-") ? order.id.slice(6, 16) : order.id.slice(0, 10)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Status & Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                <Calendar className="h-4 w-4" /> Date
              </p>
              <p className="font-medium">
                {new Date(order.created_at).toLocaleDateString("fr-FR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(order.created_at).toLocaleTimeString("fr-FR")}
              </p>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                <CreditCard className="h-4 w-4" /> Montant
              </p>
              <p className="font-bold text-xl text-primary">${order.total_amount.toFixed(2)}</p>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Statut commande</p>
              <Badge 
                variant="outline" 
                className={
                  order.status === "shipped" ? "bg-green-500/10 text-green-600 border-green-500/30" :
                  order.status === "processing" ? "bg-blue-500/10 text-blue-600 border-blue-500/30" :
                  order.status === "delivered" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" :
                  ""
                }
              >
                {order.status}
              </Badge>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Paiement</p>
              <Badge variant={order.payment_status === "paid" ? "default" : "outline"}>
                {order.payment_status === "paid" ? "✓ Payé" : order.payment_status}
              </Badge>
            </div>
          </div>

          {/* Update Status */}
          {onStatusUpdate && (
            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
              <span className="text-sm font-medium">Modifier le statut:</span>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="processing">En cours</SelectItem>
                  <SelectItem value="shipped">Expédié</SelectItem>
                  <SelectItem value="delivered">Livré</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                size="sm" 
                onClick={handleStatusChange}
                disabled={!selectedStatus}
              >
                Mettre à jour
              </Button>
            </div>
          )}

          {/* Tracking Info */}
          {order.tracking_number && (
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                    <Truck className="h-4 w-4" /> Numéro de suivi
                  </p>
                  <code className="font-mono text-lg bg-background px-3 py-1 rounded">
                    {order.tracking_number}
                  </code>
                </div>
                {metadata?.tracking_url && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(metadata.tracking_url, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Suivre
                  </Button>
                )}
              </div>
              {metadata?.estimated_days && (
                <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Délai estimé: {metadata.estimated_days} jours ouvrables
                </p>
              )}
            </div>
          )}

          <Separator />

          {/* Shipping Label */}
          {order.shipment?.label_url && (
            <div className="p-4 bg-green-500/5 rounded-lg border border-green-500/20">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                📄 Étiquette d'expédition
              </h3>
              <div className="flex items-center gap-4">
                <Button 
                  onClick={() => window.open(order.shipment!.label_url!, "_blank")}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Télécharger l'étiquette (PDF 4x6)
                </Button>
                {order.shipment?.carrier && (
                  <Badge variant="outline" className="text-base py-1">
                    {order.shipment.carrier}
                  </Badge>
                )}
              </div>
            </div>
          )}

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
                  <div className="h-3 w-3 rounded-full bg-green-500" />
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
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <h4 className="font-semibold">Adresse de livraison</h4>
                </div>
                {addressTo ? (
                  <div className="space-y-1 text-sm">
                    {addressTo.name && (
                      <p className="font-medium">{addressTo.name}</p>
                    )}
                    <p>{addressTo.street1}</p>
                    {addressTo.street2 && <p>{addressTo.street2}</p>}
                    <p>
                      {addressTo.city}, {addressTo.state} {addressTo.zip}
                    </p>
                    <p>{addressTo.country}</p>
                    {addressTo.email && (
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {addressTo.email}
                      </p>
                    )}
                  </div>
                ) : parsedShippingAddress?.address ? (
                  <div className="space-y-1 text-sm">
                    {parsedShippingAddress.name && (
                      <p className="font-medium">{parsedShippingAddress.name}</p>
                    )}
                    <p>{parsedShippingAddress.address?.line1}</p>
                    {parsedShippingAddress.address?.line2 && (
                      <p>{parsedShippingAddress.address.line2}</p>
                    )}
                    <p>
                      {parsedShippingAddress.address?.city}, {parsedShippingAddress.address?.state} {parsedShippingAddress.address?.postal_code}
                    </p>
                    <p>{parsedShippingAddress.address?.country}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Adresse non disponible
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Order Items */}
          {parsedItems.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Articles commandés
                </h3>
                <div className="space-y-2">
                  {parsedItems.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.description || item.name || "Article"}</p>
                        <p className="text-sm text-muted-foreground">Qté: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">
                        ${((item.amount_total || item.price || 0) / 100).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Shipping Method Info */}
          {(order.shipping_method || metadata?.service_level) && (
            <>
              <Separator />
              <div className="p-4 bg-muted/30 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Méthode d'expédition
                </h3>
                <p className="text-sm">
                  {order.shipping_method || `${order.shipment?.carrier} - ${metadata?.service_level}`}
                </p>
                {metadata?.shipping_cost && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Coût: ${parseFloat(metadata.shipping_cost).toFixed(2)}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
