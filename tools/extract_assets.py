"""Slice Phaser hash atlases from the Dawnbound project into individual PNGs.

Usage: python tools/extract_assets.py [source_root]
Outputs:
  public/assets/icons/<name>.png       (AI-generated, committable)
  public/assets/gen/...                (bosses, portraits, art, brand, ui copied as-is)
  public/assets/pack/battlers|monsters|heroes/...  (paid pack, gitignored)
  tools/.cache/sheets/*.png            contact sheets for visual review
"""
import json
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("E:/Roguelike Opus 55")
OUT = ROOT / "public" / "assets"
SHEETS = ROOT / "tools" / ".cache" / "sheets"


def slice_atlas(png: Path, js: Path):
    img = Image.open(png).convert("RGBA")
    data = json.loads(js.read_text(encoding="utf-8"))
    for name, fr in data["frames"].items():
        f, s, ss = fr["frame"], fr["sourceSize"], fr["spriteSourceSize"]
        crop = img.crop((f["x"], f["y"], f["x"] + f["w"], f["y"] + f["h"]))
        full = Image.new("RGBA", (s["w"], s["h"]), (0, 0, 0, 0))
        full.paste(crop, (ss["x"], ss["y"]))
        yield name, full


def save_all(png, js, dest: Path, keep=lambda n: True, rename=lambda n: n):
    dest.mkdir(parents=True, exist_ok=True)
    out = []
    for name, im in slice_atlas(png, js):
        if not keep(name):
            continue
        fn = rename(name).replace("/", "_") + ".png"
        im.save(dest / fn)
        out.append((fn, im))
    return out


def contact_sheet(items, path: Path, cell=(96, 96), cols=16, bg=(30, 28, 44, 255)):
    SHEETS.mkdir(parents=True, exist_ok=True)
    rows = (len(items) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * cell[0], rows * (cell[1] + 10)), bg)
    d = ImageDraw.Draw(sheet)
    for i, (fn, im) in enumerate(items):
        x, y = (i % cols) * cell[0], (i // cols) * (cell[1] + 10)
        t = im.copy()
        t.thumbnail((cell[0] - 4, cell[1] - 4), Image.NEAREST)
        sheet.alpha_composite(t, (x + (cell[0] - t.width) // 2, y + (cell[1] - t.height) // 2))
        d.text((x + 2, y + cell[1] - 2), str(i), fill=(255, 255, 255, 255))
    sheet.save(path)


def main():
    pub = SRC / "public" / "assets"
    # icons (381)
    icons = save_all(pub / "gen" / "icons.png", pub / "gen" / "icons.json", OUT / "icons",
                     rename=lambda n: n.removeprefix("icons_"))
    (OUT / "icons.index.json").write_text(json.dumps([f[:-4] for f, _ in icons]), encoding="utf-8")
    print("icons", len(icons))
    # battlers (front-facing, 85x128)
    bat = save_all(pub / "pack" / "battlers.png", pub / "pack" / "battlers.json", OUT / "pack" / "battlers",
                   rename=lambda n: n.removeprefix("b/"))
    (SHEETS).mkdir(parents=True, exist_ok=True)
    contact_sheet(bat, SHEETS / "battlers.png", cell=(100, 140), cols=10)
    (OUT / "pack" / "battlers.index.json").write_text(json.dumps([f[:-4] for f, _ in bat]), encoding="utf-8")
    print("battlers", len(bat))
    # monsters: one idle frame facing down
    mon = save_all(pub / "pack" / "monsters.png", pub / "pack" / "monsters.json", OUT / "pack" / "monsters",
                   keep=lambda n: n.endswith("/down/1"), rename=lambda n: n.removesuffix("/down/1"))
    contact_sheet(mon, SHEETS / "monsters.png", cell=(72, 72), cols=18)
    (OUT / "pack" / "monsters.index.json").write_text(json.dumps([f[:-4] for f, _ in mon]), encoding="utf-8")
    print("monsters", len(mon))
    # heroes: list animation names
    hj = json.loads((pub / "pack" / "heroes.json").read_text(encoding="utf-8"))["frames"]
    anims = sorted({"/".join(k.split("/")[:2]) for k in hj})
    print("hero anims", len(anims), anims[:40])
    # copy generated art as-is
    for sub in ("bosses", "portraits", "art", "brand", "ui"):
        s = SRC / "src" / "assets" / "gen" / sub
        if s.exists():
            shutil.copytree(s, OUT / "gen" / sub, dirs_exist_ok=True)
    print("copied gen art")


if __name__ == "__main__":
    main()
