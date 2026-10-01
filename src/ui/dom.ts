type Child = Node | string | number | null | undefined | false | Child[];
type Attrs = Record<string, unknown> & { class?: string; style?: string | Partial<CSSStyleDeclaration>; text?: string };

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs?: Attrs | null, ...kids: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') el.className = String(v);
      else if (k === 'text') el.textContent = String(v);
      else if (k === 'style') {
        if (typeof v === 'string') el.setAttribute('style', v);
        else Object.assign(el.style, v);
      } else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
      else if (k in el && k !== 'list') (el as unknown as Record<string, unknown>)[k] = v;
      else el.setAttribute(k, v === true ? '' : String(v));
    }
  }
  append(el, kids);
  return el;
}

function append(el: Node, kids: Child[]) {
  for (const k of kids) {
    if (k === null || k === undefined || k === false) continue;
    if (Array.isArray(k)) append(el, k);
    else el.appendChild(typeof k === 'object' ? k : document.createTextNode(String(k)));
  }
}

/** Like Element.append but skips null/false children. */
export function add<T extends Element>(el: T, ...kids: Child[]): T {
  append(el, kids);
  return el;
}

export function clear(el: Element) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

export function mount(el: Element, ...kids: Child[]) {
  clear(el);
  append(el, kids);
}

const SUFFIX = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'];
export let fullNumbers = false;
export const setFullNumbers = (v: boolean) => (fullNumbers = v);

export function fmt(n: number, digits = 1): string {
  if (!isFinite(n)) return '0';
  const neg = n < 0;
  let v = Math.abs(n);
  if (fullNumbers) return (neg ? '-' : '') + Math.round(v).toLocaleString('en-US');
  if (v < 1000) return (neg ? '-' : '') + (v < 10 && v % 1 !== 0 ? v.toFixed(digits) : String(Math.round(v)));
  let i = 0;
  while (v >= 1000 && i < SUFFIX.length - 1) {
    v /= 1000;
    i++;
  }
  const s = v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2);
  return (neg ? '-' : '') + s.replace(/\.?0+$/, '') + SUFFIX[i];
}

export function fmtTime(sec: number): string {
  sec = Math.max(0, Math.round(sec));
  const hh = Math.floor(sec / 3600);
  const mm = Math.floor((sec % 3600) / 60);
  const ss = sec % 60;
  if (hh > 0) return `${hh}h ${mm}m`;
  if (mm > 0) return `${mm}m ${ss}s`;
  return `${ss}s`;
}

export const pct = (v: number, d = 0) => `${(v * 100).toFixed(d)}%`;
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
