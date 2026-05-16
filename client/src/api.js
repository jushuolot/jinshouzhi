const tokenKey = 'jsz_token';

export function getToken() {
  return localStorage.getItem(tokenKey);
}

export function setToken(t) {
  localStorage.setItem(tokenKey, t);
}

export function clearToken() {
  localStorage.removeItem(tokenKey);
}

const ERROR_MESSAGES = {
  LOGIN_FAILED: '手机号或密码错误（请先执行 npm run seed 创建测试账号）',
  PHONE_EXISTS: '该手机号已注册，请直接登录',
  UNAUTHORIZED: '请重新登录',
  INVITE_REQUIRED: '请先绑定邀请码',
  REJECT_AGE: '年龄不符合要求',
  INVALID_INVITE_CODE: '邀请码无效',
  DAILY_LIMIT_REACHED: '今日系统分配次数已用完',
  POOL_EMPTY: '暂无可匹配用户，请先 npm run seed',
  STUDENT_VERIFY_FAIL: '学籍认证失败，测试请填 MOCK_OK',
  REFUND_NOT_ELIGIBLE: '暂不符合退保证金条件',
};

export function formatApiError(ex) {
  if (!ex || typeof ex !== 'object') return '操作失败，请重试';
  if (ex.code && ERROR_MESSAGES[ex.code]) return ERROR_MESSAGES[ex.code];
  if (ex.message && typeof ex.message === 'string') return ex.message;
  if (ex.status === 0 || ex.name === 'TypeError') {
    return '无法连接服务器：请确认终端里 npm run dev 正在运行，且后端 http://localhost:3001/api/health 可访问';
  }
  if (ex.status >= 500) return '服务器错误，请查看终端报错';
  if (ex.code) return `错误：${ex.code}`;
  return '操作失败，请重试';
}

export async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(`/api${path}`, { ...options, headers });
  } catch {
    throw { status: 0, code: 'NETWORK_ERROR', message: '网络连接失败' };
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}
