import { asset } from './icons';
import { ZONE_SEEDS } from '@/data/zoneSeeds';

const BY_ELEMENT: Record<string, string> = {
  nature: 'm_forest', physical: 'm_village', fire: 'm_forge', frost: 'm_ice', shock: 'm_crystal', shadow: 'm_crypt', holy: 'm_throne', arcane: 'm_crystal',
};

export function musicForZone(zone: number, boss: boolean): string {
  if (boss) return 'm_boss';
  if (zone >= 22) return 'm_final';
  if (zone === 5) return 'm_desert';
  if (zone === 7 || zone === 21) return 'm_drowned';
  return BY_ELEMENT[ZONE_SEEDS[zone - 1]?.element ?? 'nature'] ?? 'm_forest';
}

class AudioMgr {
  sfxVol = 0.7;
  musicVol = 0.5;
  unlocked = false;
  private music: HTMLAudioElement | null = null;
  private track = '';
  private pool = new Map<string, HTMLAudioElement[]>();
  private last = new Map<string, number>();
  private wanted = '';

  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    if (this.wanted) this.play(this.wanted, true);
  }

  setVolumes(sfx: number, music: number) {
    this.sfxVol = sfx;
    this.musicVol = music;
    if (this.music) this.music.volume = music * 0.6;
  }

  playMusic(name: string) {
    this.wanted = name;
    if (!this.unlocked) return;
    this.play(name, false);
  }

  private play(name: string, force: boolean) {
    if (!force && this.track === name && this.music) {
      if (this.music.paused && this.musicVol > 0) void this.music.play().catch(() => undefined);
      return;
    }
    this.track = name;
    const old = this.music;
    if (old) this.fadeOut(old);
    if (this.musicVol <= 0) { this.music = null; return; }
    const a = new Audio(asset(`audio/music/${name}.mp3`));
    a.loop = true;
    a.volume = 0;
    this.music = a;
    void a.play().then(() => this.fadeIn(a)).catch(() => undefined);
  }

  private fadeIn(a: HTMLAudioElement) {
    const t = setInterval(() => {
      if (a !== this.music) { clearInterval(t); return; }
      const target = this.musicVol * 0.6;
      a.volume = Math.min(target, a.volume + 0.04);
      if (a.volume >= target - 0.001) clearInterval(t);
    }, 80);
  }

  private fadeOut(a: HTMLAudioElement) {
    const t = setInterval(() => {
      a.volume = Math.max(0, a.volume - 0.06);
      if (a.volume <= 0.001) { a.pause(); clearInterval(t); }
    }, 60);
  }

  pause(p: boolean) {
    if (!this.music) return;
    if (p) this.music.pause();
    else if (this.musicVol > 0) void this.music.play().catch(() => undefined);
  }

  sfx(name: string, vol = 1, minGap = 70) {
    if (!this.unlocked || this.sfxVol <= 0) return;
    const now = performance.now();
    if (now - (this.last.get(name) ?? 0) < minGap) return;
    this.last.set(name, now);
    let list = this.pool.get(name);
    if (!list) this.pool.set(name, (list = []));
    let a = list.find((x) => x.paused || x.ended);
    if (!a) {
      if (list.length >= 4) return;
      a = new Audio(asset(`audio/sfx/${name}.mp3`));
      list.push(a);
    }
    a.volume = Math.min(1, this.sfxVol * vol);
    a.currentTime = 0;
    void a.play().catch(() => undefined);
  }
}

export const audio = new AudioMgr();
