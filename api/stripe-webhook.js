// POST /api/stripe-webhook — Stripe prévient ici quand un paiement est réussi.
// On enregistre la commande et les achats dans Supabase (avec la clé service_role).
import { CATALOGUE } from "./_catalogue.js";
import { stripe, admin, numeroCommande } from "./_outils.js";

// Stripe exige le corps brut pour vérifier la signature : on lit le flux nous-mêmes.
export const config = { api: { bodyParser: false } };
async function corpsBrut(req) {
  const morceaux = [];
  for await (const m of req) morceaux.push(typeof m === "string" ? Buffer.from(m) : m);
  return Buffer.concat(morceaux);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  let event;
  try {
    event = stripe().webhooks.constructEvent(await corpsBrut(req), req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    console.error("signature webhook", e.message);
    return res.status(400).send("Signature invalide");
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const s = event.data.object;
    if (s.payment_status !== "paid") return res.status(200).json({ recu: true });
    const items = (s.metadata.items || "").split(",").filter((id) => CATALOGUE[id]);
    const email = String((s.customer_details && s.customer_details.email) || s.customer_email || "").toLowerCase();
    const sb = admin();
    const { data: cmd, error } = await sb.from("commandes").upsert({
      stripe_session_id: s.id,
      numero: numeroCommande(s),
      email,
      user_id: s.metadata.user_id || null,
      total_cents: s.amount_total,
      articles: items,
      renonciation_retractation: s.metadata.renonciation_retractation === "oui",
    }, { onConflict: "stripe_session_id" }).select("id").single();
    if (error) { console.error("commande", error); return res.status(500).send("Erreur base"); }
    const lignes = items.map((pack_id) => ({ commande_id: cmd.id, pack_id, email, user_id: s.metadata.user_id || null }));
    const r = await sb.from("achats").upsert(lignes, { onConflict: "commande_id,pack_id" });
    if (r.error) { console.error("achats", r.error); return res.status(500).send("Erreur base"); }
  }
  return res.status(200).json({ recu: true });
}
