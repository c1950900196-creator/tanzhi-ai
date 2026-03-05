import { useState, useEffect } from 'react';
import { api } from '../api';
import { Spinner, StatCard, MiniStat, Badge, roleLabel } from '../components/Helpers';

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);
  const loadData = async () => {
    setLoading(true);
    try {
      const [a, s] = await Promise.all([api('/admin/analytics'), api('/admin/cards-stats')]);
      setAnalytics(a);
      setStats(s);
    } catch (e) { alert('加载失败: ' + e.message); }
    setLoading(false);
  };

  if (loading) return <div className="text-center py-16"><Spinner size={32} /><div className="mt-3 text-[#64748b]">加载中...</div></div>;
  if (!analytics || !stats) return <div className="text-center py-16 text-[#64748b]">暂无数据</div>;

  const ov = analytics.overview;
  const ai = analytics.by_source.ai_generated || {};
  const zh = analytics.by_source.zhihu || {};

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">核心指标</h2>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="总浏览量" value={ov.total_views} icon="📄" />
        <StatCard label="总点击量" value={ov.total_clicks} icon="👆" />
        <StatCard label="点击率" value={ov.click_rate} icon="📈" />
        <StatCard label="总卡片数" value={stats.total} icon="🃏" />
      </div>

      <h2 className="text-xl font-semibold mb-4">来源对比</h2>
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[{ label: 'AI 生成', badge: 'ai', data: ai, count: stats.bySource?.find(x => x.source === 'ai_generated')?.count || 0 },
          { label: '知乎热榜', badge: 'zhihu', data: zh, count: stats.bySource?.find(x => x.source === 'zhihu')?.count || 0 }].map(s => (
          <div key={s.label} className="bg-[#1e293b] border border-[#334155] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4"><Badge type={s.badge}>{s.label}</Badge><span className="text-[#64748b] text-[13px]">{s.count} 张卡片</span></div>
            <div className="grid grid-cols-3 gap-3">
              <MiniStat label="浏览" value={s.data.views || 0} />
              <MiniStat label="点击" value={s.data.clicks || 0} />
              <MiniStat label="点击率" value={s.data.click_rate || '0%'} />
              <MiniStat label="聊天数" value={s.data.chats || 0} />
              <MiniStat label="均时长" value={`${s.data.avg_chat_sec || 0}s`} />
              <MiniStat label="均字数" value={s.data.avg_chars || 0} />
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-semibold mb-4">角色分布</h2>
      <div className="grid grid-cols-3 gap-4">
        {(stats.byRole || []).map(r => (
          <div key={r.target_role} className="bg-[#1e293b] border border-[#334155] rounded-xl p-5">
            <div className="text-[#94a3b8] text-[13px] mb-2">{roleLabel(r.target_role)}</div>
            <div className="text-3xl font-bold">{r.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
