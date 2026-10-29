/* Moka Coloriages — catalogue (prix en centimes).
   ⚠️ Ce fichier est recopié côté serveur dans api/_catalogue.js :
   si tu changes un prix ici, change-le aussi là-bas (c'est le serveur qui fait foi). */

window.MOKA = window.MOKA || {};
var MOKA = window.MOKA;

MOKA.univers = {
  montagne: { nom: "La montagne", couleur: "#8EC9FF" },
  plage:    { nom: "La plage",    couleur: "#FFD23F" },
  foret:    { nom: "La forêt",    couleur: "#6BCB77" },
  ferme:    { nom: "La ferme",    couleur: "#F87848" },
  ecole:    { nom: "L'école",     couleur: "#F888B8" },
  noel:     { nom: "Noël",        couleur: "#FF5A5F" },
  espace:   { nom: "L'espace",    couleur: "#9B7BFF" },
  docteur:  { nom: "Chez le docteur", couleur: "#4DD4C6" },
  coffret:  { nom: "Le Tour du Monde", couleur: "#181818" }
};

/* planches : { titre, img } — img null = planche annoncée mais pas encore dessinée.
   doudou : true seulement quand le doudou est vraiment dessiné dans les planches. */
MOKA.packs = [
  {
    id: "montagne", univers: "montagne", nom: "Moka à la montagne",
    age: "2-4", prix: 199, format: "pack", nbPlanches: 6, doudou: false,
    badge: null, tags: ["tout-petits"],
    resume: "Pack de 6 coloriages à imprimer. Moka part en randonnée, fait un bonhomme de neige, file à ski, dévale en luge et rencontre une marmotte.",
    histoire: "Moka grimpe jusqu'au sommet et construit son premier bonhomme de neige.",
    planches: [
      { titre: "La randonnée", img: "montagne-randonnee.png" },
      { titre: "Le bonhomme de neige", img: "montagne-bonhomme.png" },
      { titre: "Moka au ski", img: null },
      { titre: "La luge en bois", img: null },
      { titre: "Au coin du feu", img: null },
      { titre: "La marmotte curieuse", img: null }
    ],
    cachettes: "derrière un sapin, sous la luge, dans le sac à dos"
  },
  {
    id: "plage", univers: "plage", nom: "Moka à la plage",
    age: "2-4", prix: 199, format: "pack", nbPlanches: 6, doudou: false,
    badge: null, tags: ["tout-petits"],
    resume: "Pack de 6 coloriages à imprimer. Pelle, seau et château de sable : Moka passe la journée au bord de la mer.",
    histoire: "Pelle, seau et château de sable : la mer n'a qu'à bien se tenir.",
    planches: [
      { titre: "Le château de sable", img: "plage-chateau.png" },
      { titre: "Planche 2", img: null }, { titre: "Planche 3", img: null },
      { titre: "Planche 4", img: null }, { titre: "Planche 5", img: null },
      { titre: "Planche 6", img: null }
    ],
    cachettes: "dans le seau, derrière le château, sous la serviette"
  },
  {
    id: "foret", univers: "foret", nom: "Moka à la forêt",
    age: "2-4", prix: 199, format: "pack", nbPlanches: 5, doudou: true,
    badge: "Nouveau", tags: ["pluie", "tout-petits"],
    resume: "Pack de 5 coloriages à imprimer. Moka part en balade, saute dans les flaques sous la pluie, rencontre un hérisson, trempe ses pieds dans le ruisseau et ramasse des champignons.",
    histoire: "Bâton à la main, il croise un hérisson, saute dans les flaques et remplit son panier de champignons.",
    planches: [
      { titre: "La balade en forêt", img: "foret-balade.png" },
      { titre: "Sous la pluie", img: "foret-pluie.png" },
      { titre: "Le hérisson", img: "foret-herisson.png" },
      { titre: "Au bord du ruisseau", img: "foret-ruisseau.png" },
      { titre: "La cueillette des champignons", img: "foret-champignons.png" }
    ],
    cachettes: "derrière un arbre, sous un champignon, dans le panier"
  },
  {
    id: "ferme", univers: "ferme", nom: "Moka à la ferme",
    age: "4-6", prix: 199, format: "pack", nbPlanches: 5, doudou: false,
    badge: null, tags: ["pluie"],
    resume: "Pack de 5 coloriages à imprimer. Moka aide à nourrir les poules et apprend à traire la vache Pâquerette.",
    histoire: "Il aide à nourrir les poules et apprend à traire la vache Pâquerette.",
    planches: [
      { titre: "Les poules et Pâquerette", img: "ferme-poules.png" },
      { titre: "Planche 2", img: null }, { titre: "Planche 3", img: null },
      { titre: "Planche 4", img: null }, { titre: "Planche 5", img: null }
    ],
    cachettes: "dans la botte de foin, derrière la barrière"
  },
  {
    id: "ecole", univers: "ecole", nom: "Moka va à l'école",
    age: "2-4", prix: 199, format: "pack", nbPlanches: 5, doudou: false,
    badge: "Rentrée", tags: ["rentree", "tout-petits"],
    resume: "Pack de 5 coloriages à imprimer. Premier jour de classe : un cartable, des crayons et plein de copains.",
    histoire: "Premier jour de classe : un cartable, des crayons et plein de copains.",
    planches: [
      { titre: "Au pupitre", img: "ecole-pupitre.png" },
      { titre: "Planche 2", img: null }, { titre: "Planche 3", img: null },
      { titre: "Planche 4", img: null }, { titre: "Planche 5", img: null }
    ],
    cachettes: "dans le cartable, sous le pupitre"
  },
  {
    id: "noel", univers: "noel", nom: "Moka fête Noël",
    age: "4-6", prix: 199, format: "pack", nbPlanches: 5, doudou: false,
    badge: "Édition hiver", tags: [],
    resume: "Pack de 5 coloriages d'hiver à imprimer. Moka décore le sapin et laisse un bol de lait pour le père Noël.",
    histoire: "Il décore le sapin et laisse un bol de lait pour le père Noël.",
    planches: [
      { titre: "Le sapin", img: "noel-sapin.png" },
      { titre: "Planche 2", img: null }, { titre: "Planche 3", img: null },
      { titre: "Planche 4", img: null }, { titre: "Planche 5", img: null }
    ],
    cachettes: "sous le sapin, dans un paquet cadeau"
  },
  {
    id: "espace", univers: "espace", nom: "Moka dans l'espace",
    age: "6-8", prix: 199, format: "pack", nbPlanches: 5, doudou: false,
    badge: null, tags: ["pluie"],
    resume: "Pack de 5 coloriages à imprimer. Casque sur la tête, fusée prête : Moka part en direction des étoiles.",
    histoire: "Casque sur la tête, fusée prête : direction les étoiles.",
    planches: [
      { titre: "Moka astronaute", img: "espace-astronaute.png" },
      { titre: "Planche 2", img: null }, { titre: "Planche 3", img: null },
      { titre: "Planche 4", img: null }, { titre: "Planche 5", img: null }
    ],
    cachettes: "derrière une planète, dans la fusée"
  },
  {
    id: "docteur", univers: "docteur", nom: "Moka chez le docteur",
    age: "2-4", prix: 150, format: "unite", nbPlanches: 1, doudou: false,
    badge: null, tags: ["tout-petits"],
    resume: "Un coloriage à l'unité. Un petit bobo ? Le docteur le soigne, et Moka n'a même pas peur.",
    histoire: "Un petit bobo ? Le docteur le soigne, et Moka n'a même pas peur.",
    planches: [ { titre: "La visite chez le docteur", img: "docteur-visite.png" } ],
    cachettes: "dans la sacoche du docteur"
  },
  {
    id: "coffret", univers: "coffret", nom: "Le Tour du Monde de Moka",
    age: "4-8", prix: 590, prixBarre: 796, format: "coffret", nbPlanches: 24, doudou: false,
    badge: "Coffret", tags: [],
    resume: "24 planches tirées des aventures de Moka, réunies dans un seul cahier, avec des pages bonus de labyrinthes et de 7 différences.",
    histoire: "Le grand cahier qui réunit les aventures de Moka.",
    planches: [ { titre: "Moka fait le tour du monde", img: "coffret-tour-du-monde.png" } ],
    cachettes: ""
  }
];

/* Coloriage offert (produit d'appel) */
MOKA.offert = {
  titre: "La randonnée de Moka",
  img: "montagne-randonnee.png",
  pdf: "assets/pdf/coloriage-offert-la-randonnee.pdf"
};

MOKA.ages = { "2-4": "2–4 ans", "4-6": "4–6 ans", "6-8": "6–8 ans", "4-8": "4–8 ans" };

MOKA.pack = function (id) { return MOKA.packs.find(function (p) { return p.id === id; }); };
MOKA.prix = function (c) { return (c / 100).toFixed(2).replace(".", ",") + " €"; };
MOKA.couverture = function (p) {
  var pl = (p.planches || []).find(function (x) { return x.img; });
  return pl ? "assets/coloriages/" + pl.img : null;
};
