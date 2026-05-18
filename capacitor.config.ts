import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.debtflow.app',
  appName: 'DebtFlow',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
