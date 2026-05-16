import { Router } from 'express';
import { db } from '../db.js';
import { auth } from '../middleware.js';

export const studentRoutes = Router();

/** MVP: verify_code 以 MOCK_OK 开头即通过在读认证 */
studentRoutes.post('/verify', auth('female'), (req, res) => {
  const { verify_code, education_level, school_name } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.userId);
  if (user.account_status !== 'pending_student' && user.account_status !== 'opened_normal') {
    return res.status(400).json({ code: 'INVALID_STATUS' });
  }

  if (!verify_code || !String(verify_code).startsWith('MOCK_OK')) {
    return res.status(400).json({ code: 'STUDENT_VERIFY_FAIL', message: '测试请使用验证码 MOCK_OK' });
  }

  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO student_verifies(user_id,status,enroll_status,education_level,school_name,verified_at)
     VALUES (?,?,?,?,?,?)
     ON CONFLICT(user_id) DO UPDATE SET
       status='verified', enroll_status='在读', education_level=excluded.education_level,
       school_name=excluded.school_name, verified_at=excluded.verified_at`
  ).run(
    req.userId,
    'verified',
    '在读',
    education_level || '本科',
    school_name || '测试大学',
    now
  );

  db.prepare(`UPDATE users SET account_status='opened_normal' WHERE id=?`).run(req.userId);

  res.json({ status: 'verified', enroll_status: '在读', badges: ['已认证·在读学生'] });
});

studentRoutes.get('/status', auth('female'), (req, res) => {
  const s = db.prepare('SELECT * FROM student_verifies WHERE user_id=?').get(req.userId);
  res.json(s || { status: 'pending' });
});
