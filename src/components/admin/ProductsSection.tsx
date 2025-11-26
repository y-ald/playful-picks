import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { AddProductForm } from "./AddProductForm";
import { ProductList } from "./ProductList";

export const ProductsSection = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gestion des Produits</h2>
        <p className="text-muted-foreground">
          Ajoutez et gérez vos produits
        </p>
      </div>

      <Tabs defaultValue="list">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="list">Liste des produits</TabsTrigger>
          <TabsTrigger value="add">Ajouter un produit</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="mt-6">
          <Card className="p-6">
            <ProductList />
          </Card>
        </TabsContent>
        
        <TabsContent value="add" className="mt-6">
          <Card className="p-6">
            <AddProductForm />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
