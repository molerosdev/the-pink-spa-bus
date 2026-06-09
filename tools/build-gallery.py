#!/usr/bin/env python3
"""
Build a gallery image set (large + thumb WebP) from full-size sources.

Two galleries on gallery.html, each its own folder:

  EVENTS gallery  (default)
    sources: images/Pictures/gallery-src/*   +  images/Pictures/Emma's Birthday/*.jpg
    output : public/images/gallery/{large,thumb}/NN.webp
    run    : python3 tools/build-gallery.py

  PINK COQUETTE gallery
    sources: images/Pictures/coquette-src/*   (drop the Coquette photos here)
    output : public/images/gallery/coquette/{large,thumb}/NN.webp
    run    : python3 tools/build-gallery.py coquette

After running, set data-count="<N>" on the matching .ugal in gallery.html.
"""
from PIL import Image, ImageOps
import glob, os, sys

mode = sys.argv[1] if len(sys.argv) > 1 else "events"

if mode == "coquette":
    OUT = "public/images/gallery/coquette"
    SOURCES = sorted(glob.glob("images/Pictures/coquette-src/*.png")
                   + glob.glob("images/Pictures/coquette-src/*.jpg")
                   + glob.glob("images/Pictures/coquette-src/*.jpeg")
                   + glob.glob("images/Pictures/coquette-src/*.webp"))
else:
    OUT = "public/images/gallery"
    SOURCES = sorted(glob.glob("images/Pictures/gallery-src/*.png")
                   + glob.glob("images/Pictures/gallery-src/*.jpg")
                   + glob.glob("images/Pictures/gallery-src/*.jpeg")) \
            + sorted(glob.glob("images/Pictures/Emma's Birthday/*.jpg"))

if not SOURCES:
    raise SystemExit(f"No source images found for '{mode}'. Add files first.")

os.makedirs(f"{OUT}/large", exist_ok=True)
os.makedirs(f"{OUT}/thumb", exist_ok=True)
for f in glob.glob(f"{OUT}/large/*.webp") + glob.glob(f"{OUT}/thumb/*.webp"):
    os.remove(f)

for i, src in enumerate(SOURCES, 1):
    im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
    lg = im.copy(); lg.thumbnail((1500, 1500), Image.LANCZOS)
    lg.save(f"{OUT}/large/{i:02d}.webp", "WEBP", quality=78, method=6)
    th = im.copy(); th.thumbnail((400, 400), Image.LANCZOS)
    th.save(f"{OUT}/thumb/{i:02d}.webp", "WEBP", quality=72, method=6)

print(f"[{mode}] Built {len(SOURCES)} images -> set data-count=\"{len(SOURCES)}\" on the matching .ugal in gallery.html")
