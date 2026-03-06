# Relanco — Guide de démarrage

## ÉTAPE 1 — Installer Node.js sur ton Mac
Ouvre l'application "Terminal" sur ton Mac (cherche "Terminal" dans Spotlight avec Cmd+Espace)
Colle cette commande et appuie sur Entrée :

  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

Ferme et rouvre le Terminal, puis tape :

  nvm install 20
  nvm use 20

---

## ÉTAPE 2 — Créer le projet sur ton ordinateur
Dans le Terminal, tape ces commandes une par une :

  cd Desktop
  mkdir relanco
  cd relanco

Maintenant copie TOUS les fichiers de ce dossier dans ton dossier relanco.

---

## ÉTAPE 3 — Configurer Supabase
1. Va sur supabase.com → ton projet → SQL Editor
2. Clique "New query"
3. Copie tout le contenu du fichier SCHEMA_SUPABASE.sql
4. Colle-le et clique "Run"
5. Va dans Settings → API et copie :
   - Project URL
   - anon public key

---

## ÉTAPE 4 — Remplir le fichier .env.local
Ouvre le fichier .env.local et remplace chaque valeur :
- NEXT_PUBLIC_SUPABASE_URL → ta Project URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY → ta anon key
- ANTHROPIC_API_KEY → ta clé Anthropic (console.anthropic.com)
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY → ta clé Stripe publishable
- STRIPE_SECRET_KEY → ta clé Stripe secret

---

## ÉTAPE 5 — Créer le produit sur Stripe
1. Va sur dashboard.stripe.com
2. Products → Add product
3. Nom : "Relanco Pro", Prix : 59€/mois, recurring
4. Copie le "Price ID" (commence par price_)
5. Colle-le dans .env.local → STRIPE_PRICE_ID

---

## ÉTAPE 6 — Lancer l'application
Dans le Terminal, dans ton dossier relanco :

  npm install
  npm run dev

Ouvre ton navigateur sur : http://localhost:3000
Ton application tourne ! 🎉

---

## ÉTAPE 7 — Mettre en ligne sur Vercel
1. Va sur github.com → New repository → "relanco" → Create
2. Dans le Terminal :

  git init
  git add .
  git commit -m "first commit"
  git remote add origin https://github.com/TON_USERNAME/relanco.git
  git push -u origin main

3. Va sur vercel.com → New Project → importe ton repo GitHub
4. Dans "Environment Variables", ajoute toutes les variables de ton .env.local
5. Clique Deploy

Ton app est en ligne ! Tu reçois une URL du type : relanco.vercel.app

---

## ÉTAPE 8 — Configurer le webhook Stripe (dernière étape)
1. Dans Stripe → Developers → Webhooks → Add endpoint
2. URL : https://TON_URL.vercel.app/api/stripe-webhook
3. Events : checkout.session.completed + customer.subscription.deleted
4. Copie le "Signing secret"
5. Dans Vercel → Settings → Environment Variables → ajoute STRIPE_WEBHOOK_SECRET
6. Redéploie (git push)

---

C'est terminé ! Ton SaaS est en production. 🚀
