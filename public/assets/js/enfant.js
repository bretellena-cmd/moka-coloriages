/* Mode enfant — un seul écran à état partagé :
   carte du monde → (tous les univers) → univers (le pack) → aperçu d'un dessin → ma liste de packs → porte parentale → paiement.
   L'enfant choisit des PACKS : on ne vend pas de dessin seul.
   L'enfant n'achète jamais : un adulte confirme, puis passe à la vraie page de paiement. */
(function () {
  "use strict";
  var M = window.MOKA, $ = M.$, esc = M.esc, I = M.icones;
  var lire = function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  var ecrire = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  var scene, fond, compteur, pile = [];
  var packsEnfant = M.packs.filter(function (p) { return p.id !== "coffret" && p.planches.some(function (x) { return x.img; }); });

  var liste = {
    tout: function () {
      var brut = lire("moka_liste_enfant", []), ids = [];
      brut.forEach(function (x) { var id = typeof x === "string" ? x : x && x.pack; if (id && M.pack(id) && id !== "coffret" && ids.indexOf(id) < 0) ids.push(id); });
      return ids;
    },
    a: function (pack) { return liste.tout().indexOf(pack) > -1; },
    basculer: function (pack) {
      var l = liste.tout(), k = l.indexOf(pack);
      if (k > -1) l.splice(k, 1); else l.push(pack);
      ecrire("moka_liste_enfant", l); majCompteur(); return k < 0;
    },
    ajouter: function (pack) { if (!liste.a(pack)) liste.basculer(pack); },
    retirer: function (pack) { ecrire("moka_liste_enfant", liste.tout().filter(function (x) { return x !== pack; })); majCompteur(); }
  };

  function majCompteur() { var n = liste.tout().length; compteur.textContent = n; compteur.hidden = n === 0; }
  function couleur(c) { document.body.style.background = c || "var(--fond)"; }
  function img(pack, i) { return "assets/coloriages/" + M.pack(pack).planches[i].img; }
  function nomUnivers(p) { return M.univers[p.univers].nom; }
  function mokaPetit(cls) { return '<img class="' + (cls || "") + '" src="assets/img/moka-coucou.png" alt="">'; }

  function aller(vue, garder) { if (!garder && pile.length && pile[pile.length - 1] !== vue) pile.push(vue); else if (!pile.length) pile.push(vue); rendre(vue); }
  function retour() {
    if (pile.length <= 1) { location.href = "index.html"; return; }
    pile.pop(); rendre(pile[pile.length - 1]);
  }

  function rendre(vue) {
    var parts = vue.split(":"), type = parts[0];
    window.scrollTo(0, 0);
    if (type === "carte") return vueCarte();
    if (type === "tous") return vueTous();
    if (type === "univers") return vueUnivers(parts[1]);
    if (type === "planche") return vuePlanche(parts[1], +parts[2]);
    if (type === "liste") return vueListe();
  }

  function vueCarte() {
    couleur(); fond = null;
    var iles = [["montagne", "ile-1"], ["noel", "ile-2"], ["docteur", "ile-3"], ["ecole", "ile-4"]];
    scene.innerHTML = '<h1 class="sr-only">Le monde de Moka</h1><div class="carte-monde">' + iles.map(function (x) {
      var p = M.pack(x[0]);
      return '<button class="ile ' + x[1] + '" type="button" data-univers="' + p.id + '" aria-label="' + esc(nomUnivers(p)) + '"><img src="' + M.couverture(p) + '" alt=""></button>';
    }).join("") +
      '<div class="moka-centre"><span class="bulle">Où veux-tu voir Moka ?</span>' + mokaPetit("flotte") + '</div>' +
      '<button class="btn-enfant-action btn-tous" type="button" data-tous><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/></svg>Tous les univers</button></div>';
  }

  function vueTous() {
    couleur();
    scene.innerHTML = '<div class="enfant-titre">' + mokaPetit() + '<span class="bulle">Choisis un univers !</span></div><div class="bulles">' + packsEnfant.map(function (p) {
      return '<button class="bulle-univers" type="button" style="--couleur:var(--' + p.univers + ')" data-univers="' + p.id + '"><img src="' + M.couverture(p) + '" alt=""><span>' + esc(nomUnivers(p)) + '</span></button>';
    }).join("") + '</div>';
  }

  function boutonPack(id, grand) {
    var dedans = liste.a(id);
    return '<button class="btn-enfant-action' + (dedans ? " vert" : "") + '" type="button" data-veux="' + id + '"' + (grand ? "" : ' style="font-size:20px"') + '>' +
      (dedans ? "Dans ma liste " + I.check : "+ Je veux ce pack !") + '</button>';
  }

  function vueUnivers(id) {
    var p = M.pack(id); couleur("var(--" + p.univers + ")");
    var dessins = p.planches.map(function (pl, i) { return pl.img ? i : -1; }).filter(function (i) { return i > -1; });
    var n = p.nbPlanches;
    scene.innerHTML = '<div class="enfant-titre">' + mokaPetit() + '<h1 class="bulle">' + esc(nomUnivers(p)) + ' : tu veux ce pack ?</h1></div>' +
      '<div class="enfant-pack">' +
        '<div class="enfant-pack-carte"><div class="feuille"><img src="' + img(id, dessins[0]) + '" alt=""></div>' +
          '<p class="enfant-pack-nom">' + esc(p.nom) + '</p><p class="enfant-pack-nb">' + n + (n > 1 ? " coloriages" : " coloriage") + ' dans le pack</p></div>' +
        '<div class="enfant-pack-cote">' +
          (dessins.length > 1 ? '<p class="enfant-pack-aide">Regarde les dessins du pack :</p><div class="enfant-pack-dessins">' + dessins.map(function (i) {
            return '<button class="voir" type="button" data-planche="' + id + ':' + i + '" aria-label="Voir en grand : ' + esc(p.planches[i].titre) + '"><img src="' + img(id, i) + '" alt=""></button>';
          }).join("") + (n > dessins.length ? '<span class="enfant-pack-plus">+' + (n - dessins.length) + '</span>' : "") + '</div>' : "") +
          boutonPack(id, true) +
        '</div>' +
      '</div>';
  }

  function vuePlanche(id, i) {
    var p = M.pack(id); couleur("var(--" + p.univers + ")");
    var dedans = liste.a(id);
    scene.innerHTML = '<div class="enfant-grand"><div class="feuille"><img src="' + img(id, i) + '" alt="' + esc(p.planches[i].titre) + '"></div>' +
      '<div class="cote">' + mokaPetit("moka-reaction") + '<h1>' + (dedans ? "Ce pack est dans ta liste !" : "Ce dessin est dans le pack " + esc(nomUnivers(p).replace(/^(La |L'|Le )/, "")) + " !") + '</h1>' +
      (dedans ? '<button class="btn-enfant-action noir" type="button" data-liste>Voir ma liste</button>'
              : '<button class="btn-enfant-action" type="button" data-veux-grand="' + id + '">+ Je veux ce pack !</button>') + '</div></div>';
  }

  function vueListe() {
    couleur("var(--jaune)");
    var l = liste.tout();
    scene.innerHTML = '<div class="enfant-titre">' + mokaPetit() + '<h1 style="font-size:44px;line-height:48px">Ma liste</h1><span class="pastille pastille-noir" style="font-size:20px;height:44px;min-width:44px;justify-content:center">' + l.length + '</span></div>' +
      (l.length ? '<div class="liste-dessins">' + l.map(function (id) {
        var p = M.pack(id);
        return '<div class="liste-dessin"><div class="feuille" style="border-color:var(--encre);outline:6px solid var(--' + p.univers + ')"><img src="' + M.couverture(p) + '" alt=""></div>' +
          '<p class="enfant-pack-nom" style="font-size:18px">' + esc(p.nom) + '</p><button class="btn-64" type="button" data-retirer="' + id + '" aria-label="Retirer ' + esc(p.nom) + '">' + I.x + '</button></div>';
      }).join("") + '</div><div class="enfant-bas"><button class="btn-enfant-action noir" type="button" data-porte>' + I.lock + ' Demander à papa ou maman</button></div>'
        : '<div class="enfant-vide"><img src="assets/img/moka-coucou.png" alt=""><p class="h3">Ta liste est vide.</p><p class="mt-16"><button class="btn-enfant-action" type="button" data-carte>Choisir des packs</button></p></div>');
  }

  /* Porte parentale */
  function porte() {
    var l = liste.tout(); if (!l.length) return;
    var d = document.createElement("dialog");
    d.innerHTML = '<form class="porte" method="dialog" novalidate><div class="cadenas">' + I.lock.replace("<svg", '<svg width="30" height="30"') + '</div>' +
      '<h2>Demande à un adulte</h2><p class="small douce">Pour payer ' + (l.length > 1 ? "les " + l.length + " packs" : "le pack") + ' de ta liste, un parent doit confirmer.</p>' +
      '<label class="champ mt-24"><span>Écris 7 + 5 en lettres</span><input name="rep" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Votre réponse"></label><p class="erreur" aria-live="polite"></p>' +
      '<div class="row mt-24" style="justify-content:center"><button class="btn btn-sec" type="button" data-annuler>Retour</button><button class="btn" type="submit">Valider</button></div></form>';
    document.body.appendChild(d); d.showModal(); $("input", d).focus();
    function fermer() { d.close(); d.remove(); }
    d.addEventListener("click", function (e) { if (e.target === d || e.target.closest("[data-annuler]")) fermer(); });
    d.addEventListener("cancel", function () { d.remove(); });
    $("form", d).addEventListener("submit", function (e) {
      e.preventDefault();
      var r = String($("input", d).value).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
      if (r !== "douze") { $(".erreur", d).textContent = "Ce n'est pas la bonne réponse."; $("input", d).select(); return; }
      recap(d);
    });
  }

  function recap(d) {
    var ids = liste.tout(), total = ids.reduce(function (s, id) { return s + M.pack(id).prix; }, 0);
    var dejaPanier = M.panier.items().filter(function (id) { return ids.indexOf(id) < 0; });
    $("form", d).outerHTML = '<div class="porte"><h2>La liste de votre enfant</h2><p class="small douce">Les packs de coloriages qu\'il a choisis, en PDF à imprimer.</p><div class="recap">' +
      ids.map(function (id) {
        var p = M.pack(id);
        return '<div><span><strong>' + esc(p.nom) + '</strong><small>Pack de ' + p.nbPlanches + ' coloriage' + (p.nbPlanches > 1 ? "s" : "") + ' · PDF A4</small></span><strong>' + M.prix(p.prix) + '</strong></div>';
      }).join("") + '<div class="total"><span>Total</span><span>' + M.prix(total) + '</span></div></div>' +
      (dejaPanier.length ? '<p class="small douce">Votre panier contient déjà d\'autres packs : ils resteront dedans.</p>' : "") +
      '<div class="row mt-24" style="justify-content:center"><button class="btn btn-sec" type="button" data-annuler>Retour</button><button class="btn" type="button" data-payer>Passer au paiement</button></div></div>';
    $("[data-payer]", d).addEventListener("click", function () { ids.forEach(function (id) { M.panier.ajouter(id); }); location.href = "paiement.html"; });
  }

  document.addEventListener("DOMContentLoaded", function () {
    scene = $("#scene"); compteur = $("#compteur-liste");
    majCompteur();
    document.addEventListener("click", function (e) {
      var t;
      if ((t = e.target.closest("[data-univers]"))) return aller("univers:" + t.getAttribute("data-univers"));
      if (e.target.closest("[data-tous]")) return aller("tous");
      if ((t = e.target.closest("[data-planche]")) && t.closest("#scene")) return aller("planche:" + t.getAttribute("data-planche"));
      if ((t = e.target.closest("[data-veux]"))) {
        var id = t.getAttribute("data-veux"), ajoute = liste.basculer(id);
        t.classList.toggle("vert", ajoute); t.innerHTML = ajoute ? "Dans ma liste " + I.check : "+ Je veux ce pack !";
        if (ajoute) { var mk = $(".enfant-titre img"); if (mk) { mk.classList.remove("joie"); void mk.offsetWidth; mk.classList.add("joie"); } }
        return;
      }
      if ((t = e.target.closest("[data-veux-grand]"))) {
        var pid = t.getAttribute("data-veux-grand"), pl = (pile[pile.length - 1] || "").split(":")[2];
        liste.ajouter(pid); vuePlanche(pid, +pl); var m = $(".moka-reaction"); if (m) m.classList.add("joie"); return;
      }
      if ((t = e.target.closest("[data-retirer]"))) { liste.retirer(t.getAttribute("data-retirer")); return vueListe(); }
      if (e.target.closest("[data-liste]")) return aller("liste");
      if (e.target.closest("[data-carte]")) { pile = ["carte"]; return rendre("carte"); }
      if (e.target.closest("[data-porte]")) return porte();
      if (e.target.closest("[data-retour]")) return retour();
    });
    var depart = new URLSearchParams(location.search).get("vue");
    pile = ["carte"];
    if (depart === "liste") pile.push("liste");
    rendre(pile[pile.length - 1]);
  });
})();
