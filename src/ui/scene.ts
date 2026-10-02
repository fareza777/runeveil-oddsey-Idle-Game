import { asset } from './icons';
import { procArt } from './propArt';
import { h } from './dom';
import { host } from './host';
import { GATHER_MAP, HEROES, RECIPE_MAP, SKILL_MAP } from '@/data';
import { heroDef } from '@/core/state';
import type { SkillId } from '@/core/types';

const W = 384;
const H = 192;
const GROUND = 168;

type Mode = 'overhead' | 'stab' | 'saw' | 'rod' | 'tap' | 'stir' | 'pick' | 'bow' | 'cast' | 'walk' | 'coins' | 'block' | 'slash';
type Fx = 'chips' | 'sparks' | 'dust' | 'water' | 'bubble' | 'star' | 'steam' | 'coin' | 'glyph' | 'leaf' | 'ember' | 'shard';

interface Prop { img: string; x: number; h: number; react?: 'shake' | 'sway' | 'pulse' | 'none'; y?: number }
interface Cfg {
  mode: Mode;
  tool?: string;
  toolLen?: number;
  prop?: Prop;
  fx: Fx;
  period: number;
  ambient?: Fx;
  glow?: string;
  heroX?: number;
}

const P = (img: string, x: number, hh: number, react: Prop['react'] = 'shake', y = 0): Prop => ({ img: `proc:${img}`, x, h: hh, react, y });
/** Painted tool sprites exist for these; the rest are drawn in code. */
const PAINTED_TOOLS = new Set(['axe', 'pickaxe', 'rod', 'sickle', 'hoe', 'shovel', 'hammer', 'saw']);
const T = (n: string) => (PAINTED_TOOLS.has(n) ? `gen/scene_props/tool_${n}.png` : `proc:tool_${n}`);
const I = (n: string) => `gen/items/${n}.png`;

const CFG: Record<SkillId, Cfg> = {
  combat: { mode: 'slash', tool: I('eq_sword_4'), toolLen: 40, prop: P('dummy', 288, 88), fx: 'sparks', period: 0.9 },
  fortitude: { mode: 'block', tool: I('eq_shield_4'), toolLen: 38, fx: 'dust', period: 1.4, ambient: 'dust' },
  marksmanship: { mode: 'bow', tool: I('eq_bow_4'), toolLen: 40, prop: P('target', 316, 84, 'shake'), fx: 'dust', period: 1.5 },
  arcana: { mode: 'cast', tool: I('eq_staff_4'), toolLen: 46, fx: 'star', period: 1.8, ambient: 'glyph', glow: '#8a5cff' },
  mining: { mode: 'overhead', tool: T('pickaxe'), toolLen: 44, prop: P('rock', 276, 96), fx: 'shard', period: 1.0, ambient: 'dust' },
  woodcutting: { mode: 'overhead', tool: T('axe'), toolLen: 44, prop: P('tree', 280, 130, 'shake'), fx: 'chips', period: 1.0, ambient: 'leaf' },
  fishing: { mode: 'rod', tool: T('rod'), toolLen: 70, fx: 'water', period: 5.0, ambient: 'bubble' },
  herbalism: { mode: 'pick', tool: T('sickle'), toolLen: 34, prop: P('herbs', 270, 70, 'sway'), fx: 'leaf', period: 1.2, ambient: 'star' },
  farming: { mode: 'stab', tool: T('hoe'), toolLen: 48, prop: P('wheat', 276, 80, 'sway'), fx: 'dust', period: 1.2, ambient: 'leaf' },
  hunting: { mode: 'bow', tool: I('eq_bow_3'), toolLen: 40, prop: P('deer', 300, 76, 'none'), fx: 'dust', period: 1.7, ambient: 'leaf' },
  excavation: { mode: 'stab', tool: T('shovel'), toolLen: 50, prop: P('dirtpit', 270, 70, 'pulse'), fx: 'dust', period: 1.2, ambient: 'dust' },
  smithing: { mode: 'overhead', tool: T('hammer'), toolLen: 42, prop: P('anvil', 266, 72, 'pulse'), fx: 'sparks', period: 0.8, ambient: 'ember', glow: '#ff8a2a' },
  carpentry: { mode: 'saw', tool: T('saw'), toolLen: 44, prop: P('workbench', 270, 76, 'shake'), fx: 'chips', period: 0.7 },
  leatherworking: { mode: 'tap', tool: T('awl'), toolLen: 34, prop: P('rack', 270, 90, 'sway'), fx: 'dust', period: 0.6 },
  jewelcrafting: { mode: 'tap', tool: T('chisel'), toolLen: 32, prop: P('gembench', 272, 78, 'pulse'), fx: 'star', period: 0.7, ambient: 'star', glow: '#7fd8ff' },
  cooking: { mode: 'stir', tool: T('ladle'), toolLen: 48, prop: P('cookpot', 270, 90, 'none'), fx: 'steam', period: 1.6, ambient: 'ember', glow: '#ff9a3a' },
  alchemy: { mode: 'stir', tool: T('flask'), toolLen: 34, prop: P('cauldron', 270, 84, 'pulse'), fx: 'bubble', period: 1.6, ambient: 'bubble', glow: '#5cff9a' },
  enchanting: { mode: 'cast', tool: T('quill'), toolLen: 38, fx: 'glyph', period: 1.8, ambient: 'glyph', glow: '#6aa8ff' },
  runecrafting: { mode: 'tap', tool: T('chisel'), toolLen: 34, prop: P('runestone', 276, 112, 'pulse'), fx: 'glyph', period: 0.9, ambient: 'glyph', glow: '#3fe0c0' },
  exploration: { mode: 'walk', tool: T('spyglass'), toolLen: 34, fx: 'dust', period: 0.7, ambient: 'leaf' },
  trading: { mode: 'coins', prop: P('cart', 276, 92, 'none'), fx: 'coin', period: 1.4 },
};

// ---------- tiny asset cache ----------
const imgs = new Map<string, HTMLImageElement>();
type Pic = (HTMLImageElement | HTMLCanvasElement) & { naturalWidth: number; naturalHeight: number };
function img(path: string): Pic | null {
  if (path.startsWith('proc:')) {
    const cv = procArt(path.slice(5)) as Pic | null;
    if (cv) { cv.naturalWidth = cv.width; cv.naturalHeight = cv.height; }
    return cv;
  }
  let im = imgs.get(path);
  if (!im) {
    im = new Image();
    im.src = asset(path);
    imgs.set(path, im);
  }
  return im.complete && im.naturalWidth ? (im as Pic) : null;
}

interface Part {
  x: number; y: number; vx: number; vy: number; g: number; life: number; max: number; size: number; color: string; kind: 'rect' | 'circle' | 'star' | 'ring' | 'icon'; rot?: number; icon?: string;
}

const COLORS: Record<Fx, string[]> = {
  chips: ['#d9a35a', '#b07a3a', '#e8c88a', '#8a5a2a'],
  sparks: ['#fff3b0', '#ffc04a', '#ff8a2a', '#ffe28a'],
  dust: ['#cdbf9a', '#a89b78', '#e6dcc0'],
  water: ['#bfe8ff', '#7fc4f0', '#ffffff'],
  bubble: ['#c8ffd9', '#8affc0', '#e6fff0'],
  star: ['#ffffff', '#fff3b0', '#9fe8ff'],
  steam: ['#ffffff', '#e6e6f0'],
  coin: ['#ffd35a', '#ffe28a', '#f2a93a'],
  glyph: ['#7ff0ff', '#a98aff', '#fff3b0'],
  leaf: ['#7fd06a', '#5ab04a', '#b5e08a'],
  ember: ['#ff9a3a', '#ffcf6a', '#ff6a2a'],
  shard: ['#9aa3b8', '#c9d2e6', '#7a8298', '#ffd35a'],
};

export class ActivityScene {
  el: HTMLElement;
  private cv: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private label: HTMLElement;
  private floats: HTMLElement;
  private parts: Part[] = [];
  private skill: SkillId;
  private t = 0;
  private last = 0;
  private raf = 0;
  private lastHit = -1;
  private shake = 0;
  private flash = 0;
  private propKick = 0;
  private scroll = 0;
  private arrows: { x: number; y: number; vx: number; vy: number; t: number }[] = [];
  private rocks: { x: number; y: number; vy: number; r: number }[] = [];
  private lastFrame = 0;
  private boost = 0;

  constructor(skill: SkillId, opts: { compact?: boolean } = {}) {
    this.skill = skill;
    this.cv = h('canvas', { width: String(W), height: String(H) }) as HTMLCanvasElement;
    this.ctx = this.cv.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
    this.label = h('div', { class: 'slabel' });
    this.floats = h('div', { class: 'sfloats' });
    this.el = h('div', { class: `scene ${opts.compact ? 'compact' : ''}` }, this.cv, this.label, this.floats);
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  setSkill(skill: SkillId) {
    if (skill === this.skill) return;
    this.skill = skill;
    this.parts = [];
    this.arrows = [];
    this.rocks = [];
    this.lastHit = -1;
  }

  /** Called from the screen for game events: floats the reward and pops a burst. */
  reward(text: string, icon?: string) {
    const f = h('div', { class: 'sfloat' });
    if (icon) f.append(h('img', { src: icon, alt: '' }));
    f.append(text);
    f.style.left = `${38 + Math.random() * 24}%`;
    this.floats.append(f);
    setTimeout(() => f.remove(), 1500);
    while (this.floats.childElementCount > 5) this.floats.firstElementChild?.remove();
    this.boost = 1;
    const c = CFG[this.skill];
    const px = (c.prop?.x ?? 270) - 10;
    for (let i = 0; i < 10; i++) this.emit('star', px, GROUND - (c.prop?.h ?? 60) * 0.6, 1.2);
  }

  // ---------- state ----------
  private running(): boolean {
    const a = host.game?.state.activity;
    if (!a) return false;
    if (a.type === 'gather') return GATHER_MAP[a.id]?.skill === this.skill;
    if (a.type === 'craft') return RECIPE_MAP[a.id]?.skill === this.skill;
    if (a.type === 'combat') return HEROES.some((x) => x.skill === this.skill) || this.skill === 'fortitude';
    return false;
  }

  private heroImg(): Pic | null {
    const s = host.game.state;
    let i = s.heroes.findIndex((_, k) => heroDef(s, k).skill === this.skill);
    if (i < 0) i = 0;
    const def = heroDef(s, i);
    return img(def.sprite.startsWith('gen/') ? `${def.sprite}.png` : `pack/battlers/${def.sprite}.png`);
  }

  // ---------- loop ----------
  private loop = (now: number) => {
    if (!this.raf) return;
    this.raf = requestAnimationFrame(this.loop);
    if (!this.el.isConnected || this.el.offsetParent === null) return;
    if (now - this.lastFrame < 33) return;
    this.lastFrame = now;
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    this.t += dt;
    this.draw(dt);
  };

  private emit(kind: Fx, x: number, y: number, power = 1) {
    const cols = COLORS[kind];
    const n = kind === 'steam' || kind === 'bubble' ? 1 : Math.ceil(5 * power);
    for (let i = 0; i < n; i++) {
      const c = cols[(Math.random() * cols.length) | 0];
      const a = Math.random() * Math.PI * 2;
      const sp = 30 + Math.random() * 60 * power;
      let p: Part;
      switch (kind) {
        case 'chips': p = { x, y, vx: 20 + Math.random() * 50, vy: -60 - Math.random() * 60, g: 280, life: 0.7, max: 0.7, size: 2 + (Math.random() * 2) | 0, color: c, kind: 'rect', rot: Math.random() * 6 }; break;
        case 'shard': p = { x, y, vx: (Math.random() - 0.3) * 90, vy: -50 - Math.random() * 70, g: 300, life: 0.8, max: 0.8, size: 2 + (Math.random() * 2) | 0, color: c, kind: 'rect' }; break;
        case 'sparks': p = { x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, g: 220, life: 0.55, max: 0.55, size: 2, color: c, kind: 'rect' }; break;
        case 'dust': p = { x, y, vx: (Math.random() - 0.3) * 30, vy: -10 - Math.random() * 18, g: -4, life: 0.9, max: 0.9, size: 5 + (Math.random() * 4) | 0, color: c, kind: 'circle' }; break;
        case 'water': p = { x, y, vx: (Math.random() - 0.5) * 50, vy: -70 - Math.random() * 40, g: 260, life: 0.8, max: 0.8, size: 2, color: c, kind: 'circle' }; break;
        case 'bubble': p = { x, y, vx: (Math.random() - 0.5) * 12, vy: -22 - Math.random() * 20, g: 0, life: 1.6, max: 1.6, size: 2 + (Math.random() * 3) | 0, color: c, kind: 'ring' }; break;
        case 'star': p = { x, y, vx: (Math.random() - 0.5) * 50, vy: -20 - Math.random() * 40, g: 30, life: 0.9, max: 0.9, size: 3, color: c, kind: 'star' }; break;
        case 'steam': p = { x, y, vx: (Math.random() - 0.5) * 10, vy: -26 - Math.random() * 12, g: 0, life: 1.4, max: 1.4, size: 6 + (Math.random() * 5) | 0, color: c, kind: 'circle' }; break;
        case 'coin': p = { x, y, vx: -40 - Math.random() * 40, vy: -90 - Math.random() * 30, g: 260, life: 1.0, max: 1.0, size: 4, color: c, kind: 'circle' }; break;
        case 'glyph': p = { x, y, vx: (Math.random() - 0.5) * 24, vy: -18 - Math.random() * 24, g: 0, life: 1.4, max: 1.4, size: 3, color: c, kind: 'rect' }; break;
        case 'leaf': p = { x, y, vx: 14 + Math.random() * 14, vy: 8 + Math.random() * 10, g: 4, life: 3.2, max: 3.2, size: 3, color: c, kind: 'rect', rot: Math.random() * 6 }; break;
        default: p = { x, y, vx: (Math.random() - 0.5) * 16, vy: -14 - Math.random() * 20, g: -6, life: 1.4, max: 1.4, size: 2, color: c, kind: 'rect' }; break;
      }
      this.parts.push(p);
    }
    if (this.parts.length > 160) this.parts.splice(0, this.parts.length - 160);
  }

  private onHit(c: Cfg, hx: number, hy: number) {
    const px = c.prop ? c.prop.x - c.prop.h * 0.22 : hx + 60;
    const py = GROUND - (c.prop ? c.prop.h * 0.45 : 40);
    this.propKick = 1;
    this.emit(c.fx, px, py, 1.1);
    if (c.fx === 'sparks' || c.fx === 'shard') this.flash = 0.5;
    if (c.mode === 'overhead' || c.mode === 'slash') this.shake = 0.5;
    void hx; void hy;
  }

  // ---------- drawing ----------
  private draw(dt: number) {
    const ctx = this.ctx;
    const c = CFG[this.skill];
    const run = this.running();
    const boost = this.boost = Math.max(0, this.boost - dt * 2);
    const period = c.period;
    const phase = run ? (this.t % period) / period : 0;
    const cycle = run ? Math.floor(this.t / period) : -1;
    const bg = img(`gen/scenes/${this.skill === 'trading' ? 'exploration' : this.skill}.png`);

    ctx.save();
    ctx.clearRect(0, 0, W, H);
    this.shake = Math.max(0, this.shake - dt * 4);
    if (this.shake > 0) ctx.translate((Math.random() - 0.5) * 3 * this.shake, (Math.random() - 0.5) * 2 * this.shake);

    // background (scrolls when exploring)
    if (bg) {
      if (c.mode === 'walk' && run) {
        this.scroll = (this.scroll + dt * 38) % W;
        ctx.drawImage(bg, -this.scroll, 0, W, H);
        ctx.drawImage(bg, W - this.scroll, 0, W, H);
      } else ctx.drawImage(bg, 0, 0, W, H);
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#2b2650'); g.addColorStop(1, '#14102c');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    if (c.glow) {
      const a = 0.08 + 0.05 * Math.sin(this.t * 7) + (run ? 0.05 : 0) + boost * 0.12;
      ctx.globalAlpha = a; ctx.fillStyle = c.glow; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
    }

    // prop
    const hx = c.heroX ?? (c.mode === 'rod' ? 96 : c.mode === 'coins' ? 120 : 118);
    if (c.prop) this.drawProp(c.prop, run, phase);

    // hero + tool
    this.kinematics(c, run, phase, cycle, hx, dt);

    // particles
    this.stepParts(dt);

    // ambient
    if (c.ambient && Math.random() < dt * (c.ambient === 'leaf' ? 1.6 : 2.4)) {
      const a = c.ambient;
      if (a === 'leaf') this.emit('leaf', -4, 20 + Math.random() * 60, 0.3);
      else if (a === 'bubble') this.emit('bubble', 200 + Math.random() * 100, GROUND - 4, 0.3);
      else if (a === 'ember') this.emit('ember', 100 + Math.random() * 200, GROUND, 0.3);
      else if (a === 'glyph' || a === 'star') this.emit(a, 60 + Math.random() * 270, GROUND - 10 - Math.random() * 40, 0.3);
      else this.emit('dust', Math.random() * W, GROUND + 4, 0.2);
    }

    if (this.flash > 0) {
      ctx.globalAlpha = Math.min(0.35, this.flash * 0.4); ctx.fillStyle = '#fff3d0'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
      this.flash = Math.max(0, this.flash - dt * 6);
    }
    // vignette
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.38)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    ctx.restore();

    const name = SKILL_MAP[this.skill].name;
    const txt = run ? `${name} · ${host.game.activityName()}` : `${name} · idle`;
    if (this.label.textContent !== txt) this.label.textContent = txt;
  }

  private drawProp(p: Prop, run: boolean, phase: number) {
    const im = img(p.img);
    if (!im) return;
    const ctx = this.ctx;
    this.propKick = Math.max(0, this.propKick - 0.09);
    const hh = p.h * (1 + (p.react === 'pulse' ? this.propKick * 0.05 : 0));
    const ww = (im.naturalWidth / im.naturalHeight) * hh;
    ctx.save();
    ctx.translate(p.x, GROUND + (p.y ?? 0) + 4);
    if (p.react === 'shake') ctx.rotate(Math.sin(this.t * 55) * 0.045 * this.propKick);
    else if (p.react === 'sway') ctx.rotate(Math.sin(this.t * 2.2) * 0.02 + Math.sin(this.t * 30) * 0.03 * this.propKick);
    // soft shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(0, 0, ww * 0.38, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.drawImage(im, -ww / 2, -hh, ww, hh);
    ctx.restore();
    void run; void phase;
  }

  /** Positions the hero and tool for the current phase of the swing, and fires hit effects. */
  private kinematics(c: Cfg, run: boolean, phase: number, cycle: number, hx: number, dt: number) {
    const ctx = this.ctx;
    const him = this.heroImg();
    const tool = c.tool ? img(c.tool) : null;
    const hh = him ? Math.max(70, Math.min(96, him.naturalHeight)) : 80;
    const hw = him ? (him.naturalWidth / him.naturalHeight) * hh : 50;

    let lean = 0; let bob = Math.sin(this.t * 2.2) * 0.8; let squash = 1; let tdx = 0; let tdy = 0; let hit = false; let toolAng = 0;
    const e = (x: number) => x * x * (3 - 2 * x);
    if (!run) {
      toolAng = -0.2;
    } else {
      switch (c.mode) {
        case 'overhead': {
          if (phase < 0.55) { const k = e(phase / 0.55); toolAng = -0.2 - k * 1.05; lean = -0.1 * k; squash = 1 + 0.02 * k; }
          else if (phase < 0.68) { const k = (phase - 0.55) / 0.13; toolAng = -1.25 + k * 2.0; lean = -0.1 + k * 0.28; hit = k > 0.85; }
          else { const k = e((phase - 0.68) / 0.32); toolAng = 0.75 - k * 0.95; lean = 0.18 * (1 - k); }
          break;
        }
        case 'slash': {
          if (phase < 0.45) { const k = e(phase / 0.45); toolAng = -0.1 - k * 0.9; lean = -0.07 * k; }
          else if (phase < 0.6) { const k = (phase - 0.45) / 0.15; toolAng = -1.0 + k * 1.9; lean = -0.07 + k * 0.22; tdx = k * 10; hit = k > 0.8; }
          else { const k = e((phase - 0.6) / 0.4); toolAng = 0.9 - k * 1.0; lean = 0.15 * (1 - k); tdx = 10 * (1 - k); }
          break;
        }
        case 'stab': {
          if (phase < 0.45) { const k = e(phase / 0.45); toolAng = -0.5 - k * 0.45; lean = -0.06 * k; tdy = -4 * k; }
          else if (phase < 0.6) { const k = (phase - 0.45) / 0.15; toolAng = -0.95 + k * 1.6; lean = 0.2 * k; tdy = -4 + k * 12; hit = k > 0.85; squash = 1 - 0.05 * k; }
          else { const k = e((phase - 0.6) / 0.4); toolAng = 0.65 - k * 1.15; lean = 0.2 * (1 - k); tdy = 8 * (1 - k); }
          break;
        }
        case 'saw': {
          const s = Math.sin(phase * Math.PI * 4);
          toolAng = 0.25; tdx = s * 9; lean = 0.08 + s * 0.04; squash = 0.97;
          const q = Math.floor(phase * 4);
          if (q !== this.lastHit && Math.abs(Math.cos(phase * Math.PI * 4)) < 0.2) { this.lastHit = q; hit = true; }
          break;
        }
        case 'tap': {
          const k = Math.abs(Math.sin(phase * Math.PI * 2));
          toolAng = -0.1 + k * 0.75; lean = 0.06 + k * 0.04; squash = 0.97 - 0.03 * k; hit = k > 0.95 && this.lastHit !== cycle;
          break;
        }
        case 'stir': {
          const a = phase * Math.PI * 2;
          toolAng = 0.2 + Math.sin(a) * 0.15; tdx = Math.cos(a) * 7; tdy = Math.sin(a) * 3; lean = 0.08;
          if (Math.random() < dt * 5) { const p = c.prop; this.emit(c.fx, (p?.x ?? 270) + (Math.random() - 0.5) * 16, GROUND - (p?.h ?? 60) * 0.75, 0.7); }
          break;
        }
        case 'pick': {
          const k = Math.sin(phase * Math.PI * 2) * 0.5 + 0.5;
          squash = 0.86 + 0.06 * k; lean = 0.22 + 0.06 * k; toolAng = 0.2 + k * 0.7; tdy = 6;
          hit = k > 0.96 && this.lastHit !== cycle;
          break;
        }
        case 'rod': {
          if (phase < 0.12) { const k = phase / 0.12; toolAng = -0.2 - k * 0.8; lean = -0.12 * k; }
          else if (phase < 0.2) { const k = (phase - 0.12) / 0.08; toolAng = -1.0 + k * 1.2; lean = -0.12 + k * 0.2; }
          else { toolAng = 0.2 + Math.sin(this.t * 3) * 0.03; lean = 0.08; }
          if (phase > 0.9 && this.lastHit !== cycle) { hit = true; }
          break;
        }
        case 'bow': {
          if (phase < 0.6) { const k = e(phase / 0.6); toolAng = 0.1; lean = -0.1 * k; tdx = -6 * k; }
          else if (phase < 0.66) { toolAng = 0.1; lean = 0.05; tdx = 2; if (this.lastHit !== cycle) { this.lastHit = cycle; this.arrows.push({ x: hx + 26, y: GROUND - hh * 0.55, vx: 340, vy: -8, t: 0 }); } }
          else { toolAng = 0.1; lean = 0.05; }
          break;
        }
        case 'cast': {
          const k = Math.sin(phase * Math.PI);
          toolAng = -0.35 - k * 0.5; tdy = -k * 8; bob = Math.sin(this.t * 3) * 1.5 - k * 3;
          if (Math.random() < dt * 8) { this.emit(c.fx === 'glyph' ? 'glyph' : 'star', hx + 24 + Math.cos(this.t * 4) * 22, GROUND - hh * 0.9 + Math.sin(this.t * 4) * 8, 0.4); }
          hit = k > 0.97 && this.lastHit !== cycle;
          break;
        }
        case 'walk': {
          bob = Math.abs(Math.sin(this.t * 9)) * -4; lean = 0.08; toolAng = 0.3 + Math.sin(this.t * 4.5) * 0.05;
          if (Math.random() < dt * 6) this.emit('dust', hx - 14, GROUND + 2, 0.4);
          break;
        }
        case 'coins': {
          bob = Math.sin(this.t * 6) * 1.2; lean = 0.04;
          hit = true;
          break;
        }
        case 'block': {
          lean = -0.05; toolAng = -0.1;
          if (this.lastHit !== cycle) { this.lastHit = cycle; this.rocks.push({ x: hx + 26 + Math.random() * 6, y: -20, vy: 40, r: 7 + Math.random() * 4 }); }
          break;
        }
      }
      if (hit && (c.mode === 'saw' || this.lastHit !== cycle)) {
        if (c.mode !== 'saw') this.lastHit = cycle;
        if (c.mode === 'rod') { const bx = hx + 150; this.emit('water', bx, GROUND - 8, 1.3); }
        else if (c.mode === 'coins') { for (let i = 0; i < 3; i++) this.emit('coin', (c.prop?.x ?? 270) - 12, GROUND - 38, 1); }
        else if (c.mode === 'cast') { this.emit(c.fx, hx + 60, GROUND - hh * 0.8, 1.6); this.flash = 0.25; }
        else this.onHit(c, hx, GROUND);
      }
    }

    // ---- draw hero ----
    ctx.save();
    ctx.translate(hx, GROUND + bob * 0.4);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(0, 3, hw * 0.4, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.rotate(lean);
    ctx.scale(1 + (1 - squash) * 0.6, squash);
    if (him) ctx.drawImage(him, -hw / 2, -hh, hw, hh);
    // tool in hand
    const handX = hw * 0.22 + tdx; const handY = -hh * 0.46 + tdy;
    if (tool) {
      const tl = c.toolLen ?? 40;
      const tw = tl; const th = (tool.naturalHeight / tool.naturalWidth) * tl;
      ctx.save();
      ctx.translate(handX, handY);
      ctx.rotate(toolAng);
      ctx.drawImage(tool, -tw * 0.14, -th * 0.86, tw, th);
      ctx.restore();
    }
    ctx.restore();

    // special extras
    if (c.mode === 'rod') this.drawFishing(hx, hh, run, phase, cycle);
    if (c.mode === 'bow') this.stepArrows(c, dt);
    if (c.mode === 'block') this.stepRocks(c, dt, hx, hh);
    if (c.mode === 'coins' && run) this.drawTrader(hx, hh);
  }

  private drawFishing(hx: number, hh: number, run: boolean, phase: number, cycle: number) {
    const ctx = this.ctx;
    const bx = hx + 150; const by = GROUND - 6 + Math.sin(this.t * 3) * 1.4 + (run && phase > 0.9 ? Math.sin(this.t * 40) * 3 : 0);
    const tipX = hx + 56; const tipY = GROUND - hh * 0.9;
    ctx.strokeStyle = 'rgba(235,240,255,0.8)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.quadraticCurveTo((tipX + bx) / 2, Math.min(tipY, by) - 10, bx, by - 3); ctx.stroke();
    ctx.fillStyle = '#ff5a5a'; ctx.beginPath(); ctx.arc(bx, by - 3, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(bx - 1, by - 5, 2, 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    const r = (this.t * 14) % 14;
    ctx.beginPath(); ctx.ellipse(bx, by + 1, 4 + r, 1.5 + r * 0.25, 0, 0, Math.PI * 2); ctx.stroke();
    if (run && phase > 0.92) {
      const im = img('proc:fish');
      if (im) { const k = (phase - 0.92) / 0.08; ctx.drawImage(im, bx - 14, by - 10 - Math.sin(k * Math.PI) * 38, 28, 28); }
    }
    void cycle;
  }

  private drawTrader(hx: number, hh: number) {
    if (Math.random() < 0.06) this.emit('coin', 258, GROUND - 40, 0.8);
    void hx; void hh;
  }

  private stepArrows(c: Cfg, dt: number) {
    const ctx = this.ctx;
    const tx = c.prop ? c.prop.x - 6 : 330;
    this.arrows = this.arrows.filter((a) => {
      a.x += a.vx * dt; a.t += dt;
      ctx.strokeStyle = '#e8d8b0'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(a.x - 14, a.y); ctx.lineTo(a.x, a.y); ctx.stroke();
      ctx.fillStyle = '#cfd6e6'; ctx.fillRect(a.x, a.y - 1, 3, 3);
      if (a.x >= tx) {
        this.propKick = 1; this.emit('dust', tx, a.y, 0.5); this.emit('sparks', tx, a.y, 0.5);
        return false;
      }
      return true;
    });
  }

  private stepRocks(c: Cfg, dt: number, hx: number, hh: number) {
    const ctx = this.ctx;
    this.rocks = this.rocks.filter((r) => {
      r.vy += 420 * dt; r.y += r.vy * dt;
      ctx.fillStyle = '#7a7f92'; ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#a8aec2'; ctx.fillRect(r.x - r.r * 0.4, r.y - r.r * 0.5, 3, 3);
      if (r.y >= GROUND - hh * 0.8) {
        this.emit('dust', r.x, r.y, 1); this.emit('sparks', r.x, r.y, 0.8); this.shake = 0.8; this.flash = 0.35;
        return false;
      }
      return true;
    });
    void c; void hx;
  }

  private stepParts(dt: number) {
    const ctx = this.ctx;
    this.parts = this.parts.filter((p) => {
      p.life -= dt;
      if (p.life <= 0) return false;
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      const k = p.life / p.max;
      ctx.globalAlpha = Math.min(1, k * 1.6);
      ctx.fillStyle = p.color; ctx.strokeStyle = p.color;
      const s = p.size;
      if (p.kind === 'rect') { ctx.fillRect(Math.round(p.x), Math.round(p.y), s, s); }
      else if (p.kind === 'circle') { ctx.beginPath(); ctx.arc(p.x, p.y, s * (p.g < 0 || p.size > 4 ? 1.6 - k * 0.5 : 1), 0, Math.PI * 2); ctx.fill(); }
      else if (p.kind === 'ring') { ctx.beginPath(); ctx.arc(p.x, p.y, s, 0, Math.PI * 2); ctx.stroke(); }
      else if (p.kind === 'star') { ctx.fillRect(p.x - s, p.y, s * 2 + 1, 1); ctx.fillRect(p.x, p.y - s, 1, s * 2 + 1); }
      ctx.globalAlpha = 1;
      return true;
    });
  }
}
