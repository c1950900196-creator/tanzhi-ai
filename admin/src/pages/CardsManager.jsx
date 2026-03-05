import { useState, useEffect } from 'react';
import { api } from '../api';
import { Spinner, Badge, roleLabel, fmtTime } from '../components/Helpers';

export default function CardsManager() {
  const [cards, setCards] = useState({ cards: [], pagination: {} });
  const [filter, setFilter] = useState({ source: '', role: '', page: 1 });
  const [loading, setLoading] = useState(true);
  const [genLoading, setGenLoading] = useState(false);
  const [zhihuLoading, setZhihuLoading] = useState(false);
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
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <div className="flex gap-2 items-center">
          <select value={filter.source} onChange={e => handleFilter('source', e.target.value)}
            className="bg-[#1e293b] text-[#e2e8f0] border border-[#334155] px-3 py-2 rounded-lg text-sm outline-none">
            <option value="">全部来源</option><option value="ai_generated">AI 生成</option><option value="zhihu">知乎热榜</option>
          </select>
          <select value={filter.role} onChange={e => handleFilter('role', e.target.value)}
            className="bg-[#1e293b] text-[#e2e8f0] border border-[#334155] px-3 py-2 rounded-lg text-sm outline-none">
            <option value="">全部角色</option><option value="developer">程序员</option><option value="product_manager">产品经理</option><option value="general">通用</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowModal(true)} disabled={genLoading} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50 transition-colors">{genLoading ? '生成中...' : '✨ 生成 AI 卡片'}</button>
          <button onClick={fetchZhihu} disabled={zhihuLoading} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50 transition-colors">{zhihuLoading ? '爬取中...' : '🔥 爬取知乎热榜'}</button>
        </div>
      </div>

      {loading ? <div className="text-center py-10"><Spinner size={24} /></div> : (
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead><tr className="text-left text-[#94a3b8] text-[13px] font-medium border-b border-[#334155]">
                <th className="px-3 py-2.5 w-12">ID</th><th className="px-3 py-2.5 min-w-[200px]">标题</th><th className="px-3 py-2.5 w-20">来源</th>
                <th className="px-3 py-2.5 w-20">角色</th><th className="px-3 py-2.5 min-w-[120px]">标签</th><th className="px-3 py-2.5 w-24">作者</th>
                <th className="px-3 py-2.5 w-36">生成时间</th><th className="px-3 py-2.5 w-16">操作</th>
              </tr></thead>
              <tbody>
                {cards.cards.length === 0 ? <tr><td colSpan={8} className="text-center text-[#64748b] py-8">暂无卡片</td></tr> :
                  cards.cards.map(c => (
                    <tr key={c.id} className="border-b border-[#1e293b] hover:bg-[#1e293b] text-sm">
                      <td className="px-3 py-2.5 text-[#64748b]">{c.id}</td>
                      <td className="px-3 py-2.5"><div className="font-medium mb-0.5">{c.title}</div><div className="text-[#64748b] text-xs">{c.summary}</div></td>
                      <td className="px-3 py-2.5"><Badge type={c.source === 'zhihu' ? 'zhihu' : 'ai'}>{c.source === 'zhihu' ? '知乎热榜' : 'AI 生成'}</Badge></td>
                      <td className="px-3 py-2.5"><Badge type="role">{roleLabel(c.target_role)}</Badge></td>
                      <td className="px-3 py-2.5">{(c.tags || []).map(t => <span key={t} className="inline-block bg-[#334155] text-[#94a3b8] text-[11px] px-1.5 py-0.5 rounded mr-1">{t}</span>)}</td>
                      <td className="px-3 py-2.5 text-[13px]">{c.author_name}<div className="text-[#64748b] text-[11px]">{c.author_title}</div></td>
                      <td className="px-3 py-2.5 text-xs text-[#94a3b8]">{fmtTime(c.created_at)}</td>
                      <td className="px-3 py-2.5"><button onClick={() => deleteCard(c.id, c.title)} className="bg-red-600 hover:bg-red-700 text-white text-xs px-2.5 py-1 rounded-md transition-colors">删除</button></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {p?.totalPages > 1 && (
            <div className="flex justify-between items-center px-4 py-3 border-t border-[#334155]">
              <span className="text-[#64748b] text-[13px]">共 {p.total} 张，第 {p.page}/{p.totalPages} 页</span>
              <div className="flex gap-1">
                <button onClick={() => handlePage(p.page - 1)} disabled={p.page <= 1} className="text-[13px] px-2.5 py-1 rounded bg-transparent border border-[#334155] text-[#94a3b8] hover:bg-[#1e293b] disabled:opacity-50">上一页</button>
                <button onClick={() => handlePage(p.page + 1)} disabled={p.page >= p.totalPages} className="text-[13px] px-2.5 py-1 rounded bg-transparent border border-[#334155] text-[#94a3b8] hover:bg-[#1e293b] disabled:opacity-50">下一页</button>
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6 max-w-md w-[90%]" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">生成 AI 卡片</h3>
            <label className="text-[13px] text-[#94a3b8] block mb-1.5">目标角色</label>
            <select value={genRole} onChange={e => setGenRole(e.target.value)} className="w-full mb-4 bg-[#1e293b] text-[#e2e8f0] border border-[#334155] px-3 py-2 rounded-lg text-sm outline-none">
              <option value="developer">程序员</option><option value="product_manager">产品经理</option>
            </select>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm border border-[#334155] text-[#94a3b8] hover:bg-[#1e293b]">取消</button>
              <button onClick={generate} disabled={genLoading} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">{genLoading ? '生成中...' : '确认生成'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
