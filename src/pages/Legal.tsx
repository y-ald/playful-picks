import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export default function Legal() {
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

          <h1 className="text-4xl font-bold mb-8 text-foreground">Mentions Légales</h1>
          
          <div className="prose prose-lg max-w-none space-y-6 text-foreground">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Éditeur du site</h2>
              <div className="text-muted-foreground space-y-2">
                <p><strong>Raison sociale :</strong> Kaia Kids</p>
                <p><strong>Forme juridique :</strong> [À compléter]</p>
                <p><strong>Siège social :</strong> [Adresse à compléter]</p>
                <p><strong>SIRET :</strong> [À compléter]</p>
                <p><strong>Numéro TVA intracommunautaire :</strong> [À compléter]</p>
                <p><strong>Email :</strong> contact@kaiakids.com</p>
                <p><strong>Téléphone :</strong> [À compléter]</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Directeur de la publication</h2>
              <p className="text-muted-foreground">
                [Nom et prénom du directeur de la publication à compléter]
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Hébergement</h2>
              <div className="text-muted-foreground space-y-2">
                <p><strong>Hébergeur :</strong> Lovable / Supabase</p>
                <p><strong>Adresse :</strong> [Adresse de l'hébergeur]</p>
                <p><strong>Site web :</strong> https://lovable.dev</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Propriété intellectuelle</h2>
              <p className="text-muted-foreground">
                L'ensemble du contenu de ce site (textes, images, vidéos, logos, etc.) est la propriété exclusive de Kaia Kids
                ou de ses partenaires. Toute reproduction, distribution, modification, adaptation, retransmission ou publication
                de ces différents éléments est strictement interdite sans l'accord exprès par écrit de Kaia Kids.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Données personnelles</h2>
              <p className="text-muted-foreground">
                Conformément à la loi « Informatique et Libertés » du 6 janvier 1978 modifiée et au Règlement Général sur la
                Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification, de suppression et d'opposition
                aux données personnelles vous concernant. Pour exercer ces droits, vous pouvez nous contacter à l'adresse :
                contact@kaiakids.com
              </p>
              <p className="text-muted-foreground mt-4">
                Pour plus d'informations, consultez notre <Link to={`/${lang}/privacy`} className="text-primary hover:underline">
                  Politique de Confidentialité
                </Link>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Cookies</h2>
              <p className="text-muted-foreground">
                Ce site utilise des cookies pour améliorer l'expérience utilisateur et réaliser des statistiques de visite.
                En poursuivant votre navigation sur ce site, vous acceptez l'utilisation de cookies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Limitation de responsabilité</h2>
              <p className="text-muted-foreground">
                Kaia Kids s'efforce d'assurer au mieux de ses possibilités l'exactitude et la mise à jour des informations
                diffusées sur ce site. Toutefois, Kaia Kids ne pourra être tenu responsable des omissions, des inexactitudes
                et des carences dans la mise à jour, qu'elles soient de son fait ou du fait des tiers partenaires qui lui
                fournissent ces informations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Droit applicable</h2>
              <p className="text-muted-foreground">
                Les présentes mentions légales sont régies par le droit français. En cas de litige, les tribunaux français
                seront seuls compétents.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Médiation</h2>
              <p className="text-muted-foreground">
                Conformément à l'article L.612-1 du Code de la consommation, nous proposons un dispositif de médiation de la
                consommation. L'entité de médiation retenue est : [À compléter avec le médiateur choisi].
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
