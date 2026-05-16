import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, clearToken } from '../api';

export default function Home() {
  const nav = useNavigate();
  const [me, setMe] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [convs, setConvs] = useState([]);
  const [quota, setQuota] = useState(null);

  const [inviteCode, setInviteCode] = useState('INV_M001');
  const [birthDate, setBirthDate] = useState('1980-05-01');
  const [femaleBirthDate, setFemaleBirthDate] = useState('2004-09-01');
  const [realName, setRealName] = useState('测试');
  const [studentCode, setStudentCode] = useState('MOCK_OK');

  useEffect(() => {
    load();
  }, []);

  // 女士端：男士分配后需刷新会话列表
  useEffect(() => {
    if (!me || me.role !== 'female' || me.account_status !== 'opened_normal') return;
    const t = setInterval(() => {
      api('/conversation/list')
        .then(({ conversations }) => setConvs(conversations))
        .catch(() => {});
    }, 4000);
    return () => clearInterval(t);
  }, [me?.id, me?.role, me?.account_status]);

  async function load() {
    setErr('');
    try {
      const user = await api('/auth/me');
      setMe(user);
      if (user.account_status === 'opened_normal') {
        const { conversations } = await api('/conversation/list');
        setConvs(conversations);
        if (user.role === 'male') {
          const q = await api('/assignment/quota');
          setQuota(q);
        }
      }
    } catch (ex) {
      setErr(ex.code || '加载失败');
    }
  }

  async function bindInvite() {
    setErr('');
    setMsg('');
    try {
      await api('/invite/bind', { method: 'POST', body: JSON.stringify({ invite_code: inviteCode }) });
      setMsg('邀请码绑定成功');
      load();
    } catch (ex) {
      setErr(ex.code || ex.message);
    }
  }

  async function realname(birth) {
    if (!me) return;
    setErr('');
    setMsg('');
    try {
      const gender = me.role === 'male' ? 'male' : 'female';
      await api('/user/realname', {
        method: 'POST',
        body: JSON.stringify({ real_name: realName, gender, birth_date: birth }),
      });
      setMsg('实名成功');
      load();
    } catch (ex) {
      setErr(ex.code || ex.message);
    }
  }

  async function mockPay() {
    setErr('');
    setMsg('');
    try {
      await api('/deposit/pay/create', { method: 'POST', body: JSON.stringify({}) });
      const r = await api('/deposit/pay/mock-success', { method: 'POST', body: JSON.stringify({}) });
      setMsg(`开户成功！您的邀请码：${r.invite_code}`);
      load();
    } catch (ex) {
      setErr(ex.code || ex.message);
    }
  }

  async function verifyStudent() {
    setErr('');
    setMsg('');
    try {
      await api('/student/verify', {
        method: 'POST',
        body: JSON.stringify({ verify_code: studentCode, education_level: '本科' }),
      });
      setMsg('学籍认证成功，可以等待系统分配');
      load();
    } catch (ex) {
      setErr(ex.code || ex.message);
    }
  }

  async function toggleReceiving() {
    await api('/female/settings/receiving', {
      method: 'PUT',
      body: JSON.stringify({ enabled: !me.receiving_enabled }),
    });
    load();
  }

  async function assign() {
    setErr('');
    setMsg('');
    try {
      const r = await api('/assignment/request', { method: 'POST', body: JSON.stringify({}) });
      let tip = `分配成功！今日 ${r.used}/${r.limit}`;
      if (r.matched_female_phone) {
        tip += `。女士请用 ${r.matched_female_phone} 登录，在「我的会话」中查看`;
      }
      setMsg(tip);
      nav(`/chat/${r.conversation_id}`);
    } catch (ex) {
      setErr(ex.code || ex.message);
    }
  }

  async function applyRefund() {
    setErr('');
    setMsg('');
    try {
      const r = await api('/deposit/refund/apply', { method: 'POST', body: JSON.stringify({}) });
      setMsg(`退款申请已提交：${r.refund_order_id}`);
      load();
    } catch (ex) {
      setErr(ex.code || ex.message);
    }
  }

  function logout() {
    clearToken();
    nav('/login');
  }

  if (!me) return <div className="page">加载中…</div>;

  const femaleNeedsRealname =
    me.role === 'female' &&
    !me.birth_date &&
    ['pending_verify', 'pending_student'].includes(me.account_status);

  const femaleNeedsStudent =
    me.role === 'female' &&
    me.birth_date &&
    me.account_status === 'pending_student' &&
    me.student?.status !== 'verified';

  return (
    <div className="page">
      <header className="header">
        <h1>金手指</h1>
        <p>{me.role === 'male' ? '成熟男士' : '在读学生'} · {me.phone}</p>
      </header>

      {msg && <p className="ok card">{msg}</p>}
      {err && <p className="err card">{err}</p>}

      {me.role === 'male' && me.account_status === 'pending_invite' && (
        <div className="card">
          <h3>1. 绑定邀请码</h3>
          <input value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="INV_M001" />
          <button type="button" className="btn btn-primary" onClick={bindInvite}>
            绑定
          </button>
        </div>
      )}

      {me.role === 'male' && me.account_status === 'pending_realname' && (
        <div className="card">
          <h3>2. 实名（须满40岁）</h3>
          <label>出生日期</label>
          <input value={birthDate} onChange={(e) => setBirthDate(e.target.value)} type="date" />
          <button type="button" className="btn btn-primary" onClick={() => realname(birthDate)}>
            提交实名
          </button>
        </div>
      )}

      {me.role === 'male' && me.account_status === 'pending_pay' && (
        <div className="card">
          <h3>3. 缴纳保证金 ¥10,000（模拟）</h3>
          <p style={{ fontSize: 12, color: '#888' }}>测试环境不会真实扣款</p>
          <button type="button" className="btn btn-primary" onClick={mockPay}>
            模拟支付成功
          </button>
        </div>
      )}

      {femaleNeedsRealname && (
        <div className="card">
          <h3>1. 实名认证（须满18岁）</h3>
          <label>出生日期</label>
          <input value={femaleBirthDate} onChange={(e) => setFemaleBirthDate(e.target.value)} type="date" />
          <button type="button" className="btn btn-primary" onClick={() => realname(femaleBirthDate)}>
            下一步：学籍认证
          </button>
        </div>
      )}

      {femaleNeedsStudent && (
        <div className="card">
          <h3>2. 学籍认证（高等教育在读）</h3>
          <p style={{ fontSize: 12, color: '#888' }}>测试环境验证码填：MOCK_OK</p>
          <input value={studentCode} onChange={(e) => setStudentCode(e.target.value)} />
          <button type="button" className="btn btn-primary" onClick={verifyStudent}>
            完成认证
          </button>
        </div>
      )}

      {me.account_status === 'opened_normal' && (
        <>
          {me.role === 'male' && (
            <div className="card">
              <h3>我的邀请码（一人一码）</h3>
              <p style={{ fontSize: 20, color: '#d4af37' }}>{me.invite_code}</p>
              {me.deposit && <p>保证金余额：¥{(me.deposit.balance / 100).toLocaleString()}</p>}
              {quota && <p>今日系统分配：{quota.used} / {quota.limit}</p>}
              <button type="button" className="btn btn-primary" onClick={assign}>
                系统分配
              </button>
              <button type="button" className="btn btn-secondary" onClick={applyRefund}>
                申请退保证金（须开户满30天）
              </button>
            </div>
          )}
          {me.role === 'female' && (
            <div className="card">
              <span className="badge">已认证·在读学生</span>
              <p style={{ marginTop: 8, fontSize: 12 }}>
                您的学校、姓名不会向对方展示。男士完成系统分配后，会话会出现在下方（约每 4 秒自动刷新）。
              </p>
              <p style={{ marginTop: 6, fontSize: 12, color: '#d4af37' }}>
                测试说明：分配是随机的，请用被匹配到的女士手机号登录（男士分配成功页会提示号码）。
              </p>
              <button type="button" className="btn btn-secondary" onClick={toggleReceiving}>
                {me.receiving_enabled ? '暂停接收新分配' : '恢复接收分配'}
              </button>
              <button type="button" className="btn btn-secondary" style={{ marginTop: 8 }} onClick={load}>
                刷新会话列表
              </button>
            </div>
          )}
          <div className="card">
            <h3>我的会话{convs.length > 0 ? `（${convs.length}）` : ''}</h3>
            {convs.length === 0 && me.role === 'female' && (
              <p style={{ color: '#888' }}>
                暂无会话。若男士刚分配成功，请用其提示的女士手机号登录，勿与其它测试号混用。
              </p>
            )}
            {convs.length === 0 && me.role === 'male' && (
              <p style={{ color: '#888' }}>暂无会话，可点击「系统分配」</p>
            )}
            {convs.map((c) => (
              <Link key={c.id} to={`/chat/${c.id}`} style={{ display: 'block', padding: '8px 0' }}>
                会话 ···{c.id.slice(-6)}
              </Link>
            ))}
          </div>
        </>
      )}

      <button type="button" className="btn btn-secondary" onClick={logout}>
        退出登录
      </button>
    </div>
  );
}
