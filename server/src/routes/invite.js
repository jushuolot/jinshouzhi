import { Router } from 'express';
import { db } from '../db.js';
import { auth } from '../middleware.js';

export const inviteRoutes = Router();

inviteRoutes.post('/validate', (req, res) => {
  const { invite_code } = req.body;
  if (!invite_code) return res.status(400).json({ code: 'INVALID_PARAMS', valid: false });

  const inviter = db
    .prepare(
      `SELECT id, account_status FROM users WHERE invite_code=? AND role='male'`
    )
    .get(invite_code);

  if (!inviter || inviter.account_status === 'banned_permanent') {
    return res.json({ valid: false, code: 'INVALID_INVITE_CODE' });
  }
  if (inviter.account_status !== 'opened_normal') {
    return res.json({ valid: false, code: 'INVITER_NOT_READY' });
  }
  res.json({ valid: true, inviter_id: inviter.id });
});

inviteRoutes.post('/bind', auth('male'), (req, res) => {
  const { invite_code } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.userId);
  if (user.role !== 'male') return res.status(403).json({ code: 'FORBIDDEN' });
  if (user.inviter_id) return res.status(400).json({ code: 'ALREADY_BOUND' });

  const inviter = db
    .prepare(`SELECT id FROM users WHERE invite_code=? AND role='male' AND account_status='opened_normal'`)
    .get(invite_code);
  if (!inviter) return res.status(400).json({ code: 'INVALID_INVITE_CODE' });

  db.prepare(`UPDATE users SET inviter_id=?, account_status='pending_realname' WHERE id=?`).run(
    inviter.id,
    req.userId
  );
  res.json({ ok: true, inviter_id: inviter.id });
});
