import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import {
  AdMob, AdmobConsentStatus, BannerAdPluginEvents, BannerAdPosition, BannerAdSize, InterstitialAdPluginEvents, RewardAdPluginEvents,
} from '@capacitor-community/admob';
import { ADMOB, AD_RULES } from './config';

type Hook = (reason: string) => void;

/**
 * Thin wrapper around AdMob. Everything is a no-op on the web build, and every call is wrapped so an ad failure
 * can never break the game. Rewarded ads resolve `true` only when the player really earned the reward.
 */
class Ads {
  private ready = false;
  private starting: Promise<void> | null = null;
  private lastInterstitial = Date.now();
  private sessionStart = Date.now();
  private interstitialReady = false;
  private bannerOn = false;
  private handles: PluginListenerHandle[] = [];
  private adsRemoved = false;
  /** called with the banner height in CSS pixels (0 when hidden) */
  onBannerHeight: (px: number) => void = () => undefined;
  onNotice: Hook = () => undefined;

  get native(): boolean {
    return Capacitor.isNativePlatform();
  }

  setAdsRemoved(removed: boolean) {
    this.adsRemoved = removed;
    if (removed) void this.hideBanner();
  }

  /** Web preview of rewarded ads, only for development builds or ?ads=sim */
  get simulated(): boolean {
    return !this.native && (import.meta.env.DEV || /[?&]ads=sim/.test(location.search));
  }

  get available(): boolean {
    return !this.adsRemoved && (this.native || this.simulated);
  }

  start(): Promise<void> {
    if (!this.native || this.adsRemoved) return Promise.resolve();
    this.starting ??= this.init().catch((e) => console.warn('ads init failed', e));
    return this.starting;
  }

  private async init() {
    try {
      const info = await AdMob.requestConsentInfo();
      if (info.isConsentFormAvailable && info.status === AdmobConsentStatus.REQUIRED) await AdMob.showConsentForm();
    } catch (e) {
      console.warn('consent', e);
    }
    await AdMob.initialize({ initializeForTesting: ADMOB.testing });
    this.ready = true;
    this.handles.push(
      await AdMob.addListener(BannerAdPluginEvents.SizeChanged, (size) => this.onBannerHeight(size.height < 400 ? size.height : 0)),
      await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => { this.interstitialReady = false; this.lastInterstitial = Date.now(); void this.prepareInterstitial(); }),
      await AdMob.addListener(InterstitialAdPluginEvents.Loaded, () => { this.interstitialReady = true; }),
    );
    await this.showBanner();
    void this.prepareInterstitial();
    void this.prepareRewarded();
  }

  async showBanner() {
    if (this.adsRemoved || !this.ready || this.bannerOn) return;
    try {
      await AdMob.showBanner({ adId: ADMOB.banner, adSize: BannerAdSize.ADAPTIVE_BANNER, position: BannerAdPosition.BOTTOM_CENTER, margin: 0, isTesting: ADMOB.testing });
      this.bannerOn = true;
    } catch (e) {
      console.warn('banner', e);
    }
  }

  async hideBanner() {
    if (!this.bannerOn) return;
    try { await AdMob.hideBanner(); } catch { /* ignore */ }
    this.bannerOn = false;
    this.onBannerHeight(0);
  }

  private async prepareInterstitial() {
    if (!this.ready) return;
    try { await AdMob.prepareInterstitial({ adId: ADMOB.interstitial, isTesting: ADMOB.testing }); } catch (e) { console.warn('interstitial', e); }
  }

  private async prepareRewarded() {
    if (!this.ready) return;
    try { await AdMob.prepareRewardVideoAd({ adId: ADMOB.rewarded, isTesting: ADMOB.testing }); } catch (e) { console.warn('rewarded prepare', e); }
  }

  /** Shows an interstitial at a natural break if the pacing rules allow it. */
  async maybeInterstitial(): Promise<boolean> {
    if (this.adsRemoved || !this.ready || !this.interstitialReady) return false;
    const now = Date.now();
    if (now - this.sessionStart < AD_RULES.graceSec * 1000) return false;
    if (now - this.lastInterstitial < AD_RULES.gapSec * 1000) return false;
    try {
      this.lastInterstitial = now;
      await AdMob.showInterstitial();
      return true;
    } catch (e) {
      console.warn('interstitial show', e);
      return false;
    }
  }

  /** Plays a rewarded video. Resolves true if the player earned the reward. */
  async rewarded(simulate?: () => Promise<boolean>): Promise<boolean> {
    if (this.adsRemoved) return false;
    if (!this.native) return this.simulated && simulate ? simulate() : false;
    await this.start();
    if (!this.ready) return false;
    return new Promise<boolean>((resolve) => {
      let earned = false;
      const subs: PluginListenerHandle[] = [];
      const done = (v: boolean) => {
        subs.forEach((s) => void s.remove());
        void this.prepareRewarded();
        resolve(v);
      };
      void (async () => {
        try {
          subs.push(
            await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => { earned = true; }),
            await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => done(earned)),
            await AdMob.addListener(RewardAdPluginEvents.FailedToShow, () => done(false)),
          );
          await AdMob.showRewardVideoAd();
        } catch (e) {
          console.warn('rewarded show', e);
          try {
            await AdMob.prepareRewardVideoAd({ adId: ADMOB.rewarded, isTesting: ADMOB.testing });
            await AdMob.showRewardVideoAd();
          } catch {
            this.onNotice('No ad is available right now. Try again in a moment.');
            done(false);
          }
        }
      })();
    });
  }
}

export const ads = new Ads();
