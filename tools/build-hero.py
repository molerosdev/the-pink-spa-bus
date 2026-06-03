#!/usr/bin/env python3
"""
Build the single-frame hero slideshow images (1..10).

To set your exact order: rename your 10 chosen photos to 1.jpg .. 10.jpg inside
  images/Pictures/Bus hero section/
then run:  python3 tools/build-hero.py
If 1..10.jpg aren't present, a sensible default order (below) is used.

Output: public/images/hero/1.webp .. 10.webp  (~1400px wide, WebP)
"""
from PIL import Image, ImageOps
import os, glob

SRC = "images/Pictures/Bus hero section"
OUT = "public/images/hero"
WIDTH = 1400

# default order used only if 1.jpg..10.jpg don't exist
DEFAULT = ["P1036216-1","P1036136","P1036156","P1036137","P1036217-1",
           "P1036134","P1036221","P1036219","P1036220","P10362181"]

def source_for(n):
    for ext in ("jpg","jpeg","png","JPG"):
        p = f"{SRC}/{n}.{ext}"
        if os.path.exists(p): return p
    return None

# prefer user-numbered 1..10, else default stems
order = []
if all(source_for(n) for n in range(1, 11)):
    order = [source_for(n) for n in range(1, 11)]
    print("Using your numbered 1-10 images.")
else:
    order = [f"{SRC}/{s}.jpg" for s in DEFAULT]
    print("No 1-10.jpg found — using default order.")

os.makedirs(OUT, exist_ok=True)
tot = 0
for i, src in enumerate(order, 1):
    im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
    im.thumbnail((WIDTH, int(WIDTH * 1.2)), Image.LANCZOS)
    p = f"{OUT}/{i}.webp"
    im.save(p, "WEBP", quality=80, method=6)
    tot += os.path.getsize(p)
    print(f"  {i}.webp  {im.size}  ({os.path.basename(src)})")
print(f"Done: {len(order)} images, {round(tot/1024)}KB")
