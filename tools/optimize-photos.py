#!/usr/bin/env python3
"""
Optimize event photos into web-ready gallery sets.

Usage:
  python3 tools/optimize-photos.py "images/Pictures/Emma's Birthday" emmas-birthday
  python3 tools/optimize-photos.py "images/Pictures/Sofia's 7th"     sofias-7th

Produces:
  images/gallery/<slug>/large/NN.jpg  (~1600px, q74)
  images/gallery/<slug>/thumb/NN.jpg  (~700px,  q72)

Then add to the GALLERY array in index.html:
  { title: "Emma's Birthday", slug: "emmas-birthday", count: <N> }
"""
import sys, os, glob
from PIL import Image, ImageOps

if len(sys.argv) < 3:
    print(__doc__); sys.exit(1)

src, slug = sys.argv[1], sys.argv[2]
files = sorted(glob.glob(os.path.join(src, '*.jpg')) + glob.glob(os.path.join(src, '*.jpeg')) +
               glob.glob(os.path.join(src, '*.png')) + glob.glob(os.path.join(src, '*.JPG')))
if not files:
    print('No images found in', src); sys.exit(1)

def save(im, path, w, q):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    out = im.copy(); out.thumbnail((w, w * 3), Image.LANCZOS)
    out.save(path, 'JPEG', quality=q, optimize=True, progressive=True)

total = 0
for i, f in enumerate(files[:10], 1):  # cap at 10 per event
    im = ImageOps.exif_transpose(Image.open(f)).convert('RGB')
    save(im, f"images/gallery/{slug}/large/{i:02d}.jpg", 1600, 74)
    save(im, f"images/gallery/{slug}/thumb/{i:02d}.jpg", 700, 72)
    total += 1

print(f"Done: {total} photos -> images/gallery/{slug}/")
print(f'Add to GALLERY in index.html:  {{ title: "<Event name>", slug: "{slug}", count: {total} }}')
