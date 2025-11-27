import { NavLink } from "@/components/NavLink";
import { ShoppingBag, Package, Users, Home, BarChart3 } from "lucide-react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const AdminSidebar = () => {
  const { lang } = useParams<{ lang: string }>();

  return (
    <aside className="w-64 border-r bg-card min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-primary mb-2">Admin Panel</h2>
        <p className="text-sm text-muted-foreground">Gestion de la boutique</p>
      </div>

      <nav className="flex-1 space-y-2">
        <NavLink
          to={`/${lang}/account/admin/dashboard`}
          className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-accent"
          activeClassName="bg-primary text-primary-foreground hover:bg-primary"
        >
          <BarChart3 className="h-5 w-5" />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to={`/${lang}/account/admin/products`}
          className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-accent"
          activeClassName="bg-primary text-primary-foreground hover:bg-primary"
        >
          <Package className="h-5 w-5" />
          <span>Produits</span>
        </NavLink>

        <NavLink
          to={`/${lang}/account/admin/orders`}
          className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-accent"
          activeClassName="bg-primary text-primary-foreground hover:bg-primary"
        >
          <ShoppingBag className="h-5 w-5" />
          <span>Commandes</span>
        </NavLink>

        <NavLink
          to={`/${lang}/account/admin/customers`}
          className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-accent"
          activeClassName="bg-primary text-primary-foreground hover:bg-primary"
        >
          <Users className="h-5 w-5" />
          <span>Clients</span>
        </NavLink>
      </nav>

      <div className="pt-4 border-t mt-auto">
        <NavLink to={`/${lang}`}>
          <Button variant="outline" className="w-full justify-start" size="lg">
            <Home className="h-5 w-5 mr-3" />
            Retour à la boutique
          </Button>
        </NavLink>
      </div>
    </aside>
  );
};
