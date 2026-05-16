import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api, formatApiError } from '../api';
import TopNav from '../components/TopNav';

export default function Deposit() {
  const [me, setMe] = useState(null);
  const [account, setAccount] = useState(null);
  const [elig, setElig] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setErr('');
    try {
      const user = await api('/auth/me');
      setMe(user);
      if (user.role !== 'male') return;
      const [acc, e] = await Promise.all([
        api('/deposit/account'),
        api('/deposit/refund/eligibility'),
      ]);
      setAccount(acc);
      setElig(e);
    } catch (ex) {
      setErr(formatApiError(ex));
    }
  }

  async function applyRefund() {
    setErr('');
    setMsg('');
    try {
      const r = await api('/deposit/refund/apply', { method: 'POST', body: JSON.stringify({}) });
      setMsg(`退款申请已提交，单号：${r.refund_order_id}。审核通过后 ${elig?.refund_sla_workdays || 7} 个工作日内原路退回（演示）。`);
      load();
    } catch (ex) {
      setErr(formatApiError(ex));
    }
  }

  if (!me) return <div className="page">加载中…</div>;
  if (me.role !== 'male') return <Navigate to="/" replace />;

  const statusLabel = {
    normal: '正常',
    refund_pending: '退款审核中',
    closed: '已关闭',
    frozen: '冻结',
  };

  return (
    <div className="page">
      <header className="header">
        <h1>文明互动保证金</h1>
        <p>仅男士用户 · 演示环境为模拟资金</p>
      </header>
      <TopNav role="male" />

      {err && <p className="err card">{err}</p>}
      {msg && <p className="ok card">{msg}</p>}

      <div className="card highlight-card">
        <p className="deposit-balance">¥{(account?.balance_yuan ?? 0).toLocaleString()}</p>
        <p style={{ color: '#888', fontSize: 13 }}>当前可用余额</p>
        <p style={{ marginTop: 8 }}>账户状态：{statusLabel[account?.status] || account?.status || '—'}</p>
        <p style={{ fontSize: 12, color: '#888' }}>已缴总额：¥{(elig?.total_paid_yuan ?? account?.balance_yuan ?? 0).toLocaleString()}</p>
      </div>

      {elig && (
        <div className="card">
          <h3>退保证金资格</h3>
          {elig.eligible ? (
            <p className="ok">✓ {elig.reason}</p>
          ) : (
            <p className="err">{elig.reason}</p>
          )}
          {elig.days_remaining > 0 && (
            <p style={{ fontSize: 13, marginTop: 8 }}>预计还需约 <strong>{elig.days_remaining}</strong> 天（开户满 {elig.min_days} 天）</p>
          )}
          <p style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
            审核通过后 {elig.refund_sla_workdays} 个工作日内原路退回
          </p>
        </div>
      )}

      <div className="card">
        <h3>说明</h3>
        <ul className="rules-list">
          <li>本页为 <strong>模拟演示</strong>，不会真实扣款或退款</li>
          <li>违规扣罚从保证金中扣除，详见<Link to="/rules">平台规则</Link></li>
        </ul>
      </div>

      <button
        type="button"
        className="btn btn-primary"
        disabled={!elig?.eligible}
        onClick={applyRefund}
      >
        申请退还剩余保证金
      </button>
      <Link to="/" className="btn btn-secondary">
        返回首页
      </Link>
    </div>
  );
}
