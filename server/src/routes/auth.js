import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { genId } from '../utils.js';
import { signToken, auth } from '../middleware.js';

export const authRoutes = Router();

authRoutes.post('/register', (req, res) => {
  const { phone, password, role } = req.body;
  if (!phone || !password || !['male', 'female'].includes(role)) {
    return res.status(400).json({ code: 'INVALID_PARAMS' });
  }
  const exists = db.prepare('SELECT id FROM users WHERE phone=?').get(phone);
  if (exists) return res.status(400).json({ code: 'PHONE_EXISTS' });

  const id = genId('u_');
  const hash = bcrypt.hashSync(password, 10);
  const account_status = role === 'male' ? 'pending_invite' : 'pending_verify';

  db.prepare(
    `INSERT INTO users(id,phone,password_hash,role,account_status) VALUES (?,?,?,?,?)`
  ).run(id, phone, hash, role, account_status);

  if (role === 'female') {
    db.prepare(`INSERT INTO student_verifies(user_id,status) VALUES (?,'pending')`).run(id);
  }

  const user = db.prepare('SELECT id, phone, role, account_status FROM users WHERE id=?').get(id);
  res.json({ user, token: signToken(user) });
});

authRoutes.post('/login', (req, res) => {
  const { phone, password } = req.body;
  const row = db.prepare('SELECT * FROM users WHERE phone=?').get(phone);
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ code: 'LOGIN_FAILED' });
  }
  const user = { id: row.id, phone: row.phone, role: row.role, account_status: row.account_status };
  res.json({ user, token: signToken(user) });
});

authRoutes.get('/me', auth(), (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.userId);
  if (!user) return res.status(404).json({ code: 'NOT_FOUND' });
  const deposit = db.prepare('SELECT * FROM deposit_accounts WHERE user_id=?').get(user.id);
  const student = db.prepare('SELECT * FROM student_verifies WHERE user_id=?').get(user.id);
  const studentInfo = student
    ? { status: student.status, enroll_status: student.enroll_status, education_level: student.education_level }
    : null;
  res.json({
    id: user.id,
    phone: user.phone,
    role: user.role,
    gender: user.gender,
    birth_date: user.birth_date,
    account_status: user.account_status,
    inviter_id: user.inviter_id,
    invite_code: user.invite_code,
    open_success_at: user.open_success_at,
    receiving_enabled: !!user.receiving_enabled,
    deposit,
    student: studentInfo,
  });
});
