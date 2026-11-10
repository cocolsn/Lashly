# Lashly : brief de projet

Brief à placer à la racine du projet (idéalement renommé `CLAUDE.md`). Il décrit ce qu'on construit, pourquoi, et dans quel ordre.

## 1. Vision

Lashly est une plateforme web (PWA) pour les techniciennes de cils en France.
- **Côté pro** : un outil de gestion (prestations, horaires, agenda, fiches clientes, rappels).
- **Côté cliente** : une page de réservation en ligne, puis à terme un annuaire par ville (marketplace).

Positionnement : un « Planity » spécialisé lash tech. La différence vient de la niche : fiche cliente adaptée (type de pose, courbure, longueur, colle, réactions), durées par prestation, rappels de remplissage, acomptes.

**Ordre stratégique : l'outil d'abord, la marketplace ensuite.** L'outil apporte de la valeur dès la première utilisatrice, la marketplace seulement quand il y a assez de pros. Démarrer sur une seule ville.

## 2. Périmètre

**v1 (MVP)**
- Compte pro (email + mot de passe), profil du studio, URL publique `/{slug}`
- CRUD des prestations (nom, durée, prix, description)
- Horaires d'ouverture par jour, pause, temps de préparation entre deux clientes
- Page publique de réservation avec calcul serveur des créneaux
- Agenda pro : liste des rendez-vous, annulation
- Fiches clientes (créées automatiquement à la réservation, complétées par la pro)
- Emails de confirmation et de rappel
- Page d'accueil (landing), PWA installable

**Après la v1** : acomptes Stripe, rappels de remplissage automatiques, annuaire par ville, avis, paiement en ligne complet.

**Hors périmètre** : app native iOS/Android, multi-employées, caisse, facturation.

## 3. Stack recommandée

- **Front** : Next.js (App Router), TypeScript strict, Tailwind CSS
- **Backend** : Supabase (Postgres, Auth, Row Level Security, Edge Functions), région UE
- **Hébergement** : Vercel (région UE), nom de domaine à définir
- **Emails** : Resend
- **Paiement (plus tard)** : Stripe Connect
- **PWA** : `manifest.webmanifest`, icônes, service worker minimal (installable, pas de mode hors ligne complet en v1)
- **Tâches planifiées** : Supabase `pg_cron` ou Vercel Cron (rappels)

Rester simple. Pas de librairie lourde si une solution native suffit.

## 4. Écrans (prototypes de référence)

Trois prototypes HTML validés par Coralie sont dans `/prototypes`. Ils servent de référence pour le design, les textes et le comportement. Les reproduire fidèlement, puis les brancher sur la vraie base.

| Écran | Prototype | Notes |
|---|---|---|
| Accueil (landing) | `prototypes/accueil.html` | Promesse, 6 fonctions (3 marquées « Bientôt »), boutons « Créer mon espace » et « Me connecter » |
| Espace pro | `prototypes/espace-pro.html` | Onglets Prestations, Horaires, Aperçu cliente |
| Réservation cliente | `prototypes/reservation.html` | 3 étapes : prestation (avec description dépliable), créneau, coordonnées, puis confirmation |

À retirer des prototypes : les données d'exemple et la logique qui masque des créneaux « déjà pris » artificiellement (démo uniquement).

À ajouter : l'écran Agenda dans l'espace pro, la fiche cliente, la connexion.

## 5. Modèle de données

Toutes les tables ont `id uuid`, `created_at timestamptz`. Les `pro_id` pointent vers `auth.users`.

- **pros** : `id`, `slug` (unique), `studio_name`, `city`, `phone`, `buffer_minutes` (défaut 10), `pause_start`, `pause_end`
- **services** : `pro_id`, `name`, `duration_min`, `price_cents`, `description`, `active`, `position`
- **opening_hours** : `pro_id`, `weekday` (0 à 6), `is_open`, `start_time`, `end_time`
- **clients** : `pro_id`, `full_name`, `phone`, `email`, `consent_at`
- **client_records** (fiche) : `client_id`, `lash_type`, `curl`, `length_mm`, `thickness`, `glue`, `reactions` (donnée de santé, voir RGPD), `notes`
- **bookings** : `pro_id`, `client_id`, `service_id`, `starts_at`, `ends_at`, `status` (`confirmed`, `cancelled`, `done`, `no_show`), `deposit_cents`

Les prix sont stockés en centimes. Les dates en UTC, affichées en `Europe/Paris`.

**Sécurité (RLS)** : une pro ne voit et ne modifie que ses propres lignes. Le public peut uniquement lire `pros` (champs publics), `services` actifs et les créneaux libres, et créer une réservation via une fonction serveur.

## 6. Règles métier

**Calcul des créneaux** (côté serveur, fonction testée)
- Pas de 30 minutes entre deux débuts possibles
- Un créneau est valide si `début + durée de la prestation + temps de préparation` tient avant l'heure de fermeture
- Il ne chevauche ni la pause, ni un rendez-vous existant de la pro
- Pas de créneau dans le passé
- Horizon de réservation : 14 jours à venir (configurable)

**Anti double réservation** : contrainte d'exclusion Postgres sur `tstzrange(starts_at, ends_at)` par pro (`EXCLUDE USING gist`), pour que deux clientes ne puissent jamais réserver le même créneau, même en simultané.

**Réservation cliente** : prénom et nom, téléphone, email valides, case de consentement obligatoire, champ « allergies ou réactions connues » facultatif.

**Annulation** : la pro peut annuler depuis l'agenda. La politique d'annulation côté cliente est à définir (voir questions ouvertes).

## 7. RGPD (point critique)

Les fiches clientes contiennent des informations sur les réactions et allergies, donc potentiellement des **données de santé** (catégorie particulière, article 9 du RGPD).
- Consentement explicite et séparé, horodaté (`consent_at`)
- Hébergement et sous-traitants en UE, avec accord de sous-traitance (DPA)
- Accès strictement limité par RLS, aucune donnée de santé dans les logs ni dans les emails
- Droit d'accès, de rectification et de suppression : prévoir un export et une suppression d'une cliente
- Durée de conservation définie, mentions légales, politique de confidentialité, CGU

Ce brief n'est pas un avis juridique : faire valider ces points (CNIL ou professionnel du droit) avant l'ouverture au public.

## 8. Design

Reprendre les prototypes.
- **Police** : Bricolage Grotesque (poids 400, 600, 800), avec une pile de secours système
- **Couleurs (clair)** : fond `#f6f5f8`, surface `#ffffff`, texte `#1f1726`, texte secondaire `#6b6475`, bordure `#e6e2ea`, accent prune `#4a1d5c`
- **Couleurs (sombre)** : fond `#17121c`, surface `#211a28`, texte `#f1ebf5`, accent `#c58be0`
- **Formes** : cartes à 12 px de rayon, boutons et créneaux à 8 px, ombres très légères
- **Thème** : clair et sombre automatiques (`prefers-color-scheme`)
- **Mobile d'abord** : la majorité des clientes réservera depuis un téléphone
- **Accessibilité** : focus visible, contrastes suffisants, libellés sur tous les champs

**Ton** : français, tutoiement, phrases courtes, verbes d'action (« Créer mon espace », « Confirmer la réservation »). Pas de jargon technique dans l'interface. Les erreurs disent ce qui ne va pas et comment le corriger.

## 9. Plan de construction

Avancer étape par étape, **et faire valider chaque étape par Coralie avant de passer à la suivante.**

0. **Mise en place** : projet Next.js, Supabase, Vercel, `.env.example`, déploiement vide en ligne. *Fini quand* : une page « Lashly » s'affiche sur l'URL de prévisualisation.
1. **Comptes pro** : inscription, connexion, profil du studio, slug. *Fini quand* : une pro peut créer son compte et retrouver son profil.
2. **Prestations** : CRUD complet avec description et raccourcis (wispy, hybride, volume léger, méga volume, rehaussement, teinture). *Fini quand* : les données persistent et sont isolées par pro.
3. **Horaires** : jours, heures, pause, temps de préparation. *Fini quand* : les réglages sont sauvegardés en base.
4. **Réservation publique** `/{slug}` : calcul des créneaux, formulaire, anti double réservation, écran de confirmation. *Fini quand* : une cliente réserve, et le créneau disparaît pour la suivante. Tests automatisés sur le calcul des créneaux.
5. **Agenda pro** : liste des rendez-vous du jour et de la semaine, annulation. *Fini quand* : la pro voit et annule ses rendez-vous.
6. **Fiches clientes** : fiche liée à chaque cliente, historique des poses. *Fini quand* : la pro retrouve la fiche depuis un rendez-vous.
7. **Emails** : confirmation immédiate, rappel la veille. *Fini quand* : les emails partent et ne contiennent aucune donnée de santé.
8. **PWA et landing** : page d'accueil, manifest, icônes, installation sur téléphone. *Fini quand* : l'app s'installe sur l'écran d'accueil.
9. **Après v1** : rappels de remplissage, acomptes Stripe, annuaire par ville.

## 10. Façon de travailler

- Une étape à la fois, avec un court récapitulatif de ce qui a changé et comment le tester
- TypeScript strict, composants petits, pas de code mort
- Aucun secret dans le dépôt, tout dans `.env` (fournir un `.env.example`)
- Tests automatisés pour le calcul des créneaux et la contrainte anti-chevauchement
- Commits fréquents, messages clairs
- Coralie n'est pas développeuse : expliquer simplement ce qui est fait, les comptes à créer et les clés à récupérer, étape par étape
- En cas de doute sur un choix produit, poser la question plutôt que supposer

## 11. Questions ouvertes (à trancher avec Coralie)

- Nom de domaine (par exemple `lashly.fr`) : disponibilité à vérifier, ainsi que la marque (INPI) et les comptes réseaux sociaux
- Modèle économique : abonnement mensuel pour les pros, commission par réservation, ou version gratuite limitée
- Politique d'annulation et montant de l'acompte
- Ville de lancement
- Rédaction des CGU, mentions légales et politique de confidentialité
