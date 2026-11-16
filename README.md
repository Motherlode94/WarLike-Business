# WarLike Business

MVP de gestion commerciale en navigateur, conçu pour une prévisualisation sur Cloudflare Pages.

## Fonctionnalités

- Tableau de bord : clients, devis, montants des factures encaissées / non payées.
- Répertoire client avec validation de l'e-mail et protection contre la suppression d'un client référencé.
- Création de devis avec montant HT strictement positif ; conversion en factures avec références locales uniques.
- Marquage manuel de paiement reçu et impression d'un **document de démonstration**, sans valeur fiscale.
- Persistance locale via `localStorage`, interface sombre responsive.

## Démarrer

Ouvrir `index.html` ou déployer comme site statique sur Cloudflare Pages (sans build, output directory `/`).

## Attention : pas encore un logiciel de facturation opérationnel

Aucune donnée n'est envoyée au serveur. Le navigateur n'est pas un stockage fiable pour les données de gestion. Les références sont uniques **uniquement dans cette démo locale**, non garanties légalement. Pas de comptes, TVA, mentions obligatoires, e-invoicing, numérotation fiscale immuable, emails, règlement bancaire, PDF certifié ni sauvegardes distantes. Ne pas utiliser pour émettre des factures commerciales réelles.

## Suite de développement

1. WarLike Keys : session et rôles serveur.
2. WarLike Server (D1/R2) : tenants, contrôles d'accès par entreprise, journaux d'audit, sauvegardes.
3. Cycle légal devis/contrat/facture, TVA selon juridiction, numérotation atomique et états immuables.
4. Export PDF professionnel, e-facturation réglementaire, paiements via prestataire agréé.
5. Tests CI, flux E2E et déploiement progressif.

## Vérification manuelle

1. Ajouter un client, créer un devis et le convertir en facture.
2. Marquer la facture payée ; vérifier les totaux.
3. Recharger la page ; vérifier la persistance et les références.
4. Tester suppression d'un client référencé et impression.
5. Réinitialiser la démo ; constater la remise à zéro.

Les changements initiaux sont proposés dans une PR ; `main` reste inchangée jusqu'à fusion.
