import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, ShoppingCart, Users, Package, ArrowLeft, Eye, MapPin, Calendar, User } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  newCustomers: number;
  topProducts: Array<{ name: string; count: number; revenue: number }>;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  yearlyRevenue: Array<{ year: number; revenue: number }>;
}

interface OrderDetail {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  payment_status: string | null;
  shipping_address: string;
  items: string | null;
  user_id: string | null;
  tracking_number: string | null;
  shipping_method: string | null;
}

type DetailView = "orders" | "customers" | "products" | null;

export const DashboardSection = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");
  const [detailView, setDetailView] = useState<DetailView>(null);
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [userEmails, setUserEmails] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session found");

      const { data, error } = await supabase.functions.invoke('admin-get-stats', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { period },
      });
      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast({ title: "Erreur", description: "Impossible de charger les statistiques", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      setOrders(data || []);

      // Fetch user emails via admin edge function
      const userIds = [...new Set((data || []).map(o => o.user_id).filter(Boolean))];
      if (userIds.length > 0) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: customersData } = await supabase.functions.invoke('admin-get-customers', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (customersData?.customers) {
            const emailMap: Record<string, string> = {};
            customersData.customers.forEach((c: any) => {
              emailMap[c.id] = c.email;
            });
            setUserEmails(emailMap);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleCardClick = (view: DetailView) => {
    setDetailView(view);
    if (view === "orders" || view === "customers") {
      fetchOrders();
    }
  };

  const parseItems = (items: string | null) => {
    try { return JSON.parse(items || "[]"); } catch { return []; }
  };

  const parseAddress = (address: string) => {
    try {
      const parsed = JSON.parse(address);
      if (parsed.address) {
        return {
          line1: parsed.address.line1 || "",
          city: parsed.address.city || "",
          state: parsed.address.state || "",
          postal_code: parsed.address.postal_code || "",
          country: parsed.address.country || "",
          name: parsed.name || "",
        };
      }
      return null;
    } catch { return null; }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
      processing: "bg-blue-500/10 text-blue-600 border-blue-500/30",
      shipped: "bg-purple-500/10 text-purple-600 border-purple-500/30",
      delivered: "bg-green-500/10 text-green-600 border-green-500/30",
      cancelled: "bg-red-500/10 text-red-600 border-red-500/30",
    };
    return <Badge variant="outline" className={styles[status] || ""}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) return null;

  // Order detail dialog
  const orderDialog = selectedOrder && (
    <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Commande #{selectedOrder.id.startsWith("order-") ? selectedOrder.id.slice(6, 14) : selectedOrder.id.slice(0, 8)}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Date</p>
              <p className="font-medium text-sm">
                {new Date(selectedOrder.created_at).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}
              </p>
              <p className="text-xs text-muted-foreground">{new Date(selectedOrder.created_at).toLocaleTimeString("fr-FR")}</p>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">Montant</p>
              <p className="font-bold text-lg text-primary">${selectedOrder.total_amount.toFixed(2)}</p>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">Statut</p>
              {getStatusBadge(selectedOrder.status)}
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" /> Client</p>
              <p className="font-medium text-sm truncate">{selectedOrder.user_id ? (userEmails[selectedOrder.user_id] || selectedOrder.user_id.slice(0, 8)) : "Anonyme"}</p>
            </div>
          </div>

          {/* Address */}
          {(() => {
            const addr = parseAddress(selectedOrder.shipping_address);
            return addr ? (
              <div className="p-3 border rounded-lg">
                <p className="text-sm font-medium flex items-center gap-1 mb-1"><MapPin className="h-4 w-4" /> Adresse de livraison</p>
                {addr.name && <p className="text-sm font-medium">{addr.name}</p>}
                <p className="text-sm">{addr.line1}</p>
                <p className="text-sm">{addr.city}, {addr.state} {addr.postal_code}</p>
                <p className="text-sm">{addr.country}</p>
              </div>
            ) : (
              <div className="p-3 border rounded-lg">
                <p className="text-sm font-medium flex items-center gap-1 mb-1"><MapPin className="h-4 w-4" /> Adresse</p>
                <p className="text-sm">{selectedOrder.shipping_address}</p>
              </div>
            );
          })()}

          {/* Tracking */}
          {selectedOrder.tracking_number && (
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm font-medium">Numéro de suivi</p>
              <code className="font-mono text-sm">{selectedOrder.tracking_number}</code>
            </div>
          )}

          <Separator />

          {/* Items */}
          {(() => {
            const items = parseItems(selectedOrder.items);
            return items.length > 0 ? (
              <div>
                <p className="text-sm font-medium mb-2">Articles</p>
                <div className="space-y-2">
                  {items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <div>
                        <p className="text-sm font-medium">{item.description || item.name || "Article"}</p>
                        <p className="text-xs text-muted-foreground">Qté: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold">${((item.amount_total || item.price || 0) / 100).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null;
          })()}
        </div>
      </DialogContent>
    </Dialog>
  );

  // Detail view for orders
  if (detailView === "orders" || detailView === "customers") {
    return (
      <div className="space-y-6">
        {orderDialog}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setDetailView(null)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Retour
          </Button>
          <h2 className="text-2xl font-bold">
            {detailView === "orders" ? "Détails des commandes" : "Commandes par client"}
          </h2>
        </div>

        {ordersLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Commande</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                      <TableCell className="font-mono text-sm">
                        {order.id.startsWith("order-") ? order.id.slice(6, 14) : order.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        {new Date(order.created_at).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell className="text-sm">
                        {order.user_id ? (userEmails[order.user_id] || order.user_id.slice(0, 8) + "...") : "Anonyme"}
                      </TableCell>
                      <TableCell className="font-semibold text-primary">${order.total_amount.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as "week" | "month" | "year")}>
          <TabsList>
            <TabsTrigger value="week">Semaine</TabsTrigger>
            <TabsTrigger value="month">Mois</TabsTrigger>
            <TabsTrigger value="year">Année</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* KPIs - now clickable */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={() => handleCardClick("orders")}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">Chiffre d'affaires</CardTitle>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              ${stats.totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              {period === "week" ? "Cette semaine" : period === "month" ? "Ce mois-ci" : "Cette année"}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={() => handleCardClick("orders")}>
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">Commandes</CardTitle>
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-accent" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent">
              {stats.totalOrders}
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
              {period === "week" ? "Cette semaine" : period === "month" ? "Ce mois-ci" : "Cette année"}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={() => handleCardClick("customers")}>
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">Nouveaux clients</CardTitle>
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold bg-gradient-to-r from-green-500 to-green-400 bg-clip-text text-transparent">
              {stats.newCustomers}
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              {period === "week" ? "Cette semaine" : period === "month" ? "Ce mois-ci" : "Cette année"}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={() => handleCardClick("products")}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">Produits vendus</CardTitle>
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Package className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-400 bg-clip-text text-transparent">
              {stats.topProducts.length}
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Types de produits
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Produits les plus vendus
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {stats.topProducts.slice(0, 5).map((product, index) => {
              const maxRevenue = Math.max(...stats.topProducts.map(p => p.revenue));
              const percentage = (product.revenue / maxRevenue) * 100;
              
              return (
                <div key={index} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                        ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' : ''}
                        ${index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' : ''}
                        ${index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' : ''}
                        ${index > 2 ? 'bg-muted text-muted-foreground' : ''}
                      `}>
                        #{index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {product.name}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <ShoppingCart className="h-3 w-3" />
                          {product.count} vente{product.count > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="font-bold text-lg text-primary">
                      ${product.revenue.toFixed(2)}
                    </div>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Chart */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Évolution du chiffre d'affaires
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {(period === "week" || period === "month") &&
              stats.monthlyRevenue.map((item, index) => {
                const maxRevenue = Math.max(...stats.monthlyRevenue.map(r => r.revenue));
                const percentage = (item.revenue / maxRevenue) * 100;
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-muted-foreground">{item.month}</span>
                      <span className="font-bold text-primary">${item.revenue.toFixed(2)}</span>
                    </div>
                    <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-accent to-primary rounded-full transition-all duration-700 animate-in slide-in-from-left"
                        style={{ width: `${percentage}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            {period === "year" &&
              stats.yearlyRevenue.map((item, index) => {
                const maxRevenue = Math.max(...stats.yearlyRevenue.map(r => r.revenue));
                const percentage = (item.revenue / maxRevenue) * 100;
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-muted-foreground">{item.year}</span>
                      <span className="font-bold text-primary">${item.revenue.toFixed(2)}</span>
                    </div>
                    <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-accent to-primary rounded-full transition-all duration-700 animate-in slide-in-from-left"
                        style={{ width: `${percentage}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
