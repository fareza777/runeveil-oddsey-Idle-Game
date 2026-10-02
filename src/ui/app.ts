import { add, h, fmt, fmtTime, mount, setFullNumbers } from './dom';
import { bar, ico, itemIcon, setBar } from './icons';
import { openSheet, toast } from './modal';
import { audio } from './audio';
import { host, type TabId } from './host';
import type { Screen } from './screen';
import { BattleScreen } from './battle';
import { SkillsScreen } from './skills';
import { HeroesScreen } from './heroes';
import { BagScreen } from './bag';
import { QuestsScreen } from './quests';
import { MoreScreen } from './more';
import { Game } from '@/core/engine';
import { saveState } from '@/core/save';
import { readyCount } from '@/core/questSys';
import { GATHER_MAP, HERO_MAP, ITEMS, MONSTERS, RECIPE_MAP, SKILL_MAP } from '@/data';
import { moneyEl, moneyText } from './common';
import type { GameEvent } from '@/core/state';
import type { GameState, OfflineReport } from '@/core/types';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'battle', label: 'Battle', icon: 'img:ui_icon_attack' },
  { id: 'skills', label: 'Skills', icon: 'img:ui_icon_skill' },
  { id: 'heroes', label: 'Heroes', icon: 'img:ui_icon_hero' },
  { id: 'bag', label: 'Bag', icon: 'img:ui_icon_inventory' },
  { id: 'quests', label: 'Quests', icon: 'img:ui_icon_quests' },
  { id: 'more', label: 'More', icon: 'img:ui_icon_settings' },
];

const HINTS: { text: string; tab: TabId; done: (s: GameState) => boolean }[] = [
  { text: 'Welcome to Runeveil! Tap Battle! to send your heroes into the Greenhollow Vale.', tab: 'battle', done: (s) => s.activity?.type === 'combat' || (s.stats.kills ?? 0) > 0 },
  { text: 'Your heroes fight on their own. Open Skills and start Mining or Woodcutting. Gathered goods feed crafting.', tab: 'skills', done: (s) => (s.stats.gathers ?? 0) > 0 },
  { text: 'Craft gear in Smithing or Carpentry, then equip it from Heroes with Auto-equip.', tab: 'heroes', done: (s) => (s.stats.crafts ?? 0) > 0 },
  { text: 'Check Quests for guidance and rewards. Main quests lead you across the world.', tab: 'quests', done: (s) => s.quests.done.length > 1 },
];

export class AppShell {
  game: Game;
  private root: HTMLElement;
  private topGold!: HTMLElement;
  private topTitle!: HTMLElement;
  private actbar!: HTMLElement;
  private actName!: HTMLElement;
  private actBar!: HTMLElement;
  private main!: HTMLElement;
  private nav!: HTMLElement;
  private navBtns = new Map<TabId, HTMLElement>();
  private screens = {} as Record<TabId, Screen>;
  private tab: TabId = 'battle';
  private raf = 0;
  private last = 0;
  private uiAcc = 0;
  private saveAcc = 0;
  private hintEl: HTMLElement | null = null;
  private lastGold = -1;
  private lastBadge = '';
  private running = false;
  private off: (() => void) | null = null;

  constructor(root: HTMLElement, state: GameState) {
    this.root = root;
    this.game = new Game(state);
    host.game = this.game;
    host.refresh = () => this.refreshTop(true);
    host.go = (t) => this.go(t);
    host.save = () => void saveState(this.game.state);
    setFullNumbers(state.settings.numberFormat === 'full');
    audio.setVolumes(state.settings.sfx, state.settings.music);
  }

  mount(offlineSeconds: number) {
    this.screens = { battle: new BattleScreen(), skills: new SkillsScreen(), heroes: new HeroesScreen(), bag: new BagScreen(), quests: new QuestsScreen(), more: new MoreScreen() };
    this.topGold = h('span', { text: '0' });
    this.topTitle = h('div', { class: 'title' });
    this.actName = h('div', { class: 'small grow', style: 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis' });
    this.actBar = bar('act thin', 0);
    this.actbar = h('div', { class: 'row', style: 'padding:5px 12px;background:#0f0b22;border-bottom:1px solid var(--line);gap:10px;display:none' },
      this.actName, h('div', { style: 'width:90px' }, this.actBar),
      h('button', { class: 'btn sm ghost', text: 'Stop', onclick: () => { this.game.stop('Stopped'); this.refreshTop(true); this.screens[this.tab].show(); } }));
    const top = h('div', { class: 'top' }, this.topTitle, h('span', { class: 'res', title: 'Silver · 10,000 silver = 1 gold · 10,000 gold = 1 platinum' }, this.topGold));
    this.main = h('div', { id: 'main' }, ...Object.values(this.screens).map((sc) => { sc.el.style.display = 'none'; return sc.el; }));
    this.nav = h('div', { class: 'nav' }, ...TABS.map((t) => {
      const b = h('button', { onclick: () => { audio.unlock(); audio.sfx('ui_click', 0.6); if (t.id === 'skills' && this.tab === 'skills') (this.screens.skills as SkillsScreen).reset(); this.go(t.id); } }, ico(t.icon), h('span', { text: t.label }));
      this.navBtns.set(t.id, b);
      return b;
    }));
    mount(this.root, top, this.actbar, this.main, this.nav);
    this.go('battle');
    this.refreshTop(true);

    this.off = this.game.on((e) => this.onEvent(e));
    document.addEventListener('visibilitychange', this.onVis);
    window.addEventListener('pagehide', this.persist);
    if (Capacitor.isNativePlatform()) {
      void CapApp.addListener('backButton', () => this.onBack());
      void CapApp.addListener('appStateChange', (st) => { if (!st.isActive) this.persist(); });
    }
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
    if (offlineSeconds >= 20) this.applyOffline(offlineSeconds);
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.off?.();
    document.removeEventListener('visibilitychange', this.onVis);
    window.removeEventListener('pagehide', this.persist);
  }

  // ---------- navigation ----------
  go(tab: TabId) {
    this.tab = tab;
    for (const [id, sc] of Object.entries(this.screens)) sc.el.style.display = id === tab ? '' : 'none';
    for (const [id, b] of this.navBtns) b.classList.toggle('on', id === tab);
    this.screens[tab].show();
    const titles: Record<TabId, string> = { battle: 'Runeveil Odyssey', skills: 'Skills', heroes: 'Heroes', bag: 'Bag', quests: 'Quests', more: 'More' };
    this.topTitle.replaceChildren(titles[tab], h('small', { text: this.game.state.name }));
    this.refreshTop(true);
  }

  private onBack() {
    const ov = document.querySelectorAll('.overlay');
    if (ov.length) { ov[ov.length - 1].remove(); return; }
    if (this.tab !== 'battle') { this.go('battle'); return; }
    void CapApp.minimizeApp();
  }

  // ---------- loop ----------
  private frame = (t: number) => {
    if (!this.running) return;
    const dt = Math.min(0.5, (t - this.last) / 1000);
    this.last = t;
    if (!document.hidden) {
      this.game.tick(dt);
      this.uiAcc += dt;
      if (this.uiAcc >= 0.1) {
        this.uiAcc = 0;
        this.screens[this.tab].update();
        this.refreshTop(false);
      }
      this.saveAcc += dt;
      if (this.saveAcc >= 8) {
        this.saveAcc = 0;
        this.persist();
      }
    }
    this.raf = requestAnimationFrame(this.frame);
  };

  private persist = () => {
    void saveState(this.game.state);
  };

  private onVis = () => {
    if (document.hidden) {
      this.persist();
      audio.pause(true);
      return;
    }
    audio.pause(false);
    const away = (Date.now() - this.game.state.lastSeen) / 1000;
    this.last = performance.now();
    if (away >= 20) this.applyOffline(away);
  };

  private applyOffline(sec: number) {
    const g = this.game;
    const rep = g.simulate(Math.min(sec, 12 * 3600));
    g.state.lastSeen = Date.now();
    this.persist();
    this.screens[this.tab].show();
    this.refreshTop(true);
    if (rep.seconds >= 60 && g.state.settings.offlineNotice) this.offlineSheet(rep);
  }

  // ---------- header ----------
  refreshTop(force: boolean) {
    const s = this.game.state;
    if (force || s.gold !== this.lastGold) {
      if (s.gold > this.lastGold && this.lastGold >= 0) {
        const r = this.topGold.parentElement!;
        r.classList.remove('pulse'); void r.offsetWidth; r.classList.add('pulse');
      }
      this.lastGold = s.gold;
      this.topGold.replaceChildren(moneyEl(s.gold));
    }
    const a = s.activity;
    if (!a) {
      this.actbar.style.display = 'none';
    } else {
      this.actbar.style.display = 'flex';
      const rt = this.game.rt;
      if (a.type === 'combat') {
        const e = rt?.enemy;
        const act = this.game.activityName();
        const foe = e ? (MONSTERS[rt!.monsterId]?.name ?? '') : '';
        this.actName.textContent = `Fighting · ${act}${foe && foe !== act ? ` · ${foe}` : ''}`;
        setBar(this.actBar, e ? e.hp / e.maxHp : 0);
      } else {
        this.actName.textContent = `${a.type === 'gather' ? 'Gathering' : 'Crafting'} · ${this.game.activityName()}`;
        setBar(this.actBar, this.progressFrac());
      }
    }
    const rc = readyCount(s);
    const badge = String(rc);
    if (badge !== this.lastBadge) {
      this.lastBadge = badge;
      const b = this.navBtns.get('quests')!;
      b.querySelector('.dot')?.remove();
      if (rc > 0) b.append(h('i', { class: 'dot', text: String(rc) }));
    }
    this.syncHint();
  }

  private progressFrac(): number {
    const a = this.game.state.activity;
    if (!a || a.type === 'combat') return 0;
    const g = this.game;
    const time = (a.type === 'gather' ? GATHER_MAP[a.id]?.time : RECIPE_MAP[a.id]?.time) ?? 1;
    return Math.min(1, a.progress / g.actionTime(time));
  }

  private syncHint() {
    const s = this.game.state;
    const i = s.tutorial;
    if (i >= HINTS.length) { this.hintEl?.remove(); this.hintEl = null; return; }
    if (HINTS[i].done(s)) {
      s.tutorial++;
      this.hintEl?.remove();
      this.hintEl = null;
      return;
    }
    if (this.hintEl && this.hintEl.dataset.i === String(i)) return;
    this.hintEl?.remove();
    const hint = HINTS[i];
    this.hintEl = h('div', { class: 'hint', 'data-i': String(i) }, ico('img:ui_icon_flare'), h('div', { class: 'grow', text: hint.text }),
      h('button', { class: 'btn sm gold', text: 'Go', onclick: () => { this.go(hint.tab); } }),
      h('button', { class: 'x', style: 'width:26px;height:26px;font-size:12px', text: '✕', onclick: () => { s.tutorial = HINTS.length; this.hintEl?.remove(); this.hintEl = null; } }));
    document.body.appendChild(this.hintEl);
  }

  // ---------- events ----------
  private onEvent(e: GameEvent) {
    this.screens[this.tab].event?.(e);
    switch (e.t) {
      case 'level':
        toast(`${SKILL_MAP[e.skill].name} reached level ${e.level}!`, 'gold');
        audio.sfx('level_up', 0.8);
        break;
      case 'quest':
        if (e.what === 'ready') { toast('Quest complete! Claim your reward.', 'gold'); audio.sfx('quest_complete', 0.7); }
        else if (e.what === 'accepted') toast('New quest started', 'info');
        break;
      case 'zone': toast('A new zone has been unlocked!', 'gold'); break;
      case 'recruit': toast(`${HERO_MAP[e.id].name} joined your party!`, 'gold'); audio.sfx('quest_complete', 0.8); break;
      case 'stop':
        toast(e.reason, 'bad');
        this.refreshTop(true);
        if (this.tab === 'battle' || this.tab === 'skills') this.screens[this.tab].show();
        break;
      case 'toast': toast(e.text, e.kind === 'bad' ? 'bad' : e.kind === 'good' ? 'good' : 'info'); break;
      default: break;
    }
  }

  // ---------- offline report ----------
  private offlineSheet(rep: OfflineReport) {
    openSheet('Welcome back!', (body, close) => {
      const items = Object.entries(rep.items).filter(([id]) => ITEMS[id]).sort((a, b) => ITEMS[b[0]].tier - ITEMS[a[0]].tier || b[1] - a[1]);
      const best = [...rep.gear].sort((a, b) => b.rarity - a.rarity).slice(0, 12);
      const xp = Object.entries(rep.xp).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0)).slice(0, 5);
      add(body, 
        h('div', { class: 'center muted small', text: `${rep.activityName} for ${fmtTime(rep.seconds)}${rep.capped ? ' (12h limit)' : ''}` }),
        h('div', { class: 'grid g3', style: 'margin:10px 0' },
          this.stat('Coin', moneyText(rep.gold), 'img:ui_icon_gold'),
          rep.kills ? this.stat('Kills', fmt(rep.kills), 'img:ui_icon_attack') : this.stat('Actions', fmt(rep.actions), 'img:ui_icon_skill'),
          rep.bossKills ? this.stat('Bosses', fmt(rep.bossKills), 'img:ui_icon_crown') : this.stat('Items', fmt(items.reduce((n, [, c]) => n + c, 0)), 'img:ui_icon_inventory')),
        rep.wipes ? h('div', { class: 'chip bad', style: 'margin-bottom:8px', text: `Party was defeated ${rep.wipes} time${rep.wipes > 1 ? 's' : ''}` }) : null,
        rep.levelUps.length ? h('div', { class: 'card' }, ...rep.levelUps.map((l) => h('div', { class: 'statline' }, h('span', { text: SKILL_MAP[l.skill].name }), h('b', { class: 'gold', text: `Lv ${l.from} → ${l.to}` })))) : null,
        xp.length ? h('div', { class: 'small muted', text: 'XP: ' + xp.map(([k, v]) => `${SKILL_MAP[k as keyof typeof SKILL_MAP].name} +${fmt(v ?? 0)}`).join(' · ') }) : null,
        best.length ? h('h3', { text: `Gear found (${rep.gear.length})` }) : null,
        best.length ? h('div', { class: 'row', style: 'flex-wrap:wrap;gap:6px' }, ...best.map((i) => itemIcon(i.id, i, 'sm'))) : null,
        items.length ? h('h3', { text: 'Materials' }) : null,
        items.length ? h('div', { class: 'row', style: 'flex-wrap:wrap;gap:4px' }, ...items.slice(0, 16).map(([id, n]) => h('span', { class: 'cost', title: ITEMS[id].name }, ico(ITEMS[id].icon), fmt(n)))) : null,
        h('div', { class: 'sp' }),
        h('button', { class: 'btn gold block', text: 'Collect', onclick: () => { audio.sfx('coin'); close(); } }));
    }, { noX: true });
    audio.sfx('chest_open');
  }

  private stat(label: string, value: string, icon: string): HTMLElement {
    return h('div', { class: 'card center', style: 'margin:0;padding:8px 4px' }, ico(icon, 'lg'), h('div', { style: 'font-size:18px;font-weight:700', text: value }), h('div', { class: 'tiny muted', text: label }));
  }
}
