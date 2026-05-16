import { useEffect, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';

export default function Chat() {
  const { id } = useParams();
  const [peer, setPeer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function load() {
    try {
      const [p, m] = await Promise.all([
        api(`/conversation/${id}/peer`),
        api(`/conversation/${id}/messages`),
      ]);
      setPeer(p);
      setMessages(m.messages || []);
      setErr('');
    } catch (ex) {
      setErr(ex.code || '加载失败');
    }
  }

  async function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await api(`/conversation/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: text.trim() }),
      });
      setText('');
      load();
    } catch (ex) {
      setErr(ex.code || '发送失败');
    }
  }

  async function report() {
    const reason = window.prompt('举报原因', '骚扰');
    if (!reason) return;
    try {
      await api('/violation/report', {
        method: 'POST',
        body: JSON.stringify({
          conversation_id: id,
          reason: 'harassment',
          description: reason,
        }),
      });
      alert('举报已提交');
    } catch {
      alert('举报失败');
    }
  }

  return (
    <div className="page chat-page">
      <div className="chat-top">
        <Link to="/" className="back-link">
          ← 返回
        </Link>
        {peer && (
          <>
            <h2>{peer.display_name}</h2>
            <div>
              {(peer.badges || []).map((b) => (
                <span key={b} className="badge">
                  {b}
                </span>
              ))}
            </div>
            <p className="chat-hint">对方资料已脱敏，请勿索要学校、住址或转账</p>
          </>
        )}
      </div>
      {err && <p className="err" style={{ padding: '0 16px' }}>{err}</p>}
      <div className="chat-messages">
        {messages.map((m) => (
          <div key={m.id} className="chat-bubble">
            <p>{m.content}</p>
            <time>{m.created_at?.slice(11, 16)}</time>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form className="chat-input" onSubmit={send}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="输入消息…"
          autoComplete="off"
        />
        <button type="submit" className="btn btn-primary">
          发送
        </button>
        <button type="button" className="btn btn-secondary" onClick={report}>
          举报
        </button>
      </form>
    </div>
  );
}
