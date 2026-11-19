# WarLike Business

Gestion commerciale locale dans le navigateur : https://warlike-business.pages.dev/.

## Édition enrichie — novembre 2026

- Répertoire clients avec recherche, contrôle des doublons d’email et suppression bloquée pour les clients liés à un document.
- Devis de 1 à 40 lignes, descriptions, quantités entières et prix unitaires HT. Calcul en centimes entiers, total vérifié et limites de montant.
- États manuels des devis : brouillon, envoyé, accepté, refusé. « Envoyé » est une indication personnelle, aucun email n’est envoyé.
- Conversion unique d’un devis en facture de démonstration, échéance choisie et instantané des coordonnées du client et des lignes.
- Historique des règlements manuels partiels, solde restant, rejet des montants excessifs et état de retard selon l’échéance.
- Tableau de bord calculé sur les montants effectivement saisis, recherche et filtres par état.
- Impression du document détaillé depuis la page, sans fenêtre surgissante. La commande d’impression du navigateur permet d’enregistrer un PDF local.
- Sauvegarde/restauration JSON validée, export des factures CSV (protection des cellules pouvant être interprétées comme formules) et récupération des données brutes en cas de contenu illisible.

Les données de l’ancienne démo sont migrées à la lecture sans changement de clé (`warlike-business-demo-v1`). Les écritures ne remplacent l’état en mémoire qu’après réussite du stockage. Une modification provenant d’un autre onglet bloque une écriture périmée et demande un rechargement. Un stockage illisible n’est pas écrasé automatiquement. L’import/remise à zéro exige une confirmation et remplace les données locales.

## Exécuter et vérifier

Servir la racine du dépôt avec un serveur HTTP statique ou Cloudflare Pages, sans compilation. `index.html` charge `app.css`, `model.js` et `app.js` depuis la même origine. Pas de dépendance distante.

```sh
node tests/smoke.mjs
node --check app.js
node --check model.js
node --test tests/model.test.mjs
python3 -m unittest discover -s tests -p 'test_*.py' -v
```

Essais navigateur réalisés : création d’un devis, conversion, règlement partiel et conservation du solde après rechargement. À vérifier sur les appareils cibles : impression réelle, import/export de fichiers et très gros répertoires.

## Périmètre actuel

Données dans `localStorage`, non synchronisées. Les sauvegardes JSON contiennent des coordonnées et ne sont pas chiffrées. Aucun compte, rôle serveur, paiement bancaire, envoi d’email ou archivage distant. Les documents sont des **démonstrations sans valeur fiscale**, tous les montants restent HT et aucune TVA n’est calculée. Quantités entières seulement. Les références locales ne constituent pas une numérotation fiscale garantie.

Les migrations SQL préparent une intégration future, elles ne sont pas appliquées automatiquement à une base de production. La connexion Keys/Server, les entreprises et l’émission de documents commerciaux opérationnels restent à réaliser selon [le plan d’intégration](docs/INTEGRATION.md).
