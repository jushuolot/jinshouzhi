/** H5 桌面：手机框预览；真机浏览器全屏 */
const KEY = 'nuanban-device';

type DeviceKey = 'iphone' | 'huawei';

const DEVICES = {
  iphone: { w: 390, h: 844, r: 44, notch: true, label: 'iPhone' },
  huawei: { w: 712, h: 799, r: 28, notch: false, label: '华为 X6' },
} as const;

function isMobile() {
  return /Android|iPhone|iPad|Mobile|HarmonyOS/i.test(navigator.userAgent)
    || (window.innerWidth <= 768 && 'ontouchstart' in window);
}

/** 上帝视角 / 平台看板：桌面全屏，不进手机框 */
function isFullPageRoute() {
  const h = window.location.hash || '';
  return h.includes('admin-hub') || h.includes('ops-gate');
}

export function initDevicePreview() {
  if (isMobile() || isFullPageRoute() || document.getElementById('nb-device-stage')) return;
  const app = document.getElementById('app');
  if (!app) return;

  if (!document.getElementById('nb-device-css')) {
    const s = document.createElement('style');
    s.id = 'nb-device-css';
    s.textContent = `
      html.nb-preview, html.nb-preview body { margin:0; background:#111318; overflow:hidden; }
      #nb-device-stage { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; padding:20px; }
      #nb-device-toolbar { display:flex; gap:8px; }
      #nb-device-toolbar button { border:1px solid #555; background:#222; color:#eee; padding:8px 16px; border-radius:20px; cursor:pointer; font-size:14px; }
      #nb-device-toolbar button.on { background:#c45c26; border-color:#c45c26; }
      #nb-device-frame { position:relative; border:3px solid #444; box-shadow:0 20px 50px #0008; overflow:hidden; background:#1c1c1e; }
      #nb-device-notch { position:absolute; top:8px; left:50%; transform:translateX(-50%); width:110px; height:24px; background:#1c1c1e; border-radius:0 0 14px 14px; z-index:2; }
      #nb-device-screen { width:100%; height:100%; overflow-y:auto; overflow-x:hidden; -webkit-overflow-scrolling:touch; background:#f5f5f5; }
      #nb-device-screen #app { min-height:100%; }
      #nb-device-hint { color:#888; font-size:12px; text-align:center; }
    `;
    document.head.appendChild(s);
  }
  document.documentElement.classList.add('nb-preview');

  let cur: DeviceKey = localStorage.getItem(KEY) === 'huawei' ? 'huawei' : 'iphone';
  const stage = document.createElement('div');
  stage.id = 'nb-device-stage';
  const toolbar = document.createElement('div');
  toolbar.id = 'nb-device-toolbar';
  const frame = document.createElement('div');
  frame.id = 'nb-device-frame';
  const notch = document.createElement('div');
  notch.id = 'nb-device-notch';
  const screen = document.createElement('div');
  screen.id = 'nb-device-screen';
  const btns: HTMLButtonElement[] = [];

  const apply = (k: DeviceKey) => {
    cur = k;
    localStorage.setItem(KEY, k);
    const d = DEVICES[k];
    frame.style.width = d.w + 'px';
    frame.style.height = d.h + 'px';
    frame.style.borderRadius = d.r + 'px';
    notch.style.display = d.notch ? 'block' : 'none';
    btns.forEach((b) => b.classList.toggle('on', b.dataset.k === k));
  };

  (['iphone', 'huawei'] as DeviceKey[]).forEach((k) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.k = k;
    b.textContent = DEVICES[k].label;
    b.onclick = () => apply(k);
    toolbar.appendChild(b);
    btns.push(b);
  });

  screen.appendChild(app);
  frame.append(notch, screen);
  const hint = document.createElement('div');
  hint.id = 'nb-device-hint';
  hint.textContent = '在手机框内滚动 · 或使用触控板/滚轮';
  stage.append(toolbar, hint, frame);
  document.body.appendChild(stage);
  apply(cur);
}
