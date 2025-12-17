This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.



GEOP Monitor - Analyse de visibilité IA
GEOP Monitor est un outil de monitoring de visibilité pour les moteurs de recherche IA (Generative Engine Optimization). Il permet de comparer la présence d'une marque sur les principaux modèles d'IA du marché.

🚀 Architecture Technique
1. Backend (n8n Cloud)

• Workflow orchestrateur : Analyse simultanée sur GPT-4o, Claude 3.5, Gemini 1.5 Pro et Perplexity Online.

• Webhook : Point d'entrée pour déclencher les scans via une requête POST.

• Processing : Script JavaScript pour le nettoyage des données et la gestion des citations.

• Stockage : Intégration directe avec Supabase via Postgres.

2. Base de données (Supabase)

• Table `reports` : Stockage des marques, mots-clés et données d'analyse au format JSONB.

• Hébergement : Instance AWS (eu-west-3).

3. Frontend (Next.js 15)

• Dashboard interactif : Visualisation des scores de visibilité, des sentiments et des sources citées.

• Contrôle : Interface pour lancer de nouveaux scans dynamiques.

• Stack : Tailwind CSS, Lucide Icons, Supabase JS Client.

🛠️ Installation et Configuration
1. Variables d'environnement (`.env.local`) :

```

NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase

NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon

```

2. Lancement du projet :

```

npm install

npm run dev

```


📈 Fonctionnement
• Saisissez une Marque et un Mot-clé.

• Cliquez sur Scanner : l'application envoie une requête à n8n.

• n8n interroge les 4 IA et met à jour Supabase.

• Le dashboard se rafraîchit automatiquement pour afficher les nouveaux résultats.
