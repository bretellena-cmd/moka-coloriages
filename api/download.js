// GET /api/download
//   ?session_id=cs_…            → détail de la commande (page Merci)
//   ?session_id=cs_…&pack=foret → lien temporaire vers le PDF, juste après l'achat (7 jours)
//   ?pack=foret + en-tête Authorization: Bearer <jeton> → lien temporaire depuis l'espace famille
// Les PDF sont dans un stockage Supabase PRIVÉ (bucket « pdfs ») : seul ce serveur peut créer un lien, valable 5 minutes.
import { CATALOGUE } from "./_catalogue.js";
import { stripe, admin, utilisateur, numeroCommande } from "./_outils.js";

const SEPT_JOURS = 7 * 24 * 3600;

async function lien(sb, pack) {
  const { data, error } = await sb.storage.from("pdfs").createSignedUrl(`${pack}.pdf`, 300, { download: `moka-${pack}.pdf` });
  if (error) throw error;
  return data.signedUrl;
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Méthode non autorisée." });
  res.setHeader("Cache-Control", "no-store");
  const { session_id, pack } = req.query;
  if (pack && !CATALOGUE[pack]) return res.status(400).json({ error: "Cahier inconnu." });
  const sb = admin();
  try {
    if (session_id) {
      const s = await stripe().checkout.sessions.retrieve(String(session_id));
      if (s.payment_status !== "paid") return res.status(402).json({ error: "Le paiement n'est pas encore confirmé. Rechargez la page dans un instant." });
      const items = (s.metadata.items || "").split(",").filter((id) => CATALOGUE[id]);
      if (!pack) return res.status(200).json({ numero: numeroCommande(s), items });
      if (Date.now() / 1000 - s.created > SEPT_JOURS) return res.status(410).json({ error: "Ce lien a expiré. Retrouvez vos cahiers dans votre compte." });
      if (!items.includes(pack)) return res.status(403).json({ error: "Ce cahier ne fait pas partie de la commande." });
      return res.status(200).json({ url: await lien(sb, pack) });
    }
    const user = await utilisateur(req, sb);
    if (!user) return res.status(401).json({ error: "Connectez-vous pour télécharger vos cahiers." });
    const parId = await sb.from("achats").select("id").eq("pack_id", pack).eq("user_id", user.id).limit(1);
    const parEmail = await sb.from("achats").select("id").eq("pack_id", pack).eq("email", String(user.email).toLowerCase()).limit(1);
    const data = [...(parId.data || []), ...(parEmail.data || [])];
    if (!data.length) return res.status(403).json({ error: "Ce cahier n'est pas dans votre bibliothèque." });
    return res.status(200).json({ url: await lien(sb, pack) });
  } catch (e) {
    console.error("download", e);
    return res.status(500).json({ error: "Téléchargement impossible pour le moment." });
  }
}
