import './ui/style.css';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { clearSave, loadState, saveState } from '@/core/save';
import { starterState } from '@/core/state';
import { AppShell } from '@/ui/app';
import { runIntro } from '@/ui/splash';
import { host } from '@/ui/host';
import { audio } from '@/ui/audio';

let shell: AppShell | null = null;

async function nativeSetup() {
  if (!Capacitor.isNativePlatform()) return;
  try { await StatusBar.setStyle({ style: Style.Dark }); await StatusBar.setBackgroundColor({ color: '#0d0a20' }); } catch { /* optional */ }
  try { await ScreenOrientation.lock({ orientation: 'portrait' }); } catch { /* optional */ }
}

async function boot() {
  const root = document.getElementById('app')!;
  const saved = await loadState();
  void SplashScreen.hide().catch(() => undefined);
  const choice = await runIntro(root, !!saved);
  let state = saved;
  let away = 0;
  if (choice.kind === 'new' || !state) {
    await clearSave();
    state = starterState(choice.kind === 'new' ? choice.name : 'Wayfarer');
    await saveState(state);
  } else {
    away = (Date.now() - state.lastSeen) / 1000;
  }
  document.querySelectorAll('.overlay,.hint,.toasts').forEach((n) => n.remove());
  shell = new AppShell(root, state);
  host.restart = () => {
    shell?.destroy();
    shell = null;
    audio.playMusic('m_title');
    void boot();
  };
  shell.mount(away);
}

void nativeSetup();
void boot();
