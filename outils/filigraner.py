# Filigrane « MOKA » sur les visuels des coloriages du site.
# Usage : depuis le dossier du projet, lancer  python3 outils/filigraner.py
#
# Les ORIGINAUX (sans filigrane) sont dans  originaux/  : c'est là qu'on ajoute ou remplace un dessin.
#   originaux/coloriages/    -> public/assets/coloriages/   (les planches des packs)
#   originaux/illustrations/ -> public/assets/img/          (les autres dessins à colorier : traits, coffret…)
# Le script réécrit chaque image filigranée à l'endroit que le site affiche.
# Les PDF vendus ne sont pas concernés : ils restent sans filigrane.
# Il faut Pillow :  python3 -m pip install Pillow
import os, sys
from PIL import Image, ImageDraw, ImageFont

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOSSIERS = [
    (os.path.join(RACINE, "originaux", "coloriages"), os.path.join(RACINE, "public", "assets", "coloriages")),
    (os.path.join(RACINE, "originaux", "illustrations"), os.path.join(RACINE, "public", "assets", "img")),
]
POLICE = os.path.join(RACINE, "outils", "fredoka-700.ttf")

TEXTE = "MOKA"
OPACITE = 0.12      # 0 = invisible, 1 = noir plein
ANGLE = 30          # inclinaison du motif, en degrés
TAILLE = 0.085      # hauteur du texte, en part de la largeur de l'image
ECART_X = 0.115     # espace entre deux mots sur une ligne
ECART_Y = 0.085     # espace entre deux lignes
ENCRE = (24, 24, 24)
# Dessins en trait blanc sur fond sombre : filigrane blanc
ENCRE_CLAIRE = {"moka-coffret.png": (255, 255, 255)}


def filigraner(chemin_src, chemin_dst, encre=ENCRE):
    img = Image.open(chemin_src)
    mode = img.mode
    base = img.convert("RGBA")
    w, h = base.size
    taille = max(10, round(w * TAILLE))
    police = ImageFont.truetype(POLICE, taille)
    tw = police.getbbox(TEXTE)[2]
    pas_x = tw + round(w * ECART_X)
    pas_y = taille + round(w * ECART_Y)

    # calque assez grand pour couvrir l'image une fois tourné
    d = int((w ** 2 + h ** 2) ** 0.5) + 2 * pas_x
    calque = Image.new("RGBA", (d, d), (0, 0, 0, 0))
    dessin = ImageDraw.Draw(calque)
    alpha = round(255 * OPACITE)
    for k, y in enumerate(range(-pas_y, d + pas_y, pas_y)):
        decalage = (pas_x // 2) if k % 2 else 0
        for x in range(-pas_x + decalage, d + pas_x, pas_x):
            dessin.text((x, y), TEXTE, font=police, fill=encre + (alpha,))
    calque = calque.rotate(ANGLE, resample=Image.BICUBIC)
    g, t = (d - w) // 2, (d - h) // 2
    calque = calque.crop((g, t, g + w, t + h))

    res = Image.alpha_composite(base, calque)
    if mode == "L":
        res = res.convert("L")
    elif mode != "RGBA":
        res = res.convert("RGB")
    res.save(chemin_dst, optimize=True)


if __name__ == "__main__":
    faits = []
    for source, sortie in DOSSIERS:
        if not os.path.isdir(source):
            print("(dossier absent, ignoré :", source + ")")
            continue
        os.makedirs(sortie, exist_ok=True)
        for nom in sorted(os.listdir(source)):
            if nom.lower().endswith(".png"):
                filigraner(os.path.join(source, nom), os.path.join(sortie, nom), ENCRE_CLAIRE.get(nom, ENCRE))
                faits.append(nom)
    print(len(faits), "images filigranées :", ", ".join(faits))
