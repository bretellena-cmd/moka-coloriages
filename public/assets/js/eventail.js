/* Moka · Éventail du hero — animations à ressorts (vanilla, aucune dépendance)
   Choix du mode : attribut data-anim sur .eventail
     "signature" : distribution des cartes + carte magnétique 3D + voisines qui s'écartent (défaut)
     "scroll"    : l'éventail s'ouvre et les cartes montent en parallaxe au scroll
     "shuffle"   : la carte de devant repasse derrière en arc, en boucle (pause au survol)
     "lancer"    : les cartes s'attrapent, se lancent et reviennent en rebondissant
   Respecte prefers-reduced-motion : rien ne bouge, l'éventail reste en CSS. */
(function () {
  var fan = document.querySelector(".eventail");
  if (!fan || !window.requestAnimationFrame) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var items = [].slice.call(fan.querySelectorAll(".eventail-item"));
  var N = items.length;
  var mode = fan.getAttribute("data-anim") || "scroll";
  var W = 0, H = 0, cw = 0, ch = 0, slots = [];
  var ordre = items.map(function (_, i) { return i; });           // carte -> emplacement
  var pointeur = { dedans: false, x: 0, y: 0, mx: 0, my: 0 };     // mx/my lissés (-1..1)
  var survol = -1, local = { x: 0, y: 0 };
  var saisie = null, t0 = 0, dernierShuffle = 0, scrollP = 0;

  function ressort(v) { return { v: v, vel: 0 }; }
  var etats = items.map(function () {
    return { x: ressort(0), y: ressort(0), r: ressort(0), s: ressort(1), rx: ressort(0), ry: ressort(0), h: ressort(0), vol: 0, z: 0 };
  });

  fan.classList.add("eventail-js");
  items.forEach(function (el) {
    el.draggable = false; var img = el.querySelector("img"); if (img) img.draggable = false;
  });

  function mesurer() {
    var b = fan.getBoundingClientRect();
    W = b.width; H = b.height;
    cw = items[0].offsetWidth; ch = items[0].offsetHeight;
    slots = items.map(function (el, i) {
      var cs = getComputedStyle(el);
      return {
        x: parseFloat(cs.getPropertyValue("--x")) / 100 * W,
        y: parseFloat(cs.getPropertyValue("--y")) || 0,
        r: parseFloat(cs.getPropertyValue("--r")) || 0,
        z: i + 1
      };
    });
  }

  /* Quelle carte est sous le pointeur ? On teste les emplacements AU REPOS (pas les cartes
     qui bougent) : la zone survolée reste stable, donc aucun tremblement. */
  function carteSous(px, py) {
    for (var k = N - 1; k >= 0; k--) {
      var i = ordre.indexOf(k), s = slots[k];
      var cx = s.x + cw / 2, cy = s.y + ch / 2, a = -s.r * Math.PI / 180;
      var dx = px - cx, dy = py - cy;
      var lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a);
      if (Math.abs(lx) < cw / 2 && Math.abs(ly) < ch / 2 + (i === survol ? 30 : 0)) {
        local.x = lx / (cw / 2); local.y = ly / (ch / 2); return i;
      }
    }
    return -1;
  }

  function versLocal(e) { var b = fan.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; }

  fan.addEventListener("pointermove", function (e) {
    if (e.pointerType === "touch" && !saisie) return;
    var p = versLocal(e);
    pointeur.dedans = true; pointeur.x = p.x; pointeur.y = p.y;
    if (saisie) { saisie.px = p.x; saisie.py = p.y; if (Math.hypot(p.x - saisie.ox, p.y - saisie.oy) > 6) saisie.bouge = true; return; }
    survol = carteSous(p.x, p.y);
  });
  fan.addEventListener("pointerleave", function () { if (!saisie) { pointeur.dedans = false; survol = -1; } });

  /* Mode lancer */
  fan.addEventListener("pointerdown", function (e) {
    if (mode !== "lancer") return;
    var p = versLocal(e), i = carteSous(p.x, p.y);
    if (i < 0) return;
    e.preventDefault();
    var st = etats[i];
    saisie = { i: i, gx: p.x - st.x.v, gy: p.y - st.y.v, px: p.x, py: p.y, ox: p.x, oy: p.y, bouge: false };
    items[i].classList.add("saisie");
    fan.setPointerCapture(e.pointerId);
  });
  function relacher() {
    if (!saisie) return;
    items[saisie.i].classList.remove("saisie");
    if (saisie.bouge) { var el = items[saisie.i]; el.dataset.bloque = "1"; setTimeout(function () { delete el.dataset.bloque; }, 50); }
    saisie = null;
  }
  fan.addEventListener("pointerup", relacher);
  fan.addEventListener("pointercancel", relacher);
  items.forEach(function (el) {
    el.addEventListener("click", function (e) { if (el.dataset.bloque) e.preventDefault(); });
  });

  window.addEventListener("scroll", function () {
    scrollP = Math.max(0, Math.min(1, window.scrollY / (window.innerHeight * 0.7)));
  }, { passive: true });
  window.addEventListener("resize", mesurer);

  /* Ressort amorti (Euler semi-implicite) */
  function pousse(sp, cible, k, c, dt) { sp.vel += ((cible - sp.v) * k - sp.vel * c) * dt; sp.v += sp.vel * dt; }

  function cibles(i, t) {
    var k = ordre[i], s = slots[k], d = 0.5 + k / N;               // profondeur : devant = bouge plus
    var c = { x: s.x, y: s.y, r: s.r, s: 1, rx: 0, ry: 0, h: 0, z: s.z, k: 170, c: 19 };
    var actif = survol >= 0 && mode !== "lancer" || (mode === "lancer" && survol >= 0 && !saisie);

    // respiration au repos
    var calme = survol >= 0 ? 0.3 : 1;
    c.y += Math.sin(t * 1.15 + i * 1.7) * 4 * calme;
    c.r += Math.sin(t * 0.8 + i * 2.1) * 0.7 * calme;

    // parallaxe douce avec la souris
    c.x += pointeur.mx * 10 * d; c.y += pointeur.my * 7 * d;

    if (mode === "scroll") {
      var p = scrollP, cx = W / 2 - cw / 2;
      c.x = cx + (c.x - cx) * (1 + p * 0.55);
      c.r *= 1 + p * 0.9;
      c.y -= p * (60 + 90 * Math.abs(k - (N - 1) / 2) / ((N - 1) / 2)) * (0.6 + d * 0.5);
      c.s = 1 - p * 0.06 * (1 - d);
    }

    if (mode === "shuffle" && t < etats[i].vol) {                 // la carte vole par-dessus
      c.y = Math.min(s.y, slots[N - 1].y) - ch * 0.55;
      c.x = (s.x + slots[N - 1].x) / 2 + cw * 0.15;
      c.r = -22; c.s = 1.04; c.z = 20; c.k = 140; c.c = 16;
    }

    if (actif && i === survol) {
      c.r = 0; c.y = s.y - 26; c.s = 1.07; c.h = 1; c.z = 10;
      c.ry = local.x * 13; c.rx = -local.y * 10;
      c.k = 260; c.c = 22;
    } else if (actif && survol >= 0) {
      var kh = ordre[survol], sens = k < kh ? -1 : 1, dist = Math.abs(k - kh);
      c.x += sens * 38 / Math.pow(dist, 0.7);
      c.r += sens * 3.5 / dist;
      c.y += 8; c.s = 0.97;
    }

    if (saisie && saisie.i === i) {
      var st = etats[i];
      c.x = saisie.px - saisie.gx; c.y = saisie.py - saisie.gy;
      c.r = Math.max(-28, Math.min(28, st.x.vel * 0.035));
      c.s = 1.1; c.h = 1; c.z = 30; c.k = 700; c.c = 42;
    }
    return c;
  }

  function entree(i, t) {                                         // distribution depuis un paquet
    var delai = 0.18 + i * 0.09;
    if (t - t0 >= delai) { items[i].classList.add("est-la"); return false; }
    return true;
  }

  var precedent = 0;
  function image(ms) {
    var t = ms / 1000, dt = Math.min(1 / 30, t - (precedent || t)); precedent = t;
    if (!t0) t0 = t;

    pointeur.mx += ((pointeur.dedans ? (pointeur.x / W) * 2 - 1 : 0) - pointeur.mx) * 0.08;
    pointeur.my += ((pointeur.dedans ? (pointeur.y / H) * 2 - 1 : 0) - pointeur.my) * 0.08;

    if (mode === "shuffle" && survol < 0 && t - dernierShuffle > 2.6 && t - t0 > 2) {
      dernierShuffle = t;
      var haut = ordre.indexOf(N - 1);
      ordre = ordre.map(function (k) { return k === N - 1 ? 0 : k + 1; });
      etats[haut].vol = t + 0.38;
    }

    for (var i = 0; i < N; i++) {
      var st = etats[i], el = items[i], c;
      if (entree(i, t)) {
        st.x.v = W / 2 - cw / 2; st.y.v = H * 0.35 + 70; st.r.v = (i - 2) * 2; st.s.v = 0.82;
        st.x.vel = st.y.vel = st.r.vel = st.s.vel = 0;
        st.z = slots[ordre[i]].z;
      } else {
        c = cibles(i, t);
        var sub = dt / 2;
        for (var n = 0; n < 2; n++) {
          pousse(st.x, c.x, c.k, c.c, sub); pousse(st.y, c.y, c.k, c.c, sub);
          pousse(st.r, c.r, c.k, c.c, sub); pousse(st.s, c.s, c.k, c.c, sub);
          pousse(st.rx, c.rx, 200, 20, sub); pousse(st.ry, c.ry, 200, 20, sub);
          pousse(st.h, c.h, 220, 24, sub);
        }
        st.z = c.z;
      }
      el.style.zIndex = st.z;
      el.style.transform = "translate3d(" + st.x.v.toFixed(2) + "px," + st.y.v.toFixed(2) + "px,0) rotate(" + st.r.v.toFixed(3) +
        "deg) perspective(900px) rotateX(" + st.rx.v.toFixed(2) + "deg) rotateY(" + st.ry.v.toFixed(2) + "deg) scale(" + st.s.v.toFixed(4) + ")";
      var h = Math.max(0, st.h.v), carte = el.firstElementChild;
      carte.style.setProperty("--go", (h * 0.9).toFixed(3));
      carte.style.setProperty("--gx", (50 + local.x * 40 * (i === survol ? 1 : 0)) + "%");
      carte.style.setProperty("--gy", (50 + local.y * 40 * (i === survol ? 1 : 0)) + "%");
      carte.style.boxShadow = "0 " + (4 + h * 22).toFixed(1) + "px " + (10 + h * 30).toFixed(1) + "px rgba(24,24,24," + (0.06 + h * 0.12).toFixed(3) + ")";
    }
    requestAnimationFrame(image);
  }

  mesurer();
  requestAnimationFrame(image);

  /* Petite API (sert à la démo, inutile en prod) */
  window.MokaEventail = {
    mode: function (m) { mode = m; fan.setAttribute("data-anim", m); ordre = items.map(function (_, i) { return i; }); survol = -1; },
    rejouer: function () { t0 = 0; items.forEach(function (el) { el.classList.remove("est-la"); }); }
  };
})();

/* Moka · Cartes « Comment ça marche » : apparition en cascade au scroll + petit rebond du numéro */
(function () {
  if (!("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var nums = [].slice.call(document.querySelectorAll(".boite > .num"));
  if (!nums.length) return;
  var grilles = [];
  nums.forEach(function (n) { var g = n.parentNode.parentNode; if (grilles.indexOf(g) < 0) grilles.push(g); });
  grilles.forEach(function (g) {
    var boites = [].slice.call(g.children).filter(function (b) { return b.querySelector(":scope > .num"); });
    boites.forEach(function (b, i) { b.classList.add("etape"); b.style.setProperty("--i", i); });
    g.classList.add("etapes-js");
    var io = new IntersectionObserver(function (entrees) {
      if (!entrees[0].isIntersecting) return;
      io.disconnect();
      g.classList.add("etapes-vues");
      // une fois arrivées, on retire le décalage pour que le survol réagisse tout de suite
      setTimeout(function () { g.classList.add("etapes-finies"); }, 900 + boites.length * 120);
    }, { threshold: 0.25 });
    io.observe(g);
  });
})();
