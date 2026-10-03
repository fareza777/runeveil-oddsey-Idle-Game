import { Capacitor, registerPlugin } from '@capacitor/core';
import { ads } from '@/ads/ads';

interface BillingStatus {
  available: boolean;
  purchased: boolean;
}

interface BillingPlugin {
  getStatus(): Promise<BillingStatus>;
  purchase(): Promise<BillingStatus>;
  restore(): Promise<BillingStatus>;
}

const Billing = registerPlugin<BillingPlugin>('Billing');

class Monetization {
  private state: BillingStatus = { available: false, purchased: false };

  get purchased() {
    return this.state.purchased;
  }

  get available() {
    return this.state.available;
  }

  async start() {
    if (!Capacitor.isNativePlatform()) return this.state;
    try {
      this.state = await Billing.getStatus();
      ads.setAdsRemoved(this.state.purchased);
    } catch (error) {
      console.warn('billing status unavailable', error);
    }
    return this.state;
  }

  async purchase() {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      this.state = await Billing.purchase();
      ads.setAdsRemoved(this.state.purchased);
      return this.state.purchased;
    } catch (error) {
      console.warn('remove ads purchase unavailable', error);
      return false;
    }
  }

  async restore() {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      this.state = await Billing.restore();
      ads.setAdsRemoved(this.state.purchased);
      return this.state.purchased;
    } catch (error) {
      console.warn('remove ads restore unavailable', error);
      return false;
    }
  }
}

export const monetization = new Monetization();
