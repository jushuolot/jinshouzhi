import fs from 'node:fs';
import path from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';

const STORE_DIR = path.resolve(__dirname, '../../../dev-data/verification-photos');
const INDEX_FILE = path.join(STORE_DIR, 'index.json');

type PhotoIndex = {
  photos: Array<{ userId: string; file: string; savedAt: string }>;
};

function ensureStore() {
  fs.mkdirSync(STORE_DIR, { recursive: true });
}

function readIndex(): PhotoIndex {
  ensureStore();
  try {
    return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8')) as PhotoIndex;
  } catch {
    return { photos: [] };
  }
}

function writeIndex(index: PhotoIndex) {
  ensureStore();
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2), 'utf8');
}

function safeUserId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64) || 'unknown';
}

function parseDataUrl(dataUrl: string): Buffer | null {
  const m = /^data:image\/(\w+);base64,(.+)$/i.exec(dataUrl);
  if (!m) return null;
  return Buffer.from(m[2], 'base64');
}

function readBody(req: import('http').IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function attachMiddleware(server: ViteDevServer) {
  server.middlewares.use(async (req, res, next) => {
    const url = req.url || '';

    if (req.method === 'GET' && url.startsWith('/__dev/verification-photos/')) {
      const name = path.basename(url.split('?')[0]);
      if (!name || name.includes('..')) {
        res.statusCode = 400;
        res.end('bad path');
        return;
      }
      const filePath = path.join(STORE_DIR, name);
      if (!fs.existsSync(filePath)) {
        res.statusCode = 404;
        res.end('not found');
        return;
      }
      const ext = path.extname(name).toLowerCase();
      const type =
        ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
      res.setHeader('Content-Type', type);
      res.setHeader('Cache-Control', 'no-store');
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    if (req.method === 'POST' && url.split('?')[0] === '/__dev/save-verification-photo') {
      try {
        const raw = await readBody(req);
        const body = JSON.parse(raw) as { userId?: string; dataUrl?: string };
        const userId = safeUserId(String(body.userId || 'unknown'));
        const buf = parseDataUrl(String(body.dataUrl || ''));
        if (!buf || buf.length < 64) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ message: '无效图片数据' }));
          return;
        }
        ensureStore();
        const file = `${userId}.jpg`;
        const filePath = path.join(STORE_DIR, file);
        fs.writeFileSync(filePath, buf);
        const savedAt = new Date().toISOString();
        const index = readIndex().photos.filter((p) => p.userId !== userId);
        index.push({ userId, file, savedAt });
        writeIndex({ photos: index });
        const publicUrl = `/__dev/verification-photos/${file}`;
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            ok: true,
            userId,
            file,
            savedAt,
            url: publicUrl,
            diskPath: filePath,
          }),
        );
        server.config.logger.info(`[dev] 核验照已保存 → ${filePath}`);
      } catch (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: String(err) }));
      }
      return;
    }

    next();
  });
}

/** 本地 dev：将核验照写入 dev-data/verification-photos/ */
export function devVerificationPhotoPlugin(): Plugin {
  return {
    name: 'nuanban-dev-verification-photo',
    apply: 'serve',
    configureServer(server) {
      attachMiddleware(server);
    },
  };
}
