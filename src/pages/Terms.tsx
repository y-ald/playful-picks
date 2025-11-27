import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export default function Terms() {
  const { lang } = useParams<{ lang: string }>();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-4 mb-8">
            <Link to={`/${lang}`}>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Accueil
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => window.history.back()} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
          </div>

          <h1 className="text-4xl font-bold mb-8 text-foreground">Conditions Générales de Vente</h1>
          
          <div className="prose prose-lg max-w-none space-y-6 text-foreground">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Objet</h2>
              <p className="text-muted-foreground">
                Les présentes conditions générales de vente régissent les ventes de produits effectuées sur le site Kaia Kids.
                Toute commande implique l'acceptation sans réserve des présentes conditions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Produits</h2>
              <p className="text-muted-foreground">
                Les produits proposés sont ceux qui figurent dans le catalogue en ligne. Les photographies sont les plus fidèles possibles
                mais ne peuvent assurer une similitude parfaite avec le produit, notamment en ce qui concerne les couleurs.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Prix</h2>
              <p className="text-muted-foreground">
                Les prix sont indiqués en euros toutes taxes comprises (TTC). Kaia Kids se réserve le droit de modifier ses prix à tout moment,
                mais les produits seront facturés sur la base des tarifs en vigueur au moment de la validation de la commande.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Commande</h2>
              <p className="text-muted-foreground">
                Pour passer commande, vous devez suivre le processus d'achat en ligne et valider votre commande après avoir accepté
                les présentes conditions générales de vente. La vente sera considérée comme définitive après l'envoi du paiement
                et la confirmation de celui-ci.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Paiement</h2>
              <p className="text-muted-foreground">
                Le paiement est exigible immédiatement à la commande. Il peut être effectué par carte bancaire via notre prestataire
                de paiement sécurisé Stripe. Les informations de paiement sont cryptées et sécurisées.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Livraison</h2>
              <p className="text-muted-foreground">
                Les produits sont livrés à l'adresse indiquée lors de la commande. Les délais de livraison sont donnés à titre indicatif.
                Kaia Kids ne pourra être tenu responsable des retards de livraison dus au transporteur ou à un cas de force majeure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Droit de rétractation</h2>
              <p className="text-muted-foreground">
                Conformément à l'article L221-18 du Code de la consommation, vous disposez d'un délai de 14 jours à compter de la réception
                de votre commande pour exercer votre droit de rétractation sans avoir à justifier de motifs ni à payer de pénalités.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Garanties</h2>
              <p className="text-muted-foreground">
                Tous nos produits bénéficient de la garantie légale de conformité et de la garantie contre les vices cachés,
                conformément aux dispositions du Code civil et du Code de la consommation.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Responsabilité</h2>
              <p className="text-muted-foreground">
                Kaia Kids ne pourra être tenu responsable de l'inexécution du contrat en cas de rupture de stock ou indisponibilité
                du produit, de force majeure, de perturbation ou grève totale ou partielle des services postaux et moyens de transport.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Litiges</h2>
              <p className="text-muted-foreground">
                Les présentes conditions générales sont soumises au droit français. En cas de litige, une solution amiable sera recherchée
                avant toute action judiciaire. À défaut, les tribunaux français seront seuls compétents.
              </p>
            </section>

            <p className="text-sm text-muted-foreground mt-8">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
