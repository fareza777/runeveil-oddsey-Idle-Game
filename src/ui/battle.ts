import { h, fmt, mount } from './dom';
import { ico, itemIcon, monsterSprite, setBar, bar, spriteEl, statusBadge } from './icons';
import { zoneBgUrl } from './bg';
import { openSheet, toast } from './modal';
import { audio, musicForZone } from './audio';
import { enemyList } from './bestiary';
import { huntsSheet, merchantSheet } from './hunts';
import { ArenaFx } from './fx';
import { huntStatus, merchantStatus } from '@/core/daily';
import { packAlive } from '@/core/combat';
import { buzz, danger, moneyEl, readiness } from './common';
import { host } from './host';
import type { Screen } from './screen';
import type { Fighter } from '@/core/combat';
import type { GameEvent } from '@/core/state';
import { BOSSES, ELEMENT_MAP, ITEMS, ZONES, ZONE_MAP, rarity } from '@/data';
import { countItem, heroDef } from '@/core/state';
import type { MonsterDef } from '@/core/types';

export class BattleScreen implements Screen {
  el = h('div', { class: 'screen flush' });
  private arena!: HTMLElement;
  private enemyWrap!: HTMLElement;
  private enemyBody!: HTMLElement;
  private enemyName!: HTMLElement;
  private enemyBar!: HTMLElement;
  private enemyStat!: HTMLElement;
  private zoneTag!: HTMLElement;
  private killTag!: HTMLElement;
  private fx!: HTMLElement;
  private heroEls: { root: HTMLElement; hp: HTMLElement; cd: HTMLElement; stat: HTMLElement; sig: string }[] = [];
  private info!: HTMLElement;
  private loadout!: HTMLElement;
  private ticker!: HTMLElement;
  private enemies!: HTMLElement;
  private enemiesSig = '';
  private shownEnemy = '';
  private shownVariant = '';
  private packSprites: HTMLElement[] = [];
  private badge!: HTMLElement;
  private shownZone = 0;
  private enemySig = '';
  private lastHurt = 0;
  private afx!: ArenaFx;
  private shotAt = 0;
  private shotDelay = 0;
  private lastKey = '';
  private partySize = 0;

  show() {
    const g = host.game;
    const zone = ZONE_MAP[this.currentZone()];
    this.shownZone = zone.id;
    this.shownEnemy = '';
    this.shownVariant = '';
    this.heroEls = [];

    this.zoneTag = h('div', { class: 'zonetag' });
    this.killTag = h('div', { class: 'killtag' });
    this.enemyName = h('div', { class: 'ename' });
    this.enemyBar = bar('hp tall', 1, '');
    this.enemyBar.className += ' ebar';
    this.enemyStat = h('div', { class: 'estat' });
    this.enemyBody = h('div', { class: 'body' });
    this.badge = h('div', { style: 'position:absolute;top:0;right:12%;z-index:6;display:flex;gap:4px' });
    this.enemyWrap = h('div', { class: 'enemy' }, this.enemyName, this.enemyBar, this.enemyStat, this.enemyBody, this.badge);
    this.fx = h('div', { class: 'fx' });
    this.partySize = g.state.heroes.length;
    const heroes = h('div', { class: 'heroes' }, ...g.state.heroes.map((_, i) => {
      const hd = heroDef(g.state, i);
      const hp = bar('hp ally', 1);
      const cd = bar('cd', 0);
      const stat = h('div', { class: 'hstat' });
      const root = h('div', { class: 'hero', style: `--d:${(i * 0.37).toFixed(2)}s` }, stat,
        h('div', { class: 'hb' }, spriteEl(hd.sprite, { zoom: 1.6, max: 118 })), hp, cd);
      this.heroEls.push({ root, hp, cd, stat, sig: '' });
      return root;
    }));
    this.arena = h('div', { class: 'arena' }, this.zoneTag, this.killTag, this.enemyWrap, heroes, this.fx);
    this.arena.style.backgroundImage = `url(${zoneBgUrl(zone)})`;
    this.afx = new ArenaFx(this.arena, this.fx);

    this.info = h('div', { class: 'card', style: 'margin:10px 12px 8px' });
    this.loadout = h('div', { class: 'row', style: 'margin:0 12px 6px;gap:8px' });
    this.ticker = h('div', { class: 'ticker', style: 'margin:0 8px' });
    this.enemies = h('div', { style: 'margin:10px 12px 0' });
    this.enemiesSig = '';
    mount(this.el, this.arena, this.info, this.loadout, this.enemies, h('div', { class: 'small muted', style: 'margin:10px 14px 0', text: 'Recent loot' }), this.ticker);
    this.renderInfo();
    this.renderLoadout();
    this.update();
    audio.playMusic(musicForZone(zone.id, !!g.rt?.boss));
  }

  private currentZone(): number {
    const g = host.game;
    const a = g.state.activity;
    if (a?.type === 'combat' && g.rt) return g.rt.zone;
    return g.state.zone;
  }

  private renderInfo() {
    const g = host.game;
    const s = g.state;
    const a = s.activity;
    const fighting = a?.type === 'combat';
    const zid = this.currentZone();
    const zone = ZONE_MAP[zid];
    const boss = BOSSES[zone.boss];
    const r = readiness(s, zid);
    const d = danger(r);
    const bossFight = fighting && g.rt?.boss;
    const actions = h('div', { class: 'row', style: 'margin-top:10px' });
    actions.append(h('button', { class: 'btn grow', text: 'Zones', onclick: () => this.zoneSheet() }));
    if (!fighting) {
      actions.append(h('button', { class: 'btn gold grow', text: 'Battle!', onclick: () => this.begin(`zone:${zid}`) }));
    } else if (bossFight) {
      actions.append(h('button', { class: 'btn red grow', text: 'Retreat', onclick: () => this.begin(`zone:${zid}`) }));
    } else {
      actions.append(h('button', { class: 'btn red grow', text: `Boss: ${boss.name}`, onclick: () => this.begin(boss.id) }));
    }
    const mer = merchantStatus(s);
    const hunt = huntStatus(s);
    const extra = h('div', { class: 'row', style: 'margin-top:6px' },
      h('button', { class: `btn sm grow ${hunt.open ? 'red' : ''}`, text: hunt.open ? 'Daily hunt is LIVE!' : 'Daily hunt', onclick: () => huntsSheet(() => this.show()) }),
      h('button', { class: `btn sm grow ${mer.open ? 'gold' : 'ghost'}`, text: mer.open ? 'Merchant is here!' : 'Merchant', onclick: () => merchantSheet(() => this.renderInfo()) }));
    if (fighting) actions.append(h('button', { class: 'btn ghost', text: 'Stop', onclick: () => { g.stop('You rest.'); host.refresh(); this.show(); } }));

    mount(this.info,
      h('div', { class: 'row' },
        h('div', { class: 'grow' }, h('b', { style: 'font-size:16px', text: zone.name }), h('div', { class: 'small muted', text: `Level ${zone.levelRange[0]}–${zone.levelRange[1]} · ${bossFight ? 'Boss fight' : fighting ? 'Hunting' : 'Resting'}` })),
        h('span', { class: `chip ${d.cls}`, text: `${d.label} ${Math.round(r * 100)}%` })),
      actions, extra);
    this.lastKey = this.key();
  }

  private key(): string {
    const g = host.game;
    return `${g.state.activity?.type}|${g.state.activity?.id}|${g.rt?.boss}|${g.state.zone}|${g.state.heroes.length}`;
  }

  private begin(id: string) {
    const g = host.game;
    const err = g.start('combat', id);
    if (err) { toast(err, 'bad'); return; }
    audio.sfx('ui_confirm');
    this.show();
    host.refresh();
  }

  private renderLoadout() {
    const g = host.game;
    const s = g.state;
    const slot = (kind: 'food' | 'potion', label: string) => {
      const id = s.loadout[kind];
      const have = id ? countItem(s, id) : 0;
      return h('div', { class: 'card tap grow row', style: 'margin:0;padding:6px 8px;gap:8px', onclick: () => this.pickConsumable(kind) },
        id && have > 0 ? itemIcon(id, undefined, 'sm') : h('span', { class: 'slotbox sm empty' }, ico(kind === 'food' ? 'img:ui_icon_gift' : 'img:ui_icon_flask')),
        h('div', { class: 'grow' }, h('div', { class: 'tiny muted', text: label }), h('div', { class: 'small', style: 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:110px', text: id && have > 0 ? `${ITEMS[id].name} ×${fmt(have)}` : 'None set' })));
    };
    mount(this.loadout, slot('food', `Auto-eat < ${Math.round(s.settings.autoEat * 100)}% HP`), slot('potion', s.settings.autoPotion ? 'Auto-potion' : 'Potion (off)'));
  }

  private pickConsumable(kind: 'food' | 'potion') {
    const g = host.game;
    const s = g.state;
    const list = Object.keys(s.stacks).filter((id) => {
      const d = ITEMS[id];
      return d && (kind === 'food' ? d.kind === 'food' : d.kind === 'potion' && d.buff);
    }).sort((a, b) => ITEMS[b].tier - ITEMS[a].tier);
    openSheet(kind === 'food' ? 'Choose food' : 'Choose potion', (body, close) => {
      if (!list.length) {
        body.append(h('div', { class: 'empty', text: kind === 'food' ? 'No food yet. Catch fish or hunt, then Cook it.' : 'No potions yet. Gather herbs and brew them with Alchemy.' }));
        return;
      }
      if (s.loadout[kind]) body.append(h('button', { class: 'btn ghost block', style: 'margin-bottom:8px', text: 'Clear slot', onclick: () => { g.setLoadout(kind, null); this.renderLoadout(); close(); } }));
      for (const id of list) {
        const d = ITEMS[id];
        body.append(h('div', { class: 'card tap item', onclick: () => { g.setLoadout(kind, id); this.renderLoadout(); close(); } }, itemIcon(id),
          h('div', { class: 'meta' }, h('b', { text: d.name }), h('span', { text: d.heal ? `Heals ${fmt(d.heal)}` : d.buff ? `${d.buff.status} ${Math.round(d.buff.potency * 100)}% · ${d.buff.duration}s` : '' })),
          h('span', { class: 'chip', text: `×${fmt(countItem(s, id))}` })));
      }
    });
  }

  private zoneSheet() {
    const g = host.game;
    openSheet('World map', (body, close) => {
      for (const z of ZONES) {
        const lockErr = g.canEnterZone(z.id);
        const boss = BOSSES[z.boss];
        const r = readiness(g.state, z.id);
        const d = danger(r);
        const wb = Object.values(BOSSES).find((b) => b.id.startsWith('wboss') && b.zone === z.id);
        const card = h('div', { class: `card ${lockErr ? 'locked' : ''} ${g.state.zone === z.id ? 'active' : ''}` },
          h('div', { class: 'zonecard' },
            h('div', { class: 'thumb', style: `background-image:url(${zoneBgUrl(z)})` }),
            h('div', { class: 'grow' },
              h('b', { text: `${z.id}. ${z.name}` }),
              h('div', { class: 'tiny muted', text: `Lv ${z.levelRange[0]}–${z.levelRange[1]} · ${lockErr ?? z.desc}`, style: 'display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden' })),
            lockErr ? null : h('span', { class: `chip ${d.cls}`, text: d.label })));
        if (!lockErr) {
          const killed = (g.state.bossKills[boss.id] ?? 0) > 0;
          card.append(h('div', { class: 'row', style: 'margin-top:8px;flex-wrap:wrap' },
            h('button', { class: 'btn sm grow', text: 'Enemies', onclick: () => openSheet(`${z.name} enemies`, (b2) => { b2.append(enemyList(z.id)); }) }),
            h('button', { class: 'btn sm gold grow', text: 'Fight here', onclick: () => { g.state.zone = z.id; this.go(`zone:${z.id}`, close); } }),
            h('button', { class: 'btn sm red grow', text: `${killed ? '✓ ' : ''}Boss ${boss.name}`, onclick: () => { g.state.zone = z.id; this.go(boss.id, close); } }),
            wb ? h('button', { class: 'btn sm ghost grow', text: `${(g.state.bossKills[wb.id] ?? 0) > 0 ? '✓ ' : ''}${wb.name}`, onclick: () => { g.state.zone = z.id; this.go(wb.id, close); } }) : null));
        }
        body.append(card);
      }
    });
  }

  private go(id: string, close: () => void) {
    const g = host.game;
    const err = g.start('combat', id);
    if (err) { toast(err, 'bad'); return; }
    close();
    audio.sfx('ui_confirm');
    host.refresh();
    this.show();
  }

  // ---------- per frame ----------
  update() {
    const g = host.game;
    const rt = g.rt;
    if (this.key() !== this.lastKey) {
      const z = this.currentZone();
      if (z !== this.shownZone || host.game.state.heroes.length !== this.partySize) { this.show(); return; }
      this.renderInfo();
    }
    const fighting = g.state.activity?.type === 'combat' && !!rt;
    const zone = ZONE_MAP[this.shownZone];
    this.syncEnemies(fighting ? rt!.enemyDef.id : undefined);
    this.zoneTag.replaceChildren(h('b', { text: zone.name }), `Lv ${zone.levelRange[0]}–${zone.levelRange[1]}`);
    mount(this.killTag, h('span', { class: 'muted', text: 'Kills ' }), fmt(fighting ? rt!.kills : 0), rt?.boss ? h('div', { class: 'bad', text: 'BOSS' }) : null);
    this.heroEls.forEach((he, i) => {
      const f = rt?.heroes[i];
      if (!f || !fighting) {
        setBar(he.hp, 1); setBar(he.cd, 0); he.root.classList.remove('down'); he.stat.replaceChildren();
        return;
      }
      setBar(he.hp, f.hp / f.maxHp);
      setBar(he.cd, 1 - Math.max(0, f.abilityTimer) / heroDef(host.game.state, i).ability.cd);
      he.root.classList.toggle('down', !f.alive);
      he.root.classList.toggle('low', f.alive && f.hp / f.maxHp < 0.3);
      this.syncStatuses(he, f);
    });
    if (!fighting) {
      if (this.shownEnemy !== '-') this.clearEnemy();
      return;
    }
    const e = rt!.enemy;
    const def = rt!.enemyDef;
    const variant = `${def.id}|${rt!.giant ? 'g' : ''}|${rt!.packN}`;
    if (e && this.shownVariant !== variant) { this.shownVariant = variant; this.setEnemy(def, false); }
    if (e && this.packSprites.length > 1) {
      const alive = packAlive(rt!);
      this.packSprites.forEach((sp, k) => { sp.style.visibility = k < alive ? 'visible' : 'hidden'; });
      this.badge.querySelector('.packbadge')?.replaceChildren(`x${alive}`);
    }
    if (e) {
      this.enemyWrap.classList.remove('dead');
      setBar(this.enemyBar, e.hp / e.maxHp, `${fmt(Math.max(0, e.hp))} / ${fmt(e.maxHp)}`);
      const sig = e.statuses.filter((s) => s.left > 0).map((s) => s.status + s.stacks).join(',');
      if (sig !== this.enemySig) {
        this.enemySig = sig;
        this.enemyStat.replaceChildren(...e.statuses.filter((s) => s.left > 0).map((s) => statusBadge(s.status, s.stacks)));
      }
    } else if (this.shownEnemy) {
      this.enemyWrap.classList.add('dead');
    }
  }

  private syncEnemies(activeId?: string) {
    const s = host.game.state;
    const zone = ZONE_MAP[this.shownZone];
    const ids = [...zone.monsters, zone.elite, zone.boss];
    const sig = `${this.shownZone}|${activeId ?? ''}|${ids.map((id) => `${s.codex.monsters[id] ? 1 : 0}${s.kills[id] ?? 0}`).join(',')}`;
    if (sig === this.enemiesSig) return;
    this.enemiesSig = sig;
    this.enemies.replaceChildren(enemyList(this.shownZone, activeId));
  }

  private syncStatuses(he: { stat: HTMLElement; sig: string; root: HTMLElement }, f: Fighter) {
    const live = f.statuses.filter((s) => s.left > 0);
    const sig = live.map((s) => s.status + s.stacks).join(',') + (f.shield > 0 ? 's' : '');
    if (sig === he.sig) return;
    he.sig = sig;
    he.stat.replaceChildren(...live.slice(0, 3).map((s) => statusBadge(s.status, s.stacks)));
  }

  private clearEnemy() {
    this.shownEnemy = '-';
    this.shownVariant = '';
    this.packSprites = [];
    this.badge.replaceChildren();
    this.enemyName.replaceChildren(h('span', { class: 'idletxt', text: 'Your party is resting' }));
    setBar(this.enemyBar, 0, '');
    this.enemyBar.style.visibility = 'hidden';
    this.enemyStat.replaceChildren();
    this.enemyBody.replaceChildren(h('div', { class: 'idletxt small center', style: 'align-self:center;margin:0 36px', text: 'Press Battle! to hunt monsters in this zone. Heroes keep fighting while you are away.' }));
  }

  private setEnemy(def: MonsterDef, _spawn: boolean) {
    this.shownEnemy = def.id;
    this.enemySig = '';
    this.enemyBar.style.visibility = 'visible';
    const boss = BOSSES[def.id];
    this.enemyName.replaceChildren(h('span', { style: `color:${def.boss ? '#ff9aa6' : def.elite ? '#ffd35a' : '#fff'}`, text: def.name }), h('em', { text: `Lv ${def.level}${boss ? ' · ' + boss.title : def.elite ? ' · Elite' : ''}${def.rare ? (def.rare === 'legendary' ? ' · LEGENDARY' : ' · RARE') : ''}` }));
    const rt = host.game.rt;
    const n = rt && !def.boss ? rt.packN : 1;
    const giant = !!rt?.giant;
    const zoom = giant ? 4.1 : n >= 4 ? 2.1 : n === 3 ? 2.4 : n === 2 ? 2.8 : 3.2;
    this.packSprites = Array.from({ length: n }, (_, k) => {
      const sp = monsterSprite(def, zoom);
      if (n > 1) { sp.style.margin = '0 -6px'; sp.style.animationDelay = `${(k * 0.3).toFixed(1)}s`; }
      return sp;
    });
    this.enemyBody.replaceChildren(...this.packSprites);
    this.badge.replaceChildren(...[n > 1 ? h('span', { class: 'packbadge', style: 'position:static', text: `x${n}` }) : null, giant ? h('span', { class: 'giantbadge', style: 'position:static', text: 'GIANT' }) : null].filter(Boolean) as HTMLElement[]);
    this.enemyWrap.classList.remove('dead');
    this.enemyWrap.classList.add('spawn');
    this.enemyWrap.classList.toggle('aura-rare', def.rare === 'rare');
    this.enemyWrap.classList.toggle('aura-legend', def.rare === 'legendary');
    this.enemyWrap.classList.toggle('aura-boss', !!def.boss && !def.rare);
    setTimeout(() => this.enemyWrap.classList.remove('spawn'), 320);
    if (!host.game.state.settings.reduceMotion) {
      window.setTimeout(() => {
        const feet = this.afx.at(this.enemyBody, 0.95);
        this.afx.burst(feet, '#b9a98a', giant || def.boss ? 14 : 7, giant || def.boss ? 60 : 34, { ms: 520, size: 5 });
        this.afx.ring(feet, '#d8c9a8', giant || def.boss ? 150 : 80, 480, true);
        if (def.boss || giant) this.afx.shake(giant && !def.boss ? 4 : 6, 300);
        if (def.rare) {
          this.afx.flash(def.rare === 'legendary' ? '#ff8a2a' : '#a24dff', 0.4, 900);
          this.banner(`${def.name}`, true);
        }
      }, 60);
    }
    if (def.boss) audio.playMusic('m_boss');
  }

  // ---------- events ----------
  event(e: GameEvent) {
    const g = host.game;
    const reduce = g.state.settings.reduceMotion;
    switch (e.t) {
      case 'dmg': {
        const col = e.elem === 'physical' ? '#ffe9b0' : ELEMENT_MAP[e.elem]?.color ?? '#ffe9b0';
        if (e.side === 'enemy') {
          // Ranged shots land a moment after the swing event, so the impact waits for them.
          const wait = performance.now() - this.shotAt < 60 ? this.shotDelay : 0;
          if (!e.miss && !e.heal) {
            const impact = () => {
              this.enemyWrap.classList.remove('hit', 'hitc');
              if (!reduce) {
                void this.enemyWrap.offsetWidth; this.enemyWrap.classList.add(e.crit ? 'hitc' : 'hit');
                const p = this.afx.at(this.enemyBody, 0.5);
                this.afx.burst(p, col, e.crit ? 16 : 6, e.crit ? 54 : 32);
                if (e.crit) {
                  this.afx.star(p, '#ffe27a', 92); this.afx.ring(p, col, 72); this.afx.shake(4, 220);
                } else if (e.elem !== 'physical') this.afx.ring(p, col, 40, 300);
              }
            };
            if (wait && !reduce) window.setTimeout(impact, wait); else impact();
            audio.sfx(e.crit ? 'hit_heavy' : 'hit', 0.6, e.crit ? 150 : 110);
          }
          if (wait && !reduce) window.setTimeout(() => this.floatNum(this.enemyBody, e, 50 + (Math.random() - 0.5) * 30), wait);
          else this.floatNum(this.enemyBody, e, 50 + (Math.random() - 0.5) * 30);
        } else {
          const he = this.heroEls[e.idx];
          if (he) {
            if (!e.miss && !e.heal) {
              he.root.classList.remove('hit');
              if (!reduce) {
                void he.root.offsetWidth; he.root.classList.add('hit');
                const p = this.afx.at(he.root, 0.45);
                this.afx.burst(p, '#ff6a6a', 5, 26);
                this.afx.shake(e.crit ? 5 : 2.5, 200);
                this.afx.flash('#ff2a3a', e.crit ? 0.3 : 0.14, 300);
              }
              const now = performance.now();
              if (now - this.lastHurt > 300) { this.lastHurt = now; audio.sfx('player_hurt', 0.5); buzz('light'); }
            } else if (e.heal && !reduce) {
              this.afx.burst(this.afx.at(he.root, 0.6), '#7dffa0', 6, 28, { up: true, size: 5, ms: 650 });
              this.afx.ring(this.afx.at(he.root, 0.92), '#7dffa0', 60, 500, true);
            }
            this.floatNum(he.root, e, 50);
          }
        }
        break;
      }
      case 'swing': if (!reduce) this.swing(e); break;
      case 'ability': {
        audio.sfx('cast', 0.8, 150);
        const he = this.heroEls[e.idx];
        if (he && !reduce) {
          he.root.classList.remove('cast'); void he.root.offsetWidth; he.root.classList.add('cast');
          this.floatText(he.root, e.name);
          const feet = this.afx.at(he.root, 0.92);
          this.afx.ring(feet, '#ffd45a', 90, 600, true);
          this.afx.ring(feet, '#fff3b0', 54, 450, true);
          this.afx.burst(this.afx.at(he.root, 0.7), '#ffd45a', 12, 44, { up: true, size: 5, ms: 700 });
          this.afx.flash('#ffd45a', 0.16, 380);
        } else if (e.idx < 0) {
          this.banner(e.name, true);
          if (!reduce) {
            this.afx.flash('#ff2a3a', 0.34, 520);
            this.afx.shake(7, 360);
            this.afx.ring(this.afx.at(this.enemyBody, 0.6), '#ff5a6a', 120, 560);
          }
        }
        break;
      }
      case 'kill': {
        audio.sfx(e.boss ? 'boss_death' : 'enemy_death', 0.7);
        if (!reduce) {
          const p = this.afx.at(this.enemyBody, 0.55);
          this.afx.burst(p, '#ffe9b0', e.boss ? 26 : 12, e.boss ? 90 : 52, { ms: 600, size: 5 });
          this.afx.burst(p, '#f2c75c', e.boss ? 14 : 6, e.boss ? 70 : 40, { ms: 700 });
          this.afx.ring(p, '#ffe9b0', e.boss ? 150 : 84, e.boss ? 620 : 420);
          if (e.boss) { this.afx.shake(9, 420); this.afx.flash('#ffffff', 0.4, 520); }
        }
        break;
      }
      case 'boss':
        if (e.first) { this.banner('Boss defeated!'); audio.sfx('quest_complete'); buzz('heavy'); }
        break;
      case 'wipe':
        this.banner(e.final ? 'Defeated' : 'Party down!', true);
        audio.sfx('player_death');
        break;
      case 'zone': this.banner('New zone unlocked!'); break;
      case 'item': this.tick(h('div', {}, ico(ITEMS[e.id]?.icon ?? 'img:ui_icon_gift', 'sm'), `+${fmt(e.n)} ${ITEMS[e.id]?.name ?? e.id}`)); break;
      case 'gear': {
        const r = rarity(e.inst.rarity);
        this.tick(h('div', {}, itemIcon(e.inst.id, e.inst, 'sm'), h('span', { style: `color:${r.color}`, text: `${r.name} ${ITEMS[e.inst.id].name}` })));
        if (e.inst.rarity >= 10) audio.sfx('loot_legendary'); else if (e.inst.rarity >= 4) audio.sfx('loot_rare', 0.7);
        break;
      }
      case 'gold': this.tick(h('div', { class: 'gold' }, '+', moneyEl(e.n))); break;
      case 'sold': this.tick(h('div', { class: 'muted' }, `Auto-sold ${e.n} for `, moneyEl(e.gold))); break;
      case 'heroLevel': toast(`${heroDef(g.state, e.idx).name} reached level ${e.level}`, 'good'); audio.sfx('level_up'); break;
      case 'food': audio.sfx('heal', 0.5); this.floatText(this.heroEls[e.idx]?.root ?? this.arena, 'Ate ' + (ITEMS[e.item]?.name ?? '')); break;
      default: break;
    }
  }

  /** Attack animation: the attacker dashes or recoils, and a slash or comet reaches the target. */
  private swing(e: Extract<GameEvent, { t: 'swing' }>) {
    const col = ELEMENT_MAP[e.elem]?.color ?? '#ffffff';
    if (e.side === 'hero') {
      const he = this.heroEls[e.idx];
      if (!he) return;
      const hb = he.root.querySelector('.hb') as HTMLElement | null;
      const from = this.afx.at(he.root, 0.28);
      const to = this.afx.at(this.enemyBody, 0.5);
      const dx = to.x - from.x; const dy = to.y - from.y;
      if (e.style === 'melee') {
        if (hb) this.afx.lunge(hb, dx * 0.5, dy * 0.55, 360);
        window.setTimeout(() => this.afx.slash(to, col === '#ffffff' ? '#fff6d8' : col, e.idx % 2 === 1, 88), 120);
        this.shotAt = performance.now(); this.shotDelay = 130;
      } else {
        if (hb) this.afx.lunge(hb, -dx * 0.03, 4, 300);
        const ms = e.style === 'ranged' ? 260 : 330;
        const c = e.style === 'ranged' ? '#f0e6c8' : col === '#ffffff' ? '#b9a6ff' : col;
        this.afx.burst({ x: from.x + 10, y: from.y }, c, 4, 18, { ms: 300, size: 3 });
        this.afx.shot(from, to, c, e.style === 'ranged' ? 'arrow' : 'magic', ms, () => {});
        this.shotAt = performance.now(); this.shotDelay = ms * 0.88;
      }
    } else {
      const he = this.heroEls[e.idx];
      const body = this.enemyBody.querySelector('.sprite') as HTMLElement | null;
      const from = this.afx.at(this.enemyBody, 0.5);
      const to = he ? this.afx.at(he.root, 0.45) : from;
      if (body) this.afx.lunge(body, (to.x - from.x) * 0.22, (to.y - from.y) * 0.3, 380);
      if (he) {
        const c = col === '#ffffff' ? '#ff8a8a' : col;
        window.setTimeout(() => this.afx.slash(to, c, true, 72), 140);
      }
    }
  }

  private tick(row: HTMLElement) {
    if (!this.ticker) return;
    this.ticker.prepend(row);
    while (this.ticker.children.length > 6) this.ticker.lastElementChild?.remove();
  }

  private floatNum(parent: HTMLElement, e: Extract<GameEvent, { t: 'dmg' }>, leftPct: number) {
    if (this.fx.childElementCount > 24) return;
    const r = parent.getBoundingClientRect();
    const a = this.arena.getBoundingClientRect();
    const txt = e.text ?? (e.heal ? `+${fmt(e.n)}` : fmt(e.n));
    const cls = e.miss ? 'miss' : e.text ? 'text' : e.heal ? 'heal' : e.side === 'hero' ? 'hurt' : e.crit ? 'crit' : '';
    const n = h('div', { class: `num ${cls}`, text: e.crit && !e.heal ? `${txt}!` : txt });
    n.style.left = `${r.left - a.left + (r.width * leftPct) / 100}px`;
    n.style.top = `${r.top - a.top + Math.min(r.height * 0.3, 40) + (Math.random() - 0.5) * 14}px`;
    if (e.elem !== 'physical' && !e.heal && !e.miss && e.side === 'enemy' && !e.crit) n.style.color = '#ffd9a0';
    this.fx.appendChild(n);
    setTimeout(() => n.remove(), 950);
  }

  private floatText(parent: HTMLElement, text: string) {
    if (this.fx.childElementCount > 24) return;
    const r = parent.getBoundingClientRect();
    const a = this.arena.getBoundingClientRect();
    const n = h('div', { class: 'num text', text });
    n.style.left = `${r.left - a.left + r.width / 2}px`;
    n.style.top = `${r.top - a.top - 8}px`;
    this.fx.appendChild(n);
    setTimeout(() => n.remove(), 950);
  }

  private banner(text: string, bad = false) {
    const b = h('div', { class: `banner ${bad ? 'bad' : ''}`, text });
    if (text.length > 16) b.style.fontSize = text.length > 24 ? '19px' : '24px';
    this.arena.appendChild(b);
    setTimeout(() => b.remove(), 1850);
  }

  refreshLoadout() { this.renderLoadout(); }
}
