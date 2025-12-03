import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, Truck, Eye, RefreshCw, Mail, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderDetailsDialog } from "./OrderDetailsDialog";

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

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  payment_status: string;
  shipping_address: string;
  tracking_number: string | null;
  items: string;
  user_id: string;
  shipping_method: string | null;
  shipment?: Shipment | null;
}

export const OrdersList = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch all shipments
      const { data: shipmentsData, error: shipmentsError } = await supabase
        .from("shipments")
        .select("*");

      if (shipmentsError) {
        console.error("Error fetching shipments:", shipmentsError);
      }

      setShipments(shipmentsData || []);

      // Match orders with shipments using metadata.order_id_text
      const ordersWithShipments = (ordersData || []).map((order) => {
        const matchingShipment = (shipmentsData || []).find((shipment) => {
          const meta = shipment.metadata as Record<string, any> | null;
          const orderIdText = meta?.order_id_text;
          return orderIdText === order.id || shipment.tracking_number === order.tracking_number;
        });
        return {
          ...order,
          shipment: matchingShipment || null,
        };
      });

      setOrders(ordersWithShipments);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les commandes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
      pending: { variant: "outline", className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30" },
      processing: { variant: "secondary", className: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
      shipped: { variant: "default", className: "bg-green-500/10 text-green-600 border-green-500/30" },
      delivered: { variant: "default", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
      cancelled: { variant: "destructive" },
    };
    const statusConfig = config[status] || { variant: "outline" as const };
    return (
      <Badge variant={statusConfig.variant} className={statusConfig.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const isPaid = status === "paid";
    return (
      <Badge 
        variant={isPaid ? "default" : "outline"} 
        className={isPaid ? "bg-green-500/10 text-green-600 border-green-500/30" : ""}
      >
        {status === "paid" ? "✓ Payé" : status}
      </Badge>
    );
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Statut mis à jour: ${newStatus}`,
      });

      fetchOrders();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <OrderDetailsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        order={selectedOrder}
        onStatusUpdate={updateOrderStatus}
      />
      
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6" />
              Commandes
            </h2>
            <p className="text-muted-foreground">
              {orders.length} commande{orders.length !== 1 ? "s" : ""} au total
            </p>
          </div>
          <Button variant="outline" onClick={fetchOrders} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Commande</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Paiement</TableHead>
                <TableHead>Tracking</TableHead>
                <TableHead>Transporteur</TableHead>
                <TableHead>Étiquette</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Aucune commande pour le moment
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">
                      <span className="bg-muted px-2 py-1 rounded">
                        {order.id.startsWith("order-") ? order.id.slice(6, 16) : order.id.slice(0, 10)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{new Date(order.created_at).toLocaleDateString("fr-FR")}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-primary">
                      ${order.total_amount.toFixed(2)}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{getPaymentStatusBadge(order.payment_status || "pending")}</TableCell>
                    <TableCell>
                      {order.tracking_number ? (
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-primary" />
                          <code className="font-mono text-xs bg-muted px-2 py-1 rounded">
                            {order.tracking_number}
                          </code>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {order.shipment?.carrier || order.shipping_method ? (
                        <Badge variant="outline" className="text-xs">
                          {order.shipment?.carrier || order.shipping_method?.split(' - ')[0]}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {order.shipment?.label_url ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => window.open(order.shipment!.label_url!, "_blank")}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          PDF
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewDetails(order)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Détails
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </>
  );
};
