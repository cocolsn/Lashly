# Lashly

L’agenda en ligne des techniciennes de cils. Le brief complet est dans [`CLAUDE.md`](CLAUDE.md), les maquettes validées dans [`prototypes/`](prototypes).

## Stack

Next.js (App Router, TypeScript strict, Tailwind CSS), Supabase (Postgres, Auth), Vercel, Resend.

## Lancer le projet sur un ordinateur

Il faut [Node.js](https://nodejs.org) version 20 ou plus.

```bash
npm install
npm run dev                  # ouvre http://localhost:3000
```

Autres commandes : `npm run build` (vérifie que tout compile), `npm run lint` (vérifie le code), `npm test` (tests automatiques).

## Mise en ligne : les comptes à créer (étape 0)

À faire une seule fois. Aucune carte bancaire n’est nécessaire pour les offres gratuites.

### 1. Vercel (hébergement du site)

1. Va sur [vercel.com](https://vercel.com) et clique sur **Sign Up**, puis **Continue with GitHub** (utilise le même compte GitHub que ce dépôt).
2. Clique sur **Add New… > Project**, puis **Import** à côté du dépôt `Lashly`.
3. Laisse tous les réglages par défaut et clique sur **Deploy**.
4. Après 1 à 2 minutes, Vercel affiche une adresse en `….vercel.app`. Ouvre-la : la page « Lashly » doit s’afficher. C’est le critère de fin de l’étape 0.

À chaque nouvelle branche ou modification poussée sur GitHub, Vercel crée automatiquement une adresse de prévisualisation.
Les serveurs sont réglés sur Paris (`vercel.json`, région `cdg1`).

### 2. Supabase (base de données et comptes)

Projet `Lashly`, région West EU (Irlande). L’URL et la clé « publishable » sont publiques et déjà dans le code (`src/lib/supabase/config.ts`) : rien à coller dans Vercel. La clé secrète n’est pas utilisée.

Réglages faits une fois dans le tableau de bord Supabase :
- **Authentication > URL Configuration** : *Site URL* = `https://lashly-seven.vercel.app`, et `https://lashly-seven.vercel.app/**` dans *Redirect URLs*.
- **Authentication > Sign In / Providers > Email** : *Confirm email* désactivé tant que l’envoi d’emails (Resend, étape 7) n’est pas branché.

La structure de la base est dans `supabase/migrations/` (déjà appliquée au projet). Les fichiers `supabase/tests/*.sql` vérifient que chaque pro ne voit que ses données : à lancer dans *SQL Editor*, tout est annulé à la fin.

### 3. Resend (emails aux clientes)

Les emails (confirmation, rappel la veille vers 17 h–18 h, annulation) partent directement de la base Supabase
(`supabase/migrations/20261111130000_booking_emails.sql`). Aucune donnée de santé n’y figure.

1. Crée un compte sur [resend.com](https://resend.com), puis **API Keys > Create API Key** (droit *Sending access*).
2. Dans Supabase : **Integrations > Vault > Add new secret**, nom `resend_api_key`, valeur = la clé Resend.
   La clé ne va ni dans le code ni dans Vercel.
3. Tant qu’aucun domaine n’est vérifié dans Resend, les emails ne peuvent partir que vers l’adresse du compte Resend
   (expéditeur `onboarding@resend.dev`). Une fois le nom de domaine acheté et vérifié dans Resend (région UE),
   mettre à jour l’expéditeur : `update private.settings set value = 'Nom du studio <rdv@domaine.fr>' where key = 'email_from';`

## Variables d’environnement

Voir [`.env.example`](.env.example). Les vraies valeurs vont dans `.env.local` (sur ton ordinateur) et dans Vercel, jamais dans Git.
