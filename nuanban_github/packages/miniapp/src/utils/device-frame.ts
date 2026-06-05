/** H5 桌面预览：iPhone / 华为 Mate X6 外框，真机全屏 */
export type DevicePreset = 'iphone' | 'huawei';

const PRESETS: Record<DevicePreset, { label: string; width: number; height: number; radius: number }> = {
  iphone: { label: 'iPhone', width: 390, height: 844, radius: 44 },
  huawei: { label: '华为 X6', width: 712, height: 799, radius: 28 },
};

function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return true;
  if (window.innerWidth <= 820) return true;
  return /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
}

function injectStyles(): void {
  if (document.getElementById('nb-device-frame-style')) return;
  const style = document.createElement('style');
  style.id = 'nb-device-frame-style';
  style.textContent = `
    #nb-device-stage {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 24px 16px 32px;
      background: linear-gradient(160deg, #e8e4df 0%, #d4cfc8 100%);
      box-sizing: border-box;
    }
    #nb-device-toolbar {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: center;
    }
    #nb-device-toolbar button {
      border: 1px solid #b8b0a6;
      background: #fff;
      color: #4a4038;
      padding: 8px 18px;
      border-radius: 20px;
      font-size: 14px;
      cursor: pointer;
    }
    #nb-device-toolbar button.active {
      background: #8b5a3c;
      border-color: #8b5a3c;
      color: #fff;
    }
    #nb-device-shell {
      position: relative;
      background: #1a1a1a;
      padding: 12px;
      box-shadow: 0 24px 48px rgba(0,0,0,.28);
      transition: width .25s ease, height .25s ease, border-radius .25s ease;
    }
    #nb-device-shell.preset-iphone::before {
      content: '';
      position: absolute;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      width: 120px;
      height: 28px;
      background: #1a1a1a;
      border-radius: 0 0 18px 18px;
      z-index: 2;
    }
    #nb-device-screen {
      overflow: hidden;
      background: #f5f5f5;
      position: relative;
    }
    #nb-device-screen > #app {
      width: 100%;
      height: 100%;
      overflow: auto;
    }
    #nb-device-hint {
      font-size: 12px;
      color: #6b635a;
      text-align: center;
    }
  `;
  document.head.appendChild(style);
}

function applyPreset(shell: HTMLElement, screen: HTMLElement, preset: DevicePreset): void {
  const cfg = PRESETS[preset];
  shell.className = `preset-${preset}`;
  shell.style.width = `${cfg.width + 24}px`;
  shell.style.height = `${cfg.height + 24}px`;
  shell.style.borderRadius = `${cfg.radius + 8}px`;
  screen.style.width = `${cfg.width}px`;
  screen.style.height = `${cfg.height}px`;
  screen.style.borderRadius = `${cfg.radius}px`;
}

export function initDeviceFrame(): void {
  // #ifdef H5
  if (typeof document === 'undefined' || isMobileDevice()) return;
  const app = document.getElementById('app');
  if (!app || document.getElementById('nb-device-stage')) return;

  injectStyles();

  let current: DevicePreset = (localStorage.getItem('nb-device-preset') as DevicePreset) || 'iphone';

  const stage = document.createElement('div');
  stage.id = 'nb-device-stage';

  const toolbar = document.createElement('div');
  toolbar.id = 'nb-device-toolbar';

  const shell = document.createElement('div');
  shell.id = 'nb-device-shell';

  const screen = document.createElement('div');
  screen.id = 'nb-device-screen';

  const hint = document.createElement('div');
  hint.id = 'nb-device-hint';
  hint.textContent = '电脑预览模式 · 真机打开为全屏';

  (Object.keys(PRESETS) as DevicePreset[]).forEach((key) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = PRESETS[key].label;
    btn.dataset.preset = key;
    btn.onclick = () => {
      current = key;
      localStorage.setItem('nb-device-preset', key);
      toolbar.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === btn));
      applyPreset(shell, screen, current);
    };
    toolbar.appendChild(btn);
  });

  app.parentNode?.insertBefore(stage, app);
  stage.appendChild(toolbar);
  stage.appendChild(shell);
  shell.appendChild(screen);
  screen.appendChild(app);
  stage.appendChild(hint);

  const activeBtn = toolbar.querySelector(`[data-preset="${current}"]`) as HTMLButtonElement | null;
  activeBtn?.classList.add('active');
  applyPreset(shell, screen, current);
  // #endif
}
