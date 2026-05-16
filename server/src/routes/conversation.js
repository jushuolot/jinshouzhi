import { Router } from 'express';
import { db } from '../db.js';
import { auth } from '../middleware.js';
import { genId, randomDisplayName, parseAge } from '../utils.js';

export const conversationRoutes = Router();

function stableAlias(prefix, userId) {
  return `${prefix}_${userId.slice(-4).toUpperCase()}`;
}

function maskPeer(user, role) {
  if (role === 'female') {
    const age = user.birth_date ? parseAge(user.birth_date) : null;
    return {
      peer_type: 'verified_student',
      display_name: stableAlias('同学', user.id),
      avatar_url: '/avatar-female.png',
      badges: ['已认证·在读学生'],
      age_range: age ? `${Math.max(18, age - 2)}-${age + 2}` : '18-22',
      school_visible: false,
      real_name_visible: false,
    };
  }
  return {
    peer_type: 'verified_gentleman',
    display_name: stableAlias('先生', user.id),
    avatar_url: '/avatar-male.png',
    badges: ['已认证·成熟男士', '已缴文明互动保证金'],
    age_range: '40+',
    deposit_amount_visible: false,
    real_name_visible: false,
  };
}

conversationRoutes.get('/list', auth(), (req, res) => {
  const rows =
    req.userRole === 'male'
      ? db
          .prepare(
            `SELECT c.* FROM conversations c WHERE c.male_id=? AND c.status='active' ORDER BY c.created_at DESC`
          )
          .all(req.userId)
      : db
          .prepare(
            `SELECT c.* FROM conversations c WHERE c.female_id=? AND c.status='active' ORDER BY c.created_at DESC`
          )
          .all(req.userId);

  res.json({ conversations: rows });
});

conversationRoutes.get('/:id/peer', auth(), (req, res) => {
  const conv = db.prepare('SELECT * FROM conversations WHERE id=?').get(req.params.id);
  if (!conv) return res.status(404).json({ code: 'NOT_FOUND' });
  if (conv.male_id !== req.userId && conv.female_id !== req.userId) {
    return res.status(403).json({ code: 'FORBIDDEN' });
  }

  const peerId = conv.male_id === req.userId ? conv.female_id : conv.male_id;
  const peer = db.prepare('SELECT id, role, birth_date FROM users WHERE id=?').get(peerId);
  const masked = maskPeer(peer, peer.role);

  res.json({
    ...masked,
    match_id: conv.match_id,
    conversation_id: conv.id,
    assigned_at: conv.created_at,
  });
});

conversationRoutes.get('/:id/messages', auth(), (req, res) => {
  const conv = db.prepare('SELECT * FROM conversations WHERE id=?').get(req.params.id);
  if (!conv) return res.status(404).json({ code: 'NOT_FOUND' });
  if (conv.male_id !== req.userId && conv.female_id !== req.userId) {
    return res.status(403).json({ code: 'FORBIDDEN' });
  }
  const messages = db
    .prepare(`SELECT id,sender_id,content,created_at FROM messages WHERE conversation_id=? ORDER BY created_at`)
    .all(conv.id);
  res.json({ messages });
});

conversationRoutes.post('/:id/messages', auth(), (req, res) => {
  const { content } = req.body;
  const conv = db.prepare('SELECT * FROM conversations WHERE id=?').get(req.params.id);
  if (!conv) return res.status(404).json({ code: 'NOT_FOUND' });
  if (conv.male_id !== req.userId && conv.female_id !== req.userId) {
    return res.status(403).json({ code: 'FORBIDDEN' });
  }
  const id = genId('msg_');
  db.prepare(`INSERT INTO messages(id,conversation_id,sender_id,content) VALUES (?,?,?,?)`).run(
    id,
    conv.id,
    req.userId,
    content
  );
  res.json({ id, content, created_at: new Date().toISOString() });
});
