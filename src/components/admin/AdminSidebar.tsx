import { useState } from "react";
import { NavLink } from "@/components/NavLink";
import { ShoppingBag, Package, Users, Home, BarChart3, Menu, X } from "lucide-react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const AdminSidebar = () => {
  const { lang } = useParams<{ lang: string }>();
  const [open, setOpen] = useState(false);

  const navItems = [
    { to: `/${lang}/account/admin/dashboard`, icon: BarChart3, label: "Dashboard" },
    { to: `/${lang}/account/admin/products`, icon: Package, label: "Produits" },
    { to: `/${lang}/account/admin/orders`, icon: ShoppingBag, label: "Commandes" },
    { to: `/${lang}/account/admin/customers`, icon: Users, label: "Clients" },
  ];

  const sidebarContent = (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-primary mb-2">Admin Panel</h2>
        <p className="text-sm text-muted-foreground">Gestion de la boutique</p>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-accent"
            activeClassName="bg-primary text-primary-foreground hover:bg-primary"
            onClick={() => setOpen(false)}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="pt-4 border-t mt-auto">
        <NavLink to={`/${lang}`}>
          <Button variant="outline" className="w-full justify-start" size="lg">
            <Home className="h-5 w-5 mr-3" />
            Retour à la boutique
          </Button>
        </NavLink>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden h-11 w-11"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed top-0 left-0 z-40 w-64 h-full border-r bg-card p-4 flex flex-col transition-transform duration-300 md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 border-r bg-card min-h-screen p-4 flex-col">
        {sidebarContent}
      </aside>
    </>
  );
};
