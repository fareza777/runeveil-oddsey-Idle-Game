import { h } from './dom';
import { openSheet, toast } from './modal';
import { audio } from './audio';
import { host } from './host';
import { ads } from '@/ads/ads';
import { AD_RULES } from '@/ads/config';

/** Stand-in for the video on the web preview, so reward flows can be tested without the Android SDK. */
function simulatedAd(): Promise<boolean> {
  return new Promise((resolve) => {
    let left = 3;
    let settled = false;
    const finish = (v: boolean) => { if (settled) return; settled = true; close(); resolve(v); };
    const timer = h('b', { style: 'font-size:28px', text: String(left) });
    const btn = h('button', { class: 'btn gold block off', text: 'Claim reward', onclick: () => finish(true) });
    const { close } = openSheet('Ad preview (web test)', (body) => {
      body.append(h('p', { class: 'muted small', text: 'On Android this is a rewarded video from AdMob. Here it only waits a few seconds.' }), h('div', { class: 'center' }, timer), h('div', { class: 'sp' }), btn,
        h('button', { class: 'btn ghost block', style: 'margin-top:6px', text: 'Skip (no reward)', onclick: () => finish(false) }));
    }, { mid: true, onClose: () => finish(false) });
    const iv = setInterval(() => {
      left--;
      timer.textContent = String(Math.max(0, left));
      if (left <= 0) { clearInterval(iv); btn.classList.remove('off'); }
      if (settled) clearInterval(iv);
    }, 1000);
  });
}

/** Plays a rewarded ad. Returns true when the reward was earned. */
export async function watchAd(): Promise<boolean> {
  if (!ads.available) { toast('Rewarded videos are available in the Android app.', 'info'); return false; }
  ads.onNotice = (t) => toast(t, 'bad');
  const ok = await ads.rewarded(simulatedAd);
  if (!ok) toast('No reward earned', 'info');
  return ok;
}

/** Reward offers shown on the More tab. */
export function rewardsCard(onChange: () => void): HTMLElement {
  const g = host.game;
  const left = g.crateLeft();
  const offer = (title: string, sub: string, label: string, on: () => Promise<void> | void, off = false) =>
    h('div', { class: 'card row', style: 'gap:8px' },
      h('div', { class: 'grow' }, h('b', { text: title }), h('div', { class: 'tiny muted', text: sub })),
      h('button', { class: `btn sm gold ${off ? 'off' : ''}`, text: label, onclick: async () => { if (off) return; await on(); } }));
  return h('div', {},
    h('h2', { text: 'Rewards' }),
    offer('XP boost', `+${Math.round(AD_RULES.xpBoostPct * 100)}% XP for ${Math.round(AD_RULES.xpBoostSec / 60)} minutes`, 'Watch ad', async () => {
      if (await watchAd()) { g.boostXp(); audio.sfx('quest_complete'); host.refresh(); onChange(); }
    }),
    offer('Supply crate', `Coin, food and a scroll. ${left} left today`, left > 0 ? 'Watch ad' : 'Come back tomorrow', async () => {
      if (!(await watchAd())) return;
      const err = g.claimSupplyCrate();
      if (err) toast(err, 'bad'); else { toast('Supply crate opened!', 'good'); audio.sfx('chest_open'); }
      host.refresh(); onChange();
    }, left <= 0));
}
