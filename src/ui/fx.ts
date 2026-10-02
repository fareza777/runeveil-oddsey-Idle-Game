import { h } from './dom';

export interface Pt { x: number; y: number }

const MAX_NODES = 46;

/** Small particle and screen effects for the battle arena, drawn with the Web Animations API. */
export class ArenaFx {
  constructor(private arena: HTMLElement, private layer: HTMLElement) {}

  /** Centre of an element, in arena coordinates. `fy` picks a height between top (0) and bottom (1). */
  at(el: Element, fy = 0.5, fx = 0.5): Pt {
    const a = this.arena.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: r.left - a.left + r.width * fx, y: r.top - a.top + r.height * fy };
  }

  private add(el: HTMLElement, frames: Keyframe[], ms: number, easing = 'ease-out'): boolean {
    if (this.layer.childElementCount > MAX_NODES) return false;
    this.layer.appendChild(el);
    const an = el.animate(frames, { duration: ms, easing, fill: 'forwards' });
    an.onfinish = () => el.remove();
    return true;
  }

  /** A spray of sparks. `up` makes them rise (healing, casting) instead of falling. */
  burst(p: Pt, color: string, n = 8, spread = 36, opts: { up?: boolean; size?: number; ms?: number } = {}) {
    const size = opts.size ?? 4;
    for (let i = 0; i < n; i++) {
      const s = h('div', { class: 'spark' });
      s.style.background = color;
      s.style.boxShadow = `0 0 6px ${color}`;
      s.style.width = s.style.height = `${size * (0.6 + Math.random() * 0.9)}px`;
      s.style.left = `${p.x}px`; s.style.top = `${p.y}px`;
      const ang = opts.up ? -Math.PI / 2 + (Math.random() - 0.5) * 1.6 : Math.random() * Math.PI * 2;
      const d = spread * (0.45 + Math.random() * 0.75);
      const dx = Math.cos(ang) * d;
      const dy = Math.sin(ang) * d + (opts.up ? -12 : 14);
      const ms = (opts.ms ?? 460) * (0.75 + Math.random() * 0.5);
      if (!this.add(s, [
        { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx * 0.7}px), calc(-50% + ${dy * 0.6}px)) scale(.9)`, opacity: 1, offset: 0.55 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.2)`, opacity: 0 },
      ], ms)) return;
    }
  }

  /** An expanding shock ring. */
  ring(p: Pt, color: string, size = 56, ms = 420, flat = false) {
    const r = h('div', { class: `ringfx ${flat ? 'flat' : ''}` });
    r.style.setProperty('--c', color);
    r.style.width = r.style.height = `${size}px`;
    r.style.left = `${p.x}px`; r.style.top = `${p.y}px`;
    this.add(r, [
      { transform: 'translate(-50%,-50%) scale(.2)', opacity: 0.95 },
      { transform: 'translate(-50%,-50%) scale(1.5)', opacity: 0 },
    ], ms);
  }

  /** A crossing starburst for critical hits. */
  star(p: Pt, color: string, size = 70) {
    const s = h('div', { class: 'starfx' });
    s.style.setProperty('--c', color);
    s.style.width = s.style.height = `${size}px`;
    s.style.left = `${p.x}px`; s.style.top = `${p.y}px`;
    this.add(s, [
      { transform: 'translate(-50%,-50%) rotate(-25deg) scale(.2)', opacity: 0 },
      { transform: 'translate(-50%,-50%) rotate(0deg) scale(1.05)', opacity: 1, offset: 0.35 },
      { transform: 'translate(-50%,-50%) rotate(20deg) scale(1.3)', opacity: 0 },
    ], 380);
  }

  /** Short camera shake of the whole arena. */
  shake(px: number, ms = 240) {
    const k = [{ transform: 'translate(0,0)' }];
    for (let i = 1; i <= 6; i++) {
      const f = 1 - i / 7;
      k.push({ transform: `translate(${((i % 2 ? 1 : -1) * px * f).toFixed(1)}px, ${((i % 3 === 0 ? -1 : 1) * px * 0.6 * f).toFixed(1)}px)` });
    }
    k.push({ transform: 'translate(0,0)' });
    this.arena.animate(k, { duration: ms, easing: 'linear' });
  }

  /** A full-arena colour wash. */
  flash(color: string, alpha = 0.25, ms = 320) {
    const f = h('div', { class: 'flashfx' });
    f.style.background = `radial-gradient(circle at 50% 55%, transparent 25%, ${color} 130%)`;
    this.add(f, [{ opacity: alpha }, { opacity: 0 }], ms, 'ease-out');
  }

  /** A glowing comet or arrow flying from one point to another. */
  shot(from: Pt, to: Pt, color: string, kind: 'arrow' | 'magic', ms: number, onHit: () => void) {
    const ang = Math.atan2(to.y - from.y, to.x - from.x);
    const p = h('div', { class: `proj2 ${kind}` });
    p.style.setProperty('--c', color);
    p.style.left = `${from.x}px`; p.style.top = `${from.y}px`;
    const dx = to.x - from.x; const dy = to.y - from.y;
    const rot = `rotate(${ang}rad)`;
    const wobble = kind === 'magic' ? (Math.random() - 0.5) * 26 : 0;
    const ok = this.add(p, [
      { transform: `translate(0,0) ${rot} scale(.7)`, opacity: 0.2 },
      { transform: `translate(${dx * 0.5 + Math.sin(ang) * wobble}px, ${dy * 0.5 - Math.cos(ang) * wobble}px) ${rot} scale(1.05)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) ${rot} scale(1.15)`, opacity: 1, offset: 0.92 },
      { transform: `translate(${dx}px, ${dy}px) ${rot} scale(1.8)`, opacity: 0 },
    ], ms, 'cubic-bezier(.3,.1,.6,1)');
    if (ok) window.setTimeout(onHit, ms * 0.9);
  }

  /** A curved slash made of two crescent layers. */
  slash(p: Pt, color: string, flip = false, size = 84) {
    const s = h('div', { class: 'slash2' });
    s.style.setProperty('--c', color);
    s.style.width = s.style.height = `${size}px`;
    s.style.left = `${p.x}px`; s.style.top = `${p.y}px`;
    const sgn = flip ? -1 : 1;
    this.add(s, [
      { transform: `translate(-50%,-50%) rotate(${-70 * sgn}deg) scale(.5)`, opacity: 0 },
      { transform: `translate(-50%,-50%) rotate(${0 * sgn}deg) scale(1)`, opacity: 1, offset: 0.35 },
      { transform: `translate(-50%,-50%) rotate(${55 * sgn}deg) scale(1.2)`, opacity: 0 },
    ], 300);
  }

  /** Dash an element toward a point and back; used for melee lunges and enemy charges. */
  lunge(el: HTMLElement, dx: number, dy: number, ms = 340) {
    el.animate([
      { transform: 'translate(0,0) scale(1)' },
      { transform: `translate(${-dx * 0.08}px, ${-dy * 0.08}px) scale(.96, 1.05)`, offset: 0.18 },
      { transform: `translate(${dx}px, ${dy}px) scale(1.12)`, offset: 0.4 },
      { transform: 'translate(0,0) scale(1)' },
    ], { duration: ms, easing: 'cubic-bezier(.3,.7,.3,1)' });
  }
}
