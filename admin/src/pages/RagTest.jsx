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
      <h2 className="text-xl font-semibold mb-4">RAG 标签匹配测试</h2>
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 mb-5">
        <div className="mb-3 text-[#94a3b8] text-[13px]">输入卡片标题或任意文本，测试 RAG 向量匹配和 smartTag 的输出效果</div>
        <div className="flex gap-2 mb-2">
          <input type="text" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && runTest()}
            placeholder="输入测试文本，如：如何在面试中展示自己的项目经验"
            className="flex-1 bg-[#1e293b] text-[#e2e8f0] border border-[#334155] px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-500" />
          <button onClick={() => runTest()} disabled={loading} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50 transition-colors">{loading ? <Spinner /> : '🔍 测试匹配'}</button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {EXAMPLES.map(ex => (
            <button key={ex} onClick={() => runTest(ex)} className="text-xs px-2.5 py-1 rounded-lg border border-[#334155] text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#e2e8f0] transition-colors">{ex}</button>
          ))}
        </div>
      </div>

      {result && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4">
            <h3 className="text-[15px] font-semibold mb-3">📊 向量相似度排名 <span className="text-[#64748b] text-xs">TOP {result.all_matches.length} / {result.total_tags_with_embedding} 个有向量标签</span></h3>
            <div className="text-xs text-[#64748b] mb-2">阈值 ≥ {result.threshold_used} 会被 smartTag 选用</div>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[#94a3b8] text-[13px] border-b border-[#334155]">
                <th className="px-2 py-1.5 w-8">#</th><th className="px-2 py-1.5">标签</th><th className="px-2 py-1.5 w-20">相似度</th><th className="px-2 py-1.5 w-16">使用</th>
              </tr></thead>
              <tbody>
                {result.all_matches.map((m, i) => (
                  <tr key={m.id} className={m.similarity >= result.threshold_used ? 'bg-[#0f2918]' : ''}>
                    <td className="px-2 py-1.5 text-[#64748b] text-xs">{i + 1}</td>
                    <td className="px-2 py-1.5"><span className={`px-2.5 py-0.5 rounded-full text-[13px] ${m.similarity >= result.threshold_used ? 'bg-green-900 text-[#e2e8f0]' : 'bg-[#334155] text-[#e2e8f0]'}`}>#{m.name}</span></td>
                    <td className="px-2 py-1.5"><span className={`font-mono font-semibold ${m.similarity >= result.threshold_used ? 'text-green-500' : m.similarity >= 0.45 ? 'text-yellow-500' : 'text-[#94a3b8]'}`}>{(m.similarity * 100).toFixed(1)}%</span></td>
                    <td className="px-2 py-1.5 text-blue-500 text-[13px]">{m.usage_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 mb-4">
              <h3 className="text-[15px] font-semibold mb-3">🎯 smartTag 最终输出</h3>
              <div className="flex gap-2 flex-wrap">
                {result.smart_tag_output.map(t => <span key={t} className="bg-blue-500 text-white px-3.5 py-1 rounded-full text-sm font-medium">{t}</span>)}
              </div>
              <div className="text-[#64748b] text-xs mt-2.5">这些是用户看到的卡片标签</div>
            </div>
            <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4">
              <h3 className="text-[15px] font-semibold mb-3">✅ 超过阈值的匹配 <span className="text-green-500 text-[13px]">({result.above_threshold.length} 个)</span></h3>
              {result.above_threshold.length === 0 ? <div className="text-[#64748b] text-[13px]">无标签超过阈值，smartTag 会回退到 AI 生成</div> :
                result.above_threshold.map(m => (
                  <div key={m.id} className="flex justify-between items-center py-1.5 border-b border-[#334155]">
                    <span className="text-sm">#{m.name}</span>
                    <span className="font-mono text-green-500 font-semibold">{(m.similarity * 100).toFixed(1)}%</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
