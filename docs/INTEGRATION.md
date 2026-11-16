# Plan d'intégration Business — conformité, Keys, Server et Cloudflare
## Attention
L'interface actuelle **ne permet pas d'émettre de factures légales**. Une impression HTML marquée « démo » ne constitue pas un PDF conforme.
## Sécurité / multi-entreprises
- Appairage Keys/Server sur le modèle Studio : code à usage unique, PKCE, origine contrôlée, session révocable. API refusée sans preuve vérifiée.
- Chaque requête résout le `member_id` depuis la session et le `tenant_id` via une appartenance D1 (jamais depuis un droit déclaré dans le navigateur). Contrôler `owner/admin/accountant/viewer`.
- Filtrer systématiquement par `tenant_id`, y compris dans les jointures, exports et paiements ; utiliser les paramètres D1. Audit immuable des opérations sensibles.
- Migrer `migrations/0001_business.sql` en staging avec sauvegarde. Pas d'accès public D1.
## Contrats et PDF
- Ajouter émetteur légal, SIREN/SIRET selon situation, adresse, coordonnées, TVA ou mention d'exonération valide, dates, échéance, numérotation chronologique et non réutilisable, conditions de règlement, pénalités et mentions spécifiques selon le client et le pays.
- Conserver un instantané versionné du contrat et de la facture émise. Les pièces émises ne doivent jamais être modifiées silencieusement : utiliser avoirs et journal.
- Générer PDF depuis des données vérifiées côté serveur et archiver le binaire/version dans R2 avec accès autorisé. Vérifier exigences réglementaires applicables avec conseil comptable/fiscal.
- Anticiper la réforme de facturation électronique en France : un PDF seul n'est pas nécessairement une e-facture recevable.
## Comptabilité, TVA, paiements
- Les calculs et arrondis se font en entiers (centimes + quantité millièmes), pas en flottants JS. Les taux de TVA sont déterminés par juridiction, date, nature de l'opération et statuts du client/fournisseur ; pas de taux universel implicite.
- Export comptable et écritures à rapprocher avec un professionnel ; journal et immutabilité.
- Paiement via prestataire conforme : webhook signé, idempotence, état confirmé par serveur, jamais par clic client. Aucun stockage des numéros de carte.
## Déploiement / tests bloquants
Contrôles 401/403, cross-tenant, collision et non-réutilisation des numéros, TVA/arrondis, annulations et avoirs, webhook replay, sauvegarde/restauration, PDF et RGPD. Déployer Pages/Workers après configuration des bindings, origine et secrets ; conserver le mode démo clairement isolé jusque-là.
