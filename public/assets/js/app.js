/* Moka Coloriages — scripts du site (sans dépendance).
   Mode démo tant que assets/js/config.js est vide ; sinon Supabase + Stripe via /api. */
(function () {
  "use strict";
  var M = window.MOKA;
  var CFG = window.MOKA_CONFIG || {};
  var REEL = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);
  M.reel = REEL;

  /* ---------- Outils ---------- */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var lire = function (k, def) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } };
  var ecrire = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  var params = new URLSearchParams(location.search);
  var emailOk = function (e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e).trim()); };
  var sansAccent = function (s) { return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); };
  M.$ = $; M.$$ = $$; M.esc = esc;

  var I = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    dl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 19h14"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 018 0v2.5"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>'
  };
  M.icones = I;

  /* ---------- Toast ---------- */
  var toastEl, toastT;
  M.toast = function (html) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "toast"; toastEl.setAttribute("role", "status"); document.body.appendChild(toastEl); }
    toastEl.innerHTML = I.check + "<span>" + html + "</span>";
    toastEl.classList.add("visible");
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove("visible"); }, 3200);
  };

  /* ---------- Panier ---------- */
  var panier = {
    items: function () { return lire("moka_panier", []).filter(function (id) { return M.pack(id); }); },
    a: function (id) { return panier.items().indexOf(id) > -1; },
    ajouter: function (id) { var l = panier.items(); if (l.indexOf(id) < 0) l.push(id); ecrire("moka_panier", l); maj(); },
    retirer: function (id) { ecrire("moka_panier", panier.items().filter(function (x) { return x !== id; })); maj(); },
    vider: function () { ecrire("moka_panier", []); maj(); },
    total: function () { return panier.items().reduce(function (s, id) { return s + M.pack(id).prix; }, 0); }
  };
  M.panier = panier;

  function maj() {
    var n = panier.items().length;
    $$("[data-compteur-panier]").forEach(function (el) { el.textContent = n; el.hidden = n === 0; });
    $$("[data-ajouter]").forEach(function (b) {
      var dedans = panier.a(b.getAttribute("data-ajouter"));
      if (b.hasAttribute("data-fiche")) {
        b.innerHTML = dedans ? "Ajouté au panier " + I.check : b.getAttribute("data-label");
        b.classList.toggle("btn-vert", dedans);
      } else {
        b.innerHTML = dedans ? "Dans le panier " + I.check : "Ajouter au panier";
        b.classList.toggle("btn-sec", dedans);
      }
      b.setAttribute("aria-pressed", dedans ? "true" : "false");
    });
    $$("[data-si-panier]").forEach(function (el) { el.hidden = !panier.a(el.getAttribute("data-si-panier")); });
    var envies = lire("moka_envies", []);
    $$("[data-envie]").forEach(function (b) { b.setAttribute("aria-pressed", envies.indexOf(b.getAttribute("data-envie")) > -1 ? "true" : "false"); });
  }
  M.maj = maj;

  /* ---------- Compte : démo ou Supabase ---------- */
  var sb = null;
  function supabase() {
    if (!REEL) return Promise.resolve(null);
    if (sb) return Promise.resolve(sb);
    return import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm").then(function (mod) {
      sb = mod.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey);
      return sb;
    });
  }
  var demo = {
    comptes: function () { return lire("moka_demo_comptes", {}); },
    sauver: function (c) { var all = demo.comptes(); all[c.email] = c; ecrire("moka_demo_comptes", all); },
    session: function () { var e = lire("moka_demo_session", null); return e ? demo.comptes()[e] || null : null; }
  };

  M.api = {
    /* Utilisateur connecté (ou null) : { email, prenom, enfants:[{age}], achats:[packId], commandes:[], colories:[] } */
    moi: function () {
      if (!REEL) return Promise.resolve(demo.session());
      return supabase().then(function (s) {
        return s.auth.getUser().then(function (r) {
          var u = r.data && r.data.user; if (!u) return null;
          return Promise.all([
            s.from("profils").select("prenom").eq("id", u.id).maybeSingle(),
            s.from("enfants").select("id,tranche_age").eq("parent_id", u.id),
            s.from("achats").select("pack_id,commande_id"),
            s.from("commandes").select("numero,created_at,total_cents,articles").order("created_at", { ascending: false }),
            s.from("votes").select("choix").eq("user_id", u.id).maybeSingle()
          ]).then(function (res) {
            var colories = lire("moka_colories_" + u.id, []);
            return {
              id: u.id, email: u.email, prenom: (res[0].data && res[0].data.prenom) || "",
              enfants: (res[1].data || []).map(function (e) { return { id: e.id, age: e.tranche_age }; }),
              achats: ["offert"].concat((res[2].data || []).map(function (a) { return a.pack_id; })),
              commandes: (res[3].data || []).map(function (c) { return { numero: c.numero, date: c.created_at, total: c.total_cents, items: c.articles || [] }; }),
              vote: res[4].data ? res[4].data.choix : null, colories: colories
            };
          });
        });
      });
    },
    inscription: function (prenom, email, mdp) {
      if (!REEL) {
        if (demo.comptes()[email]) return Promise.reject(new Error("Un compte existe déjà avec cet email."));
        var invites = lire("moka_demo_commandes_invite", []).filter(function (c) { return c.email === email; });
        var achats = ["offert"]; invites.forEach(function (c) { c.items.forEach(function (i) { if (achats.indexOf(i) < 0) achats.push(i); }); });
        demo.sauver({ email: email, prenom: prenom, enfants: [], achats: achats, commandes: invites, colories: [], vote: null });
        ecrire("moka_demo_session", email);
        return Promise.resolve();
      }
      return supabase().then(function (s) {
        return s.auth.signUp({ email: email, password: mdp, options: { data: { prenom: prenom }, emailRedirectTo: location.origin + "/mon-compte.html" } })
          .then(function (r) { if (r.error) throw r.error; return r; });
      });
    },
    connexion: function (email, mdp) {
      if (!REEL) {
        if (!demo.comptes()[email]) return Promise.reject(new Error("Aucun compte avec cet email. Vous pouvez en créer un."));
        ecrire("moka_demo_session", email); return Promise.resolve();
      }
      return supabase().then(function (s) { return s.auth.signInWithPassword({ email: email, password: mdp }).then(function (r) { if (r.error) throw new Error("Email ou mot de passe incorrect."); }); });
    },
    deconnexion: function () {
      if (!REEL) { ecrire("moka_demo_session", null); return Promise.resolve(); }
      return supabase().then(function (s) { return s.auth.signOut(); });
    },
    motDePasseOublie: function (email) {
      if (!REEL) return Promise.resolve();
      return supabase().then(function (s) { return s.auth.resetPasswordForEmail(email, { redirectTo: location.origin + "/nouveau-mot-de-passe.html" }); });
    },
    nouveauMotDePasse: function (mdp) {
      if (!REEL) return Promise.resolve();
      return supabase().then(function (s) { return s.auth.updateUser({ password: mdp }).then(function (r) { if (r.error) throw r.error; }); });
    },
    enfants: function (liste) { /* liste : [{age:"2-4"}] — jamais de prénom */
      if (!REEL) { var c = demo.session(); if (c) { c.enfants = liste; demo.sauver(c); } return Promise.resolve(); }
      return supabase().then(function (s) {
        return s.auth.getUser().then(function (r) {
          var u = r.data.user; if (!u) return;
          return s.from("enfants").delete().eq("parent_id", u.id).then(function () {
            if (!liste.length) return;
            return s.from("enfants").insert(liste.map(function (e) { return { parent_id: u.id, tranche_age: e.age }; }));
          });
        });
      });
    },
    colorie: function (moi, packId) {
      var l = moi.colories || []; var i = l.indexOf(packId);
      if (i > -1) l.splice(i, 1); else l.push(packId);
      moi.colories = l;
      if (!REEL) { var c = demo.session(); c.colories = l; demo.sauver(c); } else ecrire("moka_colories_" + moi.id, l);
    },
    newsletter: function (email, consentement) {
      var l = lire("moka_newsletter", []); l.push({ email: email, consentement: !!consentement, date: new Date().toISOString() }); ecrire("moka_newsletter", l);
      if (!REEL) return Promise.resolve();
      return supabase().then(function (s) { return s.from("newsletter").insert({ email: email, consentement: !!consentement, source: "coloriage-offert" }); })
        .then(function (r) { if (r && r.error && r.error.code !== "23505") throw r.error; });
    },
    message: function (m) {
      if (!REEL) return Promise.resolve();
      return supabase().then(function (s) { return s.from("messages").insert(m); }).then(function (r) { if (r && r.error) throw r.error; });
    },
    voter: function (choix) {
      if (!REEL) { var c = demo.session(); c.vote = choix; demo.sauver(c); return Promise.resolve(); }
      return supabase().then(function (s) { return s.auth.getUser().then(function (r) { return s.from("votes").upsert({ user_id: r.data.user.id, choix: choix }); }); });
    },
    resultatsVote: function (monVote) {
      var choix = ["pompiers", "cirque", "zoo"];
      if (!REEL) {
        var base = { pompiers: 12, cirque: 8, zoo: 6 }; if (monVote) base[monVote] += 1;
        return Promise.resolve({ votes: base, demo: true });
      }
      return supabase().then(function (s) { return s.from("resultats_vote").select("choix,nb"); }).then(function (r) {
        var v = { pompiers: 0, cirque: 0, zoo: 0 }; (r.data || []).forEach(function (x) { if (choix.indexOf(x.choix) > -1) v[x.choix] = x.nb; });
        return { votes: v, demo: false };
      });
    },
    /* Paiement : en réel, redirection vers Stripe Checkout ; en démo, commande simulée. */
    payer: function (items, email) {
      if (!REEL) {
        var cmd = { numero: "MK-" + new Date().getFullYear() + "-" + String(Math.floor(1000 + Math.random() * 9000)), date: new Date().toISOString(),
          items: items.slice(), total: items.reduce(function (s, id) { return s + M.pack(id).prix; }, 0), email: email };
        var c = demo.session();
        if (c && c.email === email) {
          c.commandes = [cmd].concat(c.commandes || []);
          items.forEach(function (i) { if (c.achats.indexOf(i) < 0) c.achats.push(i); });
          demo.sauver(c);
        } else { var g = lire("moka_demo_commandes_invite", []); g.unshift(cmd); ecrire("moka_demo_commandes_invite", g); }
        ecrire("moka_derniere_commande", cmd);
        panier.vider();
        location.href = "merci.html?commande=" + encodeURIComponent(cmd.numero);
        return Promise.resolve();
      }
      return supabase().then(function (s) { return s.auth.getSession(); }).then(function (r) {
        var token = r.data.session ? r.data.session.access_token : null;
        return fetch("/api/checkout", { method: "POST", headers: Object.assign({ "Content-Type": "application/json" }, token ? { Authorization: "Bearer " + token } : {}),
          body: JSON.stringify({ items: items, email: email, renonciation: true, cgv: true }) });
      }).then(function (res) { return res.json().then(function (j) { if (!res.ok) throw new Error(j.error || "Paiement impossible"); location.href = j.url; }); });
    },
    /* Lien de téléchargement d'un pack acheté */
    telecharger: function (packId, ctx) {
      if (packId === "offert") { location.href = M.offert.pdf; return Promise.resolve(); }
      if (!REEL) { window.open("../pdf-prives/" + packId + ".pdf", "_blank"); return Promise.resolve(); }
      var q = "/api/download?pack=" + encodeURIComponent(packId) + (ctx && ctx.session_id ? "&session_id=" + encodeURIComponent(ctx.session_id) : "");
      return supabase().then(function (s) { return s.auth.getSession(); }).then(function (r) {
        var token = r.data.session ? r.data.session.access_token : null;
        return fetch(q, { headers: token ? { Authorization: "Bearer " + token } : {} });
      }).then(function (res) { return res.json().then(function (j) { if (!res.ok) throw new Error(j.error || "Téléchargement impossible"); location.href = j.url; }); });
    },
    commandeStripe: function (sessionId) {
      return fetch("/api/download?session_id=" + encodeURIComponent(sessionId)).then(function (r) { return r.json(); });
    }
  };

  /* ---------- Interactions communes ---------- */
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-ajouter]");
    if (b) {
      e.preventDefault();
      var id = b.getAttribute("data-ajouter"), p = M.pack(id);
      if (panier.a(id)) { if (!b.hasAttribute("data-fiche")) { panier.retirer(id); M.toast(esc(p.nom) + " retiré du panier"); } }
      else { panier.ajouter(id); M.toast(esc(p.nom) + ' ajouté au panier · <a href="paiement.html">Voir</a>'); }
      return;
    }
    var en = e.target.closest("[data-envie]");
    if (en) {
      e.preventDefault();
      var l = lire("moka_envies", []), pid = en.getAttribute("data-envie"), k = l.indexOf(pid);
      if (k > -1) l.splice(k, 1); else { l.push(pid); M.toast("Ajouté à vos envies"); }
      ecrire("moka_envies", l); maj(); return;
    }
    var z = e.target.closest("[data-zoom]");
    if (z) { e.preventDefault(); M.zoom(z.getAttribute("data-zoom"), z.getAttribute("data-titre") || ""); return; }
    var bg = e.target.closest(".burger");
    if (bg) { var nav = $(".nav"); var o = nav.classList.toggle("ouvert"); bg.setAttribute("aria-expanded", o ? "true" : "false"); }
  });

  M.zoom = function (src, titre) {
    var d = $("#visionneuse");
    if (!d) {
      d = document.createElement("dialog"); d.id = "visionneuse";
      d.innerHTML = '<div class="visionneuse"><button class="btn-rond" type="button" aria-label="Fermer" data-fermer>' + I.x + '</button><img alt=""><p></p></div>';
      document.body.appendChild(d);
      d.addEventListener("click", function (e) { if (e.target === d || e.target.closest("[data-fermer]")) d.close(); });
    }
    $("img", d).src = src; $("img", d).alt = titre; $("p", d).textContent = titre;
    d.showModal();
  };

  /* Compte : l'icône mène à mon-compte si connecté, sinon à connexion */
  function majIconeCompte() {
    M.api.moi().then(function (u) {
      $$("[data-lien-compte]").forEach(function (a) { a.href = u ? "mon-compte.html" : "connexion.html"; a.setAttribute("aria-label", u ? "Mon compte" : "Se connecter"); });
    }).catch(function () {});
  }

  /* ---------- Pages ---------- */
  var pages = {};

  /* Accueil : filtre des packs du moment + coloriage offert */
  pages.accueil = function () {
    var cartes = $$("#packs-moment [data-age]");
    function filtrer(age) {
      var n = 0;
      cartes.forEach(function (c) { var ok = (age === "tous" || c.getAttribute("data-age") === age) && n < 4; c.hidden = !ok; if (ok) n++; });
      $$("[data-filtre-age]").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-filtre-age") === age ? "true" : "false"); });
    }
    $$("[data-filtre-age]").forEach(function (b) { b.addEventListener("click", function () { filtrer(b.getAttribute("data-filtre-age")); }); });
    filtrer("tous");
    formOffert($("#form-offert"));
  };

  function formOffert(f) {
    if (!f) return;
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = f.email.value.trim(), err = $(".erreur", f);
      if (!emailOk(email)) { err.textContent = "Cette adresse email ne semble pas valide."; f.email.focus(); return; }
      err.textContent = "";
      var btn = $("button[type=submit]", f); btn.disabled = true;
      M.api.newsletter(email, f.consentement ? f.consentement.checked : true).then(function () {
        var ok = $("#" + f.getAttribute("data-succes"));
        f.hidden = true; ok.hidden = false; $("a", ok) && $("a", ok).focus();
      }).catch(function () { err.textContent = "Oups, ça n'a pas marché. Réessayez dans un instant."; btn.disabled = false; });
    });
  }

  pages.offert = function () { formOffert($("#form-offert")); };

  /* Catalogue : filtres */
  pages.coloriages = function () {
    var etat = { age: null, univers: null, format: null, tag: null };
    var cartes = $$("#catalogue [data-age]");
    var depart = params.get("univers"); if (depart) etat.univers = depart;
    var tag = params.get("theme"); if (tag) etat.tag = tag;
    function appliquer() {
      var n = 0;
      cartes.forEach(function (c) {
        var ok = (!etat.age || c.getAttribute("data-ages").indexOf(etat.age) > -1)
          && (!etat.univers || c.getAttribute("data-univers") === etat.univers)
          && (!etat.format || c.getAttribute("data-format") === etat.format)
          && (!etat.tag || c.getAttribute("data-tags").indexOf(etat.tag) > -1);
        c.hidden = !ok; if (ok) n++;
      });
      $("#nb-cahiers").textContent = n + (n > 1 ? " cahiers" : " cahier");
      $("#aucun").hidden = n > 0;
      $$("[data-f]").forEach(function (b) { var k = b.getAttribute("data-f"), v = b.getAttribute("data-v"); b.setAttribute("aria-pressed", etat[k] === v ? "true" : "false"); });
    }
    $$("[data-f]").forEach(function (b) {
      b.addEventListener("click", function () { var k = b.getAttribute("data-f"), v = b.getAttribute("data-v"); etat[k] = etat[k] === v ? null : v; appliquer(); });
    });
    $("#reinit").addEventListener("click", function () { etat = { age: null, univers: null, format: null, tag: null }; appliquer(); });
    appliquer();
  };

  /* Fiche pack : planches à voir en grand */
  pages.pack = function () {
    var grande = $("#planche-grande"), leg = $("#legende-planche");
    $$("[data-planche]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (!grande) return;
        grande.src = b.getAttribute("data-planche"); grande.alt = b.getAttribute("data-titre");
        grande.setAttribute("data-zoom", b.getAttribute("data-planche")); grande.setAttribute("data-titre", b.getAttribute("data-titre"));
        leg.textContent = b.getAttribute("data-titre");
        $$("[data-planche]").forEach(function (x) { x.setAttribute("aria-current", x === b ? "true" : "false"); });
        if (window.innerWidth < 960) grande.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  };

  /* Panier et paiement */
  pages.paiement = function () {
    var liste = $("#lignes"), f = $("#form-paiement");
    function rendre() {
      var items = panier.items();
      $("#panier-vide").hidden = items.length > 0;
      $("#panier-plein").hidden = items.length === 0;
      liste.innerHTML = items.map(function (id) {
        var p = M.pack(id), c = M.couverture(p);
        return '<div class="ligne-panier"><a class="vignette" style="--couleur:var(--' + p.univers + ')" href="pack-' + p.id + '.html">' +
          (c ? '<img src="' + c + '" alt="">' : '<img src="assets/img/moka-coffret.png" alt="" style="background:#262626;object-fit:contain">') + '</a>' +
          '<div><strong>' + esc(p.nom) + '</strong><div class="small douce">' + p.nbPlanches + (p.nbPlanches > 1 ? " coloriages" : " coloriage") + ' · PDF A4</div></div>' +
          '<strong>' + M.prix(p.prix) + '</strong>' +
          '<button class="btn-rond" type="button" data-retirer="' + p.id + '" aria-label="Retirer ' + esc(p.nom) + '">' + I.x + '</button></div>';
      }).join("");
      var t = panier.total();
      $("#sous-total").textContent = M.prix(t); $("#total").textContent = M.prix(t);
      $("#encart-coffret").hidden = items.indexOf("coffret") > -1;
      verifier();
    }
    function verifier() {
      var ok = panier.items().length > 0 && emailOk(f.email.value) && f.cgv.checked && f.renonciation.checked;
      var b = $("#btn-payer"); b.disabled = !ok; b.textContent = "Payer " + M.prix(panier.total());
    }
    liste.addEventListener("click", function (e) { var b = e.target.closest("[data-retirer]"); if (b) { panier.retirer(b.getAttribute("data-retirer")); rendre(); } });
    f.addEventListener("input", verifier); f.addEventListener("change", verifier);
    M.api.moi().then(function (u) { if (u && !f.email.value) { f.email.value = u.email; verifier(); } }).catch(function () {});
    f.addEventListener("submit", function (e) {
      e.preventDefault(); verifier(); if ($("#btn-payer").disabled) return;
      $("#btn-payer").disabled = true; $("#btn-payer").textContent = "Redirection…";
      M.api.payer(panier.items(), f.email.value.trim()).catch(function (err) { $("#erreur-paiement").textContent = err.message; verifier(); });
    });
    $("#mode-demo").hidden = REEL;
    rendre();
  };

  /* Merci */
  pages.merci = function () {
    var zone = $("#telechargements"), num = $("#numero");
    function afficher(numero, items, ctx) {
      num.textContent = numero;
      zone.innerHTML = items.map(function (id) {
        var p = M.pack(id); if (!p) return ""; var c = M.couverture(p);
        return '<div class="ligne-panier" style="grid-template-columns:64px 1fr auto;background:#fff;border:2px solid var(--encre);border-radius:16px;padding:12px 16px;margin-bottom:12px">' +
          '<span class="vignette" style="--couleur:var(--' + p.univers + ')">' + (c ? '<img src="' + c + '" alt="">' : '<img src="assets/img/moka-coffret.png" alt="" style="background:#262626;object-fit:contain">') + '</span>' +
          '<div><strong>' + esc(p.nom) + '</strong><div class="small douce">' + p.nbPlanches + ' coloriage' + (p.nbPlanches > 1 ? "s" : "") + ' · PDF</div></div>' +
          '<button class="btn btn-s" type="button" data-dl="' + p.id + '">' + I.dl + ' Télécharger</button></div>';
      }).join("");
      zone.addEventListener("click", function (e) { var b = e.target.closest("[data-dl]"); if (b) M.api.telecharger(b.getAttribute("data-dl"), ctx).catch(function (er) { M.toast(esc(er.message)); }); });
      var moka = $("#moka-joie"); moka.classList.add("joie");
    }
    if (REEL && params.get("session_id")) {
      M.api.commandeStripe(params.get("session_id")).then(function (j) {
        if (j.error) { num.textContent = "en cours de confirmation"; zone.innerHTML = '<p class="boite">' + esc(j.error) + '</p>'; return; }
        panier.vider(); afficher(j.numero, j.items, { session_id: params.get("session_id") });
      });
    } else {
      var c = lire("moka_derniere_commande", null);
      if (c && (!params.get("commande") || params.get("commande") === c.numero)) afficher(c.numero, c.items, {});
      else { num.textContent = "—"; zone.innerHTML = '<p class="boite">Aucune commande récente sur cet appareil. Vos cahiers sont dans <a class="lien" href="mon-compte.html">Mes coloriages</a>.</p>'; }
    }
    M.api.moi().then(function (u) { if (u) $("#creer-compte").hidden = true; }).catch(function () {});
  };

  /* Inscription en 3 étapes */
  pages.inscription = function () {
    var etape = 1, fonds = ["", "var(--montagne)", "var(--rose)", "var(--foret)"];
    var nbEnfants = 1;
    function aller(n) {
      etape = n;
      $$("[data-etape]").forEach(function (s) { s.hidden = +s.getAttribute("data-etape") !== n; });
      document.body.style.background = fonds[n];
      $$(".progression > i").forEach(function (b) { b.style.width = (n / 3 * 100) + "%"; });
      $$("[data-num-etape]").forEach(function (s) { s.textContent = n; });
      var h = $('[data-etape="' + n + '"] h1'); if (h && n > 1) { h.setAttribute("tabindex", "-1"); h.focus(); }
      if (n === 3) { var m = $("#moka-bienvenue"); m.classList.remove("joie"); void m.offsetWidth; m.classList.add("joie"); }
    }
    var f1 = $("#f-compte");
    f1.addEventListener("submit", function (e) {
      e.preventDefault(); var err = $(".erreur", f1);
      if (!f1.prenom.value.trim()) { err.textContent = "Indiquez votre prénom."; return; }
      if (!emailOk(f1.email.value)) { err.textContent = "Cette adresse email ne semble pas valide."; return; }
      if (f1.mdp.value.length < 8) { err.textContent = "Le mot de passe doit faire au moins 8 caractères."; return; }
      err.textContent = "";
      M.api.inscription(f1.prenom.value.trim(), f1.email.value.trim(), f1.mdp.value).then(function () {
        $$("[data-prenom]").forEach(function (s) { s.textContent = f1.prenom.value.trim(); });
        aller(2);
      }).catch(function (er) { err.textContent = er.message; });
    });
    function rendreNb() { $("#nb-enfants").textContent = nbEnfants; }
    $("#moins").addEventListener("click", function () { nbEnfants = Math.max(0, nbEnfants - 1); rendreNb(); });
    $("#plus").addEventListener("click", function () { nbEnfants = Math.min(6, nbEnfants + 1); rendreNb(); });
    $("#f-enfants").addEventListener("submit", function (e) {
      e.preventDefault();
      var ages = $$("#f-enfants input[name=age]:checked").map(function (i) { return i.value; });
      var liste = []; for (var i = 0; i < nbEnfants; i++) liste.push({ age: ages[i % (ages.length || 1)] || "2-4" });
      M.api.enfants(liste).then(function () { aller(3); }).catch(function () { aller(3); });
    });
    $("#passer").addEventListener("click", function () { aller(3); });
    aller(1);
  };

  pages.connexion = function () {
    var f = $("#f-connexion");
    f.addEventListener("submit", function (e) {
      e.preventDefault(); var err = $(".erreur", f);
      if (!emailOk(f.email.value)) { err.textContent = "Cette adresse email ne semble pas valide."; return; }
      if (!f.mdp.value) { err.textContent = "Indiquez votre mot de passe."; return; }
      M.api.connexion(f.email.value.trim(), f.mdp.value).then(function () {
        var r = params.get("retour"); location.href = r && /^[a-z0-9-]+\.html$/.test(r) ? r : "mon-compte.html";
      }).catch(function (er) { err.innerHTML = esc(er.message) + ' <a class="lien" href="inscription.html">Créer un compte</a>'; });
    });
  };

  pages.oubli = function () {
    var f = $("#f-oubli");
    f.addEventListener("submit", function (e) {
      e.preventDefault(); var err = $(".erreur", f);
      if (!emailOk(f.email.value)) { err.textContent = "Cette adresse email ne semble pas valide."; return; }
      M.api.motDePasseOublie(f.email.value.trim()).then(function () {
        $("#email-envoye").textContent = f.email.value.trim(); f.hidden = true; $("#oubli-ok").hidden = false;
      });
    });
  };

  pages.nouveauMdp = function () {
    var f = $("#f-mdp");
    f.addEventListener("submit", function (e) {
      e.preventDefault(); var err = $(".erreur", f);
      if (f.mdp.value.length < 8) { err.textContent = "8 caractères minimum."; return; }
      if (f.mdp.value !== f.mdp2.value) { err.textContent = "Les deux mots de passe ne sont pas identiques."; return; }
      M.api.nouveauMotDePasse(f.mdp.value).then(function () { f.hidden = true; $("#mdp-ok").hidden = false; }).catch(function (er) { err.textContent = er.message; });
    });
  };

  pages.contact = function () {
    var f = $("#f-contact");
    if (params.get("sujet")) f.sujet.value = params.get("sujet");
    f.addEventListener("submit", function (e) {
      e.preventDefault(); var err = $(".erreur", f);
      if (!f.prenom.value.trim()) { err.textContent = "Indiquez votre prénom."; return; }
      if (!emailOk(f.email.value)) { err.textContent = "Cette adresse email ne semble pas valide."; return; }
      if (f.message.value.trim().length < 5) { err.textContent = "Écrivez-nous quelques mots."; return; }
      err.textContent = "";
      M.api.message({ prenom: f.prenom.value.trim(), email: f.email.value.trim(), sujet: f.sujet.value, message: f.message.value.trim() }).then(function () {
        f.hidden = true; $("#contact-ok").hidden = false; $("#contact-ok h2").focus();
      }).catch(function () { err.textContent = "Le message n'est pas parti. Réessayez dans un instant."; });
    });
    $("#re-ecrire").addEventListener("click", function () { f.reset(); f.hidden = false; $("#contact-ok").hidden = true; });
  };

  pages.legal = function () {
    var liens = $$(".sommaire a");
    var cible = document.body.getAttribute("data-section");
    if (cible && !location.hash) { var s = document.getElementById(cible); if (s) setTimeout(function () { s.scrollIntoView(); }, 30); }
    if (!("IntersectionObserver" in window)) return;
    var obs = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) liens.forEach(function (a) { a.setAttribute("aria-current", a.getAttribute("href").split("#")[1] === en.target.id ? "true" : "false"); }); });
    }, { rootMargin: "-30% 0px -60% 0px" });
    $$(".legal section").forEach(function (s) { obs.observe(s); });
  };

  /* Mon compte (espace famille) */
  pages.compte = function () {
    M.api.moi().then(function (moi) {
      if (!moi) { location.replace("connexion.html?retour=mon-compte.html"); return; }
      $("#compte").hidden = false;
      $("#bonjour").textContent = "Bonjour" + (moi.prenom ? " " + moi.prenom : "") + " !";
      var packsAchetes = moi.achats.filter(function (id) { return M.pack(id); });
      /* Packs choisis en mode enfant (ancien format {pack, i} converti en identifiants de packs) */
      var liste = [];
      lire("moka_liste_enfant", []).forEach(function (x) { var id = typeof x === "string" ? x : x && x.pack; if (id && M.pack(id) && liste.indexOf(id) < 0) liste.push(id); });
      var envies = lire("moka_envies", []);
      var aImprimer = liste.filter(function (id) { return packsAchetes.indexOf(id) > -1; });

      function enfants() {
        $("#enfants").innerHTML = moi.enfants.map(function (e, i) {
          return '<span class="pastille pastille-trait">Enfant ' + (i + 1) + ' · ' + (M.ages[e.age] || e.age) + '</span>';
        }).join("") + '<label class="pastille pastille-trait" style="cursor:pointer">' + I.plus.replace("<svg", '<svg width="14" height="14"') +
          ' Ajouter un enfant <select id="ajout-enfant" aria-label="Tranche d\'âge du nouvel enfant" style="border:0;background:none;font-weight:700"><option value="">âge…</option><option value="2-4">2–4 ans</option><option value="4-6">4–6 ans</option><option value="6-8">6–8 ans</option></select></label>';
        $("#ajout-enfant").addEventListener("change", function (e) {
          if (!e.target.value) return; moi.enfants.push({ age: e.target.value }); M.api.enfants(moi.enfants); enfants();
        });
      }
      enfants();
      var planches = packsAchetes.reduce(function (s, id) { return s + M.pack(id).nbPlanches; }, 0) + (moi.achats.indexOf("offert") > -1 ? 1 : 0);
      var univ = packsAchetes.filter(function (id) { return id !== "coffret"; }).length;
      $("#c-packs").textContent = packsAchetes.length; $("#c-planches").textContent = planches; $("#c-univers").textContent = univ + "/8";

      var onglets = {
        bibli: { n: packsAchetes.length + 1, html: function () {
          var lignes = (moi.achats.indexOf("offert") > -1 ? [{ id: "offert", nom: M.offert.titre, img: "assets/coloriages/" + M.offert.img, info: "Coloriage offert · PDF", univers: "montagne" }] : [])
            .concat(packsAchetes.map(function (id) { var p = M.pack(id); return { id: id, nom: p.nom, img: M.couverture(p), info: p.nbPlanches + " coloriage" + (p.nbPlanches > 1 ? "s" : "") + " · PDF A4", univers: p.univers }; }));
          return '<div>' + lignes.map(function (l) {
            return '<div class="ligne-panier" style="grid-template-columns:64px 1fr auto"><span class="vignette" style="--couleur:var(--' + l.univers + ')">' +
              (l.img ? '<img src="' + l.img + '" alt="">' : '<img src="assets/img/moka-coffret.png" alt="" style="background:#262626;object-fit:contain">') + '</span>' +
              '<div><strong>' + esc(l.nom) + '</strong><div class="small douce">' + l.info + '</div></div>' +
              '<button class="btn btn-s" type="button" data-dl="' + l.id + '">' + I.dl + ' Télécharger</button></div>';
          }).join("") + '</div>' + (packsAchetes.length ? "" : '<p class="mt-24">Pas encore de cahier. <a class="lien" href="coloriages.html">Voir les coloriages</a></p>');
        } },
        album: { n: null, html: function () {
          var tous = M.packs.filter(function (p) { return p.id !== "coffret"; });
          return '<p class="label mb-16">' + univ + ' univers sur 8 dans votre album · touchez une carte possédée pour la marquer « Colorié ! »</p><div class="album">' + tous.map(function (p) {
            var a = packsAchetes.indexOf(p.id) > -1, col = (moi.colories || []).indexOf(p.id) > -1;
            return '<div class="album-carte' + (a ? "" : " non-possede") + '">' +
              (a ? '<button type="button" data-colorie="' + p.id + '" style="all:unset;display:block;cursor:pointer;width:100%" aria-pressed="' + col + '" aria-label="' + esc(p.nom) + ' : marquer comme colorié">' : '<a href="pack-' + p.id + '.html" style="text-decoration:none;display:block">') +
              '<span class="carte" style="--couleur:var(--' + p.univers + ')"><span class="carte-img" style="display:block"><img src="' + M.couverture(p) + '" alt="" loading="lazy"></span></span>' +
              (col ? '<span class="tampon-colorie">Colorié !</span>' : "") + (a ? "</button>" : "</a>") +
              '<div class="mt-8">' + esc(p.nom) + '</div>' + (a ? "" : '<a class="lien small" href="pack-' + p.id + '.html">Découvrir</a>') + '</div>';
          }).join("") + '</div>';
        } },
        envies: { n: liste.length + envies.length, html: function () {
          var h = "";
          if (liste.length) h += '<h3 class="mb-16">Choisis en mode enfant</h3><div class="planches">' + liste.map(function (id) {
            var p = M.pack(id);
            return '<div class="planche"><img src="' + M.couverture(p) + '" alt="">' + esc(p.nom) + '<span class="small douce">Pack de ' + p.nbPlanches + ' coloriage' + (p.nbPlanches > 1 ? "s" : "") + '</span>' +
              (packsAchetes.indexOf(p.id) > -1 ? '<span class="pastille pastille-noir">Déjà à vous</span>' : '<button class="btn btn-s" data-ajouter="' + p.id + '">Ajouter au panier</button>') + '</div>';
          }).join("") + '</div>';
          if (envies.length) h += '<h3 class="mb-16 mt-32">Mes envies</h3><div class="planches">' + envies.map(function (id) {
            var p = M.pack(id); if (!p) return ""; var c = M.couverture(p);
            return '<div class="planche">' + (c ? '<img src="' + c + '" alt="">' : "") + esc(p.nom) + '<button class="btn btn-s" data-ajouter="' + p.id + '">Ajouter au panier</button></div>';
          }).join("") + '</div>';
          return h || '<p>Rien pour l\'instant. Laissez votre enfant choisir en <a class="lien" href="mode-enfant.html">mode enfant</a>.</p>';
        } },
        imprimer: { n: aImprimer.length, html: function () {
          if (!aImprimer.length) return '<p>Les packs choisis par vos enfants, et que vous avez achetés, apparaîtront ici, prêts à imprimer.</p>';
          return '<div class="planches">' + aImprimer.map(function (id) {
            var p = M.pack(id);
            return '<div class="planche"><img src="' + M.couverture(p) + '" alt="">' + esc(p.nom) + '<span class="small douce">' + p.nbPlanches + ' coloriage' + (p.nbPlanches > 1 ? "s" : "") + ' · PDF A4</span><button class="btn btn-s" data-dl="' + p.id + '">' + I.dl + ' PDF</button></div>';
          }).join("") + '</div>';
        } },
        factures: { n: null, html: function () {
          if (!moi.commandes.length) return "<p>Aucune facture pour l'instant.</p>";
          return moi.commandes.map(function (c) {
            return '<div class="ligne-panier" style="grid-template-columns:1fr auto auto"><div><strong>' + esc(c.numero) + '</strong><div class="small douce">' +
              new Date(c.date).toLocaleDateString("fr-FR") + ' · ' + c.items.map(function (i) { return M.pack(i) ? M.pack(i).nom : i; }).join(", ") + '</div></div><strong>' + M.prix(c.total) + '</strong>' +
              '<button class="btn btn-s btn-sec" data-facture="' + esc(c.numero) + '">Voir</button></div>';
          }).join("");
        } }
      };
      var noms = { bibli: "Ma bibliothèque", album: "Album", envies: "Envies des enfants", imprimer: "À imprimer", factures: "Factures" };
      var bar = $("#onglets"), corps = $("#onglet-corps");
      bar.innerHTML = Object.keys(onglets).map(function (k) {
        var n = onglets[k].n; return '<button role="tab" type="button" id="tab-' + k + '" aria-controls="onglet-corps" data-tab="' + k + '">' + noms[k] + (n ? ' <span class="n">' + n + '</span>' : "") + '</button>';
      }).join("");
      function ouvrir(k) {
        $$("[data-tab]").forEach(function (b) { b.setAttribute("aria-selected", b.getAttribute("data-tab") === k ? "true" : "false"); });
        corps.setAttribute("aria-labelledby", "tab-" + k); corps.innerHTML = onglets[k].html(); maj();
      }
      bar.addEventListener("click", function (e) { var b = e.target.closest("[data-tab]"); if (b) ouvrir(b.getAttribute("data-tab")); });
      corps.addEventListener("click", function (e) {
        var d = e.target.closest("[data-dl]"); if (d) { M.api.telecharger(d.getAttribute("data-dl")).catch(function (er) { M.toast(esc(er.message)); }); return; }
        var c = e.target.closest("[data-colorie]"); if (c) { M.api.colorie(moi, c.getAttribute("data-colorie")); ouvrir("album"); return; }
        var fa = e.target.closest("[data-facture]"); if (fa) facture(moi, fa.getAttribute("data-facture"));
      });
      ouvrir(params.get("onglet") && onglets[params.get("onglet")] ? params.get("onglet") : "bibli");

      /* Vote */
      var choixNoms = { pompiers: "Moka chez les pompiers", cirque: "Moka au cirque", zoo: "Moka au zoo" };
      function vote() {
        var z = $("#vote");
        if (!moi.vote) {
          z.innerHTML = Object.keys(choixNoms).map(function (k) { return '<button class="btn btn-blanc btn-bloc mt-8" type="button" data-voter="' + k + '">' + choixNoms[k] + '</button>'; }).join("");
          return;
        }
        M.api.resultatsVote(moi.vote).then(function (r) {
          var tot = Object.keys(r.votes).reduce(function (s, k) { return s + r.votes[k]; }, 0) || 1;
          z.innerHTML = Object.keys(choixNoms).map(function (k) {
            var pc = Math.round(r.votes[k] / tot * 100);
            return '<div class="mt-16"><div class="between small"><strong>' + choixNoms[k] + (moi.vote === k ? " (votre choix)" : "") + '</strong><strong>' + pc + ' %</strong></div><div class="vote-barre"><i style="width:' + pc + '%"></i></div></div>';
          }).join("") + '<p class="small mt-16"><strong>Merci ! Votre vote est bien enregistré.</strong>' + (r.demo ? " (Résultats de démonstration.)" : "") + '</p><button class="lien small mt-8" type="button" style="background:none;border:0;padding:0" data-changer>Changer mon vote</button>';
        });
      }
      $("#vote").addEventListener("click", function (e) {
        var b = e.target.closest("[data-voter]"); if (b) { moi.vote = b.getAttribute("data-voter"); M.api.voter(moi.vote).then(vote); }
        if (e.target.closest("[data-changer]")) { moi.vote = null; vote(); }
      });
      vote();
      $("#deconnexion").addEventListener("click", function () { M.api.deconnexion().then(function () { location.href = "index.html"; }); });
    }).catch(function () { location.replace("connexion.html"); });
  };

  function facture(moi, numero) {
    var c = moi.commandes.find(function (x) { return x.numero === numero; }); if (!c) return;
    var d = document.createElement("dialog");
    d.innerHTML = '<div class="visionneuse" style="width:min(92vw,560px);text-align:left"><button class="btn-rond" type="button" aria-label="Fermer" data-fermer>' + I.x + '</button>' +
      '<img src="assets/img/logo.png" alt="Moka" style="height:24px;width:auto;margin:0"><h2 class="mt-24" style="font-size:28px">Facture ' + esc(c.numero) + '</h2>' +
      '<p class="small douce mt-8">Date : ' + new Date(c.date).toLocaleDateString("fr-FR") + ' · Client : ' + esc(moi.email) + '</p><div class="recap">' +
      c.items.map(function (i) { var p = M.pack(i); return '<div><span>' + esc(p ? p.nom : i) + '</span><span>' + (p ? M.prix(p.prix) : "") + '</span></div>'; }).join("") +
      '<div class="total"><span>Total TTC</span><span>' + M.prix(c.total) + '</span></div></div><p class="small douce">Moka Coloriages, <span class="a-completer">[forme juridique, adresse, SIRET à compléter]</span>. TVA : <span class="a-completer">[à compléter]</span>.</p>' +
      '<button class="btn mt-24" type="button" onclick="window.print()">Imprimer</button></div>';
    document.body.appendChild(d); d.showModal();
    d.addEventListener("click", function (e) { if (e.target === d || e.target.closest("[data-fermer]")) { d.close(); d.remove(); } });
  }

  /* ---------- Démarrage ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    maj(); majIconeCompte();
    var p = document.body.getAttribute("data-page");
    if (pages[p]) pages[p]();
    var annee = $$("[data-annee]"); annee.forEach(function (a) { a.textContent = new Date().getFullYear(); });
  });
  window.addEventListener("storage", maj);
})();
