import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.creativeos.app',
  appName: 'CreativeOS',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: 'creativeos.app'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0a0a0a',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashImmersive: true
    },
    Keyboard: {
      resize: 'body',
      style: 'dark'
    }
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#0a0a0a',
    overrideUserAgent: 'CreativeOS/1.0'
  },
  android: {
    backgroundColor: '#0a0a0a',
    allowMixedContent: false,
    overrideUserAgent: 'CreativeOS/1.0'
  }
};

export default config;
