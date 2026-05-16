import { Router } from 'express';
import { db } from '../db.js';
import { auth } from '../middleware.js';
import { isMaleEligible, isFemaleEligible } from '../utils.js';

export const userRoutes = Router();

userRoutes.post('/realname', auth(), (req, res) => {
  const { real_name, gender, birth_date } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.userId);
  if (!real_name || !gender || !birth_date) {
    return res.status(400).json({ code: 'INVALID_PARAMS' });
  }

  if (user.role === 'male') {
    if (gender !== 'male') return res.status(400).json({ code: 'GENDER_MISMATCH' });
    if (!isMaleEligible(birth_date)) return res.status(400).json({ code: 'REJECT_AGE', message: '男士须年满40周岁' });
    if (!user.inviter_id) return res.status(400).json({ code: 'INVITE_REQUIRED' });

    db.prepare(
      `UPDATE users SET real_name=?, gender=?, birth_date=?, account_status='pending_pay' WHERE id=?`
    ).run(real_name, gender, birth_date, req.userId);
    db.prepare(`INSERT OR IGNORE INTO deposit_accounts(user_id,status) VALUES (?,'pending')`).run(req.userId);
  } else if (user.role === 'female') {
    if (gender !== 'female') return res.status(400).json({ code: 'GENDER_MISMATCH' });
    if (!isFemaleEligible(birth_date)) return res.status(400).json({ code: 'REJECT_AGE', message: '须年满18周岁' });

    db.prepare(
      `UPDATE users SET real_name=?, gender=?, birth_date=?, account_status='pending_student' WHERE id=?`
    ).run(real_name, gender, birth_date, req.userId);
  }

  res.json({ ok: true });
});

userRoutes.put('/female/settings/receiving', auth('female'), (req, res) => {
  const { enabled } = req.body;
  db.prepare(`UPDATE users SET receiving_enabled=? WHERE id=?`).run(enabled ? 1 : 0, req.userId);
  res.json({ receiving_enabled: !!enabled });
});
