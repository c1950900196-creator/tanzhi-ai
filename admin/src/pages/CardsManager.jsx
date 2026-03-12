import { useState, useEffect } from 'react';
import { api } from '../api';
import { Spinner, Badge, roleLabel, fmtTime } from '../components/Helpers';

export default function CardsManager() {
  const [cards, setCards] = useState({ cards: [], pagination: {} });
  const [filter, setFilter] = useState({ source: '', role: '', page: 1 });
  const [loading, setLoading] = useState(true);
  const [genLoading, setGenLoading] = useState(false);
  const [zhihuLoading, setZhihuLoading] = useState(false);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [genRole, setGenRole] = useState('developer');

  const loadCards = async (f = filter) => {
    setLoading(true);
    try {
      let qs = `?page=${f.page}&limit=20`;
      if (f.source) qs += `&source=${f.source}`;
      if (f.role) qs += `&role=${f.role}`;
      setCards(await api(`/admin/cards${qs}`));
    } catch (e) { alert('加载失败: ' + e.message); }
    setLoading(false);
  };

  useEffect(() => { loadCards(); }, []);

  const handleFilter = (key, val) => {
    const f = { ...filter, [key]: val, page: 1 };
    setFilter(f);
    loadCards(f);
  };

  const handlePage = (p) => {
    const f = { ...filter, page: p };
    setFilter(f);
    loadCards(f);
  };

  const deleteCard = async (id, title) => {
    if (!confirm(`确定删除卡片「${title}」？`)) return;
    try { await api(`/admin/cards/${id}`, { method: 'DELETE' }); loadCards(); } catch (e) { alert('删除失败: ' + e.message); }
  };

  const generate = async () => {
    setGenLoading(true);
    try {
      const data = await api('/admin/generate-cards', { method: 'POST', body: JSON.stringify({ role: genRole }) });
      alert(`成功生成 ${data.count} 张卡片`);
      setShowModal(false);
      loadCards();
    } catch (e) { alert('生成失败: ' + e.message); }
    setGenLoading(false);
  };

  const triggerDaily = async () => {
    if (!confirm('确定启动每日生成？将会联网搜索热点并分批生成100张卡片，耗时约20-30分钟。')) return;
    setDailyLoading(true);
    try {
      await api('/admin/daily-generate', { method: 'POST' });
      alert('每日生成任务已启动！请到「生成记录」页查看进度。');
    } catch (e) { alert('启动失败: ' + e.message); }
    setDailyLoading(false);
  };

  const fetchZhihu = async () => {
    setZhihuLoading(true);
    try {
      const data = await api('/admin/fetch-zhihu', { method: 'POST' });
      alert(`爬取完成：获取 ${data.fetched} 条热榜，新增 ${data.newCards} 张卡片`);
      loadCards();
    } catch (e) { alert('知乎爬取失败: ' + e.message); }
    setZhihuLoading(false);
  };

  const p = cards.pagination;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={filter.source} onChange={e => handleFilter('source', e.target.value)}>
            <option value="">全部来源</option><option value="ai_generated">AI 生成</option><option value="zhihu">知乎热榜</option>
          </select>
          <select value={filter.role} onChange={e => handleFilter('role', e.target.value)}>
            <option value="">全部角色</option><option value="developer">程序员</option><option value="product_manager">产品经理</option><option value="general">通用</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={triggerDaily} disabled={dailyLoading} className="btn btn-primary" style={{ background: '#7c3aed' }}>{dailyLoading ? '已启动...' : '🚀 每日生成(100张)'}</button>
          <button onClick={() => setShowModal(true)} disabled={genLoading} className="btn btn-primary">{genLoading ? '生成中...' : '✨ 生成 AI 卡片'}</button>
          <button onClick={fetchZhihu} disabled={zhihuLoading} className="btn btn-orange">{zhihuLoading ? '爬取中...' : '🔥 爬取知乎热榜'}</button>
        </div>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: '40px 0' }}><Spinner size={24} /></div> : (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, overflowX: 'auto' }}>
            <table style={{ minWidth: 900 }}>
              <thead><tr>
                <th style={{ width: 48 }}>ID</th><th style={{ minWidth: 240 }}>标题</th><th style={{ width: 90 }}>来源</th>
                <th style={{ width: 90 }}>角色</th><th style={{ minWidth: 120 }}>标签</th><th style={{ width: 96 }}>作者</th>
                <th style={{ width: 144 }}>生成时间</th><th style={{ width: 64 }}>操作</th>
              </tr></thead>
              <tbody>
                {cards.cards.length === 0 ? <tr><td colSpan={8} style={{ textAlign: 'center', color: '#64748b', padding: '32px 0' }}>暂无卡片</td></tr> :
                  cards.cards.map(c => (
                    <tr key={c.id}>
                      <td style={{ color: '#64748b' }}>{c.id}</td>
                      <td><div style={{ fontWeight: 500, marginBottom: 2 }}>{c.title}</div><div style={{ color: '#64748b', fontSize: 12 }}>{c.summary?.slice(0, 60)}...</div></td>
                      <td><Badge type={c.source === 'zhihu' ? 'zhihu' : 'ai'}>{c.source === 'zhihu' ? '知乎热榜' : 'AI 生成'}</Badge></td>
                      <td><Badge type="role">{roleLabel(c.target_role)}</Badge></td>
                      <td>{(c.tags || []).map(t => <span key={t} className="tag">{t}</span>)}</td>
                      <td style={{ fontSize: 13 }}>{c.author_name}<div style={{ color: '#64748b', fontSize: 11 }}>{c.author_title}</div></td>
                      <td style={{ fontSize: 12, color: '#94a3b8' }}>{fmtTime(c.created_at)}</td>
                      <td><button onClick={() => deleteCard(c.id, c.title)} className="btn btn-danger">删除</button></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          {p?.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid #334155' }}>
              <span style={{ color: '#64748b', fontSize: 13 }}>共 {p.total} 张，第 {p.page}/{p.totalPages} 页</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => handlePage(p.page - 1)} disabled={p.page <= 1} className="btn btn-ghost" style={{ fontSize: 13, padding: '4px 10px' }}>上一页</button>
                <button onClick={() => handlePage(p.page + 1)} disabled={p.page >= p.totalPages} className="btn btn-ghost" style={{ fontSize: 13, padding: '4px 10px' }}>下一页</button>
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowModal(false)}>
          <div className="stat-card" style={{ maxWidth: 500, width: '90%', padding: 24, borderRadius: 16 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>生成 AI 卡片</h3>
            <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 6 }}>目标角色</label>
            <select value={genRole} onChange={e => setGenRole(e.target.value)} style={{ width: '100%', marginBottom: 16 }}>
              <option value="developer">程序员</option><option value="product_manager">产品经理</option>
            </select>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost">取消</button>
              <button onClick={generate} disabled={genLoading} className="btn btn-primary">{genLoading ? '生成中...' : '确认生成'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
