import { createSSRApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { initDevicePreview } from './utils/device-preview';

export function createApp() {
  const app = createSSRApp(App);
  app.use(createPinia());
  return { app };
}

// #ifdef H5
if (typeof window !== 'undefined') {
  const boot = () => initDevicePreview();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}
// #endif
