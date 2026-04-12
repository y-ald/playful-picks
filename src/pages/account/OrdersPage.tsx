import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AccountLayout } from "@/components/account/AccountLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Package, Truck, Eye, ShoppingBag, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useParams, Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

interface OrderItem {
  description?: string;
  name?: string;
  quantity: number;
  amount_total?: number;
  price?: number;
}

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  payment_status: string | null;
  shipping_address: string;
  tracking_number: string | null;
  items: string | null;
  shipping_method: string | null;
}

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const { t } = useLanguage();
  const { lang } = useParams<{ lang: string }>();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; labelFr: string; className: string }> = {
      pending: { label: "Pending", labelFr: "En attente", className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30" },
      processing: { label: "Processing", labelFr: "En cours", className: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
      shipped: { label: "Shipped", labelFr: "Expédié", className: "bg-purple-500/10 text-purple-600 border-purple-500/30" },
      delivered: { label: "Delivered", labelFr: "Livré", className: "bg-green-500/10 text-green-600 border-green-500/30" },
      cancelled: { label: "Cancelled", labelFr: "Annulé", className: "bg-red-500/10 text-red-600 border-red-500/30" },
    };
    return configs[status] || { label: status, labelFr: status, className: "" };
  };

  const parseItems = (items: string | null): OrderItem[] => {
    try {
      return JSON.parse(items || "[]");
    } catch {
      return [];
    }
  };

  const parseAddress = (address: string) => {
    try {
      const parsed = JSON.parse(address);
      if (parsed.address) {
        return `${parsed.address.line1}, ${parsed.address.city}, ${parsed.address.state} ${parsed.address.postal_code}`;
      }
      return address;
    } catch {
      return address;
    }
  };

  const isFr = lang === "fr";

  if (loading) {
    return (
      <AccountLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            {isFr ? "Mes commandes" : "My Orders"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isFr ? "Suivez vos commandes et consultez votre historique" : "Track your orders and view your history"}
          </p>
        </div>

        {orders.length === 0 ? (
          <Card className="p-12 text-center">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {isFr ? "Aucune commande" : "No orders yet"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {isFr ? "Vous n'avez pas encore passé de commande." : "You haven't placed any orders yet."}
            </p>
            <Link to={`/${lang}/shop`}>
              <Button>{isFr ? "Commencer mes achats" : "Start Shopping"}</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              const items = parseItems(order.items);
              const isExpanded = expandedOrder === order.id;

              return (
                <Card key={order.id} className="overflow-hidden">
                  {/* Order Header */}
                  <div
                    className="p-4 sm:p-6 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <div className="hidden sm:flex h-12 w-12 rounded-full bg-primary/10 items-center justify-center">
                          <Package className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">
                            {isFr ? "Commande" : "Order"} #{order.id.startsWith("order-") ? order.id.slice(6, 14) : order.id.slice(0, 8)}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(order.created_at).toLocaleDateString(isFr ? "fr-FR" : "en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={statusConfig.className}>
                          {isFr ? statusConfig.labelFr : statusConfig.label}
                        </Badge>
                        <span className="font-bold text-lg text-primary">
                          ${order.total_amount.toFixed(2)}
                        </span>
                        {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t">
                      <div className="p-4 sm:p-6 space-y-4">
                        {/* Tracking */}
                        {order.tracking_number && (
                          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                            <div className="flex items-center gap-2">
                              <Truck className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">{isFr ? "Numéro de suivi" : "Tracking Number"}:</span>
                              <code className="font-mono text-sm bg-background px-2 py-0.5 rounded">
                                {order.tracking_number}
                              </code>
                            </div>
                          </div>
                        )}

                        {/* Shipping Address */}
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">
                            {isFr ? "Adresse de livraison" : "Shipping Address"}
                          </p>
                          <p className="text-sm">{parseAddress(order.shipping_address)}</p>
                        </div>

                        {/* Shipping Method */}
                        {order.shipping_method && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">
                              {isFr ? "Méthode de livraison" : "Shipping Method"}
                            </p>
                            <p className="text-sm">{order.shipping_method}</p>
                          </div>
                        )}

                        {/* Payment Status */}
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">
                            {isFr ? "Paiement" : "Payment"}
                          </p>
                          <Badge variant={order.payment_status === "succeeded" || order.payment_status === "paid" ? "default" : "outline"}>
                            {order.payment_status === "succeeded" || order.payment_status === "paid"
                              ? (isFr ? "✓ Payé" : "✓ Paid")
                              : (order.payment_status || (isFr ? "En attente" : "Pending"))}
                          </Badge>
                        </div>

                        <Separator />

                        {/* Items */}
                        {items.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">
                              {isFr ? "Articles" : "Items"}
                            </p>
                            <div className="space-y-2">
                              {items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                                  <div>
                                    <p className="font-medium text-sm">{item.description || item.name || (isFr ? "Article" : "Item")}</p>
                                    <p className="text-xs text-muted-foreground">{isFr ? "Qté" : "Qty"}: {item.quantity}</p>
                                  </div>
                                  <p className="font-semibold text-sm">
                                    ${((item.amount_total || item.price || 0) / 100).toFixed(2)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AccountLayout>
  );
};

export default OrdersPage;
