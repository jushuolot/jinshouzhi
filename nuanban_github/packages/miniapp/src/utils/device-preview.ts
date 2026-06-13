/** H5 桌面：手机框预览 / 独立小窗；真机浏览器全屏 */
import { OPS_SHELL_ROUTE_KEYS } from '../config/ops-tabs';
import { isOpsSessionActive } from './ops-mode';

const KEY = 'nuanban-device';
const PHONE_WIN = 'nuanban_phone_preview';

type DeviceKey = 'iphone' | 'huawei';

const DEVICES = {
  iphone: { w: 390, h: 844, r: 44, notch: true, label: 'iPhone' },
  huawei: { w: 412, h: 892, r: 32, notch: true, label: '华为' },
} as const;

function isMobile() {
  return (
    /Android|iPhone|iPad|Mobile|HarmonyOS/i.test(navigator.userAgent)
    || (window.innerWidth <= 768 && 'ontouchstart' in window)
  );
}

/** 独立手机小窗（?nb_phone=1）内不再套框 */
export function isPhonePreviewWindow(): boolean {
  try {
    if (window.name === PHONE_WIN) return true;
    return new URLSearchParams(window.location.search).get('nb_phone') === '1';
  } catch {
    return false;
  }
}

function routeProbe(): string {
  const hash = window.location.hash || '';
  try {
    const pages = getCurrentPages();
    const route = pages[pages.length - 1]?.route ?? '';
    const pagePath = route ? `/${route}` : '';
    return `${hash} ${pagePath}`;
  } catch {
    return hash;
  }
}

/** 上帝视角：桌面全屏，不进手机框（运营/编辑类页面必须全屏，否则 H5 输入框无法聚焦） */
function isFullPageRoute() {
  const probe = routeProbe();
  if (probe.includes('/pages/common/ops-')) return true;
  if (probe.includes('admin-hub') || probe.includes('fund-admin') || probe.includes('org-dispatch')) return true;
  if (probe.includes('student-profiles') || probe.includes('school-coop') || probe.includes('security')) return true;
  if (probe.includes('module-map') || probe.includes('order-chat') || probe.includes('order-voice-call') || probe.includes('ops-sms')) return true;
  if (OPS_SHELL_ROUTE_KEYS.some((k) => probe.includes(k))) return true;
  return probe.includes('ops-home') || probe.includes('ops-gate');
}

function shouldUseDesktopFullscreen(): boolean {
  return isFullPageRoute() || isOpsSessionActive();
}

function teardownDevicePreview() {
  document.documentElement.classList.remove('nb-preview');
  const existing = document.getElementById('nb-device-stage');
  if (!existing) return;
  existing.remove();
  const app = document.getElementById('app');
  if (!app) return;
  app.style.transform = '';
  app.style.pointerEvents = 'auto';
  if (app.parentElement !== document.body) {
    document.body.prepend(app);
  }
}

let routeListenersBound = false;
let opsSyncTimer: ReturnType<typeof setInterval> | null = null;

function bindOpsSessionFrameGuard() {
  if (opsSyncTimer) return;
  opsSyncTimer = setInterval(() => {
    if (!isOpsSessionActive()) return;
    teardownDevicePreview();
  }, 400);
}

function bindDevicePreviewRouteListeners() {
  if (routeListenersBound) return;
  routeListenersBound = true;
  window.addEventListener('hashchange', syncDevicePreviewRoute);
  window.addEventListener('popstate', syncDevicePreviewRoute);
  (['navigateTo', 'redirectTo', 'reLaunch', 'switchTab', 'navigateBack'] as const).forEach((method) => {
    uni.addInterceptor(method, {
      complete: () => {
        setTimeout(syncDevicePreviewRoute, 0);
        setTimeout(syncDevicePreviewRoute, 120);
      },
    });
  });
  bindOpsSessionFrameGuard();
}

/** 运营/编辑页：退出手机框，恢复 #app 到 body（uni.navigateTo 不一定触发 hashchange） */
export function syncDevicePreviewRoute() {
  if (isMobile() || isPhonePreviewWindow()) return;
  if (shouldUseDesktopFullscreen()) {
    teardownDevicePreview();
  }
}

function phonePopupUrl(): string {
  const { origin, pathname, hash } = window.location;
  return `${origin}${pathname}?nb_phone=1${hash || '#/pages/common/launch'}`;
}

/** 打开独立手机窗口（推荐：底栏/滚动更接近真机，无需装虚拟机） */
export function openPhonePreviewWindow() {
  const url = phonePopupUrl();
  const w = 420;
  const h = 900;
  const left = Math.max(0, window.screen.width - w - 24);
  const top = Math.max(0, (window.screen.height - h) / 2);
  const features = [
    `width=${w}`,
    `height=${h}`,
    `left=${left}`,
    `top=${top}`,
    'menubar=no',
    'toolbar=no',
    'location=no',
    'status=no',
    'resizable=yes',
    'scrollbars=no',
  ].join(',');
  const win = window.open(url, PHONE_WIN, features);
  if (!win) {
    // eslint-disable-next-line no-alert
    alert('浏览器拦截了弹窗，请在地址栏允许本站弹窗后，再点「独立手机窗口」');
  }
}

export function initDevicePreview() {
  bindDevicePreviewRouteListeners();
  syncDevicePreviewRoute();
  if (isMobile() || isPhonePreviewWindow() || shouldUseDesktopFullscreen()) return;
  if (document.getElementById('nb-device-stage')) return;
  const app = document.getElementById('app');
  if (!app) return;

  if (!document.getElementById('nb-device-css')) {
    const s = document.createElement('style');
    s.id = 'nb-device-css';
    s.textContent = `
      html.nb-preview, html.nb-preview body { margin:0; background:#0d0f14; }
      html.nb-preview body { min-height:100vh; overflow:auto; }
      #nb-device-stage {
        min-height:100vh; box-sizing:border-box;
        display:flex; flex-direction:column; align-items:center;
        gap:12px; padding:16px 16px 32px;
      }
      #nb-device-toolbar { display:flex; flex-wrap:wrap; justify-content:center; gap:8px; max-width:960px; }
      #nb-device-toolbar button {
        border:1px solid #555; background:#1e2228; color:#eee;
        padding:8px 14px; border-radius:20px; cursor:pointer; font-size:13px;
      }
      #nb-device-toolbar button.on { background:#c45c26; border-color:#c45c26; color:#fff; }
      #nb-device-toolbar button.primary { background:#2a5ea8; border-color:#3d7dd8; }
      #nb-device-frame-wrap { flex-shrink:0; display:flex; justify-content:center; }
      #nb-device-frame {
        position:relative; border:3px solid #3a3f48;
        box-shadow:0 24px 64px rgba(0,0,0,.45);
        overflow:hidden; background:#1c1c1e;
        transform-origin:top center;
      }
      #nb-device-notch {
        position:absolute; top:0; left:50%; transform:translateX(-50%);
        width:120px; height:28px; background:#1c1c1e;
        border-radius:0 0 16px 16px; z-index:3; pointer-events:none;
      }
      #nb-device-screen {
        width:100%; height:100%; overflow:hidden;
        background:#f5f5f5; position:relative;
      }
      #nb-device-screen #app {
        width:100%; height:100%; min-height:100%;
        overflow-y:auto; overflow-x:hidden;
        -webkit-overflow-scrolling:touch;
      }
      #nb-device-hint { color:#7a8494; font-size:12px; text-align:center; line-height:1.6; max-width:520px; }
      #nb-device-hint strong { color:#c9d1d9; }
    `;
    document.head.appendChild(s);
  }
  document.documentElement.classList.add('nb-preview');

  let cur: DeviceKey = localStorage.getItem(KEY) === 'huawei' ? 'huawei' : 'iphone';
  const stage = document.createElement('div');
  stage.id = 'nb-device-stage';
  const toolbar = document.createElement('div');
  toolbar.id = 'nb-device-toolbar';
  const frameWrap = document.createElement('div');
  frameWrap.id = 'nb-device-frame-wrap';
  const frame = document.createElement('div');
  frame.id = 'nb-device-frame';
  const notch = document.createElement('div');
  notch.id = 'nb-device-notch';
  const screen = document.createElement('div');
  screen.id = 'nb-device-screen';
  const btns: HTMLButtonElement[] = [];

  const fitFrame = () => {
    if (shouldUseDesktopFullscreen()) {
      teardownDevicePreview();
      return;
    }
    const d = DEVICES[cur];
    const maxW = window.innerWidth - 32;
    const maxH = window.innerHeight - 160;
    const scale = Math.min(1, maxW / d.w, maxH / d.h);
    frame.style.width = `${d.w}px`;
    frame.style.height = `${d.h}px`;
    frame.style.borderRadius = `${d.r}px`;
    frame.style.transform = scale < 1 ? `scale(${scale})` : '';
    frameWrap.style.height = `${Math.ceil(d.h * Math.min(1, scale))}px`;
    notch.style.display = d.notch ? 'block' : 'none';
    btns.forEach((b) => b.classList.toggle('on', b.dataset.k === cur));
  };

  const apply = (k: DeviceKey) => {
    cur = k;
    localStorage.setItem(KEY, k);
    fitFrame();
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

  const popupBtn = document.createElement('button');
  popupBtn.type = 'button';
  popupBtn.className = 'primary';
  popupBtn.textContent = '独立手机窗口';
  popupBtn.title = '推荐：小窗预览，底栏与滚动更接近真机';
  popupBtn.onclick = () => openPhonePreviewWindow();
  toolbar.appendChild(popupBtn);

  const fullBtn = document.createElement('button');
  fullBtn.type = 'button';
  fullBtn.textContent = '全屏开发';
  fullBtn.onclick = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('nb_phone');
    window.location.href = url.toString();
  };
  toolbar.appendChild(fullBtn);

  screen.appendChild(app);
  frame.append(notch, screen);
  frameWrap.appendChild(frame);
  const hint = document.createElement('div');
  hint.id = 'nb-device-hint';
  hint.innerHTML =
    '<strong>推荐</strong> 点「独立手机窗口」→ 单独小窗，无需装虚拟机<br/>'
    + '或 Chrome 按 F12 → 切换设备工具栏（Ctrl+Shift+M）选 iPhone';
  stage.append(toolbar, hint, frameWrap);
  document.body.appendChild(stage);
  apply(cur);
  window.addEventListener('resize', fitFrame);
}
