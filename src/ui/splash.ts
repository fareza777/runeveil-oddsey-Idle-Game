import { h, mount } from './dom';
import { asset } from './icons';
import { audio } from './audio';
import { bar, setBar } from './icons';
import { confirmBox } from './modal';

export type StartChoice = { kind: 'continue' } | { kind: 'new'; name: string };

const SLIDES = [
  { art: 'rv_intro_1', title: 'A Quiet World', text: 'For a thousand years the Runeveil has hung over the land, a ward woven from lantern light. Villages slept. Roads stayed safe.' },
  { art: 'rv_intro_2', title: 'The Veil Frays', text: 'Something ancient is pulling at its threads. Where the weave tears, monsters crawl through and the old rune-kings stir.' },
  { art: 'rv_intro_3', title: 'Twenty-Two Rifts', text: 'From Greenhollow Vale to the Throne of the First Rune, each zone hides a boss that holds a stolen thread.' },
  { art: 'rv_intro_4', title: 'One Lantern', text: 'You begin alone, with a single lantern. Complete quests along the road and allies will join you, up to seven heroes. Gear them and teach them twenty-one trades.' },
  { art: 'rv_intro_5', title: 'Adventure Never Sleeps', text: 'Fight, gather and craft. Your party keeps working while you are away for up to twelve hours. Come back to a pile of loot.' },
];

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
    const render = () => {
      if (i >= SLIDES.length) { nameStep(); return; }
      const s = SLIDES[i];
      mount(root, h('div', { class: 'full' },
        h('div', { class: 'slide', style: `background-image:url(${asset(`gen/art/${s.art}.png`)});image-rendering:pixelated` }, h('h1', { text: s.title }), h('p', { text: s.text })),
        h('div', { class: 'dots' }, ...SLIDES.map((_, k) => h('i', { class: k === i ? 'on' : '' }))),
        h('div', { class: 'foot' },
          h('button', { class: 'btn gold block', text: i === SLIDES.length - 1 ? 'Begin' : 'Next', onclick: () => { audio.sfx('ui_page'); i++; render(); } }),
          i < SLIDES.length - 1 ? h('button', { class: 'btn ghost block', text: 'Skip', onclick: () => { i = SLIDES.length; render(); } }) : null)));
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
