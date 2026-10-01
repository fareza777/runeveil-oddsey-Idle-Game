import type { GameState, ItemInstance, MonsterDef, OfflineReport, RecipeDef, Slot, SkillId } from './types';
import { GATHER_MAP, HEROES, ITEMS, MONSTERS, RECIPE_MAP, ZONE_MAP, ZONES, rarity } from '@/data';
import { combatStep, createCombat, refreshHeroes, type CombatRt } from './combat';
import { MAX_UP, itemStats, partyLuck, skillBonuses } from './stats';
import { mulberry32 } from './rng';
import { rollEntry, rarityQ, rollRarity } from './loot';
import { gatherEvent, questEvent, refreshQuests } from './questSys';
import {
  addGear, addGold, addItem, countItem, gainXp, itemSellPrice, newGear, sellPrice, takeItem, type Ctx, type GameEvent,
} from './state';

export const OFFLINE_CAP = 12 * 3600;
const STEP = 0.25;

export type Listener = (e: GameEvent) => void;

export class Game {
  state: GameState;
  rt: CombatRt | null = null;
  private listeners: Listener[] = [];
  private rng: () => number;
  private acc = 0;
  private qAcc = 0;
  private collector: ((e: GameEvent) => void) | null = null;

  constructor(state: GameState) {
    this.state = state;
    this.rng = mulberry32((state.seed ^ Math.floor(state.playTime * 1000)) >>> 0);
    if (state.activity?.type === 'combat') this.buildCombat();
    refreshQuests(state);
  }

  on(fn: Listener): () => void {
    this.listeners.push(fn);
    return () => (this.listeners = this.listeners.filter((l) => l !== fn));
  }

  private emit = (e: GameEvent) => {
    if (this.collector) this.collector(e);
    else for (const l of this.listeners) l(e);
  };

  get ctx(): Ctx {
    return { emit: this.emit, rng: this.rng };
  }

  toast(text: string, kind: 'good' | 'bad' | 'info' = 'info') {
    this.emit({ t: 'toast', text, kind });
  }

  // ---------- activity control ----------
  actionTime(base: number): number {
    const b = skillBonuses(this.state);
    return Math.max(base * 0.4, base * (1 - b.speedPct / 100));
  }

  canEnterZone(zone: number): string | null {
    const z = ZONE_MAP[zone];
    if (!z) return 'Unknown zone';
    if (zone > this.state.zoneUnlocked) return 'Defeat the previous zone boss first';
    if (this.state.skills.exploration < z.reqExploration) return `Needs Exploration level ${z.reqExploration}`;
    return null;
  }

  start(type: 'gather' | 'craft' | 'combat', id: string): string | null {
    const s = this.state;
    if (type === 'gather') {
      const g = GATHER_MAP[id];
      if (!g) return 'Unknown activity';
      if (s.skills[g.skill] < g.level) return `Needs level ${g.level}`;
      if (g.skill === 'exploration') {
        const zone = Number(id.split('_')[1]);
        if (zone > s.zoneUnlocked) return 'Unlock that zone first';
      }
    } else if (type === 'craft') {
      const r = RECIPE_MAP[id];
      if (!r) return 'Unknown recipe';
      if (s.skills[r.skill] < r.level) return `Needs level ${r.level}`;
      if (!this.canAfford(r)) return 'Missing materials';
    } else {
      const isZone = id.startsWith('zone:');
      const m = isZone ? null : MONSTERS[id];
      const zone = isZone ? Number(id.slice(5)) : m?.zone;
      if (!zone) return 'Unknown target';
      const err = this.canEnterZone(zone);
      if (err && !(m?.boss && id.startsWith('wboss') && zone <= s.zoneUnlocked)) return err;
    }
    s.activity = { type, id, progress: 0, boss: type === 'combat' && !id.startsWith('zone:') && !!MONSTERS[id]?.boss };
    if (type === 'combat') this.buildCombat();
    else this.rt = null;
    this.emit({ t: 'toast', text: 'Activity started', kind: 'info' });
    return null;
  }

  stop(reason = 'Stopped') {
    this.state.activity = null;
    this.rt = null;
    this.emit({ t: 'stop', reason });
  }

  private buildCombat() {
    const a = this.state.activity!;
    const isZone = a.id.startsWith('zone:');
    const zoneId = isZone ? Number(a.id.slice(5)) : MONSTERS[a.id].zone;
    const zone = ZONE_MAP[zoneId];
    const first = isZone ? MONSTERS[zone.monsters[0]] : MONSTERS[a.id];
    const rt = createCombat(this.state, zoneId, !isZone && !!first.boss, first.id);
    if (isZone) {
      rt.chooser = (rng) => {
        const r = rng();
        if (r < 0.07) return MONSTERS[zone.elite];
        return MONSTERS[zone.monsters[Math.floor(rng() * zone.monsters.length)]];
      };
    }
    this.rt = rt;
  }

  refreshStats() {
    if (this.rt) refreshHeroes(this.state, this.rt);
  }

  // ---------- crafting helpers ----------
  canAfford(r: RecipeDef): boolean {
    const s = this.state;
    if ((r.gold ?? 0) > s.gold) return false;
    return r.inputs.every((i) => countItem(s, i.item) >= i.n);
  }

  // ---------- simulation ----------
  tick(realDt: number): OfflineReport | null {
    if (realDt > 20) {
      const rep = this.simulate(Math.min(realDt, OFFLINE_CAP));
      return rep;
    }
    this.acc += realDt;
    let guard = 0;
    while (this.acc >= STEP && guard++ < 80) {
      this.acc -= STEP;
      this.advance(STEP);
    }
    return null;
  }

  advance(dt: number) {
    const s = this.state;
    s.playTime += dt;
    s.clock += dt;
    this.qAcc += dt;
    if (this.qAcc >= 1) {
      this.qAcc = 0;
      refreshQuests(s, this.ctx);
    }
    const a = s.activity;
    if (!a) {
      this.tickGlobals(dt);
      return;
    }
    if (a.type === 'combat') {
      if (!this.rt) this.buildCombat();
      const res = combatStep(s, this.rt!, dt, this.ctx);
      if (res === 'stopped') this.stop('Your party was defeated. Visit Heroes to improve gear, then try again.');
      return;
    }
    this.tickGlobals(dt);
    if (a.type === 'gather') this.advanceGather(dt);
    else this.advanceCraft(dt);
  }

  private tickGlobals(dt: number) {
    const s = this.state;
    for (const b of s.buffs) b.left -= dt;
    if (s.buffs.some((b) => b.left <= 0)) s.buffs = s.buffs.filter((b) => b.left > 0);
    if (s.xpBoost) {
      s.xpBoost.left -= dt;
      if (s.xpBoost.left <= 0) s.xpBoost = null;
    }
  }

  private advanceGather(dt: number) {
    const s = this.state;
    const a = s.activity!;
    const g = GATHER_MAP[a.id];
    const time = this.actionTime(g.time);
    a.progress += dt;
    let guard = 0;
    while (a.progress >= time && s.activity && guard++ < 5000) {
      a.progress -= time;
      this.completeGather(g.id);
    }
  }

  private completeGather(id: string) {
    const s = this.state;
    const g = GATHER_MAP[id];
    const ctx = this.ctx;
    const lv = s.skills[g.skill];
    const luck = 1 + partyLuck(s) / 300;
    const gained: Record<string, number> = {};
    const track = (e: GameEvent) => {
      if (e.t === 'item') gained[e.id] = (gained[e.id] ?? 0) + e.n;
      ctx.emit(e);
    };
    const tctx: Ctx = { emit: track, rng: this.rng };
    g.drops.forEach((d, i) => {
      if (i === 0 && g.skill !== 'exploration') {
        const n = (d.min ?? 1) + Math.floor(this.rng() * ((d.max ?? d.min ?? 1) - (d.min ?? 1) + 1));
        const dbl = this.rng() < Math.min(0.5, lv * 0.004) ? 2 : 1;
        addItem(s, d.item, n * dbl, tctx);
      } else rollEntry(s, d, i === 0 ? 1 : luck, 3 + Math.floor(lv / 10), 0.5, tctx);
    });
    gainXp(s, g.skill, g.xp, ctx);
    s.gatherCounts[g.id] = (s.gatherCounts[g.id] ?? 0) + 1;
    s.stats.gathers = (s.stats.gathers ?? 0) + 1;
    gatherEvent(s, g.id, gained);
    ctx.emit({ t: 'action', kind: 'gather', id });
  }

  private advanceCraft(dt: number) {
    const s = this.state;
    const a = s.activity!;
    const r = RECIPE_MAP[a.id];
    const time = this.actionTime(r.time);
    let guard = 0;
    a.progress += dt;
    while (a.progress >= time && s.activity && guard++ < 5000) {
      if (!this.canAfford(r)) {
        this.stop('Out of materials');
        return;
      }
      a.progress -= time;
      this.completeCraft(r);
    }
    if (s.activity && a.progress > 0 && !this.canAfford(r)) {
      a.progress = 0;
      this.stop('Out of materials');
    }
  }

  completeCraft(r: RecipeDef) {
    const s = this.state;
    const ctx = this.ctx;
    for (const i of r.inputs) takeItem(s, i.item, i.n);
    if (r.gold) s.gold -= r.gold;
    for (const o of r.out) {
      const def = ITEMS[o.item];
      if (def.kind === 'equip' || def.kind === 'rune') {
        for (let k = 0; k < o.n; k++) {
          const lv = s.skills[r.skill];
          const q = Math.max(0.1, Math.min(0.6, 0.12 + lv * 0.004 + partyLuck(s) / 800 + skillBonuses(s).rarityPct / 400));
          const maxR = Math.min(25, 2 + Math.floor(def.tier * 1.1));
          addGear(s, newGear(s, o.item, rollRarity(this.rng, maxR, q)), ctx);
        }
      } else addItem(s, o.item, o.n, ctx);
    }
    if (r.outGold) addGold(s, r.outGold * (1 + skillBonuses(s).goldPct / 100), ctx);
    gainXp(s, r.skill, r.xp, ctx);
    s.stats.crafts = (s.stats.crafts ?? 0) + 1;
    questEvent(s, 'craft', r.id);
    ctx.emit({ t: 'action', kind: 'craft', id: r.id });
  }

  // ---------- offline ----------
  simulate(seconds: number): OfflineReport {
    const s = this.state;
    const cap = Math.min(seconds, OFFLINE_CAP);
    const rep: OfflineReport = {
      seconds: cap, capped: seconds > OFFLINE_CAP, items: {}, gear: [], gold: 0, xp: {}, kills: 0, bossKills: 0, wipes: 0, actions: 0, levelUps: [], activityName: this.activityName(),
    };
    const lvStart: Partial<Record<SkillId, number>> = {};
    this.collector = (e) => {
      switch (e.t) {
        case 'item': rep.items[e.id] = (rep.items[e.id] ?? 0) + e.n; break;
        case 'gear': rep.gear.push(e.inst); break;
        case 'gold': rep.gold += e.n; break;
        case 'sold': rep.gold += e.gold; break;
        case 'xp': rep.xp[e.skill] = (rep.xp[e.skill] ?? 0) + e.n; break;
        case 'level': {
          lvStart[e.skill] ??= e.from;
          const ex = rep.levelUps.find((l) => l.skill === e.skill);
          if (ex) ex.to = e.level;
          else rep.levelUps.push({ skill: e.skill, from: e.from, to: e.level });
          break;
        }
        case 'kill': rep.kills++; if (e.boss) rep.bossKills++; break;
        case 'wipe': rep.wipes++; break;
        case 'action': rep.actions++; break;
        default: break;
      }
    };
    try {
      let left = cap;
      const combat = s.activity?.type === 'combat';
      const step = combat ? 1 : 30;
      while (left > 0.001) {
        const dt = Math.min(step, left);
        left -= dt;
        this.advance(dt);
        if (!s.activity) {
          // activity ended early (out of mats / defeated)
          s.playTime += left;
          break;
        }
      }
    } finally {
      this.collector = null;
    }
    if (rep.gear.length > 40) rep.gear = rep.gear.slice(-40);
    return rep;
  }

  activityName(): string {
    const a = this.state.activity;
    if (!a) return 'Idle';
    if (a.type === 'gather') return GATHER_MAP[a.id]?.name ?? a.id;
    if (a.type === 'craft') return RECIPE_MAP[a.id]?.name ?? a.id;
    if (a.id.startsWith('zone:')) return ZONES[Number(a.id.slice(5)) - 1]?.name ?? 'Battle';
    return MONSTERS[a.id]?.name ?? 'Battle';
  }

  // ---------- equipment ----------
  findGear(uid: string): ItemInstance | undefined {
    return this.state.gear.find((g) => g.uid === uid);
  }

  equip(heroIdx: number, uid: string): boolean {
    const s = this.state;
    const inst = this.findGear(uid);
    if (!inst) return false;
    const slot = ITEMS[inst.id].slot as Slot | undefined;
    if (!slot) return false;
    const h = s.heroes[heroIdx];
    const old = h.equip[slot];
    s.gear = s.gear.filter((g) => g.uid !== uid);
    if (old) s.gear.push(old);
    h.equip[slot] = inst;
    this.refreshStats();
    return true;
  }

  unequip(heroIdx: number, slot: Slot): boolean {
    const h = this.state.heroes[heroIdx];
    const inst = h.equip[slot];
    if (!inst) return false;
    this.state.gear.push(inst);
    delete h.equip[slot];
    this.refreshStats();
    return true;
  }

  sellGear(uids: string[]): number {
    const s = this.state;
    let total = 0;
    const set = new Set(uids);
    s.gear = s.gear.filter((g) => {
      if (!set.has(g.uid)) return true;
      total += sellPrice(s, g);
      return false;
    });
    addGold(s, total, this.ctx);
    this.emit({ t: 'sold', n: set.size, gold: total });
    return total;
  }

  sellItem(id: string, n: number): number {
    const s = this.state;
    const have = countItem(s, id);
    const count = Math.min(n, have);
    if (count <= 0) return 0;
    const price = itemSellPrice(s, id) * count;
    takeItem(s, id, count);
    addGold(s, price, this.ctx);
    s.stats.itemsSold = (s.stats.itemsSold ?? 0) + count;
    return price;
  }

  upgradeChance(inst: ItemInstance): number {
    return Math.max(0.25, 1 - inst.up * 0.075);
  }

  scrollFor(inst: ItemInstance): string | null {
    const need = Math.ceil(ITEMS[inst.id].tier / 2.5);
    for (let k = Math.max(1, need); k <= 8; k++) if (countItem(this.state, `scroll_${k}`) > 0) return `scroll_${k}`;
    return null;
  }

  upgradeCost(inst: ItemInstance): number {
    return Math.round(ITEMS[inst.id].value * 2 * (1 + inst.up) * rarity(inst.rarity).value * 0.2 + 20);
  }

  upgradeGear(uid: string): 'ok' | 'fail' | 'noscroll' | 'nogold' | 'max' {
    const s = this.state;
    let inst = this.findGear(uid);
    if (!inst) inst = s.heroes.flatMap((h) => Object.values(h.equip)).find((g) => g?.uid === uid) as ItemInstance | undefined;
    if (!inst) return 'max';
    if (inst.up >= MAX_UP) return 'max';
    const scroll = this.scrollFor(inst);
    if (!scroll) return 'noscroll';
    const cost = this.upgradeCost(inst);
    if (s.gold < cost) return 'nogold';
    s.gold -= cost;
    takeItem(s, scroll, 1);
    s.stats.upgrades = (s.stats.upgrades ?? 0) + 1;
    if (this.rng() < this.upgradeChance(inst)) {
      inst.up++;
      gainXp(s, 'enchanting', 20 + inst.up * 15, this.ctx);
      this.refreshStats();
      return 'ok';
    }
    if (inst.up >= 5) inst.up--;
    this.refreshStats();
    return 'fail';
  }

  useItem(id: string): string | null {
    const s = this.state;
    const def = ITEMS[id];
    if (!def || countItem(s, id) <= 0) return 'None left';
    if (def.xpBoost) {
      takeItem(s, id, 1);
      s.xpBoost = { skill: 'all', pct: def.xpBoost.pct, left: def.xpBoost.duration };
      this.toast(`${def.name} active: +${Math.round(def.xpBoost.pct * 100)}% XP`, 'good');
      return null;
    }
    if (def.buff) {
      takeItem(s, id, 1);
      s.buffs = s.buffs.filter((b) => b.src !== id);
      s.buffs.push({ status: def.buff.status, potency: def.buff.potency, left: def.buff.duration, src: id });
      this.toast(`${def.name} consumed`, 'good');
      return null;
    }
    return 'Cannot be used directly';
  }

  setLoadout(kind: 'food' | 'potion', id: string | null) {
    this.state.loadout[kind] = id;
  }

  gearScore(inst: ItemInstance): number {
    const st = this.statsOf(inst);
    return (st.atk ?? 0) * 3 + (st.def ?? 0) * 2 + (st.hp ?? 0) * 0.3 + (st.crit ?? 0) * 2 + (st.haste ?? 0) + (st.regen ?? 0) * 2 + (st.res ?? 0) + (st.luck ?? 0) * 0.5 + (st.eva ?? 0);
  }

  private statsOf(inst: ItemInstance) {
    return itemStats(inst);
  }

  autoEquipBest(heroIdx: number): number {
    const s = this.state;
    let changed = 0;
    const slots: Slot[] = ['weapon', 'offhand', 'head', 'body', 'legs', 'hands', 'feet', 'neck', 'ring', 'rune'];
    for (const slot of slots) {
      const cur = s.heroes[heroIdx].equip[slot];
      const candidates = s.gear.filter((g) => ITEMS[g.id].slot === slot && this.fitsHero(heroIdx, g));
      let best = cur;
      let bestScore = cur ? this.gearScore(cur) : -1;
      for (const c of candidates) {
        const sc = this.gearScore(c);
        if (sc > bestScore) { best = c; bestScore = sc; }
      }
      if (best && best !== cur) {
        this.equip(heroIdx, best.uid);
        changed++;
      }
    }
    return changed;
  }

  fitsHero(heroIdx: number, g: ItemInstance): boolean {
    const def = ITEMS[g.id];
    if (def.slot === 'weapon' && def.style) return def.style === heroStyle(heroIdx);
    return true;
  }

  monsterOf(id: string): MonsterDef | undefined {
    return MONSTERS[id];
  }

  luckPct(): number { return partyLuck(this.state); }
  rarityRollQ(): number { return rarityQ(this.state); }
}

const heroStyle = (i: number) => HEROES[i].style;

