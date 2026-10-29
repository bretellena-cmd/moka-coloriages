# Moka Coloriages — le site

Boutique de cahiers de coloriages en PDF à imprimer, pour les 2 à 8 ans.
Site HTML statique + 3 fonctions Vercel (Stripe et Supabase).

## Le voir tout de suite (mode démo)

Le site marche sans aucun compte ni clé : panier, mode enfant, paiement, compte et téléchargements sont **simulés dans le navigateur**.

1. Ouvre un terminal dans ce dossier (`moka-site`).
2. Lance `npx serve .` (ou `python3 -m http.server`).
3. Va sur **http://localhost:3000/public/** (ou `:8000/public/` avec Python).

Tu peux aussi double-cliquer sur `public/index.html` : tout marche, sauf la page 404.

Pour repartir de zéro en démo : outils de développement du navigateur > Application > Local Storage > tout effacer.

## Ce qu'il y a dans le dossier

```
moka-site/
├── public/                  ← le site (c'est ce dossier que Vercel publie)
│   ├── *.html               ← 28 pages
│   └── assets/
│       ├── css/moka.css     ← design system Moka Pop (couleurs, typo, composants)
│       ├── js/data.js       ← LE CATALOGUE : packs, prix (en centimes), planches
│       ├── js/config.js     ← clés publiques Supabase (vide = mode démo)
│       ├── js/app.js        ← panier, compte, paiement, filtres…
│       ├── js/enfant.js     ← le mode enfant
│       ├── coloriages/      ← les planches (PNG noir et blanc)
│       ├── img/             ← logo, Moka, favicon
│       ├── fonts/           ← Fredoka + TeX Gyre Heros, hébergées ici (aucun appel à Google)
│       └── pdf/             ← le coloriage offert (public)
├── pdf-prives/              ← les PDF payants : à mettre dans Supabase, JAMAIS dans public/
├── api/                     ← fonctions Vercel : checkout, stripe-webhook, download
├── supabase/schema.sql      ← tables, règles d'accès (RLS), bucket privé
├── outils/generer-pages.py  ← regénère les pages HTML à partir de data.js
├── vercel.json, package.json, .env.example
```

## Modifier le contenu

- **Un prix, un pack, une planche** : modifie `public/assets/js/data.js`, puis lance
  `python3 outils/generer-pages.py` pour mettre à jour les pages.
  Si tu changes un prix, change-le aussi dans `api/_catalogue.js` (c'est le serveur qui fait foi au paiement).
- **Une nouvelle planche** : dépose le PNG dans `public/assets/coloriages/`, puis remplace `img: null` par son nom de fichier dans `data.js`.
- **Le doudou** : mets `doudou: true` sur un pack quand le doudou est vraiment dessiné dans toutes ses planches. La mention « doudou caché » et le bloc « Retrouve le doudou » apparaissent alors.
- **Les textes** : directement dans `outils/generer-pages.py` (puis relancer), ou dans les fichiers HTML (mais une regénération écrasera tes changements).

⚠️ Les planches et les dessins de Moka ont été découpés dans le PDF du canevas : ils sont nets à l'écran, mais **pas assez définis pour l'impression**. Remplace-les par tes fichiers d'origine (`SITE_COLORIAGES/MOKA_SCÈNES/…`) en gardant les mêmes noms, et régénère les vrais PDF de chaque pack.

## Mise en ligne réelle (paiement et comptes)

### 1. Supabase
1. Crée un projet sur supabase.com.
2. SQL Editor > New query : colle `supabase/schema.sql`, clique **Run**.
3. Storage > bucket **pdfs** (privé, déjà créé par le script) : envoie les PDF de `pdf-prives/` (`montagne.pdf`, `foret.pdf`…).
4. Authentication > URL Configuration : mets l'adresse du site dans *Site URL* et ajoute `…/mon-compte.html` et `…/nouveau-mot-de-passe.html` dans *Redirect URLs*.
5. Project Settings > API : copie l'URL et la clé **anon** dans `public/assets/js/config.js`. Garde la clé **service_role** pour Vercel.

### 2. Stripe
1. Crée un compte sur stripe.com (reste en *mode test* au début).
2. Developers > API keys : récupère la clé secrète `sk_test_…`.
3. Settings > Payment methods : active carte, Apple Pay, Google Pay.

### 3. Vercel
1. Mets le dossier `moka-site` sur GitHub, puis importe-le dans Vercel (framework : *Other*).
2. Settings > Environment Variables : ajoute celles de `.env.example`.
3. Déploie, puis dans Stripe > Developers > Webhooks : ajoute l'URL `https://ton-site.vercel.app/api/stripe-webhook`, événements `checkout.session.completed` et `checkout.session.async_payment_succeeded`. Copie le secret `whsec_…` dans `STRIPE_WEBHOOK_SECRET` et redéploie.
4. Test : carte `4242 4242 4242 4242`, n'importe quelle date future, n'importe quel code.

### Sécurité
- Dans le navigateur, il n'y a **que** la clé publique *anon* de Supabase.
- La clé *service_role* et la clé secrète Stripe restent dans les variables Vercel.
- Le prix est recalculé côté serveur ; un panier trafiqué ne change rien.
- Les PDF payants sont dans un stockage privé : `/api/download` vérifie l'achat, puis donne un lien valable 5 minutes.

## Avant la vraie mise en ligne
- Compléter les passages `[entre crochets]` des pages légales (forme juridique, adresse, SIRET, médiateur, durées de conservation).
- Remplacer les planches par les fichiers HD et produire les PDF finaux.
- Trancher les points encore ouverts (voir la synthèse : usage en classe, porte parentale à la sortie du mode enfant, âges de certains packs).
