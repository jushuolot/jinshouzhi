#!/usr/bin/env node
/**
 * 删除 138 号段预设学生/老人账号（保留家属 13800000004、多角色 13800000006）
 * 用法: node scripts/purge-138-student-elder.mjs
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = (process.env.NUANBAN_API || 'http://localhost:8090').replace(/\/$/, '');

const PHONES_STUDENT = ['13800000001', '13800000002', '13800000003'];
const PHONE_ELDER = '13800000005';

const EMAIL_BY_PHONE = {
  '13800000001': 'student1@test.nuanban.dev',
  '13800000002': 'student2@test.nuanban.dev',
  '13800000003': 'student3@test.nuanban.dev',
  [PHONE_ELDER]: 'elder1@test.nuanban.dev',
};

function loadEnv() {
  try {
    const raw = readFileSync(join(ROOT, '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^NUANBAN_ADMIN_(EMAIL|PASS)=(.+)$/);
      if (m) process.env[`ADMIN_${m[1]}`] = m[2].trim();
    }
  } catch {
    /* ignore */
  }
}

async function adminToken() {
  loadEnv();
  const email = process.env.ADMIN_EMAIL || process.env.NUANBAN_ADMIN_EMAIL || 'admin@nuanban.dev';
  const password = process.env.ADMIN_PASS || process.env.NUANBAN_ADMIN_PASS || 'Nuanban2025!';
  const res = await fetch(`${BASE}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: email, password }),
  });
  const json = await res.json();
  if (!json.token) throw new Error('管理员登录失败');
  return json.token;
}

async function listAll(token, collection, filter = '') {
  const items = [];
  let page = 1;
  while (true) {
    const qs = new URLSearchParams({ perPage: '200', page: String(page) });
    if (filter) qs.set('filter', filter);
    const res = await fetch(`${BASE}/api/collections/${collection}/records?${qs}`, {
      headers: { Authorization: token },
    });
    const json = await res.json();
    items.push(...(json.items || []));
    if (page >= (json.totalPages || 1)) break;
    page += 1;
  }
  return items;
}

async function del(token, collection, id) {
  const res = await fetch(`${BASE}/api/collections/${collection}/records/${id}`, {
    method: 'DELETE',
    headers: { Authorization: token },
  });
  return res.ok;
}

async function main() {
  const health = await fetch(`${BASE}/api/health`).catch(() => null);
  if (!health?.ok) {
    console.error('PocketBase 未就绪，请先启动 docker compose');
    process.exit(2);
  }

  const token = await adminToken();
  const targetEmails = new Set(Object.values(EMAIL_BY_PHONE));

  const users = await listAll(token, 'users');
  const targetUsers = users.filter((u) => targetEmails.has(u.email));
  const targetUserIds = new Set(targetUsers.map((u) => u.id));

  console.log('将删除用户:', targetUsers.map((u) => `${u.email} (${u.id})`).join(', ') || '(无)');

  const roles = await listAll(token, 'user_roles');
  const targetRoles = roles.filter((r) => targetUserIds.has(r.user));
  const elderProfileIds = new Set(
    targetRoles.filter((r) => r.role === 'elder' && r.elder_profile).map((r) => r.elder_profile),
  );

  const orders = await listAll(token, 'orders');
  const affectedOrders = orders.filter((o) => targetUserIds.has(o.student_user));
  console.log(`将删除引用 138 学生的订单 ${affectedOrders.length} 条`);

  for (const name of ['outdoor_approvals', 'schedules', 'settlements']) {
    const rows = await listAll(token, name);
    for (const row of rows) {
      const oid = row.order;
      if (affectedOrders.some((o) => o.id === oid)) {
        await del(token, name, row.id);
      }
    }
  }

  for (const o of affectedOrders) {
    await del(token, 'orders', o.id);
  }

  for (const r of targetRoles) {
    await del(token, 'user_roles', r.id);
  }

  for (const u of targetUsers) {
    await del(token, 'users', u.id);
  }

  for (const eid of elderProfileIds) {
    const bindings = await listAll(token, 'family_elder_bindings', `elder = "${eid}"`);
    if (!bindings.length) {
      await del(token, 'elders', eid);
      console.log('已删除无人绑定的老人档案:', eid);
    } else {
      console.log('保留老人档案（仍有家属绑定）:', eid);
    }
  }

  console.log('\n完成。当前保留:');
  console.log('  学生 13500000001 → m13500000001@test.nuanban.dev');
  console.log('  老人 13500000005 → m13500000005@test.nuanban.dev');
  console.log('  家属 13800000004、多角色 13800000006 未动');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
