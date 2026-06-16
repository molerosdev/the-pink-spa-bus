#!/usr/bin/env python3
"""
Build the Party Rentals images.

Sources (full-size, git-ignored, NOT served):
  images/Pictures/rentals-src/*.jpg

Output (served):
  public/images/rentals/<name>.webp        square 1:1 card image (product fills it)
  public/images/rentals/full/<name>.webp   whole image for the click-to-zoom modal

For product-on-white shots (chairs, tables, cocktail table) the white border is
trimmed and the product is scaled up to fill the square. Photo shots (bounce
house, cart, games, setup) are cover-cropped to the square.
"""
from PIL import Image, ImageOps, ImageChops
import os

SRC = "images/Pictures/rentals-src"
OUT = "public/images/rentals"
SQUARE = 900
FULL_MAX = 1280

MAP = {
    "inflatables.webp":    "photo_4972463615348771848_y (1).jpg",
    "cocktail-table.webp": "photo_4972463615348771850_y.jpg",
    "kids-tables.webp":    "photo_4972463615348771851_y.jpg",
    "kids-chairs.webp":    "photo_4972463615348771853_y.jpg",
    "adult-chairs.webp":   "photo_4972463615348771854_y.jpg",
    "pancakes-cart.webp":  "photo_4972463615348771857_y.jpg",
    "kids-games.webp":     "photo_4972463615348771859_y.jpg",
}

def is_white_bg(im):
    w, h = im.size
    pts = [(2, 2), (w-3, 2), (2, h-3), (w-3, h-3), (w//2, 2), (w//2, h-3)]
    return all(min(im.getpixel(p)[:3]) > 236 for p in pts)

def trim_white(im):
    bg = Image.new("RGB", im.size, (255, 255, 255))
    diff = ImageChops.difference(im, bg).convert("L").point(lambda p: 255 if p > 16 else 0)
    bb = diff.getbbox()
    if not bb:
        return im
    pad = int(0.02 * max(im.size))
    x0, y0, x1, y1 = bb
    return im.crop((max(0, x0-pad), max(0, y0-pad),
                    min(im.size[0], x1+pad), min(im.size[1], y1+pad)))

os.makedirs(f"{OUT}/full", exist_ok=True)
for out, src in MAP.items():
    p = os.path.join(SRC, src)
    if not os.path.exists(p):
        print("MISSING:", p); continue
    im = ImageOps.exif_transpose(Image.open(p)).convert("RGB")

    # full image for the modal
    full = im.copy(); full.thumbnail((FULL_MAX, FULL_MAX), Image.LANCZOS)
    full.save(f"{OUT}/full/{out}", "WEBP", quality=82, method=6)

    # square card image
    if is_white_bg(im):
        prod = trim_white(im)
        canvas = Image.new("RGB", (SQUARE, SQUARE), (255, 255, 255))
        fit = prod.copy(); fit.thumbnail((int(SQUARE*0.92), int(SQUARE*0.92)), Image.LANCZOS)
        canvas.paste(fit, ((SQUARE - fit.width)//2, (SQUARE - fit.height)//2))
        sq = canvas
        mode = "white-trim+fill"
    else:
        sq = ImageOps.fit(im, (SQUARE, SQUARE), Image.LANCZOS, centering=(0.5, 0.5))
        mode = "cover"
    sq.save(f"{OUT}/{out}", "WEBP", quality=82, method=6)
    print(f"  {out}  ({mode})")
print("done ->", OUT)
