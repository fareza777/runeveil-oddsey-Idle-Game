/** Small pixel-art props and tools drawn in code, used when no painted sprite exists. All sprites are 64x64, grounded at the bottom edge. */

type Ctx = CanvasRenderingContext2D;
const OUT = '#1a1226';

const R = (c: Ctx, col: string, x: number, y: number, w: number, h: number) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
const P = (c: Ctx, col: string, pts: number[][], stroke = true) => {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fillStyle = col; c.fill();
  if (stroke) { c.strokeStyle = OUT; c.lineWidth = 1; c.stroke(); }
};
const E = (c: Ctx, col: string, x: number, y: number, rx: number, ry: number, stroke = true) => {
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = col; c.fill();
  if (stroke) { c.strokeStyle = OUT; c.lineWidth = 1; c.stroke(); }
};
const L = (c: Ctx, col: string, x1: number, y1: number, x2: number, y2: number, w = 2) => {
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'butt'; c.stroke();
};

const fire = (c: Ctx, x: number, y: number) => {
  R(c, '#5a3418', x - 10, y, 20, 3); R(c, '#7a4a22', x - 8, y - 2, 16, 3);
  P(c, '#ff6a1a', [[x - 7, y], [x - 3, y - 12], [x, y - 6], [x + 3, y - 14], [x + 7, y]], false);
  P(c, '#ffc83a', [[x - 4, y], [x - 1, y - 8], [x + 1, y - 5], [x + 4, y]], false);
};

const PROPS: Record<string, (c: Ctx) => void> = {
  tree(c) {
    R(c, '#5a3a22', 28, 40, 8, 23); R(c, '#7a5232', 28, 40, 3, 23); R(c, OUT, 27, 40, 1, 23); R(c, OUT, 36, 40, 1, 23);
    const tiers: [number, number, number][] = [[44, 30, 0], [32, 25, 0], [20, 19, 0], [9, 13, 0]];
    tiers.forEach(([y, hw], i) => {
      P(c, i % 2 ? '#2f7a45' : '#24663a', [[32 - hw, y + 8], [32, y - 12], [32 + hw, y + 8]]);
      P(c, '#3f9a58', [[32 - hw * 0.5, y + 4], [32, y - 10], [32, y + 6]], false);
    });
  },
  rock(c) {
    P(c, '#6c6a7c', [[6, 62], [10, 34], [22, 20], [40, 16], [54, 30], [58, 62]]);
    P(c, '#8b8a9c', [[12, 40], [22, 24], [38, 20], [30, 34], [18, 50]], false);
    P(c, '#4c4a5a', [[40, 62], [48, 36], [56, 34], [58, 62]], false);
    R(c, '#e08a3a', 26, 38, 5, 4); R(c, '#ffc27a', 27, 38, 2, 2); R(c, '#e08a3a', 40, 46, 4, 4); R(c, '#ffc27a', 41, 46, 2, 2);
    R(c, '#c8e0f0', 19, 30, 3, 3);
  },
  anvil(c) {
    R(c, '#5a3a22', 22, 44, 20, 18); R(c, '#7a5232', 22, 44, 5, 18); R(c, OUT, 21, 44, 1, 18); R(c, OUT, 42, 44, 1, 18);
    P(c, '#4a4a5c', [[10, 28], [54, 28], [56, 32], [46, 36], [42, 44], [22, 44], [20, 36], [10, 33]]);
    R(c, '#7a7a90', 12, 28, 40, 3); R(c, '#9a9ab0', 14, 28, 16, 1);
    P(c, '#4a4a5c', [[52, 28], [62, 31], [54, 33]]);
  },
  cauldron(c) {
    fire(c, 32, 62); fire(c, 20, 62); fire(c, 44, 62);
    E(c, '#2a2a36', 32, 40, 24, 18);
    R(c, '#2a2a36', 8, 34, 48, 12);
    E(c, '#3a3a4a', 32, 30, 24, 7);
    E(c, '#4cff8c', 32, 30, 20, 5, false); E(c, '#9affc0', 28, 29, 8, 2, false);
    R(c, '#4a4a5c', 12, 36, 5, 14); R(c, '#4a4a5c', 47, 36, 5, 14);
    R(c, '#8affb0', 24, 22, 3, 3); R(c, '#8affb0', 38, 18, 2, 2);
  },
  cookpot(c) {
    L(c, '#5a3a22', 14, 8, 14, 62, 3); L(c, '#5a3a22', 50, 8, 50, 62, 3); L(c, '#5a3a22', 14, 10, 50, 10, 3); L(c, '#2a2a36', 32, 10, 32, 24, 2);
    fire(c, 32, 62);
    E(c, '#3a3a4a', 32, 38, 15, 14);
    R(c, '#3a3a4a', 16, 26, 32, 8);
    E(c, '#7a4a2a', 32, 26, 16, 4);
    E(c, '#c87a3a', 32, 26, 13, 3, false);
    R(c, '#8a8aa0', 18, 28, 4, 12);
  },
  wheat(c) {
    R(c, '#4a3a22', 2, 56, 60, 8);
    for (let i = 0; i < 11; i++) {
      const x = 5 + i * 5.4; const hh = 30 + ((i * 7) % 5) * 3;
      L(c, '#8a7a2a', x, 60, x + Math.sin(i) * 2, 60 - hh, 1.5);
      E(c, i % 2 ? '#f0c040' : '#e0a82a', x + Math.sin(i) * 2, 60 - hh - 3, 2.2, 5, false);
    }
  },
  herbs(c) {
    R(c, '#3a4a22', 2, 56, 60, 8);
    for (let i = 0; i < 9; i++) {
      const x = 6 + i * 6.5; const hh = 18 + ((i * 5) % 4) * 5;
      L(c, '#2f8a3a', x, 60, x + Math.cos(i) * 3, 60 - hh, 2);
      P(c, '#4cc060', [[x, 60 - hh * 0.6], [x - 7, 60 - hh * 0.8], [x, 60 - hh * 0.4]], false);
      P(c, '#3aa050', [[x, 60 - hh * 0.5], [x + 7, 60 - hh * 0.7], [x, 60 - hh * 0.3]], false);
      E(c, ['#e86aa8', '#8a8aff', '#ffe05a'][i % 3], x + Math.cos(i) * 3, 60 - hh - 2, 3, 3, false);
    }
  },
  dummy(c) {
    R(c, '#5a3a22', 29, 20, 6, 42); R(c, '#7a5232', 29, 20, 2, 42);
    R(c, '#5a3a22', 14, 56, 36, 6);
    R(c, '#5a3a22', 14, 28, 36, 5); R(c, '#7a5232', 14, 28, 36, 2);
    E(c, '#d8b070', 32, 36, 12, 15); E(c, '#e8c88a', 28, 32, 5, 7, false);
    L(c, '#8a5a2a', 22, 30, 42, 44, 1.5); L(c, '#8a5a2a', 42, 30, 22, 44, 1.5);
    E(c, '#d8b070', 32, 14, 8, 8); R(c, '#c04040', 24, 11, 16, 3);
  },
  target(c) {
    L(c, '#5a3a22', 20, 62, 32, 36, 4); L(c, '#5a3a22', 44, 62, 32, 36, 4);
    E(c, '#6a4a2a', 32, 30, 25, 25);
    E(c, '#f4eee0', 32, 30, 22, 22, false); E(c, '#d83a3a', 32, 30, 17, 17, false); E(c, '#f4eee0', 32, 30, 12, 12, false); E(c, '#d83a3a', 32, 30, 7, 7, false); E(c, '#f0c040', 32, 30, 3, 3, false);
    L(c, '#8a5a2a', 36, 24, 46, 14, 1.5); R(c, '#e8e0d0', 45, 12, 4, 3);
  },
  workbench(c) {
    R(c, '#5a3a22', 8, 34, 6, 28); R(c, '#5a3a22', 50, 34, 6, 28); R(c, OUT, 8, 34, 1, 28); R(c, OUT, 55, 34, 1, 28);
    R(c, '#8a5a32', 4, 28, 56, 8); R(c, '#b07a48', 4, 28, 56, 3); R(c, OUT, 4, 36, 56, 1);
    R(c, '#7a5232', 14, 44, 36, 4);
    R(c, '#d8b070', 10, 18, 22, 4); R(c, '#e8c88a', 10, 18, 22, 1); R(c, '#c89850', 16, 22, 24, 4);
    R(c, '#6a6a80', 44, 14, 4, 14); R(c, '#9a9ab0', 42, 12, 8, 3);
  },
  rack(c) {
    R(c, '#5a3a22', 6, 12, 5, 50); R(c, '#5a3a22', 53, 12, 5, 50); R(c, '#5a3a22', 4, 12, 56, 4); R(c, '#7a5232', 4, 12, 56, 1);
    P(c, '#b0703a', [[14, 16], [30, 16], [32, 40], [28, 52], [22, 46], [16, 52], [12, 38]]);
    P(c, '#8a5428', [[34, 16], [50, 16], [52, 36], [46, 48], [40, 44], [35, 50]]);
    R(c, '#c88a50', 16, 18, 4, 14);
    R(c, '#5a3a22', 8, 56, 48, 6);
  },
  gembench(c) {
    R(c, '#3a3050', 8, 36, 48, 6); R(c, '#5a4a80', 8, 36, 48, 2); R(c, '#3a3050', 12, 42, 6, 20); R(c, '#3a3050', 46, 42, 6, 20);
    R(c, '#2a2a36', 28, 20, 3, 16); R(c, '#2a2a36', 22, 18, 12, 3);
    E(c, '#8ae0ff', 22, 24, 5, 4, false); R(c, 'rgba(138,224,255,0.25)', 8, 18, 32, 18);
    P(c, '#ff4a6a', [[16, 36], [20, 28], [24, 36]]);
    P(c, '#4aa0ff', [[26, 36], [30, 26], [35, 36]]);
    P(c, '#5aff9a', [[38, 36], [42, 29], [46, 36]]);
    R(c, '#ffffff', 19, 31, 1, 1); R(c, '#ffffff', 29, 29, 1, 1); R(c, '#ffffff', 41, 32, 1, 1);
  },
  runestone(c) {
    P(c, '#5e5c70', [[14, 62], [12, 26], [22, 6], [42, 4], [52, 24], [50, 62]]);
    P(c, '#7b798e', [[18, 56], [17, 28], [24, 10], [34, 8], [30, 30]], false);
    const g = '#46ffd0';
    c.fillStyle = g;
    R(c, g, 30, 18, 3, 24); R(c, g, 24, 24, 6, 3); R(c, g, 33, 32, 7, 3); R(c, g, 26, 40, 5, 3);
    R(c, 'rgba(70,255,208,0.25)', 22, 14, 22, 34);
  },
  dirtpit(c) {
    E(c, '#5a3a22', 32, 52, 28, 9); E(c, '#2a1a10', 32, 52, 18, 5, false);
    P(c, '#7a5232', [[4, 58], [14, 44], [24, 48], [30, 58]], false);
    P(c, '#8a6240', [[40, 58], [48, 42], [60, 52], [62, 58]], false);
    R(c, '#c0a070', 26, 48, 4, 3); R(c, '#e8e0d0', 40, 50, 3, 2);
  },
  deer(c) {
    R(c, '#6a4424', 22, 40, 4, 22); R(c, '#6a4424', 30, 40, 4, 22); R(c, '#6a4424', 42, 40, 4, 22); R(c, '#6a4424', 48, 40, 4, 22);
    E(c, '#a8703a', 36, 36, 18, 9);
    E(c, '#d8b088', 36, 41, 12, 4, false);
    P(c, '#a8703a', [[20, 34], [14, 18], [22, 12], [28, 30]]);
    E(c, '#a8703a', 17, 14, 6, 5);
    L(c, '#d8d0b0', 15, 10, 10, 2, 1.5); L(c, '#d8d0b0', 19, 9, 22, 1, 1.5); L(c, '#d8d0b0', 15, 10, 13, 5, 1.5);
    R(c, OUT, 13, 14, 2, 2);
    R(c, '#f4eee0', 54, 33, 4, 4);
  },
  cart(c) {
    R(c, '#c83a3a', 6, 8, 52, 8); R(c, '#f4eee0', 14, 8, 8, 8); R(c, '#f4eee0', 30, 8, 8, 8); R(c, '#f4eee0', 46, 8, 8, 8);
    P(c, '#c83a3a', [[4, 16], [60, 16], [56, 22], [8, 22]]);
    R(c, '#5a3a22', 8, 16, 4, 46); R(c, '#5a3a22', 52, 16, 4, 46);
    R(c, '#8a5a32', 8, 36, 48, 18); R(c, '#b07a48', 8, 36, 48, 3); R(c, OUT, 8, 54, 48, 1);
    E(c, '#f0c040', 18, 32, 4, 4); E(c, '#d83a3a', 28, 32, 4, 4); E(c, '#4aa0ff', 38, 32, 4, 4); E(c, '#5aff9a', 48, 32, 4, 4);
    E(c, '#5a3a22', 14, 58, 7, 5); E(c, '#5a3a22', 50, 58, 7, 5);
    R(c, '#3a2a18', 12, 56, 4, 4);
  },

  fish(c) {
    P(c, '#3a7ad0', [[6, 32], [18, 22], [38, 20], [52, 30], [60, 22], [58, 42], [52, 34], [38, 44], [18, 42]]);
    P(c, '#8ac0ff', [[14, 34], [22, 28], [40, 26], [48, 31], [38, 35], [20, 38]], false);
    E(c, '#fff', 15, 30, 2.5, 2.5, false); R(c, OUT, 14, 30, 2, 2);
    L(c, '#2a5aa0', 28, 24, 30, 36, 1);
  },

  // ---- tools: handle grip at bottom-left, working end at top-right ----
  tool_awl(c) {
    L(c, OUT, 6, 62, 30, 38, 7); L(c, '#8a5a2a', 6, 62, 28, 40, 5); L(c, '#b07a48', 6, 62, 28, 40, 1.5);
    L(c, OUT, 30, 38, 58, 8, 4); L(c, '#b8b8d0', 30, 38, 58, 8, 2); L(c, '#e8e8f8', 30, 38, 58, 8, 0.8);
  },
  tool_chisel(c) {
    L(c, OUT, 6, 62, 26, 42, 8); L(c, '#8a5a2a', 6, 62, 26, 42, 6); L(c, '#c89850', 6, 62, 26, 42, 1.5);
    P(c, '#9a9ab0', [[24, 44], [30, 38], [58, 8], [60, 12], [34, 46], [28, 48]]);
    P(c, '#e8e8f8', [[30, 38], [58, 8], [59, 10], [32, 41]], false);
  },
  tool_ladle(c) {
    L(c, OUT, 6, 62, 40, 24, 5); L(c, '#8a5a2a', 6, 62, 40, 24, 3); L(c, '#b07a48', 6, 62, 40, 24, 1);
    E(c, '#8a8aa0', 50, 16, 11, 9); E(c, '#c87a3a', 50, 14, 8, 5, false); E(c, '#b8b8d0', 46, 12, 4, 2, false);
  },
  tool_flask(c) {
    R(c, '#dcd0b0', 28, 6, 8, 6); R(c, OUT, 27, 5, 10, 1);
    R(c, 'rgba(190,230,255,0.6)', 29, 12, 6, 12);
    P(c, 'rgba(190,230,255,0.55)', [[29, 24], [35, 24], [50, 50], [50, 58], [44, 62], [20, 62], [14, 58], [14, 50]]);
    P(c, '#5cff9a', [[22, 42], [42, 42], [49, 52], [49, 58], [44, 61], [20, 61], [15, 58], [15, 52]], false);
    R(c, '#c8ffe0', 22, 46, 4, 8); E(c, '#c8ffe0', 38, 36, 2, 2, false); E(c, '#c8ffe0', 30, 30, 1.5, 1.5, false);
  },
  tool_quill(c) {
    P(c, '#e8f0ff', [[8, 62], [20, 40], [44, 8], [58, 2], [54, 20], [34, 44], [16, 58]]);
    P(c, '#9ac0ff', [[44, 8], [58, 2], [54, 20], [46, 22]], false);
    L(c, '#4a5a80', 8, 62, 52, 6, 1.5);
    P(c, '#2a2a40', [[4, 64], [8, 62], [10, 58]], false);
  },
  tool_spyglass(c) {
    L(c, OUT, 8, 56, 56, 14, 14); L(c, '#8a5a2a', 8, 56, 30, 36, 11); L(c, '#c89850', 8, 56, 30, 36, 2);
    L(c, '#b0884a', 30, 36, 48, 22, 9); L(c, '#e0b860', 30, 36, 48, 22, 2);
    L(c, '#5a5a70', 48, 22, 58, 14, 12); L(c, '#9a9ab0', 48, 22, 58, 14, 3);
    L(c, '#8ae0ff', 59, 13, 60, 12, 5);
  },
};

export const PROC_ART = new Set(Object.keys(PROPS));

const cache = new Map<string, HTMLCanvasElement>();
export function procArt(name: string): HTMLCanvasElement | null {
  let cv = cache.get(name);
  if (!cv) {
    const draw = PROPS[name];
    if (!draw) return null;
    cv = document.createElement('canvas');
    cv.width = 64; cv.height = 64;
    const c = cv.getContext('2d')!;
    c.imageSmoothingEnabled = false;
    draw(c);
    cache.set(name, cv);
  }
  return cv;
}
