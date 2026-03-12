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

  if (loading) return <div style={{ textAlign: 'center', padding: '64px 0' }}><Spinner size={32} /><div style={{ marginTop: 12, color: '#64748b' }}>加载中...</div></div>;
  if (!analytics || !stats) return <div style={{ textAlign: 'center', padding: '64px 0', color: '#64748b' }}>暂无数据</div>;

  const ov = analytics.overview;
  const ai = analytics.by_source.ai_generated || {};
  const zh = analytics.by_source.zhihu || {};

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>核心指标</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="总浏览量" value={ov.total_views} icon="📄" />
        <StatCard label="总点击量" value={ov.total_clicks} icon="👆" />
        <StatCard label="点击率" value={ov.click_rate} icon="📈" />
        <StatCard label="总卡片数" value={stats.total} icon="🃏" />
      </div>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>来源对比</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
        {[{ label: 'AI 生成', badge: 'ai', data: ai, count: stats.bySource?.find(x => x.source === 'ai_generated')?.count || 0 },
          { label: '知乎热榜', badge: 'zhihu', data: zh, count: stats.bySource?.find(x => x.source === 'zhihu')?.count || 0 }].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Badge type={s.badge}>{s.label}</Badge>
              <span style={{ color: '#64748b', fontSize: 13 }}>{s.count} 张卡片</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
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

      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>角色分布</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {(stats.byRole || []).map(r => (
          <div key={r.target_role} className="stat-card">
            <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 8 }}>{roleLabel(r.target_role)}</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{r.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
