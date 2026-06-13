/**
 * 雨林一圈 · 引导条（C4I + Field 串联）
 */
const STEPS = [
  { id: 'order', label: '① C4I 下单', c4i: true },
  { id: 'draft', label: '② Field 草拟 SO', role: 'shipper' },
  { id: 'doc', label: '③ Field 审单过账', role: 'shipper' },
  { id: 'mrp', label: '④ 计划员 MRP', role: 'planner' },
  { id: 'start', label: '⑤ 激活全链', role: 'shipper' },
  { id: 'fulfill', label: '⑥ 履约作业', role: null },
];

export async function detectTourStep(chain, chainOrderId) {
  if (!chainOrderId) return 'order';
  const co = await chain.getChainOrder(chainOrderId);
  if (!co) return 'order';
  if (co.status !== 'draft') return 'fulfill';

  const flow = await chain.getShipperFlow(chainOrderId);
  if (!flow?.next) return co.salesFlowComplete ? 'fulfill' : 'start';

  const code = flow.next.code;
  const docs = await chain.getDocumentsForChain(chainOrderId);
  const so = docs.find((d) => d.docType === 'SO');

  if (code === 'SO_DRAFT') return 'draft';
  if (code === 'SO_APPROVED') {
    if (so?.status === 'draft') return 'doc';
    return 'doc';
  }
  if (code === 'ORDER_CREATED') return so?.status === 'approved' ? 'doc' : 'doc';
  if (code === 'MRP_EXPLODE') return 'mrp';
  if (code === 'CHAIN_START') {
    const pr = docs.find((d) => d.docType === 'PR');
    if (pr && pr.status !== 'posted') return 'mrp';
    return 'start';
  }
  return 'fulfill';
}

export function renderTourBar(el, currentStep, { chainOrderId, onField } = {}) {
  if (!el) return;
  const idx = STEPS.findIndex((s) => s.id === currentStep);
  const step = STEPS[idx] || STEPS[0];
  const chips = STEPS.map((s, i) => {
    const cls = i < idx ? ' done' : s.id === currentStep ? ' cur' : '';
    return `<span class="tour-step${cls}">${s.label}</span>`;
  }).join('');

  let action = '';
  if (step.role && chainOrderId) {
    const url = `field/role.html?role=${step.role}&co=${encodeURIComponent(chainOrderId)}`;
    action = `<a class="tour-go" href="${url}">📱 Field · ${step.label}</a>`;
  } else if (step.id === 'order') {
    action = `<button type="button" class="tour-go" id="tour-new">＋ 创建订单</button>`;
  }

  el.innerHTML =
    `<div class="tour-inner">` +
    `<span class="tour-title">跑一圈</span>${chips}${action}` +
    `</div>`;

  el.querySelector('#tour-new')?.addEventListener('click', () => {
    document.getElementById('btn-new')?.click();
  });
}
