/* Moka · Le monde de Moka : un livre qui se feuillette au scroll.
   Le HTML contient toutes les pages (lisibles sans JS). Ici on active le mode « livre 3D »
   sauf sur petit écran et si l'appareil demande de réduire les animations :
   dans ces cas les pages restent simplement empilées. */
(function () {
  var histoire = document.getElementById("histoire");
  if (!histoire || !window.requestAnimationFrame) return;
  var mqPetit = window.matchMedia("(max-width: 760px)");
  var mqCalme = window.matchMedia("(prefers-reduced-motion: reduce)");

  var feuilles = [].slice.call(histoire.querySelectorAll(".feuille"));
  var N = feuilles.length, TOURS = N - 1;        // on s'arrête livre ouvert sur la dernière double page
  var glisse = histoire.querySelector(".livre-glisse"), reliure = histoire.querySelector(".livre-reliure");
  var nav = histoire.querySelector(".livre-onglets"), boutons = nav ? [].slice.call(nav.children) : [];
  var etatTxt = histoire.querySelector("[data-etat-texte]"), barre = histoire.querySelector(".livre-barre i");
  var etats = feuilles.map(function () { return { v: 0, vel: 0 }; });
  var dec = { v: -0.25, vel: 0 }, ech = { v: 0.9, vel: 0 };
  var actif = false, raf = 0, avant = 0, vu = -1, p = 0;

  function lisse(x) { return x * x * (3 - 2 * x); }
  function pousse(s, c, k, d, dt) { s.vel += ((c - s.v) * k - s.vel * d) * dt; s.v += s.vel * dt; }
  function lire() { var b = histoire.getBoundingClientRect(), h = histoire.offsetHeight - innerHeight; p = h > 0 ? Math.min(1, Math.max(0, -b.top / h)) : 0; }
  function hauteurHeader() { var hh = document.querySelector(".header"); histoire.style.setProperty("--h-header", (hh ? hh.offsetHeight : 0) + "px"); }

  function image(ms) {
    var dt = Math.min(1 / 30, (ms - (avant || ms)) / 1000); avant = ms;
    var t = p * TOURS;
    for (var i = 0; i < N; i++) {
      // chaque feuille tourne au milieu de son morceau de scroll : entre deux tours, la double page reste ouverte pour la lecture
      var a = i < TOURS ? lisse(Math.min(1, Math.max(0, (t - i - 0.25) / 0.5))) * 180 : 0;
      var s = etats[i]; pousse(s, a, 140, 22, dt / 2); pousse(s, a, 140, 22, dt / 2);
      if (Math.abs(s.v - a) < 0.2 && Math.abs(s.vel) < 1) { s.v = a; s.vel = 0; }
      var v = s.v, sn = Math.sin(v * Math.PI / 180);
      var z = (N - i) * 3 + (-i * 3 - (N - i) * 3) * (v / 180);   // empilement sans que deux pages se croisent
      var f = feuilles[i];
      f.style.transform = "rotateY(" + (-v).toFixed(2) + "deg) translateZ(" + (sn * 10 + z).toFixed(2) + "px)";
      f.style.zIndex = v > 90 ? 100 + i : 100 + N - i;
      f.children[0].lastElementChild.style.opacity = v < 90 ? (sn * .85).toFixed(3) : 0;
      f.children[1].lastElementChild.style.opacity = v >= 90 ? (sn * .85).toFixed(3) : 0;
      // on cache vraiment la face qui est de dos : sinon Safari laisse voir certaines images en miroir à travers la page
      f.children[0].style.visibility = v > 90 ? "hidden" : "";
      f.children[1].style.visibility = v < 90 ? "hidden" : "";
    }
    var ouvert = Math.min(1, etats[0].v / 180);
    pousse(dec, -0.25 * (1 - ouvert), 120, 20, dt); pousse(ech, 0.9 + 0.1 * ouvert, 120, 20, dt);
    glisse.style.transform = "translateX(" + (dec.v * 100).toFixed(3) + "%) scale(" + ech.v.toFixed(4) + ")";
    reliure.style.opacity = ouvert > .5 ? 1 : 0;
    if (nav) { nav.style.opacity = Math.max(0, ouvert * 2 - 1).toFixed(3); nav.style.pointerEvents = ouvert > .9 ? "auto" : "none"; }
    histoire.classList.toggle("livre-ouvert", etats[0].v > 2);
    var s2 = 0; while (s2 < N && etats[s2].v > 100) s2++;
    // pages à afficher : la double page ouverte, plus celle qui se découvre pendant qu'une feuille tourne
    var aVoir = [];
    if (s2 > 0) aVoir.push(feuilles[s2 - 1].children[1]);
    if (s2 < N) aVoir.push(feuilles[s2].children[0]);
    if (s2 < N && etats[s2].v > 2) { aVoir.push(feuilles[s2].children[1]); if (s2 + 1 < N) aVoir.push(feuilles[s2 + 1].children[0]); }
    if (s2 > 0 && etats[s2 - 1].v < 178) { aVoir.push(feuilles[s2 - 1].children[0]); if (s2 - 2 >= 0) aVoir.push(feuilles[s2 - 2].children[1]); }
    histoire.querySelectorAll(".face.visible").forEach(function (x) { if (aVoir.indexOf(x) < 0) x.classList.remove("visible"); });
    aVoir.forEach(function (x) { x.classList.add("visible"); });
    if (s2 !== vu) {
      // seules les pages visibles restent atteignables au clavier
      feuilles.forEach(function (f, i) {
        f.children[0].inert = !(i === s2);
        f.children[1].inert = !(i === s2 - 1);
      });
      vu = s2;
      if (etatTxt) etatTxt.textContent = feuilles[Math.min(N - 1, s2)].getAttribute("data-etat");
      boutons.forEach(function (b, k) {
        var s = +b.getAttribute("data-aller"), suiv = boutons[k + 1] ? +boutons[k + 1].getAttribute("data-aller") : 99;
        b.setAttribute("aria-current", s2 >= s && s2 < suiv ? "true" : "false");
      });
    }
    if (barre) barre.style.width = (p * 100).toFixed(1) + "%";
    raf = requestAnimationFrame(image);
  }

  function allerA(s) {
    var h = histoire.offsetHeight - innerHeight;
    window.scrollTo({ top: histoire.offsetTop + h * (s / TOURS) + (s === TOURS ? 0 : 2), behavior: "smooth" });
  }
  boutons.forEach(function (b) { b.addEventListener("click", function () { allerA(+b.getAttribute("data-aller")); }); });

  function activer() {
    if (actif) return; actif = true;
    histoire.classList.add("livre-js"); histoire.style.setProperty("--tours", TOURS);
    hauteurHeader(); lire(); vu = -1; avant = 0;
    window.addEventListener("scroll", lire, { passive: true });
    window.addEventListener("resize", hauteurHeader);
    raf = requestAnimationFrame(image);
  }
  function desactiver() {
    if (!actif) return; actif = false;
    cancelAnimationFrame(raf);
    window.removeEventListener("scroll", lire); window.removeEventListener("resize", hauteurHeader);
    histoire.classList.remove("livre-js", "livre-ouvert");
    feuilles.forEach(function (f) {
      f.style.transform = f.style.zIndex = "";
      [].forEach.call(f.children, function (c) { c.inert = false; c.style.visibility = ""; c.classList.remove("visible"); if (c.lastElementChild) c.lastElementChild.style.opacity = ""; });
    });
    glisse.style.transform = reliure.style.opacity = "";
  }
  function choisir() { if (mqPetit.matches || mqCalme.matches) desactiver(); else activer(); }
  [mqPetit, mqCalme].forEach(function (mq) { if (mq.addEventListener) mq.addEventListener("change", choisir); else if (mq.addListener) mq.addListener(choisir); });
  choisir();
})();
