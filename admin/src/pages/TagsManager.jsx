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

  if (loading) return <div style={{ textAlign: 'center', padding: '40px 0' }}><Spinner size={24} /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>标签库 <span style={{ color: '#64748b', fontSize: 14, fontWeight: 400 }}>({total} 个)</span></h2>
        <button onClick={initTags} disabled={initLoading} className="btn btn-primary">{initLoading ? '初始化中...' : '🔄 从卡片初始化'}</button>
      </div>

      {selected.size > 0 && (
        <div className="stat-card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ color: '#94a3b8', fontSize: 13 }}>已选 {selected.size} 个标签</span>
          <input type="text" value={mergeTarget} onChange={e => setMergeTarget(e.target.value)} placeholder="合并目标标签名" style={{ width: 192 }} />
          <button onClick={mergeTags} disabled={mergeLoading} className="btn btn-primary" style={{ fontSize: 13, padding: '6px 12px' }}>{mergeLoading ? '合并中...' : '🔗 合并标签'}</button>
          <button onClick={() => setSelected(new Set())} className="btn btn-ghost" style={{ fontSize: 13, padding: '6px 12px' }}>清除选择</button>
        </div>
      )}

      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, overflowX: 'auto' }}>
        <table style={{ minWidth: 700 }}>
          <thead><tr>
            <th style={{ width: 40 }}><input type="checkbox" checked={selected.size === tags.length && tags.length > 0} onChange={selectAll} /></th>
            <th style={{ width: 48 }}>ID</th><th style={{ minWidth: 120 }}>标签名</th>
            <th style={{ width: 80 }}>分类</th><th style={{ width: 80 }}>使用次数</th>
            <th style={{ width: 80 }}>有向量</th><th style={{ width: 144 }}>创建时间</th><th style={{ width: 64 }}>操作</th>
          </tr></thead>
          <tbody>
            {tags.length === 0 ? <tr><td colSpan={8} style={{ textAlign: 'center', color: '#64748b', padding: '32px 0' }}>暂无标签</td></tr> :
              tags.map(t => (
                <tr key={t.id} style={selected.has(t.id) ? { background: '#1e3a5f' } : {}}>
                  <td><input type="checkbox" checked={selected.has(t.id)} onChange={() => toggle(t.id)} /></td>
                  <td style={{ color: '#64748b' }}>{t.id}</td>
                  <td style={{ fontWeight: 500 }}><span className="tag" style={{ fontSize: 13, padding: '2px 10px' }}>#{t.name}</span></td>
                  <td style={{ color: '#94a3b8', fontSize: 13 }}>{t.category || '-'}</td>
                  <td><span style={{ color: '#3b82f6', fontWeight: 600 }}>{t.usage_count}</span></td>
                  <td>{t.has_embedding !== false ? <span style={{ color: '#22c55e' }}>✓</span> : <span style={{ color: '#ef4444' }}>✗</span>}</td>
                  <td style={{ fontSize: 12, color: '#94a3b8' }}>{fmtTime(t.created_at)}</td>
                  <td><button onClick={() => deleteTag(t.id, t.name)} className="btn btn-danger">删除</button></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
