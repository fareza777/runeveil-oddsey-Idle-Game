import { h, fmt, mount } from './dom';
import { ico } from './icons';
import { toast } from './modal';
import { audio } from './audio';
import { host } from './host';
import type { Screen } from './screen';
import { HERO_MAP, ITEMS, QUESTS, QUEST_MAP, SKILL_MAP } from '@/data';
import { acceptQuest, availableQuests, claimQuest, questDone, stepProgress } from '@/core/questSys';
import type { QuestDef } from '@/core/types';
import { buzz, goldChip } from './common';

type Tab = 'active' | 'available' | 'done';

export class QuestsScreen implements Screen {
  el = h('div', { class: 'screen' });
  private tab: Tab = 'active';

  show() {
    const g = host.game;
    const s = g.state;
    const avail = availableQuests(s);
    const counts: Record<Tab, number> = { active: s.quests.active.length, available: avail.length, done: s.quests.done.length };
    const seg = h('div', { class: 'seg' }, ...(['active', 'available', 'done'] as Tab[]).map((t) =>
      h('button', { class: this.tab === t ? 'on' : '', text: `${t === 'active' ? 'Active' : t === 'available' ? 'Side quests' : 'Completed'} (${counts[t]})`, onclick: () => { this.tab = t; this.show(); } })));
    const list = h('div');
    if (this.tab === 'active') {
      const act = s.quests.active.map((id) => QUEST_MAP[id]).filter(Boolean).sort((a, b) => (a.kind === 'main' ? -1 : 1) - (b.kind === 'main' ? -1 : 1) || Number(questDone(s, b)) - Number(questDone(s, a)));
      if (!act.length) list.append(h('div', { class: 'empty', text: 'No active quests. Check the Side quests tab.' }));
      for (const q of act) list.append(this.card(q, 'active'));
    } else if (this.tab === 'available') {
      if (!avail.length) list.append(h('div', { class: 'empty', text: 'No side quests available. Reach new zones and raise skills to unlock more.' }));
      for (const q of avail) list.append(this.card(q, 'available'));
    } else {
      const done = [...s.quests.done].reverse().map((id) => QUEST_MAP[id]).filter(Boolean);
      if (!done.length) list.append(h('div', { class: 'empty', text: 'Nothing completed yet.' }));
      for (const q of done.slice(0, 80)) list.append(h('div', { class: 'card item', style: 'opacity:.75' }, ico('img:ui_icon_quests'), h('div', { class: 'meta' }, h('b', { text: q.name }), h('span', { text: `${q.kind} · ${q.giver}` })), h('span', { class: 'chip good', text: '✓' })));
    }
    const total = QUESTS.length;
    mount(this.el, h('div', { class: 'row' }, h('h2', { style: 'margin:4px 0;flex:1', text: 'Quests' }), h('span', { class: 'chip gold', text: `${s.quests.done.length}/${total} done` })), seg, list);
  }

  update() { /* progress is updated when the tab is reopened */ }

  private card(q: QuestDef, mode: 'active' | 'available'): HTMLElement {
    const g = host.game;
    const s = g.state;
    const done = mode === 'active' && questDone(s, q);
    const rewards: HTMLElement[] = [];
    if (q.reward.hero) rewards.push(h('span', { class: 'cost gold', style: 'padding-left:6px' }, `Recruit: ${HERO_MAP[q.reward.hero].name}`));
    if (q.reward.gold) rewards.push(goldChip(s.gold, q.reward.gold));
    for (const it of q.reward.items ?? []) if (ITEMS[it.item]) rewards.push(h('span', { class: 'cost', title: ITEMS[it.item].name }, ico(ITEMS[it.item].icon), `×${it.n}`));
    for (const x of q.reward.xp ?? []) rewards.push(h('span', { class: 'cost' }, ico(SKILL_MAP[x.skill].icon), `${fmt(x.n)} XP`));
    const steps = q.steps.map((st, i) => {
      const p = mode === 'active' ? stepProgress(s, q, i) : 0;
      const ok = p >= st.n;
      return h('div', { class: `qstep ${ok ? 'done' : ''}` }, h('span', { text: ok ? '✓' : '•' }), h('span', { class: 'grow', text: st.text }), mode === 'active' ? h('span', { text: `${fmt(Math.min(p, st.n))}/${fmt(st.n)}` }) : null);
    });
    return h('div', { class: `card ${q.kind === 'main' ? 'active' : ''}` },
      h('div', { class: 'row' }, h('b', { class: 'grow', text: q.name }), h('span', { class: `chip ${q.kind === 'main' ? 'gold' : ''}`, text: q.kind === 'main' ? 'Main' : 'Side' })),
      h('div', { class: 'tiny muted', text: `from ${q.giver}` }),
      h('p', { class: 'small', style: 'margin:6px 0;line-height:1.4;color:#d6d0f5', text: q.story }),
      ...steps,
      h('div', { class: 'row', style: 'margin-top:8px;flex-wrap:wrap' }, ...rewards, h('span', { class: 'grow' }),
        mode === 'available'
          ? h('button', { class: 'btn sm gold', text: 'Accept', onclick: () => { acceptQuest(s, q.id, g.ctx); audio.sfx('quest_new'); toast('Quest accepted', 'good'); this.show(); host.refresh(); } })
          : h('button', { class: `btn sm ${done ? 'green' : 'off'}`, text: done ? 'Claim reward' : 'In progress', onclick: () => {
            if (claimQuest(s, q.id, g.ctx)) { audio.sfx('quest_complete'); buzz('medium'); toast(`${q.name} complete!`, 'gold'); this.show(); host.refresh(); }
          } })));
  }
}
