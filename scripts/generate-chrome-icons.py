#!/usr/bin/env python3
"""Generate DHL Image Studio Chrome and Android PWA icons."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import sys

TARGET = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('chrome-extension/icons')
TARGET.mkdir(parents=True, exist_ok=True)
S = 512
im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(im)
d.rounded_rectangle((14, 14, 498, 498), radius=99,
                    fill=(5, 20, 50, 255), outline=(20, 142, 245, 255), width=16)
d.rounded_rectangle((25, 25, 487, 487), radius=91,
                    outline=(95, 207, 255, 200), width=4)
# Camera pictogram.
d.rounded_rectangle((196, 66, 318, 150), radius=16,
                    outline=(243, 248, 255, 255), width=11)
d.rounded_rectangle((219, 52, 271, 76), radius=7, fill=(243, 248, 255, 255))
d.ellipse((230, 89, 283, 142), outline=(243, 248, 255, 255), width=10)
d.ellipse((291, 81, 304, 94), fill=(243, 248, 255, 255))

FONTS = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-BoldOblique.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/truetype/liberation2/LiberationSans-BoldItalic.ttf',
]
def font(size):
    for path in FONTS:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()

def center(text, ft, y, fill):
    bounds = d.textbbox((0, 0), text, font=ft)
    d.text(((S - (bounds[2] - bounds[0])) / 2, y - bounds[1]),
           text, font=ft, fill=fill)

center('DHL', font(174), 165, (255, 255, 255, 255))
d.polygon(((75, 363), (383, 363), (448, 338), (422, 381), (91, 386)),
          fill=(247, 53, 69, 255))
d.rounded_rectangle((108, 409, 404, 466), radius=20, fill=(218, 23, 46, 255))
center('SPORTS', font(53), 403, (255, 255, 255, 255))

for size in (16, 32, 48, 128, 192, 512):
    im.resize((size, size), Image.Resampling.LANCZOS).save(
        TARGET / f'icon{size}.png', optimize=True)
for size in (192, 512):
    # The central safe area must be preserved when Android masks an app icon.
    maskable = Image.new('RGBA', (size, size), (5, 20, 50, 255))
    inner = round(size * 0.75)
    foreground = im.resize((inner, inner), Image.Resampling.LANCZOS)
    maskable.alpha_composite(foreground, ((size-inner)//2, (size-inner)//2))
    maskable.save(TARGET / f'icon{size}-maskable.png', optimize=True)
print('Generated Chrome (16/32/48/128) and Android PWA (192/512 + maskable) icons.')
