import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, setToken, formatApiError } from '../api';

export default function Login() {
  const nav = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('123456');
  const [role, setRole] = useState('male');
  const [err, setErr] = useState('');
  const [mode, setMode] = useState('login');

  async function submit(e) {
    e.preventDefault();
    setErr('');
    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register';
      const data = await api(path, {
        method: 'POST',
        body: JSON.stringify({ phone, password, role: mode === 'register' ? role : undefined }),
      });
      setToken(data.token);
      nav('/');
    } catch (ex) {
      setErr(formatApiError(ex));
    }
  }

  const onCodespaces =
    typeof window !== 'undefined' &&
    (window.location.hostname.includes('github.dev') || window.location.hostname.includes('app.github.dev'));

  return (
    <div className="page">
      <header className="header">
        <h1>金手指</h1>
        <p>成熟男士 · 在读学生 · 系统分配</p>
      </header>
      <form className="card" onSubmit={submit}>
        <label>手机号</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="13800001001" required />
        <label>密码</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {mode === 'register' && (
          <>
            <label>我是</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="male">男士（40+）</option>
              <option value="female">女士（在读学生）</option>
            </select>
          </>
        )}
        {err && <p className="err">{err}</p>}
        <button type="submit" className="btn btn-primary">{mode === 'login' ? '登录' : '注册'}</button>
        <button type="button" className="btn btn-secondary" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? '没有账号？注册' : '已有账号？登录'}
        </button>
      </form>
      {onCodespaces && (
        <p className="card" style={{ fontSize: 12, color: '#d4af37' }}>
          GitHub Codespaces：请先 <code>npm run dev</code>，再在「端口」打开 <strong>5173</strong>。
        </p>
      )}
      <p style={{ textAlign: 'center', margin: '8px 0' }}>
        <Link to="/rules">查看平台规则</Link>
      </p>
      <div className="card" style={{ fontSize: 12, color: '#888' }}>
        <p>测试账号（需先 npm run seed）：</p>
        <p>男士 13800001001 / 女士 13900002001～03（随机匹配）</p>
        <p>密码均为 123456</p>
      </div>
    </div>
  );
}
