/** Procedural 32x32 pixel icons so every item has art without a bespoke sprite. */

type RGB = [number, number, number];
const N = 32;

const hex = (c: string): RGB => {
  const h = c.replace('#', '');
  const v = h.length === 3 ? h.split('').map((x) => x + x).join('') : h;
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
};
const shade = (c: RGB, f: number): RGB => [Math.max(0, Math.min(255, c[0] * f)), Math.max(0, Math.min(255, c[1] * f)), Math.max(0, Math.min(255, c[2] * f))];
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

class Pix {
  d: (RGB | null)[] = new Array(N * N).fill(null);
  lit: boolean[] = new Array(N * N).fill(true);
  set(x: number, y: number, c: RGB, shaded = true) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= N || y >= N) return;
    this.d[y * N + x] = c;
    this.lit[y * N + x] = shaded;
  }
  rect(x: number, y: number, w: number, h: number, c: RGB, shaded = true) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c, shaded);
  }
  ellipse(cx: number, cy: number, rx: number, ry: number, c: RGB, shaded = true) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x - cx) / rx, dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, c, shaded);
      }
    }
  }
  poly(pts: [number, number][], c: RGB, shaded = true) {
    const ys = pts.map((p) => p[1]);
    const y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
    for (let y = y0; y <= y1; y++) {
      const xs: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) xs.push(a[0] + ((y - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
      }
      xs.sort((p, q) => p - q);
      for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.round(xs[i]); x <= Math.round(xs[i + 1]); x++) this.set(x, y, c, shaded);
    }
  }
  line(x0: number, y0: number, x1: number, y1: number, c: RGB, w = 1, shaded = true) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 + 1;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
      for (let a = 0; a < w; a++) for (let b = 0; b < w; b++) this.set(x + a - (w - 1) / 2, y + b - (w - 1) / 2, c, shaded);
    }
  }
  /** top-left light, bottom-right shadow on lit pixels, then a dark outline */
  finish(): HTMLCanvasElement {
    const cv = document.createElement('canvas');
    cv.width = N; cv.height = N;
    const ctx = cv.getContext('2d')!;
    const img = ctx.createImageData(N, N);
    let minS = 99, maxS = 0;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (this.d[y * N + x]) { minS = Math.min(minS, x + y); maxS = Math.max(maxS, x + y); }
    const span = Math.max(1, maxS - minS);
    const outline: RGB = [22, 16, 32];
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const i = y * N + x;
        let c = this.d[i];
        if (c && this.lit[i]) c = shade(c, 1.22 - 0.5 * ((x + y - minS) / span));
        if (!c) {
          const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
            const nx = x + dx, ny = y + dy;
            return nx >= 0 && ny >= 0 && nx < N && ny < N && this.d[ny * N + nx];
          });
          if (nb) c = outline;
        }
        if (c) {
          const o = i * 4;
          img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
    return cv;
  }
}

type Painter = (p: Pix, c: RGB) => void;

const ROCK: RGB = [104, 100, 118];

const PAINTERS: Record<string, Painter> = {
  ore(p, c) {
    p.poly([[5, 24], [4, 17], [8, 10], [15, 7], [22, 9], [27, 15], [28, 23], [22, 27], [11, 27]], ROCK);
    p.ellipse(11, 15, 3, 2.5, c); p.ellipse(20, 12, 2.5, 2, c); p.ellipse(21, 21, 3.5, 2.5, c); p.ellipse(10, 22, 2, 1.5, c);
    p.set(10, 14, shade(c, 1.5), false); p.set(20, 11, shade(c, 1.5), false);
  },
  bar(p, c) {
    p.poly([[4, 14], [10, 8], [27, 8], [22, 14]], shade(c, 1.25));
    p.poly([[4, 14], [22, 14], [22, 24], [4, 24]], c);
    p.poly([[22, 14], [27, 8], [27, 18], [22, 24]], shade(c, 0.7));
    p.line(6, 16, 20, 16, shade(c, 1.45), 1, false);
  },
  log(p, c) {
    p.rect(4, 10, 20, 13, c);
    p.line(5, 14, 22, 14, shade(c, 0.78), 1, false); p.line(5, 19, 22, 19, shade(c, 0.78), 1, false);
    p.ellipse(24, 16.5, 4, 6.5, shade(c, 1.35));
    p.ellipse(24, 16.5, 2.5, 4.5, shade(c, 1.1)); p.ellipse(24, 16.5, 1, 2, shade(c, 0.8));
  },
  plank(p, c) {
    for (let i = 0; i < 3; i++) {
      const y = 7 + i * 7;
      p.rect(4 + (i % 2) * 2, y, 22, 6, shade(c, 1 - i * 0.07));
      p.line(6 + (i % 2) * 2, y + 2, 24, y + 2, shade(c, 0.8), 1, false);
      p.set(8 + i * 5, y + 4, shade(c, 0.65), false);
    }
  },
  hide(p, c) {
    p.poly([[7, 7], [14, 9], [18, 7], [25, 8], [27, 15], [24, 20], [27, 26], [19, 24], [14, 27], [10, 23], [5, 22], [8, 15]], c);
    p.line(10, 12, 22, 20, shade(c, 0.8), 1, false); p.line(22, 12, 12, 21, shade(c, 1.2), 1, false);
  },
  leather(p, c) {
    p.poly([[5, 8], [26, 8], [27, 24], [6, 25]], c);
    p.poly([[5, 8], [26, 8], [24, 12], [7, 12]], shade(c, 1.25));
    for (let x = 9; x < 25; x += 3) p.set(x, 18, shade(c, 0.6), false);
    p.line(8, 22, 25, 22, shade(c, 0.75), 1, false);
  },
  gemrough(p, c) {
    p.poly([[5, 26], [6, 17], [11, 12], [17, 14], [24, 11], [28, 18], [26, 26]], ROCK);
    p.poly([[13, 22], [15, 10], [19, 6], [22, 12], [21, 22]], shade(c, 0.9));
    p.poly([[15, 10], [19, 6], [17, 16]], shade(c, 1.4), false);
  },
  gem(p, c) {
    p.poly([[10, 7], [22, 7], [28, 14], [16, 28], [4, 14]], c);
    p.poly([[10, 7], [22, 7], [20, 14], [12, 14]], shade(c, 1.45), false);
    p.poly([[4, 14], [12, 14], [16, 28]], shade(c, 0.85), false);
    p.poly([[28, 14], [20, 14], [16, 28]], shade(c, 0.6), false);
    p.set(12, 9, [255, 255, 255], false); p.set(13, 9, [255, 255, 255], false);
  },
  fish(p, c) {
    p.poly([[22, 16], [29, 9], [28, 16], [29, 23]], shade(c, 0.8));
    p.ellipse(14, 16, 10, 6, c);
    p.ellipse(14, 18, 8, 3, shade(c, 1.35), false);
    p.poly([[11, 11], [15, 6], [18, 11]], shade(c, 0.75));
    p.set(7, 14, [255, 255, 255], false); p.set(7, 15, [20, 20, 30], false);
    p.line(18, 12, 18, 20, shade(c, 0.7), 1, false);
  },
  herb(p, c) {
    p.line(16, 28, 16, 12, [70, 130, 70], 2);
    p.ellipse(10, 20, 5, 2.5, [80, 160, 80]); p.ellipse(22, 17, 5, 2.5, [90, 170, 90]); p.ellipse(11, 14, 4, 2, [70, 150, 80]);
    p.ellipse(16, 8, 4, 4, c); p.ellipse(16, 8, 1.5, 1.5, [255, 230, 120], false);
  },
  crop(p, c) {
    p.ellipse(16, 18, 9, 8, c);
    p.ellipse(13, 15, 3, 2.5, shade(c, 1.4), false);
    p.line(16, 10, 16, 6, [80, 140, 60], 2);
    p.ellipse(12, 6, 4, 2, [90, 170, 70]); p.ellipse(20, 6, 4, 2, [70, 150, 60]);
  },
  dish(p, c) {
    p.ellipse(16, 22, 13, 5, [225, 225, 235]);
    p.ellipse(16, 21, 10, 3.5, [190, 190, 205], false);
    p.ellipse(16, 17, 8, 6, c);
    p.ellipse(13, 14, 3, 2, shade(c, 1.4), false);
    p.set(19, 15, [255, 255, 255], false); p.set(11, 18, shade(c, 0.7), false);
  },
  relic(p, c) {
    p.poly([[8, 28], [8, 12], [12, 5], [20, 5], [24, 12], [24, 28]], mix(ROCK, c, 0.45));
    p.rect(12, 12, 8, 2, shade(c, 1.4), false); p.rect(15, 15, 2, 8, shade(c, 1.4), false); p.rect(12, 18, 3, 2, shade(c, 1.2), false);
  },
  essence(p, c) {
    p.ellipse(16, 17, 10, 10, shade(c, 0.5));
    p.ellipse(16, 17, 8, 8, c);
    p.ellipse(16, 17, 4, 4, shade(c, 1.6), false);
    p.set(12, 12, [255, 255, 255], false); p.set(13, 12, [255, 255, 255], false);
  },
  rune(p, c) {
    p.poly([[6, 26], [5, 8], [10, 4], [22, 4], [27, 8], [26, 26], [20, 28], [11, 28]], [70, 68, 86]);
    p.line(16, 8, 16, 24, c, 2, false); p.line(16, 12, 22, 8, c, 1, false); p.line(16, 18, 10, 14, c, 1, false); p.line(16, 22, 21, 19, c, 1, false);
  },
  scroll(p, c) {
    p.rect(7, 8, 18, 17, [226, 208, 168]);
    p.ellipse(7, 16.5, 2, 9, [196, 170, 120]); p.ellipse(25, 16.5, 2, 9, [196, 170, 120]);
    for (let y = 12; y < 22; y += 3) p.line(10, y, 22, y, [150, 120, 80], 1, false);
    p.rect(14, 8, 4, 17, c, false);
    p.ellipse(16, 17, 3, 3, shade(c, 1.2), false);
  },
  bow(p, c) {
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const x = 9 + Math.sin(t * Math.PI) * 13, y = 4 + t * 24;
      p.set(x, y, c); p.set(x + 1, y, c);
    }
    p.line(9, 4, 9, 28, [225, 220, 205], 1, false);
    p.line(9, 16, 24, 16, [180, 150, 100], 1, false);
    p.poly([[24, 14], [28, 16], [24, 18]], [210, 210, 225]);
  },
  shield(p, c) {
    p.poly([[5, 6], [16, 3], [27, 6], [26, 17], [16, 29], [6, 17]], c);
    p.poly([[16, 3], [27, 6], [26, 17], [16, 29]], shade(c, 0.78));
    p.ellipse(16, 14, 4, 4, shade(c, 1.4), false);
    p.line(8, 8, 24, 8, shade(c, 1.35), 1, false);
  },
  orb(p, c) {
    p.poly([[9, 28], [12, 23], [20, 23], [23, 28]], [90, 80, 100]);
    p.ellipse(16, 14, 10, 10, shade(c, 0.6));
    p.ellipse(16, 14, 8, 8, c);
    p.ellipse(13, 11, 3, 3, shade(c, 1.7), false);
    p.set(12, 10, [255, 255, 255], false);
  },
  legs(p, c) {
    p.rect(7, 5, 18, 5, shade(c, 1.2));
    p.poly([[7, 10], [16, 10], [15, 28], [7, 28]], c);
    p.poly([[16, 10], [25, 10], [25, 28], [17, 28]], shade(c, 0.85));
    p.rect(7, 22, 8, 2, shade(c, 1.35), false); p.rect(17, 22, 8, 2, shade(c, 1.25), false);
    p.rect(14, 5, 4, 5, [230, 200, 90], false);
  },
  gloves(p, c) {
    p.rect(8, 22, 14, 6, shade(c, 0.8));
    p.rect(8, 11, 14, 11, c);
    for (let i = 0; i < 4; i++) p.rect(8 + i * 4, 5, 3, 7, shade(c, 1.1));
    p.rect(21, 14, 5, 3, shade(c, 1.15));
    p.line(9, 14, 21, 14, shade(c, 0.7), 1, false);
  },
};

const cache = new Map<string, string>();

export function genIconUrl(kind: string, color: string): string {
  const key = `${kind}|${color}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const p = new Pix();
  (PAINTERS[kind] ?? PAINTERS.relic)(p, hex(color.startsWith('#') ? color : '#9a9ab0'));
  const url = p.finish().toDataURL('image/png');
  cache.set(key, url);
  return url;
}

export const hasPainter = (k: string) => k in PAINTERS;
