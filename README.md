# EcoTracker : Suivi de Projet de Réhabilitation et de Stabilisation des Dunes

Ce projet est une application de suivi et de gestion pour un projet de reboisement communautaire, spécifiquement axé sur la réhabilitation et la stabilisation des dunes sur la côte nord de Keur Massar (Sénégal). Elle permet de gérer les îlots de reboisement, les activités, la logistique, les finances et l'administration des utilisateurs.

## Technologies Utilisées

*   **Framework:** [Next.js](https://nextjs.org/) (v13.5.1)
*   **Langage:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Base de données & Authentification:** [Supabase](https://supabase.io/) (PostgreSQL)
*   **UI Components:** [React](https://react.dev/) (v18.2.0)
*   **Cartographie:** [`react-leaflet`](https://react-leaflet.js.org/) et [`leaflet`](https://leafletjs.com/)
*   **Graphiques:** [`recharts`](https://recharts.org/)
*   **Icônes:** [`lucide-react`](https://lucide.dev/icons/)
*   **Gestion des dates:** [`date-fns`](https://date-fns.org/)

## Démarrage Rapide

Suivez ces étapes pour lancer l'application en local.

### 1. Configuration de l'environnement

Assurez-vous d'avoir Node.js et npm (ou yarn/pnpm/bun) installés.

### 2. Installation des dépendances

```bash
npm install
# ou
yarn install
# ou
pnpm install
# ou
bun install
```

### 3. Configuration de Supabase

Ce projet utilise Supabase pour la base de données et l'authentification. Vous devrez configurer votre projet Supabase et ajouter les variables d'environnement nécessaires.

Créez un fichier `.env.local` à la racine de votre projet avec les informations suivantes :

```
NEXT_PUBLIC_SUPABASE_URL=VOTRE_URL_SUPABASE
NEXT_PUBLIC_SUPABASE_ANON_KEY=VOTRE_CLE_ANON_SUPABASE
SUPABASE_URL=VOTRE_URL_SUPABASE
SUPABASE_SERVICE_ROLE_KEY=VOTRE_CLE_SERVICE_ROLE_SUPABASE
```

*   `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` sont pour le client côté navigateur.
*   `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont pour les scripts côté serveur (comme le script de `seed`). La `SERVICE_ROLE_KEY` doit être gardée secrète et ne jamais être exposée côté client.

### 4. Migration et Seeding de la base de données

Pour configurer votre base de données Supabase avec le schéma et les données initiales :

1.  **Appliquez les migrations Supabase** :
    Assurez-vous que votre base de données Supabase est configurée avec le schéma défini dans `supabase/migrations/`. Vous pouvez utiliser l'outil CLI de Supabase pour cela.

2.  **Exécutez le script de seeding** :
    Ce script crée des utilisateurs de démonstration (`admin@example.com` et `enqueteur@example.com`) et leurs profils associés.

    ```bash
    npm run db:seed
    # ou
    yarn db:seed
    # ou
    pnpm db:seed
    # ou
    bun run db:seed
    ```

    *   **Admin:** `admin@example.com` / `Admin1234!`
    *   **Enquêteur:** `enqueteur@example.com` / `Enq1234!`

### 5. Lancer le serveur de développement

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
# ou
bun run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) avec votre navigateur pour voir le résultat.

## Déploiement sur Vercel

Le moyen le plus simple de déployer votre application Next.js est d'utiliser la [Plateforme Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) des créateurs de Next.js.

Consultez notre [documentation de déploiement Next.js](https://nextjs.org/docs/deployment) pour plus de détails.