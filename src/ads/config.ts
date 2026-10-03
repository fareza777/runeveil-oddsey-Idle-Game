/**
 * AdMob configuration.
 *
 * Production IDs live in `.env.production`; local development keeps Google's public
 * test IDs unless `VITE_ADMOB_LIVE=1` is explicitly enabled. Never click your own live ads.
 */
const env = import.meta.env as Record<string, string | undefined>;

export const ADMOB = {
  /** true while the Google test ids are in use */
  testing: env.VITE_ADMOB_LIVE !== '1',
  banner: env.VITE_ADMOB_BANNER ?? 'ca-app-pub-3940256099942544/6300978111',
  interstitial: env.VITE_ADMOB_INTERSTITIAL ?? 'ca-app-pub-3940256099942544/1033173712',
  rewarded: env.VITE_ADMOB_REWARDED ?? 'ca-app-pub-3940256099942544/5224354917',
};

/** Pacing so ads never feel like punishment. */
export const AD_RULES = {
  /** no interstitial during the first minutes of a session */
  graceSec: 6 * 60,
  /** minimum time between two interstitials */
  gapSec: 5 * 60,
  /** rewarded video: perk definitions */
  xpBoostPct: 0.5,
  xpBoostSec: 15 * 60,
  crateLimitPerDay: 5,
};
