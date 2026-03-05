import { useState, useEffect } from 'react';
import { api } from '../api';
import { Spinner, fmtTime } from '../components/Helpers';

export default function TagsManager() {
  const [tags, setTags] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [initLoading, setInitLoading] = useState(false);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [mergeTarget, setMergeTarget] = useState('');

  useEffect(() => { loadTags(); }, []);
  const loadTags = async () => {
    setLoading(true);
    try { const d = await api('/admin/tags'); setTags(d.tags); setTotal(d.total); } catch (e) { alert('加载失败: ' + e.message); }
    setLoading(false);
  };

  const initTags = async () => {
    if (!confirm('从所有卡片中提取标签并生成向量？')) return;
    setInitLoading(true);
    try {
      const d = await api('/admin/tags/init', { method: 'POST' });
      alert(`初始化完成：新增 ${d.added} 个标签`);
      loadTags();
    } catch (e) { alert('失败: ' + e.message); }
    setInitLoading(false);
  };

  const deleteTag = async (id, name) => {
    if (!confirm(`删除标签「${name}」？`)) return;
    try { await api(`/admin/tags/${id}`, { method: 'DELETE' }); selected.delete(id); loadTags(); } catch (e) { alert('失败: ' + e.message); }
  };

  const toggle = (id) => { const s = new Set(selected); s.has(id) ? s.delete(id) : s.add(id); setSelected(s); };
  const selectAll = () => { if (selected.size === tags.length) setSelected(new Set()); else setSelected(new Set(tags.map(t => t.id))); };

  const mergeTags = async () => {
    if (!mergeTarget.trim()) return alert('请输入合并目标标签名');
    if (selected.size < 2) return alert('请至少选择2个标签');
    if (!confirm(`合并 ${selected.size} 个标签为「${mergeTarget}」？`)) return;
    setMergeLoading(true);
    try {
      await api('/admin/tags/merge', { method: 'POST', body: JSON.stringify({ sourceIds: [...selected], targetName: mergeTarget }) });
      alert('合并成功');
      setSelected(new Set());
      setMergeTarget('');
      loadTags();
    } catch (e) { alert('失败: ' + e.message); }
    setMergeLoading(false);
  };

  if (loading) return <div className="text-center py-10"><Spinner size={24} /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">标签库 <span className="text-[#64748b] text-sm font-normal">({total} 个)</span></h2>
        <button onClick={initTags} disabled={initLoading} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50 transition-colors">{initLoading ? '初始化中...' : '🔄 从卡片初始化'}</button>
      </div>

      {selected.size > 0 && (
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 mb-4 flex items-center gap-3 flex-wrap">
          <span className="text-[#94a3b8] text-[13px]">已选 {selected.size} 个标签</span>
          <input type="text" value={mergeTarget} onChange={e => setMergeTarget(e.target.value)} placeholder="合并目标标签名" className="w-48 bg-[#1e293b] text-[#e2e8f0] border border-[#334155] px-3 py-1.5 rounded-lg text-sm outline-none" />
          <button onClick={mergeTags} disabled={mergeLoading} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm disabled:opacity-50">{mergeLoading ? '合并中...' : '🔗 合并标签'}</button>
          <button onClick={() => setSelected(new Set())} className="px-3 py-1.5 rounded-lg text-sm border border-[#334155] text-[#94a3b8] hover:bg-[#1e293b]">清除选择</button>
        </div>
      )}

      <div className="bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden">
        <table className="w-full border-collapse text-sm">
          <thead><tr className="text-left text-[#94a3b8] text-[13px] font-medium border-b border-[#334155]">
            <th className="px-3 py-2.5 w-10"><input type="checkbox" checked={selected.size === tags.length && tags.length > 0} onChange={selectAll} /></th>
            <th className="px-3 py-2.5 w-12">ID</th><th className="px-3 py-2.5 min-w-[120px]">标签名</th>
            <th className="px-3 py-2.5 w-20">分类</th><th className="px-3 py-2.5 w-20">使用次数</th>
            <th className="px-3 py-2.5 w-20">有向量</th><th className="px-3 py-2.5 w-36">创建时间</th><th className="px-3 py-2.5 w-16">操作</th>
          </tr></thead>
          <tbody>
            {tags.length === 0 ? <tr><td colSpan={8} className="text-center text-[#64748b] py-8">暂无标签</td></tr> :
              tags.map(t => (
                <tr key={t.id} className={`border-b border-[#1e293b] hover:bg-[#1e293b] ${selected.has(t.id) ? 'bg-[#1e3a5f]' : ''}`}>
                  <td className="px-3 py-2.5"><input type="checkbox" checked={selected.has(t.id)} onChange={() => toggle(t.id)} /></td>
                  <td className="px-3 py-2.5 text-[#64748b]">{t.id}</td>
                  <td className="px-3 py-2.5 font-medium"><span className="bg-[#334155] text-[#e2e8f0] px-2.5 py-0.5 rounded-full text-[13px]">#{t.name}</span></td>
                  <td className="px-3 py-2.5 text-[#94a3b8] text-[13px]">{t.category || '-'}</td>
                  <td className="px-3 py-2.5"><span className="text-blue-500 font-semibold">{t.usage_count}</span></td>
                  <td className="px-3 py-2.5">{t.has_embedding !== false ? <span className="text-green-500">✓</span> : <span className="text-red-500">✗</span>}</td>
                  <td className="px-3 py-2.5 text-xs text-[#94a3b8]">{fmtTime(t.created_at)}</td>
                  <td className="px-3 py-2.5"><button onClick={() => deleteTag(t.id, t.name)} className="bg-red-600 hover:bg-red-700 text-white text-xs px-2.5 py-1 rounded-md transition-colors">删除</button></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
