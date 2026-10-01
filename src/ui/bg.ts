import type { Element, ZoneDef } from '@/core/types';
import { ZONE_SEEDS } from '@/data/zoneSeeds';
import { seeded } from '@/core/rng';

type RGB = [number, number, number];
const W = 130;
const H = 110;

const hex = (c: string): RGB => {
  const v = c.replace('#', '');
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
};
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const css = (c: RGB, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

const cache = new Map<number, string>();

export function zoneBgUrl(z: ZoneDef): string {
  const hit = cache.get(z.id);
  if (hit) return hit;
  const el: Element = ZONE_SEEDS[z.id - 1]?.element ?? 'nature';
  const rnd = seeded(`bg${z.id}`);
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d')!;
  const base = hex(z.color);
  const night: RGB = [10, 8, 24];
  const dark = z.id % 3 === 0 || el === 'shadow' || el === 'arcane';
  const top = mix(night, base, dark ? 0.16 : 0.28);
  const horizon = mix(night, base, dark ? 0.5 : 0.62);

  for (let y = 0; y < H; y++) {
    const t = y / (H * 0.7);
    g.fillStyle = css(mix(top, horizon, Math.min(1, t)));
    g.fillRect(0, y, W, 1);
  }

  // stars / motes
  const stars = el === 'frost' ? 14 : dark ? 40 : 10;
  for (let i = 0; i < stars; i++) {
    g.fillStyle = css([255, 255, 255], 0.3 + rnd() * 0.6);
    g.fillRect(Math.floor(rnd() * W), Math.floor(rnd() * H * 0.45), 1, 1);
  }

  // sun / moon
  const sx = 20 + rnd() * (W - 40);
  const sy = 12 + rnd() * 18;
  const sunCol: RGB = el === 'fire' ? [255, 150, 70] : el === 'holy' ? [255, 245, 190] : dark ? [220, 225, 255] : [255, 240, 200];
  g.fillStyle = css(sunCol, 0.18);
  g.beginPath(); g.arc(sx, sy, 15, 0, 7); g.fill();
  g.fillStyle = css(sunCol, 0.9);
  g.beginPath(); g.arc(sx, sy, 7, 0, 7); g.fill();
  if (dark && el !== 'holy') {
    g.fillStyle = css(top);
    g.beginPath(); g.arc(sx + 3, sy - 2, 6, 0, 7); g.fill();
  }

  // ridges
  const ridge = (baseY: number, amp: number, col: RGB, freq: number, jag: number) => {
    const ph = rnd() * 100;
    g.fillStyle = css(col);
    for (let x = 0; x < W; x++) {
      let n = Math.sin(x * freq + ph) * amp + Math.sin(x * freq * 2.3 + ph * 1.7) * amp * 0.45;
      if (jag) n = Math.abs(n) * 1.1 - amp * 0.4;
      const y = Math.round(baseY - n);
      g.fillRect(x, y, 1, H - y);
    }
  };
  ridge(62, 12, mix(horizon, top, 0.35), 0.05, el === 'physical' || el === 'frost' || el === 'shock' ? 1 : 0);
  ridge(72, 9, mix(horizon, night, 0.45), 0.075, el === 'fire' ? 1 : 0);
  ridge(82, 6, mix(base, night, 0.78), 0.11, 0);

  // feature layer
  const fcol = mix(base, night, 0.82);
  const feature = (x: number, y: number, s: number) => {
    g.fillStyle = css(fcol);
    switch (el) {
      case 'nature':
        g.fillRect(x, y - s * 2, 1, s * 2);
        g.beginPath(); g.arc(x, y - s * 2.3, s * 1.1, 0, 7); g.fill();
        break;
      case 'frost':
        for (let i = 0; i < s * 2; i++) g.fillRect(x - Math.floor(i / 2), y - s * 2 + i, 1 + Math.floor(i / 2) * 2, 1);
        break;
      case 'fire':
        g.fillStyle = css([255, 120 + rnd() * 80, 40], 0.9);
        g.fillRect(x, y - 1, 2, 1);
        g.fillStyle = css(fcol);
        g.fillRect(x - 1, y - s, 3, s);
        break;
      case 'shock':
      case 'holy':
        g.fillRect(x, y - s * 3, 2, s * 3);
        g.fillStyle = css(mix(base, [255, 255, 255], 0.6), 0.9);
        g.fillRect(x, y - s * 3, 2, 1);
        break;
      case 'arcane':
        g.fillStyle = css(mix(base, [255, 255, 255], 0.35), 0.85);
        g.beginPath(); g.moveTo(x, y - s * 3); g.lineTo(x + s, y - s); g.lineTo(x, y); g.lineTo(x - s, y - s); g.fill();
        break;
      case 'shadow':
        g.fillRect(x, y - s * 2, 1, s * 2);
        g.fillRect(x - s, y - s * 2, s * 2 + 1, 1);
        g.fillRect(x - 1, y - s * 3, 1, s);
        g.fillRect(x + 2, y - s * 2, 1, s);
        break;
      default:
        g.fillRect(x - s, y - s, s * 2 + 1, s);
        g.fillRect(x - s + 1, y - s * 2, s * 2 - 1, s);
    }
  };
  for (let i = 0; i < 16; i++) feature(Math.floor(rnd() * W), 80 + Math.floor(rnd() * 6), 2 + Math.floor(rnd() * 3));

  // ground
  const gTop = mix(base, night, 0.62);
  const gBot = mix(base, night, 0.82);
  for (let y = 84; y < H; y++) {
    g.fillStyle = css(mix(gTop, gBot, (y - 84) / (H - 84)));
    g.fillRect(0, y, W, 1);
  }
  g.fillStyle = css(mix(base, [255, 255, 255], 0.2), 0.35);
  g.fillRect(0, 84, W, 1);
  for (let i = 0; i < 90; i++) {
    g.fillStyle = css(mix(gTop, [255, 255, 255], 0.18), 0.5);
    g.fillRect(Math.floor(rnd() * W), 86 + Math.floor(rnd() * (H - 87)), 1 + Math.floor(rnd() * 3), 1);
  }

  // vignette
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(0,0,0,0.35)');
  grad.addColorStop(0.5, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.4)');
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);

  const url = cv.toDataURL('image/png');
  cache.set(z.id, url);
  return url;
}

