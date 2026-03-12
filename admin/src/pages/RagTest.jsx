import { useState } from 'react';
import { api } from '../api';
import { Spinner } from '../components/Helpers';

const EXAMPLES = ['用ChatGPT写代码怎么避免返工', '如何看待腾讯对中学生开放实习', '美军战前TikTok晒牛排龙虾', '产品经理面试五个高频问题'];

export default function RagTest() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runTest = async (input) => {
    const q = input || text;
    if (!q.trim()) return alert('请输入测试文本');
    setText(q);
    setLoading(true);
    try {
      setResult(await api('/admin/rag-test', { method: 'POST', body: JSON.stringify({ text: q, topK: 15 }) }));
    } catch (e) { alert('测试失败: ' + e.message); }
    setLoading(false);
  };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>RAG 标签匹配测试</h2>
      <div className="stat-card" style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 12, color: '#94a3b8', fontSize: 13 }}>输入卡片标题或任意文本，测试 RAG 向量匹配和 smartTag 的输出效果</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input type="text" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && runTest()}
            placeholder="输入测试文本，如：如何在面试中展示自己的项目经验" style={{ flex: 1 }} />
          <button onClick={() => runTest()} disabled={loading} className="btn btn-primary">{loading ? <Spinner /> : '🔍 测试匹配'}</button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {EXAMPLES.map(ex => (
            <button key={ex} onClick={() => runTest(ex)} className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }}>{ex}</button>
          ))}
        </div>
      </div>

      {result && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="stat-card">
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>📊 向量相似度排名 <span style={{ color: '#64748b', fontSize: 12 }}>TOP {result.all_matches.length} / {result.total_tags_with_embedding} 个有向量标签</span></h3>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>阈值 ≥ {result.threshold_used} 会被 smartTag 选用</div>
            <table>
              <thead><tr>
                <th style={{ width: 32 }}>#</th><th>标签</th><th style={{ width: 80 }}>相似度</th><th style={{ width: 64 }}>使用</th>
              </tr></thead>
              <tbody>
                {result.all_matches.map((m, i) => (
                  <tr key={m.id} style={m.similarity >= result.threshold_used ? { background: '#0f2918' } : {}}>
                    <td style={{ color: '#64748b', fontSize: 12 }}>{i + 1}</td>
                    <td><span className="tag" style={m.similarity >= result.threshold_used ? { background: '#14532d', color: '#e2e8f0', padding: '2px 10px', fontSize: 13 } : { padding: '2px 10px', fontSize: 13 }}>#{m.name}</span></td>
                    <td><span style={{ fontFamily: 'monospace', fontWeight: 600, color: m.similarity >= result.threshold_used ? '#22c55e' : m.similarity >= 0.45 ? '#eab308' : '#94a3b8' }}>{(m.similarity * 100).toFixed(1)}%</span></td>
                    <td style={{ color: '#3b82f6', fontSize: 13 }}>{m.usage_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <div className="stat-card" style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>🎯 smartTag 最终输出</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {result.smart_tag_output.map(t => <span key={t} style={{ background: '#3b82f6', color: '#fff', padding: '4px 14px', borderRadius: 9999, fontSize: 14, fontWeight: 500 }}>{t}</span>)}
              </div>
              <div style={{ color: '#64748b', fontSize: 12, marginTop: 10 }}>这些是用户看到的卡片标签</div>
            </div>
            <div className="stat-card">
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>✅ 超过阈值的匹配 <span style={{ color: '#22c55e', fontSize: 13 }}>({result.above_threshold.length} 个)</span></h3>
              {result.above_threshold.length === 0 ? <div style={{ color: '#64748b', fontSize: 13 }}>无标签超过阈值，smartTag 会回退到 AI 生成</div> :
                result.above_threshold.map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #334155' }}>
                    <span style={{ fontSize: 14 }}>#{m.name}</span>
                    <span style={{ fontFamily: 'monospace', color: '#22c55e', fontWeight: 600 }}>{(m.similarity * 100).toFixed(1)}%</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
