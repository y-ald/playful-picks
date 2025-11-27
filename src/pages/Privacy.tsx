import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export default function Privacy() {
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

          <h1 className="text-4xl font-bold mb-8 text-foreground">Politique de Confidentialité</h1>
          
          <div className="prose prose-lg max-w-none space-y-6 text-foreground">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p className="text-muted-foreground">
                Kaia Kids s'engage à protéger la vie privée des utilisateurs de son site internet. Cette politique de confidentialité
                décrit comment nous collectons, utilisons et protégeons vos données personnelles conformément au Règlement Général
                sur la Protection des Données (RGPD).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Données collectées</h2>
              <p className="text-muted-foreground mb-4">
                Nous collectons les données suivantes :
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Informations d'identification : nom, prénom, adresse email</li>
                <li>Informations de livraison : adresse postale, numéro de téléphone</li>
                <li>Informations de paiement : traitées de manière sécurisée par notre prestataire Stripe</li>
                <li>Données de navigation : cookies, historique de navigation sur le site</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Finalités du traitement</h2>
              <p className="text-muted-foreground mb-4">
                Vos données sont collectées pour :
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Gérer vos commandes et assurer la livraison des produits</li>
                <li>Traiter les paiements de manière sécurisée</li>
                <li>Vous contacter concernant votre commande</li>
                <li>Améliorer nos services et personnaliser votre expérience</li>
                <li>Respecter nos obligations légales et réglementaires</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Base légale</h2>
              <p className="text-muted-foreground">
                Le traitement de vos données personnelles repose sur :
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>L'exécution du contrat de vente</li>
                <li>Votre consentement pour les communications marketing</li>
                <li>Le respect de nos obligations légales</li>
                <li>Notre intérêt légitime à améliorer nos services</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Destinataires des données</h2>
              <p className="text-muted-foreground">
                Vos données peuvent être partagées avec :
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Nos prestataires de paiement (Stripe)</li>
                <li>Nos transporteurs pour la livraison</li>
                <li>Nos prestataires techniques et d'hébergement</li>
                <li>Les autorités compétentes sur demande légale</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Durée de conservation</h2>
              <p className="text-muted-foreground">
                Vos données sont conservées pendant la durée nécessaire aux finalités pour lesquelles elles sont collectées,
                et conformément aux obligations légales de conservation (notamment fiscales et comptables).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Vos droits</h2>
              <p className="text-muted-foreground mb-4">
                Conformément au RGPD, vous disposez des droits suivants :
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Droit d'accès à vos données personnelles</li>
                <li>Droit de rectification de vos données</li>
                <li>Droit à l'effacement de vos données</li>
                <li>Droit à la limitation du traitement</li>
                <li>Droit à la portabilité de vos données</li>
                <li>Droit d'opposition au traitement</li>
                <li>Droit de retirer votre consentement</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                Pour exercer ces droits, contactez-nous à l'adresse : contact@kaiakids.com
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Sécurité</h2>
              <p className="text-muted-foreground">
                Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour garantir la sécurité
                de vos données personnelles et prévenir toute perte, utilisation abusive ou accès non autorisé.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Cookies</h2>
              <p className="text-muted-foreground">
                Notre site utilise des cookies pour améliorer votre expérience de navigation. Vous pouvez gérer vos préférences
                de cookies dans les paramètres de votre navigateur.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Modifications</h2>
              <p className="text-muted-foreground">
                Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. Les modifications
                seront publiées sur cette page avec une nouvelle date de mise à jour.
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
