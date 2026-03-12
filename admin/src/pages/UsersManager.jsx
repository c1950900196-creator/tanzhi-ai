import { useState, useEffect } from 'react';
import { api } from '../api';
import { Spinner, Badge, roleLabel, eventLabel, fmtTime } from '../components/Helpers';

export default function UsersManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => { loadUsers(); }, []);
  const loadUsers = async () => {
    setLoading(true);
    try { setUsers(await api('/admin/analytics/users')); } catch (e) { alert('加载失败: ' + e.message); }
    setLoading(false);
  };

  const loadDetail = async (id) => {
    if (expanded === id) { setExpanded(null); setDetail(null); return; }
    setDetailLoading(true);
    try {
      const d = await api(`/admin/analytics/user/${id}`);
      setExpanded(id);
      setDetail(d);
    } catch (e) { alert('加载详情失败: ' + e.message); }
    setDetailLoading(false);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px 0' }}><Spinner size={24} /></div>;

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>用户列表 <span style={{ color: '#64748b', fontSize: 14, fontWeight: 400 }}>({users.length} 人)</span></h2>
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, overflowX: 'auto' }}>
        <table style={{ minWidth: 900 }}>
          <thead><tr>
            <th style={{ width: 48 }}>ID</th><th>用户名</th><th style={{ width: 80 }}>身份</th>
            <th style={{ minWidth: 100 }}>兴趣标签</th><th style={{ width: 60 }}>浏览</th>
            <th style={{ width: 60 }}>点击</th><th style={{ width: 60 }}>聊天</th>
            <th style={{ width: 144 }}>注册时间</th><th style={{ width: 144 }}>最后使用</th><th style={{ width: 60 }}>详情</th>
          </tr></thead>
          <tbody>
            {users.map(u => (<>
              <tr key={u.id}>
                <td style={{ color: '#64748b' }}>{u.id}</td>
                <td style={{ fontWeight: 500 }}>{u.username}</td>
                <td><Badge type="role">{roleLabel(u.role)}</Badge></td>
                <td>{(u.tags || []).map(t => <span key={t} className="tag">{t}</span>)}</td>
                <td>{u.views || 0}</td>
                <td>{u.clicks || 0}</td>
                <td>{u.chats || 0}</td>
                <td style={{ fontSize: 12, color: '#94a3b8' }}>{fmtTime(u.created_at)}</td>
                <td style={{ fontSize: 12, color: '#94a3b8' }}>{fmtTime(u.last_active)}</td>
                <td><button onClick={() => loadDetail(u.id)} className="btn btn-ghost" style={{ fontSize: 12, padding: '2px 8px' }}>{expanded === u.id ? '收起' : '展开'}</button></td>
              </tr>
              {expanded === u.id && detail && (
                <tr key={`detail-${u.id}`}><td colSpan={10} style={{ padding: 0 }}>
                  <div style={{ background: '#0f172a', padding: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 16 }}>
                      {[
                        { l: '总浏览', v: detail.stats?.views || 0 },
                        { l: '总点击', v: detail.stats?.clicks || 0 },
                        { l: '总聊天', v: detail.stats?.chats || 0 },
                        { l: '总时长', v: `${detail.stats?.total_chat_sec || 0}s` },
                        { l: '总字数', v: detail.stats?.total_chars || 0 },
                        { l: '点击率', v: detail.stats?.click_rate || '0%' }
                      ].map(s => (
                        <div key={s.l} className="stat-card" style={{ padding: 12 }}>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{s.l}</div>
                          <div style={{ fontSize: 18, fontWeight: 600 }}>{s.v}</div>
                        </div>
                      ))}
                    </div>
                    <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>最近操作记录</h4>
                    <table>
                      <thead><tr>
                        <th style={{ width: 80 }}>事件</th><th style={{ width: 48 }}>卡片ID</th><th>卡片标题</th><th>来源</th><th>详情</th><th style={{ width: 144 }}>时间</th>
                      </tr></thead>
                      <tbody>
                        {(detail.recent_events || []).map((e, i) => (
                          <tr key={i}>
                            <td><Badge type="role">{eventLabel(e.event_type)}</Badge></td>
                            <td style={{ color: '#64748b' }}>{e.card_id}</td>
                            <td style={{ fontSize: 13 }}>{e.card_title || '-'}</td>
                            <td>{e.card_source ? <Badge type={e.card_source === 'zhihu' ? 'zhihu' : 'ai'}>{e.card_source === 'zhihu' ? '知乎' : 'AI'}</Badge> : '-'}</td>
                            <td style={{ fontSize: 12, color: '#94a3b8' }}>{e.meta ? (typeof e.meta === 'object' ? JSON.stringify(e.meta) : e.meta) : '-'}</td>
                            <td style={{ fontSize: 12, color: '#94a3b8' }}>{fmtTime(e.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </td></tr>
              )}
            </>))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
