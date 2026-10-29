# Générateur des pages HTML statiques de Moka Coloriages.
# Usage : depuis le dossier du projet, lancer  python3 outils/generer-pages.py
# Lit public/assets/js/data.js (le catalogue) et réécrit toutes les pages HTML de public/.
import json, os, subprocess, html as H

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(RACINE, "public") + os.sep
_js = """const vm=require('vm'),fs=require('fs');const c={window:{}};vm.createContext(c);
vm.runInContext(fs.readFileSync(process.argv[1],'utf8'),c);const M=c.window.MOKA;
process.stdout.write(JSON.stringify({univers:M.univers,packs:M.packs,offert:M.offert,ages:M.ages}));"""
D = json.loads(subprocess.check_output(["node", "-e", _js, os.path.join(OUT, "assets", "js", "data.js")]))
PACKS = D["packs"]; UNIV = D["univers"]; AGES = D["ages"]
P = {p["id"]: p for p in PACKS}
COF = P["coffret"]
REMISE = round((1 - COF["prix"] / COF["prixBarre"]) * 100)  # en %
e = H.escape

def prix(c): return f"{c/100:.2f}".replace(".", ",") + " €"
def couv(p):
    for pl in p["planches"]:
        if pl["img"]: return "assets/coloriages/" + pl["img"]
    return None

IC = {
 "user": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.2-3.6 4-5.4 7.5-5.4s6.3 1.8 7.5 5.4"/></svg>',
 "bag": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M5.5 8h13l-1 12h-11z"/><path d="M9 10V7a3 3 0 016 0v3" stroke-linecap="round"/></svg>',
 "heart": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0112 7.6 4.2 4.2 0 0119.5 10c0 5.4-7.5 10-7.5 10z"/></svg>',
 "print": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M7 9V4h10v5"/><rect x="4" y="9" width="16" height="7" rx="2"/><path d="M7 14h10v6H7z"/></svg>',
 "pencil": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><path d="M4 20l1.2-4.6L15.8 4.8a2 2 0 012.8 0l.6.6a2 2 0 010 2.8L8.6 18.8z"/></svg>',
 "lapin": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><ellipse cx="9.6" cy="5.5" rx="1.6" ry="4"/><ellipse cx="14.4" cy="5.5" rx="1.6" ry="4"/><circle cx="12" cy="12" r="3.6"/><ellipse cx="12" cy="18.8" rx="4.4" ry="3.4"/></svg>',
 "bolt": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M13 3L5 14h6l-1 7 8-11h-6z"/></svg>',
 "fleche": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
 "lock": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 018 0v2.5"/></svg>',
 "menu": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14"/></svg>',
 "check": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
 "dl": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 19h14"/></svg>',
 "a4": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/></svg>',
}
DOUDOU = '<svg viewBox="0 0 100 160" aria-hidden="true"><g stroke="#181818" stroke-width="7" fill="#fff"><ellipse cx="37" cy="32" rx="9" ry="27" transform="rotate(-7 37 32)"/><ellipse cx="63" cy="32" rx="9" ry="27" transform="rotate(7 63 32)"/><ellipse cx="50" cy="128" rx="33" ry="27"/><circle cx="50" cy="80" r="27"/></g><circle cx="41" cy="77" r="4.5" fill="#181818"/><circle cx="59" cy="77" r="4.5" fill="#181818"/><path d="M44 88q6 6 12 0" fill="none" stroke="#181818" stroke-width="4.5" stroke-linecap="round"/></svg>'

NAV = [("index.html", "Accueil", "accueil"), ("coloriages.html", "Les coloriages", "coloriages"),
       ("monde-de-moka.html", "Le monde de Moka", "monde"), ("coloriage-offert.html", "Coloriage offert", "offert")]

def header_full(actif):
    nav = "".join(f'<a href="{h}"{" aria-current=\"page\"" if k == actif else ""}>{t}</a>' for h, t, k in NAV)
    return f'''<header class="header"><div class="wrap header-in">
  <a class="logo" href="index.html"><img src="assets/img/logo.png" alt="Moka Coloriages, accueil" width="446" height="111"></a>
  <nav class="nav" id="nav" aria-label="Navigation principale">{nav}</nav>
  <div class="header-actions">
    <button class="btn-rond burger" type="button" aria-label="Menu" aria-expanded="false" aria-controls="nav">{IC["menu"]}</button>
    <a class="btn-rond" href="connexion.html" data-lien-compte aria-label="Mon compte">{IC["user"]}</a>
    <a class="btn-rond" href="paiement.html" aria-label="Mon panier">{IC["bag"]}<span class="pastille-compteur" data-compteur-panier hidden>0</span></a>
    <a class="btn-enfant" href="mode-enfant.html"><img src="assets/img/moka-icone.svg" alt="" width="40" height="40"><span>Mode enfant</span></a>
  </div></div></header>'''

def header_simple(droite):
    return f'''<header class="header header-simple" style="background:transparent;border:0;position:static"><div class="wrap header-in">
  <a class="logo" href="index.html"><img src="assets/img/logo.png" alt="Moka Coloriages, accueil" width="446" height="111"></a>
  <div>{droite}</div></div></header>'''

FOOTER = '''<footer class="footer"><div class="wrap">
  <div class="footer-grid">
    <div><img src="assets/img/logo-blanc.png" alt="Moka" width="446" height="111"><p class="small">Des aventures à colorier pour les 2 à 8 ans.</p></div>
    <div><h4>Découvrir</h4><ul><li><a href="coloriages.html">Les coloriages</a></li><li><a href="monde-de-moka.html">Le monde de Moka</a></li><li><a href="coloriage-offert.html">Coloriage offert</a></li><li><a href="mode-enfant.html">Mode enfant</a></li></ul></div>
    <div><h4>Aide</h4><ul><li><a href="faq.html">Questions fréquentes</a></li><li><a href="contact.html">Nous contacter</a></li><li><a href="mon-compte.html" data-lien-compte>Mon compte</a></li></ul></div>
    <div><h4>Infos</h4><ul><li><a href="mentions-legales.html">Mentions légales</a></li><li><a href="cgv.html">Conditions générales de vente</a></li><li><a href="confidentialite.html">Confidentialité</a></li><li><a href="cookies.html">Cookies</a></li></ul></div>
  </div>
  <div class="footer-bas">© <span data-annee>2026</span> Moka Coloriages · Sans publicité ni traceur.</div>
</div></footer>'''

def page(fichier, titre, desc, corps, actif=None, header="full", bandeau=False, page_id="", body_style="", scripts=("app.js",), body_attrs="", footer=True):
    if header == "full": hd = header_full(actif)
    elif header == "none": hd = ""
    else: hd = header
    band = '<div class="bandeau">Nouveau : Moka fête Noël est arrivé ! 5 coloriages d\'hiver à imprimer. <a href="pack-noel.html">Découvrir</a></div>' if bandeau else ""
    sc = "".join(f'<script src="assets/js/{s}" defer></script>' for s in ("config.js", "data.js") + tuple(scripts))
    st = f' style="{body_style}"' if body_style else ""
    full_title = titre if titre.startswith("Moka") else f"{titre} · Moka Coloriages"
    doc = f'''<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(full_title)}</title>
<meta name="description" content="{e(desc)}">
<meta name="theme-color" content="#FFD23F">
<meta property="og:title" content="{e(full_title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:image" content="assets/img/favicon-512.png">
<link rel="icon" type="image/png" sizes="32x32" href="assets/img/favicon-32.png">
<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">
<link rel="preload" href="assets/fonts/fredoka-latin-700-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/css/moka.css">
{sc}
</head>
<body data-page="{page_id}"{st}{(" " + body_attrs) if body_attrs else ""}>
<a class="skip" href="#contenu">Aller au contenu</a>
{band}{hd}
<main id="contenu">
{corps}
</main>
{FOOTER if footer else ""}
</body>
</html>
'''
    open(OUT + fichier, "w").write(doc)

# ---------- Composants ----------
def ages_attr(p):
    return {"2-4": "2-4", "4-6": "4-6", "6-8": "6-8", "4-8": "4-6 6-8"}[p["age"]]

def carte(p, achat=True, envie=True, cls="", nom_tag="div"):
    img = couv(p)
    coffret = p["id"] == "coffret"
    if coffret: img = "assets/img/moka-coffret.png"
    badge = f'<span class="pastille pastille-orange carte-badge">{e(p["badge"])}</span>' if p.get("badge") and not coffret else ""
    if coffret: badge = f'<span class="pastille pastille-orange carte-badge">-24 %</span>'
    n = p["nbPlanches"]
    infos = f'<span>{IC["pencil"]} {n} planche{"s" if n > 1 else ""}</span>'
    if p["doudou"]: infos += f'<span>{IC["lapin"]} doudou caché</span>'
    if coffret: infos += '<span>+ jeux bonus</span>'
    env = f'<button class="envie" type="button" data-envie="{p["id"]}" aria-pressed="false" aria-label="Ajouter {e(p["nom"])} à mes envies" style="top:20px;right:20px">{IC["heart"]}</button>' if (envie and not badge) else ""
    achat_html = ""
    if achat:
        barre = f'<span class="prix-barre">{prix(p["prixBarre"])}</span>' if p.get("prixBarre") else ""
        achat_html = f'<div class="carte-achat"><span class="prix">{prix(p["prix"])}{barre}</span><button class="btn btn-s" type="button" data-ajouter="{p["id"]}" aria-pressed="false">Ajouter au panier</button></div>'
    return f'''<article class="carte-pack {cls}" data-age="{p["age"]}" data-ages="{ages_attr(p)}" data-univers="{p["univers"]}" data-format="{p["format"]}" data-tags="{" ".join(p["tags"])}">
  <div style="position:relative"><a class="carte{" carte-coffret" if coffret else ""}" style="--couleur:var(--{p["univers"]})" href="pack-{p["id"]}.html">
    <span class="carte-img" style="display:block"><img src="{img}" alt="" loading="lazy"><span class="pastille">{AGES[p["age"]]}</span>{badge}</span>
    <{nom_tag} class="carte-nom">{e(p["nom"])}</{nom_tag}>
    <span class="carte-infos">{infos}</span>
  </a>{env}</div>
  {achat_html}
</article>'''

def mini_carte(p, rot=0, extra=""):
    img = couv(p)
    return f'<a class="eventail-item" href="pack-{p["id"]}.html" tabindex="-1"><span class="carte" style="--couleur:var(--{p["univers"]})"><span class="carte-img" style="display:block"><img src="{img}" alt=""><span class="pastille">{AGES[p["age"]]}</span></span><span class="carte-nom" style="display:block">{e(p["nom"])}</span></span></a>'

def acc(q, r, c="var(--vide)", ouvert=False):
    return f'<details class="acc"{" open" if ouvert else ""}><summary>{q}<span class="plus" style="--c:{c}" aria-hidden="true"></span></summary><div class="acc-corps">{r}</div></details>'

OFFERT_FORM = f'''<form id="form-offert" data-succes="offert-ok" novalidate>
  <label class="champ"><span>Votre email</span><input type="email" name="email" autocomplete="email" placeholder="prenom@exemple.fr" required></label>
  <label class="coche mt-16"><input type="checkbox" name="consentement"><span>Je veux aussi recevoir les nouvelles aventures de Moka (une fois par mois, maximum).</span></label>
  <p class="erreur" aria-live="polite"></p>
  <button class="btn btn-bloc mt-16" type="submit">Recevoir mon coloriage</button>
  <p class="small douce mt-16">Pas de spam, désinscription en un clic. <a href="confidentialite.html">Confidentialité</a></p>
</form>
<div id="offert-ok" hidden>
  <h3>C'est parti !</h3>
  <p class="mt-8">Votre coloriage est prêt. Le lien vous attend aussi dans votre boîte mail.</p>
  <a class="btn btn-bloc mt-24" href="{D["offert"]["pdf"]}" download>{IC["dl"]} Télécharger « {e(D["offert"]["titre"])} »</a>
  <p class="small douce mt-16">Format A4, noir et blanc, échelle 100 %.</p>
</div>'''

# =========================================================
# ACCUEIL
# =========================================================
eventail = "".join(mini_carte(P[i]) for i in ["espace", "foret", "montagne", "plage", "noel"])
univers_cartes = "".join(
    f'<a class="carte carte-univers" style="--couleur:var(--{p["univers"]})" href="pack-{p["id"]}.html"><span class="carte-img" style="display:block"><img src="{couv(p)}" alt="" loading="lazy"></span><span class="carte-nom">{e(UNIV[p["univers"]]["nom"])}</span></a>'
    for p in PACKS if p["id"] != "coffret")
packs_moment = "".join(carte(P[i]) for i in ["montagne", "plage", "noel", "ecole", "foret", "ferme", "espace", "docteur"])

accueil = f'''
<section class="hero"><div class="wrap hero-grid">
  <div>
    <h1 class="display">Choisi par l'enfant,<br> imprimé par le parent.</h1>
    <p class="body-l">Des aventures de Moka à colorier, en PDF à imprimer chez vous. Pensées pour chaque âge, de 2 à 8 ans. Sans pub, et sans écran pendant le coloriage.</p>
    <div class="row mt-32"><a class="btn" href="coloriages.html">Voir les coloriages</a><a class="btn btn-jaune" href="mode-enfant.html">Mode enfant</a></div>
    <div class="hero-atouts"><span>{IC["print"]} Imprimable à l'infini</span><span>{IC["pencil"]} Traits adaptés à chaque âge</span><span>{IC["lapin"]} Un doudou caché à trouver</span></div>
  </div>
  <div class="eventail" aria-hidden="true">{eventail}</div>
</div></section>

<section class="section"><div class="wrap">
  <h2 class="titre-section">Comment ça marche</h2>
  <div class="grid-3">
    <div class="boite"><div class="num bg-plage">1</div><h3>L'enfant choisit</h3><p class="mt-8 douce">En mode enfant, il explore le monde de Moka et choisit les packs de coloriages qui lui font envie.</p></div>
    <div class="boite"><div class="num bg-montagne">2</div><h3>Vous imprimez</h3><p class="mt-8 douce">Vous validez sa liste, vous payez, et vous imprimez les coloriages du pack en PDF, chez vous.</p></div>
    <div class="boite"><div class="num bg-ecole">3</div><h3>Il cherche le doudou, puis il colorie</h3><p class="mt-8 douce">Le doudou lapin de Moka se cache dans les planches. On le trouve d'abord, on sort les crayons ensuite.</p></div>
  </div>
</div></section>

<section class="section"><div class="wrap">
  <h2 class="titre-section">Les univers de Moka</h2>
  <div class="defile">{univers_cartes}</div>
</div></section>

<section class="section"><div class="wrap">
  <div class="between titre-section"><h2>Les packs du moment</h2>
    <div class="row" role="group" aria-label="Filtrer par âge">
      <button class="filtre" type="button" data-filtre-age="tous" aria-pressed="true">Tous</button>
      <button class="filtre" type="button" data-filtre-age="2-4" aria-pressed="false">2–4 ans</button>
      <button class="filtre" type="button" data-filtre-age="4-6" aria-pressed="false">4–6 ans</button>
      <button class="filtre" type="button" data-filtre-age="6-8" aria-pressed="false">6–8 ans</button>
    </div></div>
  <div class="grid-4" id="packs-moment">{packs_moment}</div>
  <p class="mt-24"><a class="lien" href="coloriages.html">Voir tous les coloriages</a></p>
</div></section>

<section class="section"><div class="wrap">
  <h2 class="titre-section">Un trait pour chaque âge</h2>
  <div class="grid-3">
    <div class="boite"><div style="background:var(--fond);border-radius:16px;padding:20px"><img src="assets/img/moka-trait-epais.png" alt="Moka dessiné avec un trait très épais" style="height:150px;margin:0 auto"></div><span class="pastille pastille-trait mt-16">2–4 ans</span><p class="mt-16 douce">Traits très épais, grandes zones, peu de détails. Parfait pour les gros crayons de cire.</p></div>
    <div class="boite"><div style="background:var(--fond);border-radius:16px;padding:20px"><img src="assets/img/moka-trait-moyen.png" alt="Moka dessiné avec un trait moyen" style="height:150px;margin:0 auto"></div><span class="pastille pastille-trait mt-16">4–6 ans</span><p class="mt-16 douce">Des scènes simples, un décor qui raconte une histoire, et le doudou à chercher.</p></div>
    <div class="boite"><div style="background:var(--fond);border-radius:16px;padding:20px"><img src="assets/img/moka-trait-fin.png" alt="Moka dessiné avec un trait fin" style="height:150px;margin:0 auto"></div><span class="pastille pastille-trait mt-16">6–8 ans</span><p class="mt-16 douce">Plus de détails et un trait plus fin, pour les mains plus sûres et les feutres pointus.</p></div>
  </div>
</div></section>

<section class="section"><div class="wrap">
  <div class="coffret-bloc bg-noir">
    <div>
      <span class="pastille pastille-orange">Coffret · -{REMISE} %</span>
      <h2 class="mt-24" style="font-size:44px;line-height:48px">Le Tour du Monde de Moka</h2>
      <p class="mt-16" style="max-width:34em">{e(P["coffret"]["resume"])}</p>
      <div class="row mt-24"><span class="prix" style="font-size:28px">{prix(COF["prix"])}</span><span class="prix-barre" style="color:#bdbdbd">{prix(COF["prixBarre"])}</span><a class="btn btn-jaune" href="pack-coffret.html">Découvrir le coffret</a></div>
    </div>
    <img src="assets/img/moka-coffret.png" alt="Moka, dessin au trait blanc">
  </div>
</div></section>

<section class="section"><div class="wrap duo">
  <div class="bg-foret" style="border-radius:24px;padding:48px 24px;display:flex;justify-content:center;align-items:center;min-height:420px">
    <figure class="passeport-photo"><img src="assets/img/moka-photo-identite.png" alt="Photo d'identité de Moka" width="600" height="680"><figcaption>Moka</figcaption></figure></div>
  <div>
    <h2>Voici Moka</h2>
    <p class="body-l mt-16 douce">Un petit ourson curieux et un peu maladroit, qui part à l'aventure avec son doudou lapin. À la montagne, à la plage, à l'école ou dans l'espace, les enfants le suivent d'un cahier à l'autre.</p>
    <div class="row mt-24"><span class="pastille pastille-trait">Curiosité</span><span class="pastille pastille-trait">Entraide</span><span class="pastille pastille-trait">Le droit de se tromper</span></div>
    <p class="mt-24"><a class="lien" href="monde-de-moka.html">Découvrir le monde de Moka</a></p>
  </div>
</div></section>

<section class="section"><div class="wrap">
  <div class="bg-jaune duo" style="border-radius:24px;padding:48px">
    <div>
      <h2>Votre premier coloriage est offert</h2>
      <p class="mt-16">Recevez « {e(D["offert"]["titre"])} » par email, prêt à imprimer pour le goûter.</p>
      <div class="boite mt-24" style="max-width:480px">{OFFERT_FORM}</div>
    </div>
    <div class="centre"><div style="display:inline-block;background:#fff;border:2px solid var(--encre);border-radius:16px;padding:12px;transform:rotate(5deg);max-width:280px"><img src="assets/coloriages/{D["offert"]["img"]}" alt="Le coloriage offert : la randonnée de Moka"></div></div>
  </div>
</div></section>

<section class="section"><div class="wrap">
  <h2 class="titre-section">Nos engagements</h2>
  <div class="grid-4">
    <div class="engagement bg-montagne"><h3>Zéro pub</h3><p>Ni sur le site, ni dans les cahiers. On colorie, c'est tout.</p></div>
    <div class="engagement bg-ecole"><h3>Zéro traceur</h3><p>Seulement les cookies nécessaires au panier et au compte.</p></div>
    <div class="engagement bg-foret"><h3>Rien sur l'enfant</h3><p>Ni prénom, ni photo. Juste une tranche d'âge, si vous le voulez.</p></div>
    <div class="engagement bg-plage"><h3>Ce que vous voyez, vous l'imprimez</h3><p>Les dessins du site sont ceux du PDF, en noir et blanc.</p></div>
  </div>
</div></section>

<section class="section"><div class="wrap-s">
  <h2 class="titre-section centre">Questions fréquentes</h2>
  {acc("Quelle imprimante utiliser ?", "Toute imprimante standard, jet d'encre ou laser, en noir et blanc. Les PDF sont calibrés pour l'A4.")}
  {acc("Puis-je imprimer plusieurs fois ?", "Oui, autant que vous voulez, pour toute la famille.")}
  {acc("Comment fonctionne le mode enfant ?", "Votre enfant explore le monde de Moka et choisit ses packs de coloriages. Vous gardez la main sur l'achat et l'impression : une petite question réservée aux adultes est posée avant de payer.")}
  {acc("Et si un fichier pose problème ?", "Comme le PDF est téléchargé tout de suite, le droit de rétractation ne s'applique plus. Mais si un fichier ne s'ouvre pas ou s'imprime mal, écrivez-nous : on trouve toujours une solution.")}
  <p class="centre mt-24"><a class="lien" href="faq.html">Toutes les questions</a></p>
</div></section>
'''
page("index.html", "Moka Coloriages · Coloriages à imprimer pour les 2 à 8 ans", "Des cahiers de coloriages en PDF à imprimer chez vous, avec Moka le petit ourson. Pensés pour chaque âge, de 2 à 8 ans. Sans pub, sans traceur.", accueil, actif="accueil", bandeau=True, page_id="accueil")

# =========================================================
# LES COLORIAGES
# =========================================================
f_univ = "".join(f'<button class="filtre" type="button" data-f="univers" data-v="{k}" aria-pressed="false"><span class="point" style="background:var(--{k})"></span>{e(v["nom"].replace("La ", "").replace("L\'", "").replace("Chez le ", ""))}</button>' for k, v in UNIV.items() if k != "coffret")
catalogue = "".join(carte(p, nom_tag="h2") for p in PACKS)
coloriages = f'''
<div class="wrap">
  <nav class="ariane" aria-label="Fil d'Ariane"><a href="index.html">Accueil</a> / Les coloriages</nav>
  <div class="row" style="align-items:baseline"><h1>Tous les coloriages</h1><span class="douce" style="font-weight:700" id="nb-cahiers" aria-live="polite">9 cahiers</span></div>
  <div class="row mt-24" role="group" aria-label="Idées">
    <button class="raccourci bg-ecole" type="button" data-f="tag" data-v="rentree" aria-pressed="false">Spécial rentrée</button>
    <button class="raccourci bg-montagne" type="button" data-f="tag" data-v="pluie" aria-pressed="false">Jour de pluie</button>
    <button class="raccourci bg-plage" type="button" data-f="tag" data-v="tout-petits" aria-pressed="false">Pour les tout-petits</button>
  </div>
  <div class="filtres mt-24">
    <div class="filtres-ligne"><span>Âge</span><div class="row">
      <button class="filtre" type="button" data-f="age" data-v="2-4" aria-pressed="false">2–4 ans</button>
      <button class="filtre" type="button" data-f="age" data-v="4-6" aria-pressed="false">4–6 ans</button>
      <button class="filtre" type="button" data-f="age" data-v="6-8" aria-pressed="false">6–8 ans</button></div></div>
    <div class="filtres-ligne"><span>Univers</span><div class="row">{f_univ}</div></div>
    <div class="filtres-ligne"><span>Format</span><div class="row">
      <button class="filtre" type="button" data-f="format" data-v="pack" aria-pressed="false">Pack</button>
      <button class="filtre" type="button" data-f="format" data-v="unite" aria-pressed="false">À l'unité</button>
      <button class="filtre" type="button" data-f="format" data-v="coffret" aria-pressed="false">Coffret</button></div></div>
  </div>
  <div class="grid-4 mt-32" id="catalogue">{catalogue}</div>
  <div class="vide-resultat" id="aucun" hidden><img src="assets/img/moka-coucou.png" alt="" style="width:120px;margin:0 auto 16px"><p class="h3">Aucun cahier avec ces filtres.</p><button class="btn btn-sec mt-16" type="button" id="reinit">Tout afficher</button></div>
</div>
<div class="section"></div>'''
page("coloriages.html", "Les coloriages", "Tous les cahiers de coloriages Moka à imprimer : montagne, plage, forêt, ferme, école, Noël, espace, docteur. Filtrez par âge, univers et format.", coloriages, actif="coloriages", page_id="coloriages")

# =========================================================
# FICHES PACK
# =========================================================
def fiche(p):
    pid = p["id"]; coffret = pid == "coffret"
    pls = [x for x in p["planches"]]
    reelles = [x for x in pls if x["img"]]
    badge = f'<span class="pastille pastille-orange">{e(p["badge"])}</span>' if p.get("badge") and not coffret else ""
    if coffret: badge = f'<span class="pastille pastille-orange">-{REMISE} % par rapport aux cahiers séparés</span>'
    barre = f'<span class="prix-barre" style="font-size:20px">{prix(p["prixBarre"])}</span>' if p.get("prixBarre") else ""
    label = "Ajouter au panier"
    if coffret:
        visuel = f'<div class="fiche-visuel bg-noir"><img src="assets/img/moka-coffret.png" alt="Moka, dessin au trait blanc" style="max-height:420px;margin:0 auto"></div>'
    else:
        g = reelles[0]
        visuel = f'''<div class="fiche-visuel"><img class="planche-grande" id="planche-grande" src="assets/coloriages/{g["img"]}" alt="{e(g["titre"])}" data-zoom="assets/coloriages/{g["img"]}" data-titre="{e(g["titre"])}">
          <p class="mt-16" style="font-weight:700"><span id="legende-planche">{e(g["titre"])}</span></p><p class="small douce">Touchez le dessin pour le voir en grand</p></div>'''
    atout_doudou = f'<li>{IC["lapin"]} Le doudou est caché dans chaque planche</li>' if p["doudou"] else f'<li>{IC["a4"]} PDF A4, en noir et blanc</li>'
    encart = '' if coffret else f'<a class="encart-coffret mt-24" href="pack-coffret.html"><strong>Envie de plus d\'aventures ?</strong>Le coffret Tour du Monde : 24 planches à {prix(COF["prix"])} au lieu de {prix(COF["prixBarre"])}.</a>'
    # Planches
    if coffret:
        bloc_planches = f'''<section class="section"><div class="wrap"><h2 class="titre-section">Dans le coffret</h2><div class="grid-3">
          <div class="boite"><h3>24 planches</h3><p class="mt-8 douce">Des scènes tirées des aventures de Moka, réunies dans un seul grand cahier.</p></div>
          <div class="boite"><h3>Pages bonus</h3><p class="mt-8 douce">Des labyrinthes et des jeux des 7 différences, à faire avant ou après le coloriage.</p></div>
          <div class="boite"><h3>Un seul PDF</h3><p class="mt-8 douce">Format A4, noir et blanc, imprimable à l'infini pour la famille.</p></div></div>
          <p class="mt-24 small douce">Le détail des planches sera affiché ici dès que le coffret sera finalisé.</p></div></section>'''
    else:
        tuiles = ""
        for i, x in enumerate(pls, 1):
            if x["img"]:
                tuiles += f'<button class="planche" type="button" data-planche="assets/coloriages/{x["img"]}" data-titre="{i}. {e(x["titre"])}" aria-current="{"true" if i == 1 else "false"}"><img src="assets/coloriages/{x["img"]}" alt="" loading="lazy">{i}. {e(x["titre"])}</button>'
            else:
                t = "" if x["titre"].startswith("Planche") else f'{i}. {e(x["titre"])}'
                tuiles += f'<div class="planche"><div class="planche-a-venir">Dessin<br>en cours</div>{t or f"Planche {i}"}</div>'
        n = p["nbPlanches"]
        bloc_planches = f'''<section class="section"><div class="wrap"><div class="between titre-section"><h2>{"La planche" if n == 1 else f"Les {n} planches du pack"}</h2><span class="small douce">Touchez une planche pour la voir en grand</span></div>
          <div class="planches">{tuiles}</div></div></section>'''
    doudou = f'''<section class="section" style="padding-top:0"><div class="wrap"><div class="doudou-bloc bg-{p["univers"]}">{DOUDOU}<div><h2 class="h3">Retrouve le doudou de Moka !</h2><p class="mt-8">Dans chaque planche, le petit lapin s'est caché : {e(p["cachettes"])}. On le cherche avant de colorier.</p></div></div></div></section>''' if p["doudou"] else ""
    autres = [q for q in PACKS if q["id"] not in (pid, "coffret")]
    autres.sort(key=lambda q: (q["age"] != p["age"], q["id"]))
    reco = "".join(carte(q, nom_tag="h3") for q in autres[:4])
    corps = f'''
<div class="wrap">
  <nav class="ariane" aria-label="Fil d'Ariane"><a href="index.html">Accueil</a> / <a href="coloriages.html">Les coloriages</a> / {e(p["nom"])}</nav>
  <div class="fiche">
    {visuel}
    <div class="fiche-info">
      <div class="row"><span class="pastille pastille-trait">{AGES[p["age"]]}</span>{badge}</div>
      <h1>{e(p["nom"])}</h1>
      <p class="body-l douce">{e(p["resume"])}</p>
      <span class="prix">{prix(p["prix"])}{barre}</span>
      <button class="btn btn-l btn-bloc" type="button" data-ajouter="{pid}" data-fiche data-label="{label}">{label}</button>
      <a class="btn btn-l btn-bloc btn-orange mt-16" href="paiement.html" data-si-panier="{pid}" hidden>Voir mon panier et payer</a>
      <ul class="fiche-atouts"><li>{IC["bolt"]} Accès immédiat après le paiement</li><li>{IC["print"]} Imprimable à l'infini, pour la famille</li>{atout_doudou}</ul>
      {encart}
    </div>
  </div>
</div>
{bloc_planches}
{doudou}
<section class="section" style="padding-top:0"><div class="wrap">
  <h2 class="titre-section">Ce qu'il faut pour colorier</h2>
  <div class="grid-3">
    <div class="boite"><h3 class="h4">Une imprimante standard</h3><p class="mt-8 douce">Jet d'encre ou laser, en noir et blanc. Format A4, échelle 100 %.</p></div>
    <div class="boite"><h3 class="h4">Le bon papier</h3><p class="mt-8 douce">80 à 90 g pour les crayons, 120 à 160 g pour les feutres.</p></div>
    <div class="boite"><h3 class="h4">Des crayons adaptés</h3><p class="mt-8 douce">Gros crayons de cire pour les 2–4 ans, feutres lavables ensuite.</p></div>
  </div>
</div></section>
<section class="section" style="padding-top:0"><div class="wrap-s" style="margin-left:max(0px,calc((100vw - 1280px)/2));">
  <h2 class="titre-section">Questions sur ce pack</h2>
  {acc("Comment je reçois les coloriages ?", "Juste après le paiement, le PDF est sur la page de confirmation, dans votre boîte mail, et dans « Mes coloriages » si vous avez un compte.")}
  {acc("Je peux l'imprimer plusieurs fois ?", "Oui, autant de fois que vous voulez pour votre famille. Le partage et la revente ne sont pas autorisés.")}
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
  <h2 class="titre-section">Vous aimerez aussi</h2>
  <div class="grid-4">{reco}</div>
</div></section>'''
    page(f"pack-{pid}.html", p["nom"] + " · coloriages à imprimer", p["resume"], corps, actif="coloriages", page_id="pack")

for p in PACKS: fiche(p)

# =========================================================
# LE MONDE DE MOKA
# =========================================================
voyages = ""
for k, p in enumerate([q for q in PACKS if q["id"] != "coffret"], 1):
    voyages += f'''<div class="voyage" style="--couleur:var(--{p["univers"]})"><div class="voyage-img"><img src="{couv(p)}" alt="{e(p["planches"][0]["titre"])}" loading="lazy"></div>
      <div><span class="pastille">Étape {k}</span><h3>{e(UNIV[p["univers"]]["nom"])}</h3><p class="douce body-l">{e(p["histoire"])}</p><p class="mt-16"><a class="lien" href="pack-{p["id"]}.html">Voir le cahier</a></p></div></div>'''
# Timbres de voyage : un par univers dont le tampon est dessiné (assets/img/tampon-<univers>.png)
TAMPONS = ["montagne", "plage", "foret", "espace"]
tampons = "".join(f'<a class="tampon-img" href="pack-{k}.html"><img src="assets/img/tampon-{k}.png" alt="Timbre {e(UNIV[k]["nom"].replace("La ", "").replace("L\'", ""))}" width="515" height="512"></a>' for k in TAMPONS)
monde = f'''
<section class="bg-jaune"><div class="wrap duo" style="padding-top:64px;padding-bottom:64px">
  <div><p class="label">Le monde de Moka</p><h1 class="display mt-16">Il était une fois un petit ourson…</h1>
    <p class="body-l mt-24" style="max-width:30em">Il s'appelle Moka. Il est curieux, un peu maladroit et toujours prêt à partir à l'aventure. Tourne les pages pour faire sa connaissance.</p>
    <a class="btn mt-32" href="#chapitre-1">Ouvrir l'histoire ↓</a></div>
  <img src="assets/img/moka-coucou.png" alt="Moka, assis, fait coucou" style="max-height:440px;margin:0 auto" class="flotte">
</div></section>

<section class="chapitre" id="chapitre-1"><div class="wrap">
  <p class="overline">Chapitre 1</p><h2 class="mt-8 titre-section">Le passeport de Moka</h2>
  <div class="passeport">
    <div class="passeport-g">
      <div class="between"><img src="assets/img/logo.png" alt="Moka" style="height:24px;width:auto"><span class="overline">Passeport · N° 0001</span></div>
      <figure class="passeport-photo"><img src="assets/img/moka-photo-identite.png" alt="Photo d'identité de Moka" width="600" height="680"><figcaption>Moka</figcaption></figure>
    </div>
    <div class="passeport-d">
      <dl>
        <div><dt>Nom</dt><dd>Moka</dd></div><div><dt>Espèce</dt><dd>Ourson brun</dd></div><div><dt>Âge</dt><dd>4 ans et demi</dd></div>
        <div><dt>Habite</dt><dd>Une cabane au pied de la montagne</dd></div><div><dt>Adore</dt><dd>Les crêpes au miel et sauter dans les flaques</dd></div>
        <div><dt>N'aime pas</dt><dd>Le bruit de l'aspirateur</dd></div><div><dt>Signe particulier</dt><dd>Sa veste, qu'il ne quitte jamais</dd></div>
        <div><dt>Meilleur ami</dt><dd>Son doudou</dd></div>
      </dl>
      <p class="overline mt-24">Timbres de voyage</p><div class="tampons">{tampons}</div>
    </div>
  </div>
</div></section>

<section class="chapitre bg-surface"><div class="wrap">
  <div class="centre titre-section"><p class="overline">Chapitre 2</p><h2 class="mt-8">Les grands voyages de Moka</h2><p class="body-l douce mt-16">Huit aventures, huit cahiers à colorier. Chacun a sa couleur, comme une page de son carnet.</p></div>
  <div class="mt-48">{voyages}</div>
</div></section>

<section class="chapitre"><div class="wrap duo" style="grid-template-columns:auto 1fr">
  <div class="rond-doudou">{DOUDOU}</div>
  <div><p class="overline">Chapitre 3</p><h2 class="mt-8">Le doudou, son fidèle compagnon</h2><p class="body-l douce mt-16">Où que Moka aille, son doudou n'est jamais loin. Il dort avec lui, part en voyage avec lui et le rassure quand quelque chose est nouveau. Dans les cahiers, il se cache : à vous de le trouver avant de colorier.</p></div>
</div></section>

<section class="chapitre bg-noir"><div class="wrap">
  <p class="overline">Chapitre 4</p><h2 class="mt-8 titre-section">Ce que Moka nous apprend</h2>
  <div class="grid-3">
    <div class="valeur bg-foret"><h3>Être curieux</h3><p>Chaque nouveau lieu est une occasion de poser des questions.</p></div>
    <div class="valeur bg-plage"><h3>S'entraider</h3><p>Moka aide les autres, et accepte qu'on l'aide aussi.</p></div>
    <div class="valeur bg-espace"><h3>Avoir le droit de se tromper</h3><p>On peut dépasser des traits : c'est comme ça qu'on apprend.</p></div>
  </div>
</div></section>

<section class="chapitre centre"><div class="wrap">
  <img src="assets/img/moka-coucou.png" alt="" style="width:180px;margin:0 auto">
  <h2 class="mt-24">À suivre… avec tes crayons !</h2>
  <p class="body-l douce mt-16">La suite de l'histoire, c'est ton enfant qui la colorie.</p>
  <div class="row mt-32" style="justify-content:center"><a class="btn btn-orange" href="coloriages.html">Voir les cahiers</a><a class="btn btn-sec" href="coloriage-offert.html">Recevoir un coloriage offert</a></div>
</div></section>'''
page("monde-de-moka.html", "Le monde de Moka", "Qui est Moka, le petit ourson des coloriages ? Son passeport, ses huit voyages, son doudou et ce qu'il nous apprend.", monde, actif="monde", page_id="monde")

# =========================================================
# COLORIAGE OFFERT
# =========================================================
o = D["offert"]
offert = f'''
<section class="bg-montagne" style="padding:64px 0 80px"><div class="wrap duo">
  <div style="position:relative;max-width:420px;margin:0 auto;width:100%;aspect-ratio:.85">
    <div style="position:absolute;inset:6% 14% 0 4%;background:#fff;border:2px solid var(--encre);border-radius:14px;transform:rotate(-9deg)"></div>
    <div style="position:absolute;inset:3% 8% 3% 8%;background:#fff;border:2px solid var(--encre);border-radius:14px;transform:rotate(-4deg)"></div>
    <div style="position:absolute;inset:0 4% 6% 14%;background:#fff;border:2px solid var(--encre);border-radius:14px;padding:12px;transform:rotate(2deg)"><img src="assets/coloriages/{o["img"]}" alt="Aperçu du coloriage offert : la randonnée de Moka" style="width:100%;height:100%;object-fit:contain"></div>
    <span class="bg-plage" style="position:absolute;right:0;top:4%;width:96px;height:96px;border-radius:50%;border:2px solid var(--encre);display:grid;place-items:center;text-align:center;font-family:var(--titre);font-weight:700;transform:rotate(12deg);line-height:20px">C'est<br>gratuit</span>
  </div>
  <div>
    <p class="label">Coloriage offert</p>
    <h1 class="mt-8">{e(o["titre"])}, offerte.</h1>
    <p class="body-l mt-16">Un vrai coloriage de nos cahiers, à imprimer ce soir. Pour découvrir Moka avant de choisir un cahier.</p>
    <div class="boite mt-24" style="max-width:480px">{OFFERT_FORM}</div>
  </div>
</div></section>
<section class="section"><div class="wrap">
  <h2 class="titre-section">Comment ça marche</h2>
  <div class="grid-3">
    <div class="row" style="align-items:flex-start;flex-wrap:nowrap"><div class="num bg-montagne" style="flex:none">1</div><div><h3 class="h4">Laissez votre email</h3><p class="douce small">Une seule adresse, aucun mot de passe.</p></div></div>
    <div class="row" style="align-items:flex-start;flex-wrap:nowrap"><div class="num bg-plage" style="flex:none">2</div><div><h3 class="h4">Téléchargez le PDF</h3><p class="douce small">Le lien arrive aussi dans votre boîte mail.</p></div></div>
    <div class="row" style="align-items:flex-start;flex-wrap:nowrap"><div class="num bg-foret" style="flex:none">3</div><div><h3 class="h4">Imprimez, coloriez !</h3><p class="douce small">Format A4, en noir et blanc.</p></div></div>
  </div>
  <div class="bg-plage between mt-48" style="border-radius:24px;padding:28px 32px">
    <div><h2 class="h3">Il a adoré ? La suite l'attend.</h2><p class="mt-8">Le cahier complet « Moka à la montagne » : 6 coloriages, {prix(P["montagne"]["prix"])}.</p></div>
    <a class="btn" href="pack-montagne.html">Voir le cahier</a>
  </div>
</div></section>'''
page("coloriage-offert.html", "Coloriage offert", "Recevez gratuitement « La randonnée de Moka », un vrai coloriage à imprimer, pour découvrir Moka.", offert, actif="offert", page_id="offert")

# =========================================================
# PANIER & PAIEMENT
# =========================================================
paiement = f'''
<div class="wrap" style="padding-bottom:64px">
  <p class="mt-16"><a class="lien" href="coloriages.html">← Continuer mes achats</a></p>
  <h1 class="mt-24 mb-24">Mon panier</h1>
  <div id="panier-vide" hidden class="boite centre"><img src="assets/img/moka-coucou.png" alt="" style="width:140px;margin:0 auto 16px"><h2 class="h3">Votre panier est vide</h2><p class="douce mt-8">Les cahiers ajoutés depuis le site ou choisis en mode enfant arriveront ici.</p><div class="row mt-24" style="justify-content:center"><a class="btn" href="coloriages.html">Voir les coloriages</a><a class="btn btn-jaune" href="mode-enfant.html">Mode enfant</a></div></div>
  <div id="panier-plein" class="panier-grid">
    <div class="boite">
      <div id="lignes"></div>
      <div class="totaux mt-24"><div><span>Sous-total</span><span id="sous-total">0,00 €</span></div><div><span>Livraison</span><span>Aucune, c'est un PDF</span></div><div class="total"><span>Total TTC</span><span id="total">0,00 €</span></div></div>
      <div id="encart-coffret" class="bg-plage between mt-24" style="border-radius:16px;padding:14px 18px"><span class="small"><strong>Le coffret Tour du Monde : {prix(COF["prix"])}</strong> au lieu de {prix(COF["prixBarre"])}</span><a class="lien small" href="pack-coffret.html">Voir le coffret</a></div>
    </div>
    <form class="boite-trait" id="form-paiement" novalidate>
      <h2 class="h3 mb-16">Vos informations</h2>
      <label class="champ"><span>Email</span><input type="email" name="email" autocomplete="email" placeholder="prenom@exemple.fr" required></label>
      <p class="aide">Les PDF y seront envoyés, et dans votre compte.</p>
      <label class="coche mt-24"><input type="checkbox" name="cgv" required><span>J'accepte les <a class="lien" href="cgv.html" target="_blank">conditions générales de vente</a>.</span></label>
      <label class="coche mt-16"><input type="checkbox" name="renonciation" required><span>Je demande l'accès immédiat aux PDF et je renonce à mon droit de rétractation de 14 jours.</span></label>
      <button class="btn btn-l btn-bloc mt-24" type="submit" id="btn-payer" disabled>Payer</button>
      <p class="erreur" id="erreur-paiement" aria-live="polite"></p>
      <p class="small douce mt-16">{IC["lock"].replace("<svg", '<svg width="14" height="14" style="vertical-align:-2px"')} Vous serez redirigé vers Stripe pour payer par carte, Apple Pay ou Google Pay. Nous ne voyons jamais vos coordonnées bancaires.</p>
      <p class="small mt-16 bg-plage" id="mode-demo" style="border-radius:12px;padding:10px 14px" hidden><strong>Mode démo :</strong> aucun paiement réel. La commande est simulée dans ce navigateur.</p>
    </form>
  </div>
</div>'''
page("paiement.html", "Mon panier", "Votre panier Moka Coloriages et le paiement sécurisé.", paiement,
     header=header_simple(f'<span class="row small" style="font-weight:700">{IC["lock"].replace("<svg", "<svg width=18 height=18")} Paiement sécurisé</span>'), page_id="paiement")

# =========================================================
# MERCI
# =========================================================
merci = f'''
<section class="bg-foret" style="padding:56px 0 80px"><div class="wrap-s centre">
  <img id="moka-joie" src="assets/img/moka-coucou.png" alt="Moka saute de joie" style="width:170px;margin:0 auto">
  <h1 class="display mt-24">Merci, à vos crayons !</h1>
  <p class="body-l mt-16">Commande <strong id="numero">…</strong> confirmée. Vos cahiers sont prêts, et une copie est partie par email.</p>
  <div id="telechargements" class="mt-32" style="text-align:left;max-width:560px;margin-left:auto;margin-right:auto"></div>
  <div class="boite mt-24" style="text-align:left;max-width:560px;margin-left:auto;margin-right:auto"><strong>Avant d'imprimer</strong><p class="small mt-8">Échelle 100 %, mode noir et blanc. Vous pourrez retélécharger les PDF à tout moment depuis votre compte.</p></div>
  <div class="row mt-32" style="justify-content:center"><a class="btn" href="inscription.html" id="creer-compte">Créer mon compte pour les retrouver</a><a class="btn btn-sec" href="index.html">Retour à l'accueil</a></div>
</div></section>'''
page("merci.html", "Merci pour votre commande", "Votre commande Moka Coloriages est confirmée.", merci, page_id="merci", body_attrs='data-noindex')

# =========================================================
# INSCRIPTION
# =========================================================
inscription = f'''
<div class="plein" style="min-height:calc(100vh - 92px)"><div class="wrap duo">
  <div>
    <section data-etape="1" class="carte-form">
      <p class="small" style="font-weight:700">Étape <span data-num-etape>1</span> sur 3</p><div class="progression mt-8 mb-24"><i style="width:33%"></i></div>
      <h1>Créez votre compte</h1><p class="douce small mb-24">Pour retrouver vos cahiers et les retélécharger quand vous voulez.</p>
      <form id="f-compte" novalidate>
        <label class="champ"><span>Votre prénom</span><input name="prenom" autocomplete="given-name" placeholder="Camille"></label>
        <label class="champ"><span>Email</span><input type="email" name="email" autocomplete="email" placeholder="prenom@exemple.fr"></label>
        <label class="champ"><span>Mot de passe</span><input type="password" name="mdp" autocomplete="new-password" minlength="8"><span class="aide">8 caractères minimum.</span></label>
        <p class="erreur" aria-live="polite"></p>
        <button class="btn btn-bloc mt-24" type="submit">Continuer</button>
      </form>
    </section>
    <section data-etape="2" class="carte-form" hidden>
      <p class="small" style="font-weight:700">Étape <span data-num-etape>2</span> sur 3</p><div class="progression mt-8 mb-24"><i style="width:66%"></i></div>
      <h1>Pour qui ?</h1><p class="douce small mb-24">Pour vous suggérer les bons cahiers. Nous ne demandons ni prénom ni photo d'enfant.</p>
      <form id="f-enfants" novalidate>
        <span class="champ-label">Nombre d'enfants</span>
        <div class="row"><button class="btn-rond" type="button" id="moins" aria-label="Un enfant de moins">–</button><strong id="nb-enfants" style="font-size:24px;min-width:24px;text-align:center" aria-live="polite">1</strong><button class="btn-rond" type="button" id="plus" aria-label="Un enfant de plus">+</button></div>
        <span class="champ-label mt-24">Tranches d'âge</span>
        <div class="row">
          <label class="coche"><input type="checkbox" name="age" value="2-4"><span>2–4 ans</span></label>
          <label class="coche"><input type="checkbox" name="age" value="4-6"><span>4–6 ans</span></label>
          <label class="coche"><input type="checkbox" name="age" value="6-8"><span>6–8 ans</span></label>
        </div>
        <button class="btn btn-bloc mt-32" type="submit">Continuer</button>
        <button class="btn btn-sec btn-bloc mt-8" type="button" id="passer">Passer cette étape</button>
      </form>
    </section>
    <section data-etape="3" class="carte-form centre" hidden>
      <p class="small" style="font-weight:700">Étape <span data-num-etape>3</span> sur 3</p><div class="progression mt-8 mb-24"><i style="width:100%"></i></div>
      <h1>Bienvenue <span data-prenom></span> !</h1>
      <p class="douce">Votre compte est prêt. « {e(o["titre"])} » vous attend déjà dans vos coloriages.</p>
      <div style="background:var(--montagne);border-radius:16px;padding:10px;max-width:200px;margin:24px auto"><img src="assets/coloriages/{o["img"]}" alt="" style="background:#fff;border-radius:10px"></div>
      <a class="btn btn-bloc" href="mon-compte.html">Voir mes coloriages</a>
      <a class="btn btn-sec btn-bloc mt-8" href="coloriages.html">Découvrir les cahiers</a>
    </section>
  </div>
  <div class="centre"><span class="bulle">Coucou ! Moi, c'est Moka.</span><img id="moka-bienvenue" src="assets/img/moka-coucou.png" alt="" style="max-width:300px;margin:16px auto 0"></div>
</div></div>'''
page("inscription.html", "Créer un compte", "Créez votre compte Moka Coloriages pour retrouver et retélécharger vos cahiers.", inscription,
     header=header_simple('<a class="lien" href="connexion.html">J\'ai déjà un compte</a>'), page_id="inscription", body_style="background:var(--montagne)", footer=False)

# =========================================================
# CONNEXION, MOT DE PASSE
# =========================================================
def page_rose(fichier, titre, desc, contenu, pid):
    corps = f'''<div class="plein" style="justify-content:center"><div class="wrap" style="display:flex;justify-content:center">
      <div style="position:relative;width:100%;max-width:460px;padding-top:146px">
        <img src="assets/img/moka-tete-connexion.png" alt="" width="859" height="792" style="position:absolute;top:0;left:50%;transform:translateX(-50%);width:170px;height:auto;z-index:0">
        <div class="carte-form" style="z-index:1">{contenu}</div>
      </div></div></div>'''
    page(fichier, titre, desc, corps, header=header_simple('<a class="lien" href="index.html">← Retour au site</a>'), page_id=pid, body_style="background:var(--rose)", footer=False)

page_rose("connexion.html", "Se connecter", "Connectez-vous à votre espace famille Moka Coloriages.", '''
  <h1>Content de vous revoir</h1>
  <form id="f-connexion" novalidate>
    <label class="champ"><span>Email</span><input type="email" name="email" autocomplete="email" placeholder="prenom@exemple.fr"></label>
    <label class="champ"><span>Mot de passe</span><input type="password" name="mdp" autocomplete="current-password"></label>
    <p class="small mt-8" style="text-align:right"><a class="lien" href="mot-de-passe-oublie.html">Mot de passe oublié ?</a></p>
    <p class="erreur" aria-live="polite"></p>
    <button class="btn btn-bloc mt-24" type="submit">Se connecter</button>
  </form>
  <p class="small centre mt-24">Pas encore de compte ? <a class="lien" href="inscription.html">Créer un compte</a></p>''', "connexion")

page_rose("mot-de-passe-oublie.html", "Mot de passe oublié", "Recevez un lien pour choisir un nouveau mot de passe.", '''
  <form id="f-oubli" novalidate>
    <h1>Mot de passe oublié ?</h1>
    <p class="douce small mb-24">Indiquez votre email : on vous envoie un lien pour en choisir un nouveau.</p>
    <label class="champ"><span>Email</span><input type="email" name="email" autocomplete="email" placeholder="prenom@exemple.fr"></label>
    <p class="erreur" aria-live="polite"></p>
    <button class="btn btn-bloc mt-24" type="submit">Recevoir le lien</button>
    <p class="small centre mt-24"><a class="lien" href="connexion.html">Retour à la connexion</a></p>
  </form>
  <div id="oubli-ok" class="centre" hidden>
    <h1>Regardez vos emails</h1>
    <p class="douce">Si un compte existe pour <strong id="email-envoye"></strong>, un lien vient de partir. Pensez à vérifier les indésirables.</p>
    <a class="btn btn-bloc mt-24" href="connexion.html">Retour à la connexion</a>
  </div>''', "oubli")

page_rose("nouveau-mot-de-passe.html", "Nouveau mot de passe", "Choisissez un nouveau mot de passe pour votre compte Moka.", '''
  <form id="f-mdp" novalidate>
    <h1>Nouveau mot de passe</h1>
    <label class="champ"><span>Nouveau mot de passe</span><input type="password" name="mdp" autocomplete="new-password"><span class="aide">8 caractères minimum.</span></label>
    <label class="champ"><span>Confirmez-le</span><input type="password" name="mdp2" autocomplete="new-password"></label>
    <p class="erreur" aria-live="polite"></p>
    <button class="btn btn-bloc mt-24" type="submit">Enregistrer</button>
  </form>
  <div id="mdp-ok" class="centre" hidden>
    <h1>C'est enregistré !</h1><p class="douce">Votre nouveau mot de passe est actif.</p>
    <a class="btn btn-bloc mt-24" href="mon-compte.html">Mes coloriages</a>
  </div>''', "nouveauMdp")

# =========================================================
# MON COMPTE
# =========================================================
compte = f'''
<div class="wrap section" id="compte" hidden>
  <div class="between">
    <div><h1 id="bonjour">Bonjour !</h1><div class="row mt-16" id="enfants"></div></div>
    <div class="chiffres"><div class="chiffre"><span class="small douce">Packs</span><strong id="c-packs">0</strong></div><div class="chiffre"><span class="small douce">Planches</span><strong id="c-planches">0</strong></div><div class="chiffre"><span class="small douce">Univers</span><strong id="c-univers">0/8</strong></div></div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 300px;gap:32px;align-items:start" class="mt-32 compte-grid">
    <div>
      <div class="onglets" id="onglets" role="tablist" aria-label="Mes coloriages"></div>
      <div class="boite mt-24" id="onglet-corps" role="tabpanel"></div>
    </div>
    <aside>
      <div class="boite"><h2 class="h4">Astuces d'impression</h2>
        <p class="small mt-16"><strong>Échelle 100 %.</strong> Évitez « Ajuster à la page ».</p>
        <p class="small mt-8"><strong>Noir et blanc.</strong> Le mode brouillon suffit.</p>
        <p class="small mt-8"><strong>Papier.</strong> 80–90 g pour les crayons, 120–160 g pour les feutres.</p></div>
      <div class="boite mt-16 bg-espace"><h2 class="h4">Où part Moka le mois prochain ?</h2><p class="small mt-8">Votez pour la prochaine aventure : le pack gagnant sort le mois prochain.</p><div id="vote" class="mt-8"></div></div>
      <button class="btn btn-sec btn-bloc mt-16" type="button" id="deconnexion">Se déconnecter</button>
    </aside>
  </div>
</div>
<style>@media (max-width:960px){{.compte-grid{{grid-template-columns:1fr !important}}}}</style>'''
page("mon-compte.html", "Mes coloriages", "Votre espace famille : bibliothèque, album, envies des enfants et factures.", compte, page_id="compte")

# =========================================================
# MODE ENFANT
# =========================================================
enfant = f'''<div class="enfant">
  <header class="enfant-header">
    <button class="btn-64" type="button" data-retour aria-label="Retour">{IC["fleche"]}</button>
    <span class="logo"><img src="assets/img/logo.png" alt="Moka"></span>
    <button class="btn-64 jaune" type="button" data-liste aria-label="Ma liste">{IC["bag"]}<span class="pastille-compteur" id="compteur-liste" hidden>0</span></button>
  </header>
  <div class="enfant-scene" id="scene" aria-live="polite"></div>
</div>'''
page("mode-enfant.html", "Mode enfant", "Le mode enfant de Moka : l'enfant choisit ses packs de coloriages, un parent confirme avant de payer.", enfant, header="none", page_id="enfant", scripts=("app.js", "enfant.js"), footer=False)
# Le mode enfant n'a pas de lien d'évitement utile ni de main large : on retire le skip-link
s = open(OUT + "mode-enfant.html").read().replace('<a class="skip" href="#contenu">Aller au contenu</a>\n', "")
open(OUT + "mode-enfant.html", "w").write(s)

# =========================================================
# FAQ
# =========================================================
themes = [
 ("packs", "Les packs", "var(--montagne)", [
   ("Qu'est-ce qu'un pack de coloriages ?", "Un fichier PDF à télécharger, avec 5 ou 6 coloriages d'une même aventure de Moka, plus une page de couverture. Vous l'imprimez chez vous, au format A4."),
   ("Je reçois quelque chose par la poste ?", "Non, rien n'est envoyé : tout est numérique. Vous téléchargez le PDF et vous imprimez les coloriages quand vous voulez."),
   ("Pour quel âge ?", "Chaque pack indique un âge conseillé : 2–4 ans pour les gros traits, jusqu'à 8 ans pour les scènes plus détaillées."),
   ("Je peux imprimer plusieurs fois ?", "Oui, autant de fois que vous voulez pour votre famille. Le partage ou la revente du PDF ne sont pas autorisés."),
   ("Quelle différence entre un pack, un coloriage à l'unité et le coffret ?", "Un pack réunit 5 ou 6 coloriages d'un même univers. Un coloriage à l'unité, c'est une seule planche. Le coffret Tour du Monde réunit 24 planches et des jeux bonus dans un seul PDF.")]),
 ("commande", "Commande et paiement", "var(--plage)", [
   ("Comment payer ?", "Par carte bancaire, Apple Pay ou Google Pay, via Stripe. Nous ne voyons jamais vos coordonnées bancaires."),
   ("Je reçois le PDF quand ?", "Tout de suite après le paiement : le lien de téléchargement est sur la page de confirmation et dans votre boîte mail."),
   ("Puis-je être remboursé ?", "Comme le PDF est téléchargé immédiatement, le droit de rétractation ne s'applique plus. En cas de souci de fichier, écrivez-nous : on trouve toujours une solution."),
   ("Comment marche le mode enfant ?", "Votre enfant choisit ses packs de coloriages sur la carte du monde de Moka. Pour payer, une question réservée aux adultes est posée, puis vous voyez le récapitulatif des packs avant de passer au paiement.")]),
 ("impression", "Impression", "var(--foret)", [
   ("Quelle imprimante utiliser ?", "Toute imprimante standard, jet d'encre ou laser, en noir et blanc. Les PDF sont calibrés pour l'A4."),
   ("Quel papier utiliser ?", "80 à 90 g pour les crayons, 120 à 160 g pour les feutres et la peinture."),
   ("Le dessin est coupé à l'impression", "Choisissez « Échelle 100 % » et non « Ajuster à la page » dans la fenêtre d'impression."),
   ("Je peux imprimer un seul coloriage du pack ?", "Oui. Dans la fenêtre d'impression, indiquez seulement le numéro de la page voulue.")]),
 ("compte", "Mon compte", "var(--rose)", [
   ("Un compte est-il obligatoire ?", "Non. Mais il permet de retrouver et retélécharger vos PDF à tout moment."),
   ("J'ai perdu mon PDF, comment le retrouver ?", "Connectez-vous à votre compte : tous vos packs sont dans « Ma bibliothèque », prêts à être retéléchargés."),
   ("Que faites-vous des données de mes enfants ?", "Nous ne demandons ni prénom ni photo : seulement une tranche d'âge, pour adapter les suggestions.")]),
]
puces = "".join(f'<a class="raccourci" href="#{k}" style="background:{c};text-decoration:none;display:inline-flex;align-items:center">{t}</a>' for k, t, c, _ in themes)
blocs = "".join(f'<section id="{k}" class="mt-48" style="scroll-margin-top:100px"><h2 class="h3 mb-16 row"><span style="width:14px;height:14px;border-radius:50%;background:{c};display:inline-block"></span>{t}</h2>' + "".join(acc(q, r, c) for q, r in qs) + "</section>" for k, t, c, qs in themes)
faq = f'''<div class="wrap-s section">
  <h1 class="display">Questions fréquentes</h1>
  <p class="body-l douce mt-16">Tout ce qu'il faut savoir avant de sortir les crayons.</p>
  <div class="row mt-24">{puces}</div>
  {blocs}
  <div class="bg-noir between mt-48" style="border-radius:24px;padding:28px 32px"><div><h2 class="h3">Pas trouvé votre réponse ?</h2><p class="small mt-8">On répond en moins de 48 heures.</p></div><a class="btn btn-jaune" href="contact.html">Nous écrire</a></div>
</div>'''
page("faq.html", "Questions fréquentes", "Packs de coloriages en PDF, commande, impression, compte : toutes les réponses sur les coloriages Moka à imprimer.", faq, page_id="faq")

# =========================================================
# CONTACT
# =========================================================
contact = f'''<section class="bg-espace plein" style="min-height:auto;padding:80px 0"><div class="wrap duo">
  <div><h1 class="display">Écrire à Moka</h1><p class="body-l mt-16" style="max-width:28em">Une question sur une commande, une idée d'aventure, un dessin à nous montrer ? On lit tout et on répond en moins de 48 heures.</p>
    <img src="assets/img/moka-lettre.png" alt="Moka tient une lettre" width="620" height="941" style="width:260px;height:auto;margin:32px 0 0 48px"></div>
  <div class="carte-form" style="max-width:none">
    <form id="f-contact" novalidate>
      <label class="champ"><span>Votre prénom</span><input name="prenom" autocomplete="given-name" placeholder="Camille"></label>
      <label class="champ"><span>Email</span><input type="email" name="email" autocomplete="email" placeholder="prenom@exemple.fr"></label>
      <label class="champ"><span>Sujet</span><select name="sujet"><option>Ma commande</option><option>Un problème d'impression</option><option>Une idée d'aventure</option><option>Mes données</option><option>Autre chose</option></select></label>
      <label class="champ"><span>Message</span><textarea name="message" placeholder="Bonjour Moka…"></textarea></label>
      <p class="erreur" aria-live="polite"></p>
      <button class="btn btn-bloc mt-24" type="submit">Envoyer</button>
    </form>
    <div id="contact-ok" class="centre" hidden><img src="assets/img/moka-coucou.png" alt="" style="width:140px;margin:0 auto 16px" class="joie"><h2 tabindex="-1">Message bien reçu !</h2><p class="douce mt-8">Merci. On vous répond par email en moins de 48 heures.</p><button class="btn btn-sec mt-24" type="button" id="re-ecrire">Écrire un autre message</button></div>
  </div>
</div></section>'''
page("contact.html", "Nous contacter", "Écrivez à l'équipe Moka Coloriages : commande, impression, idée d'aventure.", contact, page_id="contact")

# =========================================================
# LÉGAL (4 pages, même contenu, ancrées sur leur section)
# =========================================================
AC = lambda t: f'<span class="a-completer">[{t}]</span>'
legal_corps = f'''<div class="wrap section">
  <h1>Informations légales</h1><p class="douce mt-8">Mise à jour le 29 octobre 2026. Les passages entre crochets sont à compléter.</p>
  <div class="legal mt-32">
    <nav class="sommaire" aria-label="Sommaire"><a href="mentions-legales.html#mentions">Mentions légales</a><a href="cgv.html#cgv">Conditions générales de vente</a><a href="confidentialite.html#confidentialite">Politique de confidentialité</a><a href="cookies.html#cookies">Cookies</a></nav>
    <div>
      <section id="mentions"><h2>Mentions légales</h2>
        <h3>Éditeur</h3><p>Moka Coloriages, {AC("forme juridique et capital à compléter")}, {AC("adresse")}, SIRET {AC("à compléter")}. Contact : {AC("email de contact")}.</p><p class="mt-8">Directrice de la publication : Léna Bretel-Müller.</p>
        <h3>Hébergement</h3><p>Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis.</p>
        <h3>Propriété intellectuelle</h3><p>Les illustrations, le personnage de Moka et les textes sont protégés. Toute reproduction hors usage familial est interdite.</p></section>
      <section id="cgv"><h2>Conditions générales de vente</h2>
        <h3>Produits</h3><p>Des fichiers PDF à imprimer, pour un usage strictement familial et non commercial. Le partage, la revente et l'usage en classe ne sont pas couverts {AC("usage en classe : à trancher")}.</p>
        <h3>Prix et paiement</h3><p>Prix en euros TTC. Paiement sécurisé par Stripe (carte bancaire, Apple Pay, Google Pay).</p>
        <h3>Livraison</h3><p>Accès immédiat après paiement, par téléchargement et par email. Les PDF restent téléchargeables depuis le compte client.</p>
        <h3>Droit de rétractation</h3><p>Conformément à l'article L221-28 13° du Code de la consommation, il ne s'applique plus une fois le téléchargement commencé, avec votre accord exprès donné au moment du paiement.</p>
        <h3>Réclamations</h3><p>En cas de fichier défectueux, écrivez-nous depuis la page contact. Médiateur de la consommation : {AC("nom et coordonnées du médiateur")}.</p></section>
      <section id="confidentialite"><h2>Politique de confidentialité</h2>
        <h3>Données collectées</h3><p>Email, prénom du parent, tranche d'âge des enfants (facultatif), historique de commandes. Aucun prénom ni photo d'enfant.</p>
        <h3>Finalités</h3><p>Livrer vos achats, gérer votre compte, et vous écrire si vous l'avez accepté.</p>
        <h3>Sous-traitants</h3><p>Supabase (comptes et base de données), Stripe (paiement), Vercel (hébergement). {AC("pays d'hébergement des données à vérifier")}</p>
        <h3>Durée de conservation</h3><p>{AC("durées à compléter")}. Les factures sont conservées 10 ans (obligation comptable).</p>
        <h3>Vos droits</h3><p>Accès, rectification, suppression : écrivez-nous depuis la <a class="lien" href="contact.html?sujet=Mes%20donn%C3%A9es">page contact</a>. Vous pouvez aussi saisir la CNIL.</p></section>
      <section id="cookies"><h2>Cookies</h2>
        <h3>Ce que nous utilisons</h3><p>Uniquement le stockage nécessaire au fonctionnement du site (session de connexion, panier, liste du mode enfant). Aucun traceur publicitaire ni mesure d'audience, donc pas de bandeau à cliquer.</p></section>
    </div>
  </div>
</div>'''
for f, sec, t in [("mentions-legales.html", "mentions", "Mentions légales"), ("cgv.html", "cgv", "Conditions générales de vente"), ("confidentialite.html", "confidentialite", "Politique de confidentialité"), ("cookies.html", "cookies", "Cookies")]:
    page(f, t, "Informations légales de Moka Coloriages : " + t.lower() + ".", legal_corps, page_id="legal", body_attrs=f'data-section="{sec}"')

# =========================================================
# 404
# =========================================================
p404 = '''<section class="bg-docteur" style="padding:80px 0"><div class="wrap duo">
  <div><p class="display" style="font-size:140px;line-height:140px" aria-hidden="true">404</p>
    <h1 class="mt-16">Oups, Moka s'est perdu…</h1>
    <p class="body-l mt-16">Cette page n'existe pas, ou elle est partie en randonnée. On vous ramène sur le bon chemin ?</p>
    <div class="row mt-32"><a class="btn" href="/index.html">Retour à l'accueil</a><a class="btn btn-sec" href="/coloriages.html">Voir les coloriages</a></div></div>
  <div style="position:relative;max-width:420px;margin:0 auto">
    <svg viewBox="0 0 400 420" style="position:absolute;inset:0;width:100%;height:100%" aria-hidden="true"><path d="M20 400 C 80 330, 60 260, 140 230 S 300 200, 330 30" fill="none" stroke="#181818" stroke-width="7" stroke-linecap="round" stroke-dasharray="2 20"/><text x="40" y="90" font-family="Fredoka" font-weight="700" font-size="52" fill="#181818">?</text><text x="330" y="40" font-family="Fredoka" font-weight="700" font-size="70" fill="#181818">?</text></svg>
    <img src="/assets/img/moka-coucou.png" alt="Moka, un peu perdu" style="position:relative;width:78%;margin:40px auto 0">
  </div>
</div></section>'''
page("404.html", "Page introuvable", "Cette page n'existe pas.", p404.replace('href="/', 'href="').replace('src="/', 'src="'), page_id="404")
# Vercel sert 404.html pour n'importe quelle URL : on passe ses liens en absolus pour qu'ils marchent depuis un sous-dossier.
s = open(OUT + "404.html").read()
for a in ['href="assets/', 'src="assets/', 'href="index.html', 'href="coloriages.html', 'href="monde-de-moka.html', 'href="coloriage-offert.html', 'href="connexion.html', 'href="paiement.html', 'href="mode-enfant.html', 'href="faq.html', 'href="contact.html', 'href="mon-compte.html', 'href="mentions-legales.html', 'href="cgv.html', 'href="confidentialite.html', 'href="cookies.html', 'src="assets/js']:
    s = s.replace(a, a.replace('="', '="/'))
open(OUT + "404.html", "w").write(s)

print("Pages générées :", sorted(f for f in os.listdir(OUT) if f.endswith(".html")))
