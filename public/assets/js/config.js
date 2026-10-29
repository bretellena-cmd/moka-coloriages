/* Configuration publique de Moka Coloriages.
   Tant que ces deux valeurs sont vides, le site tourne en MODE DÉMO :
   panier, compte et commandes sont simulés dans le navigateur (localStorage),
   et aucun paiement réel n'a lieu.

   Pour passer en réel (voir README.md) :
   - supabaseUrl et supabaseAnonKey : Supabase > Project Settings > API.
     ⚠️ Seule la clé « anon » (publique) va ici. Jamais la clé service_role.
   - La clé secrète Stripe et la clé service_role restent dans les variables
     d'environnement Vercel, côté serveur. */
window.MOKA_CONFIG = {
  supabaseUrl: "",
  supabaseAnonKey: ""
};
