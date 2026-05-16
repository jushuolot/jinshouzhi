import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { execSync } from 'child_process';
import { initSchema, db } from './db.js';
import { authRoutes } from './routes/auth.js';
import { inviteRoutes } from './routes/invite.js';
import { userRoutes } from './routes/user.js';
import { depositRoutes } from './routes/deposit.js';
import { studentRoutes } from './routes/student.js';
import { assignmentRoutes } from './routes/assignment.js';
import { conversationRoutes } from './routes/conversation.js';
import { violationRoutes } from './routes/violation.js';
import { adminRoutes } from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

initSchema();

const serverRoot = path.join(__dirname, '..');
function ensureSeedData() {
  const { n } = db.prepare('SELECT COUNT(*) as n FROM users').get();
  if (n > 0) return;
  console.log('[金手指] 数据库为空，正在写入测试账号...');
  execSync('node scripts/seed.js', { cwd: serverRoot, stdio: 'inherit' });
}
ensureSeedData();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_, res) => res.json({ ok: true, product: '金手指' }));

app.get('/api/users/female/list', (_, res) => {
  res.status(403).json({ code: 'FORBIDDEN', message: '女士信息不对外公开' });
});

app.use('/api/auth', authRoutes);
app.use('/api/invite', inviteRoutes);
app.use('/api/user', userRoutes);
app.use('/api/deposit', depositRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/assignment', assignmentRoutes);
app.use('/api/conversation', conversationRoutes);
app.use('/api/violation', violationRoutes);
app.use('/api/admin', adminRoutes);

const clientDist = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const HOST = process.env.HOST || '0.0.0.0';
const server = app.listen(PORT, HOST, () => {
  console.log(`金手指 API: http://localhost:${PORT}`);
  if (fs.existsSync(clientDist)) {
    console.log(`金手指 网页: http://localhost:${PORT} （生产模式，前后端同端口）`);
  }
  console.log(`健康检查: http://localhost:${PORT}/api/health`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[错误] 端口 ${PORT} 已被占用（通常是以前没关干净的旧程序）。`);
    console.error('请在终端执行下面命令后，再重新 npm run dev：\n');
    console.error(`  lsof -ti :${PORT} | xargs kill -9`);
    console.error('\n或双击项目里的「停止旧程序.command」\n');
    process.exit(1);
  }
  throw err;
});
