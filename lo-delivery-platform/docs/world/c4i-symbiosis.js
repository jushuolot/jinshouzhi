/**
 * C4I 共生网 — 链上 LO / 单据 / 结算 生命周期（雨林「面」）
 */
import { projectChainSymbiosis, LIFE_PHASES } from '../kernel/lot-organism.js?v=13.1';

export async function renderSymbiosisPanel(chain, chainOrderId, el) {
  if (!el) return;
  if (!chainOrderId) {
    el.innerHTML = '<p class="sym-empty">选择链订单 · 查看共生网</p>';
    return;
  }
  const net = await projectChainSymbiosis(chain, chainOrderId);
  if (!net.organisms.length) {
    el.innerHTML = '<p class="sym-empty">尚无有机体 · 完成草拟 SO 后生长</p>';
    return;
  }

  const legend = LIFE_PHASES.slice(0, 5)
    .map((p) => `<span class="sym-leg" data-ph="${p.id}">${p.labelZh}</span>`)
    .join('');

  const nodes = net.organisms
    .map((o) => {
      const id = o.id.replace(/[^a-zA-Z0-9]/g, '_');
      return (
        `<div class="sym-node" data-id="${id}" style="--ph:${o.color}">` +
        `<span class="sym-kind">${o.kind}</span>` +
        `<b>${o.labelZh}</b>` +
        `<span class="sym-phase">${o.phaseLabel}</span>` +
        `</div>`
      );
    })
    .join('');

  const edgeLines = net.edges
    .slice(0, 12)
    .map((e) => `<div class="sym-edge">↳ ${e.from.split('-').pop()} → ${e.to.split('-').pop()} <i>${e.rel}</i></div>`)
    .join('');

  el.innerHTML =
    `<div class="sym-head"><span>🌿 共生网</span><span class="sym-count">${net.organisms.length} 点 · ${net.edges.length} 边</span></div>` +
    `<div class="sym-legend">${legend}</div>` +
    `<div class="sym-grid">${nodes}</div>` +
    (edgeLines ? `<div class="sym-edges">${edgeLines}</div>` : '');
}

export function renderLayerToggles(state, el, onChange) {
  if (!el) return;
  const layers = [
    { id: 'routes', label: '航线层' },
    { id: 'nodes', label: '点位层' },
    { id: 'symbiosis', label: '共生层' },
  ];
  el.innerHTML = layers
    .map((l) => {
      const on = state.layers[l.id] !== false ? ' on' : '';
      return `<button type="button" class="layer-chip${on}" data-layer="${l.id}">${l.label}</button>`;
    })
    .join('');
  el.querySelectorAll('[data-layer]').forEach((btn) => {
    btn.onclick = () => {
      state.layers[btn.dataset.layer] = !state.layers[btn.dataset.layer];
      if (state.layers[btn.dataset.layer] === false) btn.classList.remove('on');
      else btn.classList.add('on');
      onChange?.();
    };
  });
}
