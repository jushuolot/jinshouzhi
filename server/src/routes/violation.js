import { Router } from 'express';
import { db } from '../db.js';
import { auth } from '../middleware.js';
import { genId } from '../utils.js';

export const violationRoutes = Router();

violationRoutes.post('/report', auth(), (req, res) => {
  let { target_user_id, conversation_id, reason, description } = req.body;

  if (conversation_id) {
    const conv = db.prepare('SELECT * FROM conversations WHERE id=?').get(conversation_id);
    if (!conv) return res.status(404).json({ code: 'NOT_FOUND' });
    if (conv.male_id !== req.userId && conv.female_id !== req.userId) {
      return res.status(403).json({ code: 'FORBIDDEN' });
    }
    target_user_id = conv.male_id === req.userId ? conv.female_id : conv.male_id;
  }

  if (!target_user_id) return res.status(400).json({ code: 'INVALID_PARAMS' });

  const id = genId('tkt_');
  db.prepare(
    `INSERT INTO violation_tickets(id,reporter_id,target_id,conversation_id,reason,status)
     VALUES (?,?,?,?,?,'open')`
  ).run(id, req.userId, target_user_id, conversation_id || null, reason || description);
  res.json({ ticket_id: id, target_user_id });
});
