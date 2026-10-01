import { add, h, fmt, fmtTime, mount, setFullNumbers } from './dom';
import { ico, itemIcon, monsterSprite } from './icons';
import { confirmBox, openSheet, toast } from './modal';
import { audio } from './audio';
import { host } from './host';
import type { Screen } from './screen';
import { BOSSES, ITEMS, MONSTERS, RARITIES, SKILLS, ZONES } from '@/data';
import { exportSave, importSave, clearSave, saveState } from '@/core/save';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { InAppReview } from '@capacitor-community/in-app-review';
import { partyPower } from '@/core/stats';
import { BAG_MAX } from '@/core/state';

export const APP_ID = 'com.runeveil.odyssey';
export const VERSION = '0.1.0';
export const STORE_URL = `https://play.google.com/store/apps/details?id=${APP_ID}`;

export class MoreScreen implements Screen {
  el = h('div', { class: 'screen' });

  show() {
    const g = host.game;
    const s = g.state;
    const done = s.quests.done.length;
    const row = (icon: string, title: string, sub: string, on: () => void, danger = false) =>
      h('div', { class: 'card tap item', onclick: () => { audio.sfx('ui_click'); on(); } }, ico(icon, 'lg'),
        h('div', { class: 'meta' }, h('b', { class: danger ? 'bad' : '', text: title }), h('span', { text: sub })), h('span', { class: 'muted', text: '›' }));

    mount(this.el,
      h('div', { class: 'card' },
        h('div', { class: 'item' }, h('img', { class: 'portrait', src: `${import.meta.env.BASE_URL}assets/gen/brand/rv_icon.png` }),
          h('div', { class: 'meta' }, h('b', { style: 'font-size:18px;font-family:var(--head);color:var(--gold)', text: s.name }),
            h('span', { text: `Zone ${s.zoneUnlocked} reached · ${done} quests · power ${fmt(partyPower(s))}` }),
            h('span', { text: `Played ${fmtTime(s.playTime)}` })))),
      h('h2', { text: 'Menu' }),
      row('img:ui_icon_codex', 'Codex', 'Monsters, bosses and items you have discovered', () => this.codex()),
      row('img:ui_icon_crown', 'Statistics', 'Your journey in numbers', () => this.stats()),
      row('img:ui_icon_settings', 'Settings', 'Sound, haptics, auto-eat, auto-sell', () => this.settings()),
      row('img:ui_icon_gift', 'Share', 'Invite friends to Runeveil Odyssey', () => void this.share()),
      row('img:ui_icon_flare', 'Rate the game', 'A rating helps a lot', () => void this.rate()),
      row('img:ui_icon_inventory', 'Save data', 'Export or import a backup code', () => this.saveSheet()),
      row('img:ui_icon_hero', 'About', `Version ${VERSION}`, () => this.about()),
      row('img:ui_icon_dash', 'New game', 'Erase progress and start over', () => this.newGame(), true));
  }

  update() { /* static */ }

  // ---------- sheets ----------
  private stats() {
    const s = host.game.state;
    const st = s.stats;
    const total = SKILLS.reduce((n, k) => n + s.skills[k.id], 0);
    const rows: [string, string][] = [
      ['Time played', fmtTime(s.playTime)], ['Total skill level', `${total} / ${SKILLS.length * 99}`], ['Monsters defeated', fmt(st.kills ?? 0)], ['Bosses defeated', fmt(st.bossKills ?? 0)],
      ['Party wipes', fmt(st.wipes ?? 0)], ['Resources gathered', fmt(st.gathers ?? 0)], ['Items crafted', fmt(st.crafts ?? 0)], ['Enhancements', fmt(st.upgrades ?? 0)],
      ['Gold earned', fmt(st.goldEarned ?? 0)], ['Items sold', fmt(st.itemsSold ?? 0)], ['Gear auto-sold', fmt(st.autoSold ?? 0)], ['Total XP gained', fmt(st.xpTotal ?? 0)],
      ['Items discovered', `${Object.keys(s.codex.items).length} / ${Object.keys(ITEMS).length}`], ['Monsters discovered', `${Object.keys(s.codex.monsters).length} / ${Object.keys(MONSTERS).length}`],
    ];
    openSheet('Statistics', (body) => add(body, h('div', { class: 'card kv' }, ...rows.flatMap(([a, b]) => [h('span', { text: a }), h('b', { text: b })]))));
  }

  private codex() {
    const g = host.game;
    const s = g.state;
    let tab: 'monsters' | 'items' = 'monsters';
    openSheet('Codex', (body) => {
      const render = () => {
        const seg = h('div', { class: 'seg' }, ...(['monsters', 'items'] as const).map((t) => h('button', { class: tab === t ? 'on' : '', text: t === 'monsters' ? `Monsters ${Object.keys(s.codex.monsters).length}/${Object.keys(MONSTERS).length}` : `Items ${Object.keys(s.codex.items).length}/${Object.keys(ITEMS).length}`, onclick: () => { tab = t; render(); } })));
        const list = h('div');
        if (tab === 'monsters') {
          for (const z of ZONES) {
            const ids = [...z.monsters, z.elite, z.boss];
            const seen = ids.filter((id) => s.codex.monsters[id]).length;
            list.append(h('div', { class: 'list-hd', style: 'margin:8px 0 4px' }, h('b', { class: 'grow', text: `${z.id}. ${z.name}` }), h('span', { class: 'tiny muted', text: `${seen}/${ids.length}` })));
            list.append(h('div', { class: 'grid g5' }, ...ids.map((id) => {
              const m = MONSTERS[id];
              const known = !!s.codex.monsters[id];
              const cell = h('div', { class: `slotbox ${known ? '' : 'empty'}`, style: 'width:100%;height:auto;aspect-ratio:1;overflow:hidden', onclick: () => known && this.monsterSheet(id) },
                known ? monsterSprite(m, 1) : h('span', { class: 'muted', text: '?' }));
              const img = cell.querySelector('img');
              if (img) { (img as HTMLElement).style.maxHeight = '80%'; (img as HTMLElement).style.height = 'auto'; (img as HTMLElement).style.maxWidth = '80%'; }
              return cell;
            })));
          }
        } else {
          const all = Object.values(ITEMS).sort((a, b) => a.tier - b.tier);
          list.append(h('div', { class: 'grid bag' }, ...all.map((d) => {
            const known = !!s.codex.items[d.id];
            const el = known ? itemIcon(d.id) : h('span', { class: 'slotbox empty' }, h('span', { class: 'muted', text: '?' }));
            if (known) el.addEventListener('click', () => toast(`${d.name} · tier ${d.tier}`, 'info'));
            return el;
          })));
        }
        mount(body, seg, list);
      };
      render();
    });
  }

  private monsterSheet(id: string) {
    const s = host.game.state;
    const m = MONSTERS[id];
    const b = BOSSES[id];
    openSheet(m.name, (body) => {
      add(body, 
        h('div', { class: 'center', style: 'min-height:120px;display:flex;align-items:flex-end;justify-content:center;margin-bottom:8px' }, monsterSprite(m, 2.4)),
        h('div', { class: 'row', style: 'flex-wrap:wrap;gap:4px;justify-content:center' },
          h('span', { class: 'chip', text: `Lv ${m.level}` }), h('span', { class: 'chip', text: m.element }), m.weak ? h('span', { class: 'chip good', text: `weak: ${m.weak}` }) : null,
          m.resist ? h('span', { class: 'chip bad', text: `resists: ${m.resist}` }) : null, m.inflicts ? h('span', { class: 'chip gold', text: `inflicts ${m.inflicts.status}` }) : null,
          h('span', { class: 'chip', text: `defeated ${fmt(s.kills[id] ?? 0)}` })),
        b ? h('p', { class: 'small muted', style: 'line-height:1.4', text: `${b.title}. ${b.lore}` }) : null,
        b ? h('div', { class: 'ability' }, ...b.abilities.map((a) => h('div', {}, h('b', { text: a.name + ' ' }), `every ${a.every}s · ${a.kind}`))) : null,
        h('h3', { text: 'Drops' }),
        h('div', { class: 'row', style: 'flex-wrap:wrap;gap:4px' }, ...m.drops.filter((d) => ITEMS[d.item]).map((d) => h('span', { class: 'cost' }, ico(ITEMS[d.item].icon), `${ITEMS[d.item].name} ${Math.round(d.chance * 1000) / 10}%`))));
    });
  }

  private settings() {
    const g = host.game;
    const st = g.state.settings;
    const apply = () => {
      audio.setVolumes(st.sfx, st.music);
      setFullNumbers(st.numberFormat === 'full');
      if (st.music > 0) audio.pause(false);
      void saveState(g.state);
    };
    openSheet('Settings', (body) => {
      const slider = (label: string, key: 'sfx' | 'music') => h('div', { class: 'card' }, h('div', { class: 'row' }, h('b', { class: 'grow', text: label }), h('span', { class: 'muted small', text: `${Math.round(st[key] * 100)}%` })),
        h('input', { type: 'range', class: 'slider', min: '0', max: '100', value: String(Math.round(st[key] * 100)), oninput: (e: Event) => {
          st[key] = Number((e.target as HTMLInputElement).value) / 100;
          ((e.target as HTMLElement).previousElementSibling!.lastElementChild as HTMLElement).textContent = `${Math.round(st[key] * 100)}%`;
          apply();
        }, onchange: () => audio.sfx('ui_confirm') }));
      const toggle = (label: string, sub: string, key: 'haptics' | 'autoPotion' | 'reduceMotion' | 'offlineNotice') => h('div', { class: 'card row' },
        h('div', { class: 'grow' }, h('b', { text: label }), h('div', { class: 'tiny muted', text: sub })),
        h('input', { type: 'checkbox', class: 'toggle', checked: st[key], onchange: (e: Event) => { st[key] = (e.target as HTMLInputElement).checked; apply(); } }));
      const autoEat = h('div', { class: 'card' }, h('div', { class: 'row' }, h('b', { class: 'grow', text: 'Auto-eat threshold' }), h('span', { class: 'muted small', text: `${Math.round(st.autoEat * 100)}% HP` })),
        h('input', { type: 'range', class: 'slider', min: '10', max: '90', step: '5', value: String(Math.round(st.autoEat * 100)), oninput: (e: Event) => {
          st.autoEat = Number((e.target as HTMLInputElement).value) / 100;
          ((e.target as HTMLElement).previousElementSibling!.lastElementChild as HTMLElement).textContent = `${Math.round(st.autoEat * 100)}% HP`;
        }, onchange: apply }));
      const sellLabel = () => (st.autoSell <= 1 ? 'Off' : `Below ${RARITIES[st.autoSell - 1].name}`);
      const autoSell = h('div', { class: 'card' }, h('div', { class: 'row' }, h('b', { class: 'grow', text: 'Auto-sell drops' }), h('span', { class: 'muted small', text: sellLabel() })),
        h('div', { class: 'tiny muted', text: `Drops under this rarity are sold on pickup. Bag holds ${BAG_MAX} items.` }),
        h('input', { type: 'range', class: 'slider', min: '1', max: '10', value: String(Math.max(1, st.autoSell)), oninput: (e: Event) => {
          const v = Number((e.target as HTMLInputElement).value);
          st.autoSell = v <= 1 ? 0 : v;
          ((e.target as HTMLElement).parentElement!.firstElementChild!.lastElementChild as HTMLElement).textContent = sellLabel();
        }, onchange: apply }));
      const fmtRow = h('div', { class: 'card row' }, h('div', { class: 'grow' }, h('b', { text: 'Number format' }), h('div', { class: 'tiny muted', text: 'Short: 1.2K · Full: 1,234' })),
        h('button', { class: 'btn sm', text: st.numberFormat === 'short' ? 'Short' : 'Full', onclick: (e: Event) => {
          st.numberFormat = st.numberFormat === 'short' ? 'full' : 'short';
          (e.target as HTMLElement).textContent = st.numberFormat === 'short' ? 'Short' : 'Full';
          apply();
        } }));
      add(body, slider('Sound effects', 'sfx'), slider('Music', 'music'),
        toggle('Haptics', 'Vibrate on big hits and rewards', 'haptics'), toggle('Reduce motion', 'Fewer shake and flash effects', 'reduceMotion'),
        toggle('Auto-potion', 'Drink the equipped potion in battle', 'autoPotion'), toggle('Offline report', 'Show a summary when you return', 'offlineNotice'),
        autoEat, autoSell, fmtRow);
    }, { onClose: apply });
  }

  private about() {
    openSheet('About', (body) => add(body, 
      h('div', { class: 'center' },
        h('img', { src: `${import.meta.env.BASE_URL}assets/gen/brand/rv_icon.png`, style: 'width:96px;height:96px;border-radius:20px;border:2px solid var(--gold)' }),
        h('div', { class: 'logo', style: 'margin:10px 0' }, h('div', { class: 'l1', style: 'font-size:38px', text: 'Runeveil' }), h('div', { class: 'l2', style: 'font-size:20px;letter-spacing:5px', text: 'ODYSSEY' })),
        h('div', { class: 'muted small', text: `Version ${VERSION}` })),
      h('p', { class: 'small', style: 'line-height:1.5', text: 'Five heroes, one fading Veil. Gather, craft and fight your way across 22 zones while your party keeps adventuring even when you are away.' }),
      h('div', { class: 'card small muted', style: 'line-height:1.5' }, 'Idle progress continues offline for up to 12 hours.', h('br'), 'Pixel art and music from licensed asset packs, plus procedurally generated item icons.', h('br'), `Package ${APP_ID}`),
      h('div', { class: 'row' }, h('button', { class: 'btn grow', text: 'Share', onclick: () => void this.share() }), h('button', { class: 'btn gold grow', text: 'Rate', onclick: () => void this.rate() }))));
  }

  async share() {
    const s = host.game.state;
    const text = `I reached zone ${s.zoneUnlocked} in Runeveil Odyssey with ${s.quests.done.length} quests done. Come adventure with me!`;
    try {
      if (Capacitor.isNativePlatform()) await Share.share({ title: 'Runeveil Odyssey', text, url: STORE_URL, dialogTitle: 'Share Runeveil Odyssey' });
      else if (navigator.share) await navigator.share({ title: 'Runeveil Odyssey', text, url: STORE_URL });
      else {
        await navigator.clipboard.writeText(`${text} ${STORE_URL}`);
        toast('Link copied to clipboard', 'good');
      }
    } catch { /* user dismissed */ }
  }

  async rate() {
    try {
      if (Capacitor.isNativePlatform()) await InAppReview.requestReview();
      else window.open(STORE_URL, '_blank');
    } catch {
      window.open(STORE_URL, '_blank');
    }
  }

  private saveSheet() {
    const g = host.game;
    openSheet('Save data', (body, close) => {
      const out = h('textarea', { class: 'field', readOnly: true, value: exportSave(g.state) });
      const inp = h('textarea', { class: 'field', placeholder: 'Paste a backup code here' });
      add(body, 
        h('div', { class: 'small muted', text: 'Backup code' }), out,
        h('button', { class: 'btn block', style: 'margin:8px 0 14px', text: 'Copy code', onclick: async () => { try { await navigator.clipboard.writeText(out.value); toast('Copied', 'good'); } catch { out.select(); toast('Select and copy the code manually', 'info'); } } }),
        h('div', { class: 'small muted', text: 'Restore from code' }), inp,
        h('button', { class: 'btn red block', style: 'margin-top:8px', text: 'Import (overwrites current save)', onclick: () => {
          const st = importSave(inp.value);
          if (!st) { toast('That code is not valid', 'bad'); return; }
          confirmBox({ title: 'Overwrite save?', text: 'Your current progress will be replaced.', danger: true, ok: 'Import', onOk: async () => { await saveState(st); close(); host.restart(); } });
        } }));
    });
  }

  private newGame() {
    confirmBox({
      title: 'Start a new game?', text: 'All progress, gear and quests will be erased. This cannot be undone.', danger: true, ok: 'Erase everything',
      onOk: async () => { await clearSave(); host.restart(); },
    });
  }
}
