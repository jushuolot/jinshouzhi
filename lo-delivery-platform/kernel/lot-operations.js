/**
 * 人工作业台 — 每步须对应操作人点击，禁止静默自动推进
 */
import { ACTOR_LENSES } from './lot-nucleus.js';
import {
  getShipperOrderFlowView,
  advanceShipperOrderFlow,
  peekNextBusinessStep,
  getOpenExceptions,
  EXCEPTION_RESOLUTIONS,
  resolveNextException,
} from './lot-business.js';
import { legMeta } from './lot-chain-order.js';
import { checkShipperDocGate, actorLabel } from './lot-document-ops.js';

export const OPERATION_MODE = 'manual';

export async function isAutoPilot(chain) {
  return (await chain.local.getMeta('auto_pilot')) === '1';
}

export async function setAutoPilot(chain, on) {
  await chain.local.setMeta('auto_pilot', on ? '1' : '0');
}

export async function getPendingOperation(chain, chainOrderId, viewerActor) {
  const co = await chain.getChainOrder(chainOrderId);
  if (!co) return null;

  const exOpen = await getOpenExceptions(chain, chainOrderId);
  if (exOpen.length) {
    const ex = exOpen[0];
    const res = EXCEPTION_RESOLUTIONS[ex.event.code];
    if (res) {
      return {
        phase: 'exception',
        buttonLabel: res.labelZh,
        actor: res.actor,
        actorLabel: actorLabel(res.actor),
        code: res.code,
        loId: ex.loId,
        canExecute: viewerActor === res.actor,
        blockedReason: viewerActor !== res.actor ? `需「${actorLabel(res.actor)}」处理异常` : null,
      };
    }
  }

  if (co.status === 'draft' && !co.salesFlowComplete) {
    const flow = await getShipperOrderFlowView(chain, chainOrderId);
    if (!flow?.next) return { phase: 'sales_flow', done: true, labelZh: '销售流程已完成' };
    const step = flow.next;
    const gate = await checkShipperDocGate(chain, chainOrderId, step);
    const canExecute = viewerActor === step.actor && gate.ok;
    let blockedReason = null;
    if (viewerActor !== step.actor) blockedReason = `此步由「${actorLabel(step.actor)}」操作（请切换角色镜头）`;
    else if (!gate.ok) blockedReason = gate.reason;
    return {
      phase: 'sales_flow',
      step,
      buttonLabel: step.buttonLabel || step.labelZh,
      actor: step.actor,
      actorLabel: actorLabel(step.actor),
      loId: flow.salesLoId,
      relatedDocType: step.doc?.type,
      canExecute,
      blockedReason,
      flowSteps: flow.steps,
    };
  }

  const next = await peekNextBusinessStep(chain, chainOrderId);
  if (!next) {
    if (co.status === 'settling') {
      return { phase: 'settlement', done: false, labelZh: '请在结算面板由财务确认', canExecute: false };
    }
    return { phase: 'fulfillment', done: true, labelZh: '本链段暂无待办' };
  }

  const roleOk = viewerActor === next.actor;
  const canExecute = roleOk && next.canExecute !== false;
  let blockedReason = null;
  if (!roleOk) blockedReason = `此步由「${actorLabel(next.actor)}」执行（请切换角色镜头）`;
  else if (!next.canExecute) blockedReason = next.blockedReason;

  return {
    phase: 'fulfillment',
    step: next,
    buttonLabel: next.labelZh,
    actor: next.actor,
    actorLabel: actorLabel(next.actor),
    loId: next.loId,
    legLabel: legMeta(next.legType).labelZh,
    code: next.code,
    canExecute,
    blockedReason,
  };
}

export async function executePendingOperation(chain, chainOrderId, viewerActor) {
  const pending = await getPendingOperation(chain, chainOrderId, viewerActor);
  if (!pending) return { ok: false, reason: '无待办' };
  if (!pending.canExecute) return { ok: false, reason: pending.blockedReason || '当前角色不可操作' };

  if (pending.phase === 'exception') {
    const r = await resolveNextException(chain, chainOrderId);
    if (r?.step) return { ok: true, ...r, phase: 'exception' };
    return { ok: false, reason: '异常处理失败' };
  }

  if (pending.phase === 'sales_flow') {
    const r = await advanceShipperOrderFlow(chain, chainOrderId, { actor: viewerActor, requireActor: true });
    if (r.reason) return { ok: false, reason: r.reason };
    return { ok: true, ...r };
  }

  if (pending.phase === 'fulfillment' && pending.step) {
    const s = pending.step;
    if (s.canExecute === false) return { ok: false, reason: s.blockedReason || '业务闸门未满足' };
    const lo = await chain.getLO(s.loId);
    const evt = await chain.emitAction(s.loId, {
      code: s.code,
      actor: viewerActor,
      spatialCellId: s.spatialCellId || lo?.originCellId,
      payload: { manual: true, operator: viewerActor, label: s.labelZh },
    });
    return { ok: true, step: s, evt, phase: 'fulfillment' };
  }

  return { ok: false, reason: '无可执行步骤' };
}
