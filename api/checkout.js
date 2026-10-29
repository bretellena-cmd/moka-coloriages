// POST /api/checkout — crée une session Stripe Checkout.
// Le prix est recalculé ici à partir du catalogue serveur : le panier du navigateur ne donne que des identifiants.
import { CATALOGUE } from "./_catalogue.js";
import { stripe, admin, utilisateur, emailValide } from "./_outils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée." });
  try {
    const { items, email, cgv, renonciation } = req.body || {};
    const ids = Array.isArray(items) ? [...new Set(items.map(String))].slice(0, 20) : [];
    if (!ids.length || ids.some((id) => !CATALOGUE[id])) return res.status(400).json({ error: "Panier invalide." });
    if (!emailValide(email)) return res.status(400).json({ error: "Adresse email invalide." });
    // Obligatoire pour du contenu numérique livré immédiatement (art. L221-28 13° du Code de la consommation)
    if (cgv !== true || renonciation !== true) return res.status(400).json({ error: "Merci d'accepter les CGV et la renonciation au droit de rétractation." });

    const user = await utilisateur(req, admin());
    const origin = process.env.SITE_URL || `https://${req.headers.host}`;

    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      locale: "fr",
      customer_email: email.trim(),
      line_items: ids.map((id) => ({
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: CATALOGUE[id].prix,
          product_data: { name: CATALOGUE[id].nom, description: `${CATALOGUE[id].planches} coloriage(s) · PDF A4 à imprimer` },
        },
      })),
      metadata: { items: ids.join(","), user_id: user ? user.id : "", renonciation_retractation: "oui", cgv: "acceptees" },
      success_url: `${origin}/merci.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/paiement.html`,
    });
    return res.status(200).json({ url: session.url });
  } catch (e) {
    console.error("checkout", e);
    return res.status(500).json({ error: "Le paiement n'a pas pu démarrer. Réessayez dans un instant." });
  }
}
