import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initSchema, db } from '../src/db.js';
import { genId, genInviteCode } from '../src/utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

initSchema();

const hash = bcrypt.hashSync('123456', 10);

function upsertUser({ id, phone, role, birth_date, gender, account_status, invite_code, inviter_id, receiving_enabled }) {
  db.prepare(
    `INSERT OR REPLACE INTO users(id,phone,password_hash,role,birth_date,gender,account_status,invite_code,inviter_id,open_success_at,receiving_enabled)
     VALUES (@id,@phone,@hash,@role,@birth_date,@gender,@account_status,@invite_code,@inviter_id,@open_success_at,@receiving_enabled)`
  ).run({
    id,
    phone,
    hash,
    role,
    birth_date,
    gender,
    account_status,
    invite_code: invite_code || null,
    inviter_id: inviter_id || null,
    open_success_at: account_status === 'opened_normal' ? new Date().toISOString() : null,
    receiving_enabled: receiving_enabled ?? 1,
  });
}

const maleId = 'u_male_demo';
const inviteCode = 'INV_M001';

upsertUser({
  id: maleId,
  phone: '13800001001',
  role: 'male',
  birth_date: '1980-05-01',
  gender: 'male',
  account_status: 'opened_normal',
  invite_code: inviteCode,
});

db.prepare(
  `INSERT OR REPLACE INTO deposit_accounts(user_id,total_paid,balance,status,paid_at,pay_trade_no)
   VALUES (?,1000000,1000000,'normal',datetime('now'),'MOCK_SEED')`
).run(maleId);

for (let i = 1; i <= 5; i++) {
  const fid = `u_female_${i}`;
  upsertUser({
    id: fid,
    phone: `1390000200${i}`,
    role: 'female',
    birth_date: '2004-09-01',
    gender: 'female',
    account_status: 'opened_normal',
    receiving_enabled: i === 4 ? 0 : 1,
  });
  db.prepare(
    `INSERT OR REPLACE INTO student_verifies(user_id,status,enroll_status,education_level,school_name,verified_at)
     VALUES (?,'verified','在读','本科','测试大学',datetime('now'))`
  ).run(fid);
}

const adminId = 'u_admin';
upsertUser({
  id: adminId,
  phone: '13700000000',
  role: 'admin',
  birth_date: '1990-01-01',
  gender: 'male',
  account_status: 'opened_normal',
});

console.log('种子数据已写入');
console.log('--- 测试账号（密码均为 123456）---');
console.log('男士(已开户,邀请码):', '13800001001', '邀请码:', inviteCode);
console.log('女士(可匹配):', '13900002001 ~ 13900002003');
console.log('女士(暂停接收):', '13900002004');
console.log('管理端:', '13700000000');
