import { h, mount } from './dom';
import { asset } from './icons';
import { audio } from './audio';
import { bar, setBar } from './icons';
import { confirmBox } from './modal';
import introSlides from '@/data/intro.json';

export type StartChoice = { kind: 'continue' } | { kind: 'new'; name: string };

const SLIDES: { art: string; title: string; text: string }[] = introSlides;

interface VoWord { w: string; t0: number; t1: number }
interface VoTrack { duration: number; words: VoWord[] }

const VO_KEY = 'rv.vo';
const voEnabled = (): boolean => { try { return localStorage.getItem(VO_KEY) !== '0'; } catch { return true; } };
const setVoEnabled = (on: boolean) => { try { localStorage.setItem(VO_KEY, on ? '1' : '0'); } catch { /* ignore */ } };

async function loadTrack(i: number): Promise<VoTrack | null> {
  try {
    const r = await fetch(asset(`audio/vo/intro_${i + 1}.json`));
    return r.ok ? ((await r.json()) as VoTrack) : null;
  } catch {
    return null;
  }
}

const logo = () => h('div', { class: 'logo' }, h('div', { class: 'l1', text: 'RUNEVEIL' }), h('div', { class: 'l2', text: 'ODYSSEY' }), h('div', { class: 'l3', text: 'AN IDLE ADVENTURE' }));

const preload = (urls: string[]) => Promise.all(urls.map((u) => new Promise<void>((res) => { const i = new Image(); i.onload = i.onerror = () => res(); i.src = u; })));

export async function runIntro(root: HTMLElement, hasSave: boolean): Promise<StartChoice> {
  const loadBar = bar('act', 0);
  loadBar.classList.add('loadbar');
  const screen = h('div', { class: 'full splash', style: `background-image:url(${asset('gen/art/rv_title.png')});image-rendering:pixelated` }, logo(),
    h('div', { class: 'tap', text: 'Loading...' }), h('div', { class: 'sp' }), loadBar);
  mount(root, screen);
  const urls = [...SLIDES.map((s) => asset(`gen/art/${s.art}.png`)), asset('gen/brand/rv_icon.png')];
  let done = 0;
  const tick = setInterval(() => setBar(loadBar, Math.min(0.95, done / urls.length)), 60);
  const t0 = performance.now();
  await Promise.all([
    Promise.all(urls.map((u) => preload([u]).then(() => { done++; }))),
    document.fonts?.ready ?? Promise.resolve(),
    new Promise((r) => setTimeout(r, 900)),
  ]);
  clearInterval(tick);
  setBar(loadBar, 1);
  void t0;

  return new Promise<StartChoice>((resolve) => {
    const start = (c: StartChoice) => { audio.sfx('ui_confirm'); resolve(c); };
    const newGame = () => {
      audio.sfx('ui_confirm');
      void onboarding(root).then((name) => start({ kind: 'new', name }));
    };
    const menu = h('div', { class: 'menu' },
      hasSave ? h('button', { class: 'btn gold block', style: 'font-size:18px;padding:13px', text: 'Continue', onclick: () => { audio.unlock(); audio.playMusic('m_village'); start({ kind: 'continue' }); } }) : null,
      h('button', { class: `btn ${hasSave ? 'ghost' : 'gold'} block`, style: hasSave ? '' : 'font-size:18px;padding:13px', text: 'New Game', onclick: () => {
        audio.unlock(); audio.playMusic('m_intro');
        if (hasSave) confirmBox({ title: 'Start a new game?', text: 'Your existing save will be erased when the new game begins.', danger: true, ok: 'Start new', onOk: newGame });
        else newGame();
      } }));
    mount(screen, logo(), menu, h('div', { class: 'tiny muted', style: 'margin-top:14px', text: 'v0.1.0' }));
    audio.playMusic('m_title');
    const first = () => { audio.unlock(); audio.playMusic('m_title'); screen.removeEventListener('pointerdown', first); };
    screen.addEventListener('pointerdown', first);
  });
}

function onboarding(root: HTMLElement): Promise<string> {
  return new Promise((resolve) => {
    let i = 0;
    let stopVo: (() => void) | null = null;
    let gen = 0;
    const leave = () => { stopVo?.(); stopVo = null; };
    const next = () => { leave(); audio.sfx('ui_page'); i++; render(); };
    const render = () => {
      leave();
      if (i >= SLIDES.length) { nameStep(); return; }
      const s = SLIDES[i];
      const my = ++gen;
      const titleWords = s.title.split(/\s+/);
      const bodyWords = s.text.split(/\s+/);
      const spans = [...titleWords, ...bodyWords].map((w) => h('span', { class: 'vw', text: w }));
      const h1 = h('h1', {}, ...spans.slice(0, titleWords.length).flatMap((x, k) => (k ? [' ', x] : [x])));
      const p = h('p', {}, ...spans.slice(titleWords.length).flatMap((x, k) => (k ? [' ', x] : [x])));
      const voBtn = h('button', { class: 'vobtn', text: voEnabled() ? '🔊 Narration' : '🔇 Narration', onclick: () => {
        setVoEnabled(!voEnabled());
        voBtn.textContent = voEnabled() ? '🔊 Narration' : '🔇 Narration';
        render();
      } });
      mount(root, h('div', { class: 'full' },
        h('div', { class: 'slide', style: `background-image:url(${asset(`gen/art/${s.art}.png`)});image-rendering:pixelated` }, voBtn, h1, p),
        h('div', { class: 'dots' }, ...SLIDES.map((_, k) => h('i', { class: k === i ? 'on' : '' }))),
        h('div', { class: 'foot' },
          h('button', { class: 'btn gold block', text: i === SLIDES.length - 1 ? 'Begin' : 'Next', onclick: next }),
          i < SLIDES.length - 1 ? h('button', { class: 'btn ghost block', text: 'Skip', onclick: () => { leave(); i = SLIDES.length; render(); } }) : null)));
      if (!voEnabled()) { spans.forEach((x) => x.classList.add('on')); return; }
      void startVo(my === gen ? i : 0, spans, () => {
        if (gen !== my) return;
        const t = setTimeout(() => { if (gen === my) next(); }, 900);
        const prev = stopVo;
        stopVo = () => { clearTimeout(t); prev?.(); };
      }).then((stop) => { if (gen === my) stopVo = stop; else stop(); });
    };
    const nameStep = () => {
      const input = h('input', { class: 'field', maxLength: 14, placeholder: 'Wayfarer', value: '' });
      const go = () => resolve((input.value.trim() || 'Wayfarer').slice(0, 14));
      mount(root, h('div', { class: 'full' },
        h('div', { class: 'slide', style: `background-image:url(${asset('gen/art/rv_title.png')});image-rendering:pixelated` },
          h('h1', { text: 'Who Leads the Party?' }), h('p', { text: 'Choose a name for the Lantern Bearer. You can start fighting right away.' }), input),
        h('div', { class: 'foot' }, h('button', { class: 'btn gold block', style: 'font-size:18px;padding:13px', text: 'Start Adventure', onclick: go }))));
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    };
    render();
  });
}

/** Plays slide narration and lights up each word at the moment it is spoken. */
async function startVo(i: number, spans: HTMLElement[], onEnd: () => void): Promise<() => void> {
  const track = await loadTrack(i);
  const au = new Audio(asset(`audio/vo/intro_${i + 1}.mp3`));
  au.volume = 1;
  let raf = 0;
  let stopped = false;
  const stop = () => { stopped = true; cancelAnimationFrame(raf); au.pause(); audio.duck(false); };
  const words = track?.words ?? [];
  const sync = () => {
    if (stopped) return;
    const t = au.currentTime;
    for (let k = 0; k < spans.length; k++) {
      const w = words[k];
      spans[k].classList.toggle('on', !w || t >= w.t0 - 0.03);
    }
    raf = requestAnimationFrame(sync);
  };
  au.addEventListener('ended', () => { if (stopped) return; cancelAnimationFrame(raf); spans.forEach((x) => x.classList.add('on')); audio.duck(false); onEnd(); });
  audio.duck(true);
  try {
    await au.play();
    raf = requestAnimationFrame(sync);
  } catch {
    spans.forEach((x) => x.classList.add('on'));
    audio.duck(false);
  }
  return stop;
}
