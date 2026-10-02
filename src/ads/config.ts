/**
 * AdMob configuration.
 *
 * The IDs below are Google's public TEST ids: they always serve test ads and never earn money.
 * Before publishing, create the app and three ad units in the AdMob console and either
 *   1. put the real unit ids into `.env.production` as VITE_ADMOB_BANNER / VITE_ADMOB_INTERSTITIAL / VITE_ADMOB_REWARDED
 *      and set VITE_ADMOB_LIVE=1, and
 *   2. replace the `admob_app_id` string in android/app/src/main/res/values/strings.xml with the real app id.
 * Never click your own live ads.
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
