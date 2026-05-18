import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.itsmebcash.debtflow',
  appName: 'DebtFlow',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
