import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.runeveil.odyssey',
  appName: 'Runeveil Odyssey',
  webDir: 'dist',
  android: { backgroundColor: '#0b0a14', allowMixedContent: false },
  plugins: {
    StatusBar: { overlaysWebView: false, backgroundColor: '#0d0a20', style: 'DARK' },
    SplashScreen: { launchShowDuration: 600, backgroundColor: '#0b0a14', showSpinner: false, launchFadeOutDuration: 250 },
  },
};

export default config;