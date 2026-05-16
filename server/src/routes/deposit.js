import { Router } from 'express';
import { db, getConfig } from '../db.js';
import { auth } from '../middleware.js';
import { genId, genInviteCode } from '../utils.js';

export const depositRoutes = Router();

function getDepositAmount() {
  return parseInt(getConfig('deposit_amount_cents', '1000000'), 10);
}

depositRoutes.post('/pay/create', auth('male'), (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.userId);
  if (!user.inviter_id) return res.status(400).json({ code: 'INVITE_REQUIRED' });
  if (user.account_status !== 'pending_pay') {
    return res.status(400).json({ code: 'INVALID_STATUS' });
  }

  const amount = getDepositAmount();
  res.json({
    pay_order_id: genId('pay_'),
    amount_cents: amount,
    amount_yuan: amount / 100,
    mock: true,
    message: 'MVP模拟支付，请调用 /api/deposit/pay/mock-success 完成',
  });
});

depositRoutes.post('/pay/mock-success', auth('male'), (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.userId);
  if (user.account_status !== 'pending_pay') {
    return res.status(400).json({ code: 'INVALID_STATUS' });
  }

  const amount = getDepositAmount();
  const tradeNo = genId('MOCK_');
  const now = new Date().toISOString();
  let inviteCode = user.invite_code;
  if (!inviteCode) {
    inviteCode = genInviteCode();
    while (db.prepare('SELECT id FROM users WHERE invite_code=?').get(inviteCode)) {
      inviteCode = genInviteCode();
    }
  }

  db.prepare(
    `UPDATE users SET account_status='opened_normal', open_success_at=?, invite_code=? WHERE id=?`
  ).run(now, inviteCode, req.userId);

  db.prepare(
    `INSERT INTO deposit_accounts(user_id,total_paid,balance,status,paid_at,pay_trade_no)
     VALUES (?,?,?,?,?,?)
     ON CONFLICT(user_id) DO UPDATE SET
       total_paid=excluded.total_paid, balance=excluded.balance,
       status='normal', paid_at=excluded.paid_at, pay_trade_no=excluded.pay_trade_no`
  ).run(req.userId, amount, amount, 'normal', now, tradeNo);

  res.json({ ok: true, invite_code: inviteCode, balance: amount });
});

function computeRefundEligibility(userId) {
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(userId);
  const acc = db.prepare('SELECT * FROM deposit_accounts WHERE user_id=?').get(userId);
  const minDays = parseInt(getConfig('refund_min_days', '30'), 10);
  const refundSla = parseInt(getConfig('refund_sla_workdays', '7') || '7', 10);

  if (!acc || !user?.open_success_at) {
    return {
      eligible: false,
      days_remaining: minDays,
      eligible_at: null,
      reason: '尚未开户或未缴纳保证金',
      balance_yuan: acc ? acc.balance / 100 : 0,
      min_days: minDays,
      refund_sla_workdays: refundSla,
    };
  }

  const openAt = new Date(user.open_success_at);
  const eligibleAt = new Date(openAt);
  eligibleAt.setDate(eligibleAt.getDate() + minDays);
  const now = new Date();
  const msLeft = eligibleAt - now;
  const daysRemaining = msLeft > 0 ? Math.ceil(msLeft / (24 * 60 * 60 * 1000)) : 0;

  let eligible = true;
  let reason = '符合申请条件';

  if (now < eligibleAt) {
    eligible = false;
    reason = `开户满 ${minDays} 天后可申请（还剩约 ${daysRemaining} 天）`;
  } else if (user.account_status === 'banned_permanent') {
    eligible = false;
    reason = '账号已被永久封禁';
  } else if (acc.balance <= 0) {
    eligible = false;
    reason = '保证金余额为 0';
  } else if (acc.status === 'refund_pending') {
    eligible = false;
    reason = '退款申请处理中';
  } else {
    const openTicket = db
      .prepare(
        `SELECT id FROM violation_tickets WHERE target_id=? AND status IN ('open','deducting') LIMIT 1`
      )
      .get(userId);
    if (openTicket) {
      eligible = false;
      reason = '存在未结投诉/扣罚工单';
    }
  }

  return {
    eligible,
    days_remaining: daysRemaining,
    eligible_at: eligibleAt.toISOString(),
    reason,
    balance_yuan: acc.balance / 100,
    total_paid_yuan: acc.total_paid / 100,
    min_days: minDays,
    refund_sla_workdays: refundSla,
    account_status: acc.status,
    open_success_at: user.open_success_at,
  };
}

depositRoutes.get('/refund/eligibility', auth('male'), (req, res) => {
  res.json(computeRefundEligibility(req.userId));
});

depositRoutes.get('/account', auth('male'), (req, res) => {
  const acc = db.prepare('SELECT * FROM deposit_accounts WHERE user_id=?').get(req.userId);
  if (!acc) return res.status(404).json({ code: 'NOT_FOUND' });
  res.json({
    balance: acc.balance,
    balance_yuan: acc.balance / 100,
    total_paid: acc.total_paid,
    status: acc.status,
    paid_at: acc.paid_at,
  });
});

depositRoutes.post('/refund/apply', auth('male'), (req, res) => {
  const check = computeRefundEligibility(req.userId);
  if (!check.eligible) {
    return res.status(400).json({
      code: 'REFUND_NOT_ELIGIBLE',
      message: check.reason || '暂不符合退保证金条件',
    });
  }

  const acc = db.prepare('SELECT * FROM deposit_accounts WHERE user_id=?').get(req.userId);

  const id = genId('ref_');
  db.prepare(`INSERT INTO refund_orders(id,user_id,amount,status) VALUES (?,?,?,'pending_review')`).run(
    id,
    req.userId,
    acc.balance
  );
  db.prepare(`UPDATE deposit_accounts SET status='refund_pending' WHERE user_id=?`).run(req.userId);

  res.json({ refund_order_id: id, amount: acc.balance, status: 'pending_review' });
});
