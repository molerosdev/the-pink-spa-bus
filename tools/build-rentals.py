#!/usr/bin/env python3
"""
Build the Party Rentals card images.

Sources (full-size, git-ignored, NOT served):
  images/Pictures/rentals-src/*.jpg   (the original rental photos + flyer PDF)

Output (served): public/images/rentals/<name>.webp  (4:3, ~820px, center-cropped)

Each rental card maps to one specific source photo below. Re-run after dropping
new/replacement photos in the source folder and updating the MAP.
"""
from PIL import Image, ImageOps
import os

SRC = "images/Pictures/rentals-src"
OUT = "public/images/rentals"
TW, TH = 820, 615          # 4:3 card image

MAP = {
    "inflatables.webp":    "photo_4972463615348771848_y (1).jpg",
    "cocktail-table.webp": "photo_4972463615348771850_y.jpg",
    "kids-tables.webp":    "photo_4972463615348771851_y.jpg",
    "kids-chairs.webp":    "photo_4972463615348771853_y.jpg",
    "adult-chairs.webp":   "photo_4972463615348771854_y.jpg",
    "pancakes-cart.webp":  "photo_4972463615348771857_y.jpg",
    "kids-games.webp":     "photo_4972463615348771859_y.jpg",
}

os.makedirs(OUT, exist_ok=True)
for out, src in MAP.items():
    p = os.path.join(SRC, src)
    if not os.path.exists(p):
        print("MISSING:", p); continue
    im = ImageOps.exif_transpose(Image.open(p)).convert("RGB")
    # cover-crop to 4:3, centered
    im = ImageOps.fit(im, (TW, TH), Image.LANCZOS, centering=(0.5, 0.5))
    im.save(os.path.join(OUT, out), "WEBP", quality=80, method=6)
    print(f"  {out}  <- {src}")
print("done ->", OUT)
