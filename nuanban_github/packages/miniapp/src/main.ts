import { createSSRApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { initDeviceFrame } from './utils/device-frame';

export function createApp() {
  const app = createSSRApp(App);
  app.use(createPinia());
  return { app };
}

// #ifdef H5
if (typeof window !== 'undefined') {
  const boot = () => initDeviceFrame();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}
// #endif
