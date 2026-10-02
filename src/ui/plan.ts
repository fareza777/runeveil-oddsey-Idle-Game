import { h } from './dom';
import { openSheet, toast } from './modal';
import { audio } from './audio';
import { host } from './host';
import { watchAd } from './rewards';
import { GATHER, RECIPES, SKILL_MAP, ZONES } from '@/data';
import type { PlanStep } from '@/core/types';
import { KIND_LABEL, PLAN_RULES, bestNodeFor, bestZoneId, defaultPlan, fmtMin, stepLabel } from '@/core/plan';

const hm = (sec: number): string => {
  const m = Math.max(0, Math.ceil(sec / 60));
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
};

function defaultTarget(kind: PlanStep['kind']): string {
  const s = host.game.state;
  if (kind === 'combat') return `zone:${bestZoneId(s)}`;
  if (kind === 'gather') return bestNodeFor(s, 'mining') ?? bestNodeFor(s, 'woodcutting') ?? GATHER[0].id;
  const r = RECIPES.filter((x) => x.level <= s.skills[x.skill]).sort((a, b) => b.level - a.level)[0];
  return r?.id ?? RECIPES[0].id;
}

function targetSelect(step: PlanStep, onChange: () => void): HTMLSelectElement {
  const s = host.game.state;
  const sel = h('select', { class: 'sel grow' }) as HTMLSelectElement;
  const group = (label: string, opts: [string, string][]) => {
    if (!opts.length) return;
    const g = h('optgroup', { label });
    for (const [v, t] of opts) g.append(h('option', { value: v, text: t }));
    sel.append(g);
  };
  if (step.kind === 'combat') {
    group('Zones you can enter', ZONES.filter((z) => z.id <= s.zoneUnlocked && z.reqExploration <= s.skills.exploration).map((z) => [`zone:${z.id}`, `${z.name} (Lv ${z.levelRange[0]}-${z.levelRange[1]})`]));
  } else if (step.kind === 'gather') {
    const skills = [...new Set(GATHER.map((g) => g.skill))];
    for (const sk of skills) {
      group(SKILL_MAP[sk].name, GATHER.filter((g) => g.skill === sk && g.level <= s.skills[sk] && (sk !== 'exploration' || Number(g.id.split('_')[1]) <= s.zoneUnlocked)).map((g) => [g.id, g.name]));
    }
  } else {
    const skills = [...new Set(RECIPES.map((r) => r.skill))];
    for (const sk of skills) {
      group(SKILL_MAP[sk].name, RECIPES.filter((r) => r.skill === sk && r.level <= s.skills[sk]).map((r) => [r.id, r.name]));
    }
  }
  if (![...sel.querySelectorAll('option')].some((o) => (o as HTMLOptionElement).value === step.id)) step.id = (sel.querySelector('option') as HTMLOptionElement | null)?.value ?? step.id;
  sel.value = step.id;
  sel.onchange = () => { step.id = sel.value; onChange(); };
  return sel;
}

/** The timed auto plan: a few activities that run one after another, even while the game is closed. */
export function planSheet() {
  const g = host.game;
  openSheet('Auto plan', (body, close) => {
    const s = g.state;
    let steps: PlanStep[] = (s.plan?.steps ?? defaultPlan(s)).map((x) => ({ ...x }));
    let loop = s.plan?.loop ?? true;

    const render = () => {
      if (!body.isConnected) return;
      const p = s.plan;
      body.replaceChildren();
      body.append(h('p', { class: 'small muted', style: 'line-height:1.45', text: `Chain up to ${PLAN_RULES.maxSteps} activities. Each one runs for the time you set, then the next begins. The plan keeps going while the game is closed (up to 12 hours away) and stops by itself after ${PLAN_RULES.baseHours} hours. Starting something by hand pauses it.` }));

      if (p?.on) {
        const cur = p.steps[p.idx];
        body.append(h('div', { class: 'card plan-live' },
          h('div', { class: 'row' }, h('b', { class: 'grow', text: `Running: step ${p.idx + 1} of ${p.steps.length}` }), h('span', { class: 'chip live-chip', text: 'ON' })),
          h('div', { class: 'small', style: 'margin-top:4px', text: `${KIND_LABEL[cur.kind]} ${stepLabel(cur)}, ${hm(p.stepLeft)} left in this step` }),
          h('div', { class: 'tiny muted', text: `Plan stops in ${hm(p.budget)}${p.note ? ` · ${p.note}` : ''}` }),
          h('div', { class: 'row', style: 'gap:8px;margin-top:8px' },
            h('button', { class: 'btn sm red grow', text: 'Stop plan', onclick: () => { g.userStop('Plan stopped'); host.refresh(); render(); } }),
            p.extended < PLAN_RULES.extendMax ? h('button', { class: 'btn sm gold grow', text: `+${PLAN_RULES.extendHours}h (watch ad)`, onclick: async () => {
              if (!(await watchAd())) return;
              if (g.extendPlan()) { toast(`The plan will run ${PLAN_RULES.extendHours} hours longer`, 'good'); audio.sfx('quest_complete'); }
              render();
            } }) : null)));
      } else if (p?.note) {
        body.append(h('div', { class: 'card', style: 'padding:8px' }, h('div', { class: 'small', style: 'color:#ffb27a', text: `Last plan: ${p.note}` }),
          p.extended < PLAN_RULES.extendMax && p.note.includes('time limit') ? h('button', { class: 'btn sm gold block', style: 'margin-top:6px', text: `Keep going +${PLAN_RULES.extendHours}h (watch ad)`, onclick: async () => {
            if (!(await watchAd())) return;
            if (g.extendPlan()) { toast('The plan is running again', 'good'); host.refresh(); }
            render();
          } }) : null));
      }

      steps.forEach((st, i) => {
        const kindSel = h('select', { class: 'sel' }, ...(['gather', 'craft', 'combat'] as const).map((k) => h('option', { value: k, text: KIND_LABEL[k] }))) as HTMLSelectElement;
        kindSel.value = st.kind;
        kindSel.onchange = () => { st.kind = kindSel.value as PlanStep['kind']; st.id = defaultTarget(st.kind); render(); };
        const minSel = h('select', { class: 'sel' }, ...PLAN_RULES.stepMinutes.map((m) => h('option', { value: String(m), text: fmtMin(m) }))) as HTMLSelectElement;
        minSel.value = String(st.min);
        minSel.onchange = () => { st.min = Number(minSel.value); render(); };
        body.append(h('div', { class: 'card plan-step' },
          h('div', { class: 'row', style: 'gap:6px' }, h('b', { class: 'plan-n', text: String(i + 1) }), kindSel, targetSelect(st, () => render()), minSel,
            steps.length > 1 ? h('button', { class: 'btn sm ghost', text: '×', onclick: () => { steps.splice(i, 1); render(); } }) : null),
          st.kind === 'craft' ? h('div', { class: 'tiny muted', style: 'margin-top:4px', text: `Missing materials are gathered and prepared automatically. Makes ${PLAN_RULES.craftBatch} at a time, again and again.` }) : null));
      });

      const total = steps.reduce((t, x) => t + x.min, 0);
      body.append(h('div', { class: 'row', style: 'gap:8px;margin-top:8px' },
        steps.length < PLAN_RULES.maxSteps ? h('button', { class: 'btn sm grow', text: '+ Add step', onclick: () => { steps.push({ kind: 'combat', id: defaultTarget('combat'), min: 60 }); render(); } }) : null,
        h('button', { class: `btn sm grow ${loop ? 'gold' : 'ghost'}`, text: loop ? 'Repeat: on' : 'Repeat: off', onclick: () => { loop = !loop; render(); } })));
      body.append(h('div', { class: 'tiny muted center', style: 'margin:8px 0', text: `One round takes ${fmtMin(total)}. ${loop ? `It repeats until the ${PLAN_RULES.baseHours}-hour limit.` : 'It stops after the last step.'}` }));
      body.append(h('button', { class: 'btn gold block', text: p?.on ? 'Restart with these steps' : 'Start plan', onclick: () => {
        const err = g.startPlan(steps, loop);
        if (err) { toast(err, 'bad'); render(); return; }
        audio.sfx('ui_confirm'); host.refresh(); close();
        host.go('battle');
      } }));
    };
    render();
    const iv = setInterval(() => {
      if (!body.isConnected) { clearInterval(iv); return; }
      if (s.plan?.on && !body.querySelector('select:focus')) render();
    }, 5000);
  });
}
