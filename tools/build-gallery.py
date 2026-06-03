#!/usr/bin/env python3
"""
Build the unified gallery image set.

Sources (full-size, git-ignored, NOT served):
  images/Pictures/gallery-src/*           (drop new gallery photos here: jpg/png)
  images/Pictures/Emma's Birthday/*.jpg   (existing event photos)

Output (served):
  public/images/gallery/large/NN.webp  (~1500px, featured)
  public/images/gallery/thumb/NN.webp  (~400px,  thumbnails)

After running, set data-count="<N>" on the .ugal element in gallery.html to the
number printed below.
"""
from PIL import Image, ImageOps
import glob, os

OUT = "public/images/gallery"
SOURCES = sorted(glob.glob("images/Pictures/gallery-src/*.png")
               + glob.glob("images/Pictures/gallery-src/*.jpg")
               + glob.glob("images/Pictures/gallery-src/*.jpeg")) \
        + sorted(glob.glob("images/Pictures/Emma's Birthday/*.jpg"))

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

print(f"Built {len(SOURCES)} gallery images -> set data-count=\"{len(SOURCES)}\" in gallery.html")
