import { Router } from 'express';
import { db } from '../db.js';
import { auth } from '../middleware.js';
import { genId } from '../utils.js';

export const adminRoutes = Router();

adminRoutes.use(auth('admin'));

adminRoutes.post('/deposit/deduct', (req, res) => {
  const { user_id, amount_cents, ticket_id } = req.body;
  const acc = db.prepare('SELECT * FROM deposit_accounts WHERE user_id=?').get(user_id);
  if (!acc) return res.status(404).json({ code: 'NOT_FOUND' });
  const amount = Math.min(amount_cents, acc.balance);
  const balance = acc.balance - amount;
  db.prepare(`UPDATE deposit_accounts SET balance=? WHERE user_id=?`).run(balance, user_id);
  if (ticket_id) {
    db.prepare(`UPDATE violation_tickets SET status='deducted', deduct_amount=? WHERE id=?`).run(
      amount,
      ticket_id
    );
  }
  res.json({ balance, deducted: amount });
});

adminRoutes.post('/deposit/refund/approve', (req, res) => {
  const { refund_order_id } = req.body;
  const order = db.prepare('SELECT * FROM refund_orders WHERE id=?').get(refund_order_id);
  if (!order) return res.status(404).json({ code: 'NOT_FOUND' });

  const now = new Date().toISOString();
  db.prepare(`UPDATE refund_orders SET status='approved', approved_at=? WHERE id=?`).run(now, refund_order_id);
  db.prepare(`UPDATE deposit_accounts SET balance=0, status='closed' WHERE user_id=?`).run(order.user_id);
  db.prepare(`UPDATE users SET account_status='refunded_closed' WHERE id=?`).run(order.user_id);

  res.json({ status: 'approved', message: 'MVP模拟：7个工作日内原路退款' });
});

adminRoutes.get('/refunds', (_, res) => {
  const rows = db.prepare(`SELECT * FROM refund_orders WHERE status='pending_review'`).all();
  res.json({ refunds: rows });
});
