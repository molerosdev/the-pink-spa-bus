#!/usr/bin/env python3
"""
Remove the wording from the Pink Coquette promo graphic, keep the logo + frame.

Usage:
  python3 tools/erase-card-text.py
Input : public/images/cards/coquette-raw.png   (the original graphic WITH text)
Output: public/images/cards/coquette.png        (text removed, portrait, web-optimized)

It builds a mask of the text (magenta titles/tagline + bright-pink body copy) but
PROTECTS the top-left logo zone, then uses OpenCV inpainting to reconstruct the
soft-pink panel behind the text. Tune the constants after inspecting the file.
"""
import cv2, numpy as np, os

RAW = "images/package-card.png"          # source (not served)
OUT = "public/images/cards/coquette.png"

# --- regions are fractions of width/height ---
LOGO_ZONE   = (0.00, 0.00, 0.50, 0.235)  # protect (x0,y0,x1,y1) — keep the logo
TEXT_ZONE   = (0.02, 0.22, 0.98, 0.98)   # only look for text inside here
# protect only the knot of the big top-right bow (its ribbons overlap the title):
BOW_ZONE    = (0.66, 0.00, 0.97, 0.19)

# --- text color thresholds (HSV) — panel S≈69/V≈252; body pink S≈141; titles dark ---
DARK_S_MIN, DARK_V_MAX = 60, 150          # dark magenta titles / tagline
BRIGHT_S_MIN, BRIGHT_V_MIN = 110, 150     # saturated brand-pink body copy
GRAY_S_MAX, GRAY_V_LO, GRAY_V_HI = 55, 40, 215   # gray emoji/icons (camera, gift)

def frac_box(shape, box):
    h, w = shape[:2]
    x0, y0, x1, y1 = box
    return int(x0*w), int(y0*h), int(x1*w), int(y1*h)

def main():
    if not os.path.exists(RAW):
        raise SystemExit(f"Missing {RAW} — drop the graphic there first.")
    img = cv2.imread(RAW)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    H, W = img.shape[:2]

    # region of interest
    roi = np.zeros((H, W), np.uint8)
    rx0, ry0, rx1, ry1 = frac_box(img.shape, TEXT_ZONE)
    roi[ry0:ry1, rx0:rx1] = 255
    lx0, ly0, lx1, ly1 = frac_box(img.shape, LOGO_ZONE)
    roi[ly0:ly1, lx0:lx1] = 0   # carve out the logo
    bx0, by0, bx1, by1 = frac_box(img.shape, BOW_ZONE)
    roi[by0:by1, bx0:bx1] = 0   # carve out the big bow

    s = hsv[:, :, 1]; v = hsv[:, :, 2]
    dark   = ((s > DARK_S_MIN) & (v < DARK_V_MAX)).astype(np.uint8) * 255
    bright = ((s > BRIGHT_S_MIN) & (v > BRIGHT_V_MIN)).astype(np.uint8) * 255
    gray   = ((s < GRAY_S_MAX) & (v > GRAY_V_LO) & (v < GRAY_V_HI)).astype(np.uint8) * 255
    text = cv2.bitwise_or(cv2.bitwise_or(dark, bright), gray)
    mask = cv2.bitwise_and(text, roi)

    # grow the mask so glyph edges/halos are covered
    mask = cv2.dilate(mask, np.ones((5, 5), np.uint8), iterations=2)
    print(f"mask covers {100*mask.mean()/255:.1f}% of the image")

    out = cv2.inpaint(img, mask, 6, cv2.INPAINT_TELEA)

    # save a portrait, web-sized PNG
    cv2.imwrite(OUT, out)
    # also emit an optimized version via Pillow for smaller size
    from PIL import Image
    im = Image.open(OUT).convert("RGB")
    im.thumbnail((1000, 1300), Image.LANCZOS)
    im.save(OUT.replace(".png", ".jpg"), "JPEG", quality=82, optimize=True, progressive=True)
    print("wrote", OUT, "and", OUT.replace(".png", ".jpg"))

if __name__ == "__main__":
    main()
