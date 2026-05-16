import { Router } from 'express';
import { db, getConfig } from '../db.js';
import { auth } from '../middleware.js';
import { genId, todayShanghai, randomDisplayName } from '../utils.js';

export const assignmentRoutes = Router();

function getDailyLimit() {
  return parseInt(getConfig('male_daily_assignment_limit', '3'), 10);
}

function getDailyCount(maleId) {
  const date = todayShanghai();
  const row = db
    .prepare(`SELECT count FROM male_daily_assignment WHERE user_id=? AND date=?`)
    .get(maleId, date);
  return row ? row.count : 0;
}

function incDailyCount(maleId) {
  const date = todayShanghai();
  db.prepare(
    `INSERT INTO male_daily_assignment(user_id,date,count) VALUES (?,?,1)
     ON CONFLICT(user_id,date) DO UPDATE SET count=count+1`
  ).run(maleId, date);
}

assignmentRoutes.get('/quota', auth('male'), (req, res) => {
  const used = getDailyCount(req.userId);
  const limit = getDailyLimit();
  const date = todayShanghai();
  const resetAt = `${date}T23:59:59+08:00`;
  res.json({ used, limit, reset_at: resetAt });
});

assignmentRoutes.post('/request', auth('male'), (req, res) => {
  const male = db.prepare('SELECT * FROM users WHERE id=?').get(req.userId);
  if (male.account_status !== 'opened_normal') {
    if (male.account_status === 'frozen') return res.status(400).json({ code: 'ACCOUNT_FROZEN' });
    return res.status(400).json({ code: 'INVALID_STATUS' });
  }

  const acc = db.prepare('SELECT * FROM deposit_accounts WHERE user_id=?').get(req.userId);
  if (!acc || acc.status !== 'normal') {
    return res.status(400).json({ code: 'INVALID_STATUS' });
  }

  const limit = getDailyLimit();
  const used = getDailyCount(req.userId);
  if (used >= limit) {
    return res.status(400).json({ code: 'DAILY_LIMIT_REACHED', used, limit });
  }

  const female = db
    .prepare(
      `SELECT u.id FROM users u
       JOIN student_verifies s ON s.user_id=u.id
       WHERE u.role='female' AND u.account_status='opened_normal'
         AND u.receiving_enabled=1 AND s.status='verified' AND s.enroll_status='在读'
         AND u.id NOT IN (
           SELECT female_id FROM match_assignments WHERE male_id=? AND date(created_at) >= date('now','-30 day')
         )
       ORDER BY RANDOM() LIMIT 1`
    )
    .get(req.userId);

  if (!female) {
    return res.status(404).json({ code: 'POOL_EMPTY', message: '暂无可匹配用户，请先运行 npm run seed' });
  }

  const matchId = genId('mch_');
  const convId = genId('conv_');

  db.prepare(
    `INSERT INTO match_assignments(id,male_id,female_id) VALUES (?,?,?)`
  ).run(matchId, req.userId, female.id);

  db.prepare(
    `INSERT INTO conversations(id,match_id,male_id,female_id) VALUES (?,?,?,?)`
  ).run(convId, matchId, req.userId, female.id);

  incDailyCount(req.userId);

  const femaleUser = db.prepare('SELECT phone FROM users WHERE id=?').get(female.id);

  res.json({
    match_id: matchId,
    conversation_id: convId,
    used: used + 1,
    limit,
    // MVP 测试：告知男士本次匹配到的女士登录号（女士信息不对外列表展示）
    matched_female_phone: femaleUser?.phone || null,
  });
});

/** 禁止女士列表 */
assignmentRoutes.get('/female/list', auth(), (req, res) => {
  res.status(403).json({ code: 'FORBIDDEN', message: '女士信息不对外公开' });
});
