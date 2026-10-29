// Outils partagés par les fonctions Vercel (fichier préfixé par _ : pas exposé comme route).
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const stripe = () => new Stripe(process.env.STRIPE_SECRET_KEY);

// Client Supabase « serveur » : utilise la clé service_role, qui ne quitte jamais Vercel.
export const admin = () =>
  createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

// Utilisateur connecté à partir du jeton envoyé par le navigateur (ou null).
export async function utilisateur(req, sb) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return null;
  const { data, error } = await sb.auth.getUser(token);
  return error ? null : data.user;
}

export const numeroCommande = (session) =>
  "MK-" + new Date(session.created * 1000).getFullYear() + "-" + session.id.slice(-6).toUpperCase();

export const emailValide = (e) => typeof e === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
