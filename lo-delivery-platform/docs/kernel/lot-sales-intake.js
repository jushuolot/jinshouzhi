/** 货主下单接入 — 手工 / 导入 / API */
export const CSV_TEMPLATE = `title,cargoSummary,consignee,customerRef,sku,name,spec,qty,uom,price
智能终端整机 · 华北履约,智能终端整机,北京海淀终端客户,SO-DEMO-001,SKU-MAIN-01,智能终端,标准版,120,件,1280
`;

export const DEMO_API_ORDER = {
  externalId: 'ERP-SO-88421',
  title: 'API 接入订单',
  cargoSummary: '智能终端整机',
  consignee: '北京朝阳经销商',
  customerRef: 'SO-API-88421',
  lines: [{ sku: 'SKU-MAIN-01', name: '智能终端整机', qty: 80, uom: '件', price: 1380 }],
};

const num = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

export function normalizeOrderLine(ln, i = 0) {
  const qty = num(ln.qty, 1);
  const price = num(ln.price, 0);
  return {
    lineNo: ln.lineNo ?? i + 1,
    sku: String(ln.sku || `SKU-${i + 1}`),
    name: String(ln.name || '货品'),
    spec: String(ln.spec || ''),
    qty,
    uom: String(ln.uom || '件'),
    price,
    amount: ln.amount ?? qty * price,
  };
}

export function orderLinesFromCargo(cargo, p = {}) {
  const lines = p.orderLines || p.lines;
  if (lines?.length) return lines.map(normalizeOrderLine);
  return [normalizeOrderLine({ name: cargo, qty: num(p.qty, 100), price: num(p.unitPrice, 128) })];
}

export function normalizeSalesIntake(raw, source = 'manual') {
  const p = raw?.order || raw;
  const lines = (p.lines || p.orderLines || []).map(normalizeOrderLine);
  const cargo = p.cargoSummary || p.cargo || lines[0]?.name || '供应链货品';
  return {
    source,
    title: p.title || '链订单',
    cargoSummary: cargo,
    consignee: p.consignee || '终端客户',
    customerRef: p.customerRef || p.soNo || undefined,
    orderLines: lines.length ? lines : orderLinesFromCargo(cargo, p),
    intakeMeta: {
      source,
      fileName: p.fileName || null,
      apiUrl: p.apiUrl || null,
      importedAt: new Date().toISOString(),
    },
  };
}

export function parseCsvImport(text) {
  const rows = text.trim().split(/\r?\n/).filter(Boolean);
  const h = rows[0].split(',').map((x) => x.trim());
  const i = (n) => h.indexOf(n);
  const cells = rows[1].split(',');
  const g = {
    title: cells[i('title')],
    cargoSummary: cells[i('cargoSummary')],
    consignee: cells[i('consignee')],
    customerRef: cells[i('customerRef')],
    lines: [normalizeOrderLine({
      sku: cells[i('sku')],
      name: cells[i('name')],
      spec: cells[i('spec')],
      qty: cells[i('qty')],
      uom: cells[i('uom')],
      price: cells[i('price')],
    })],
  };
  return [normalizeSalesIntake(g, 'import')];
}

export function parseJsonImport(text) {
  const d = JSON.parse(text);
  return (Array.isArray(d) ? d : [d]).map((x) => normalizeSalesIntake(x, 'import'));
}

export async function fetchSalesOrderApi(url, { headers = {} } = {}) {
  const t = (url || '').trim();
  if (!t || t === 'demo' || t.includes('demo-sales-order')) {
    return { orders: [normalizeSalesIntake({ ...DEMO_API_ORDER, apiUrl: t }, 'api')], demo: true };
  }
  try {
    const r = await fetch(t, { headers: { Accept: 'application/json', ...headers } });
    const d = await r.json();
    return { orders: [normalizeSalesIntake({ ...d, apiUrl: t }, 'api')] };
  } catch (e) {
    return {
      orders: [normalizeSalesIntake({ ...DEMO_API_ORDER, apiUrl: t }, 'api')],
      fallback: true,
      error: e.message,
    };
  }
}

export function intakeSourceLabel(s) {
  return ({ manual: '手工制单', import: '批量导入', api: 'API 对接' })[s] || s;
}

export function summarizeIntake(it) {
  const lines = it.orderLines || [];
  return {
    title: it.title,
    lineCount: lines.length,
    amount: lines.reduce((s, l) => s + num(l.amount ?? l.qty * l.price), 0),
    source: intakeSourceLabel(it.source),
  };
}
