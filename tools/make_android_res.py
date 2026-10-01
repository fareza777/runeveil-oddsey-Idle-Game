"""Build Android launcher icons and splash images from the generated Runeveil art (nearest-neighbour to keep pixels crisp)."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
RES = ROOT / "android/app/src/main/res"
ICON = Image.open(ROOT / "public/assets/gen/brand/rv_icon.png").convert("RGBA")
FG = Image.open(ROOT / "public/assets/gen/brand/rv_icon_fg.png").convert("RGBA")
TITLE = Image.open(ROOT / "public/assets/gen/art/rv_title.png").convert("RGB")
BG = (11, 22, 38, 255)

LEGACY = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
SPLASH = {"mdpi": (320, 480), "hdpi": (480, 800), "xhdpi": (720, 1280), "xxhdpi": (960, 1600), "xxxhdpi": (1280, 1920)}


def scale(im: Image.Image, w: int, h: int) -> Image.Image:
    return im.resize((w, h), Image.NEAREST)


def cover(im: Image.Image, w: int, h: int) -> Image.Image:
    k = max(w / im.width, h / im.height)
    big = im.resize((round(im.width * k), round(im.height * k)), Image.NEAREST)
    x, y = (big.width - w) // 2, (big.height - h) // 2
    return big.crop((x, y, x + w, y + h))


for dens, px in LEGACY.items():
    d = RES / f"mipmap-{dens}"
    sq = scale(ICON, px, px)
    sq.save(d / "ic_launcher.png")
    mask = Image.new("L", (px * 4, px * 4), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, px * 4 - 1, px * 4 - 1), fill=255)
    mask = mask.resize((px, px), Image.LANCZOS)
    rd = Image.new("RGBA", (px, px), (0, 0, 0, 0))
    rd.paste(sq, (0, 0), mask)
    rd.save(d / "ic_launcher_round.png")
    full = round(px * 108 / 48)
    canvas = Image.new("RGBA", (full, full), (0, 0, 0, 0))
    inner = round(full * 0.62)
    canvas.paste(scale(FG, inner, inner), ((full - inner) // 2, (full - inner) // 2))
    canvas.save(d / "ic_launcher_foreground.png")

for dens, (w, h) in SPLASH.items():
    cover(TITLE, w, h).save(RES / f"drawable-port-{dens}" / "splash.png")
    cover(TITLE, h, w).save(RES / f"drawable-land-{dens}" / "splash.png")
cover(TITLE, 480, 800).save(RES / "drawable" / "splash.png")
print("android resources written")
