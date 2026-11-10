# Lashly

L’agenda en ligne des techniciennes de cils. Le brief complet est dans [`CLAUDE.md`](CLAUDE.md), les maquettes validées dans [`prototypes/`](prototypes).

## Stack

Next.js (App Router, TypeScript strict, Tailwind CSS), Supabase (Postgres, Auth), Vercel, Resend.

## Lancer le projet sur un ordinateur

Il faut [Node.js](https://nodejs.org) version 20 ou plus.

```bash
npm install
cp .env.example .env.local   # puis remplir les valeurs
npm run dev                  # ouvre http://localhost:3000
```

Autres commandes : `npm run build` (vérifie que tout compile), `npm run lint` (vérifie le code).

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

Supabase servira à partir de l’étape 1. Tu peux le créer dès maintenant :

1. Va sur [supabase.com](https://supabase.com), clique sur **Start your project** et connecte-toi avec GitHub.
2. Clique sur **New project** :
   - **Name** : `lashly`
   - **Database Password** : clique sur **Generate a password** et garde-le dans un gestionnaire de mots de passe
   - **Region** : **Central EU (Frankfurt)** ou **West EU (Paris)**, obligatoirement en Europe (RGPD)
3. Une fois le projet prêt, va dans **Project Settings > API** et récupère :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (secrète : ne la partage jamais, ne l’envoie pas par message)
4. Dans Vercel, ouvre le projet, va dans **Settings > Environment Variables** et ajoute ces trois valeurs (mêmes noms qu’au-dessus).

### 3. Resend (emails)

Pas utile avant l’étape 7. On s’en occupera à ce moment-là.

## Variables d’environnement

Voir [`.env.example`](.env.example). Les vraies valeurs vont dans `.env.local` (sur ton ordinateur) et dans Vercel, jamais dans Git.
