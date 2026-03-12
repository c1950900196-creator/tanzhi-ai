import { useState, useEffect } from 'react';
import { api } from '../api';
import { Spinner, Badge, fmtTime } from '../components/Helpers';

const TYPE_MAP = {
  ai_generate: { label: 'AI 生成', badge: 'ai' },
  daily_generate: { label: '每日生成', badge: 'ai' },
  daily_summary: { label: '每日汇总', badge: 'role' },
  zhihu_crawl: { label: '知乎爬取', badge: 'zhihu' }
};

function formatDuration(ms) {
  if (!ms) return '-';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function GenerationLogs() {
  const [logs, setLogs] = useState({ logs: [], pagination: {} });
  const [filter, setFilter] = useState({ type: '', page: 1 });
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const load = async (f = filter) => {
    setLoading(true);
    try {
      let qs = `?page=${f.page}&limit=20`;
      if (f.type) qs += `&type=${f.type}`;
      setLogs(await api(`/admin/generation-logs${qs}`));
    } catch (e) { alert('加载失败: ' + e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleFilter = (val) => {
    const f = { type: val, page: 1 };
    setFilter(f);
    load(f);
  };

  const handlePage = (p) => {
    const f = { ...filter, page: p };
    setFilter(f);
    load(f);
  };

  const p = logs.pagination;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={filter.type} onChange={e => handleFilter(e.target.value)}>
            <option value="">全部类型</option>
            <option value="ai_generate">AI 生成（手动）</option>
            <option value="daily_generate">每日生成</option>
            <option value="daily_summary">每日汇总</option>
            <option value="zhihu_crawl">知乎爬取</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}><Spinner size={24} /></div>
      ) : logs.logs.length === 0 ? (
        <div className="stat-card" style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
          暂无生成记录，生成卡片或爬取知乎后记录将自动出现
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {logs.logs.map(log => {
            const typeInfo = TYPE_MAP[log.type] || { label: log.type, badge: 'role' };
            const isExpanded = expandedId === log.id;
            return (
              <div key={log.id} className="stat-card" style={{ padding: 0 }}>
                <div
                  style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                    <Badge type={typeInfo.badge}>{typeInfo.label}</Badge>
                    <span style={{ color: log.status === 'failed' ? '#ef4444' : '#22c55e', fontWeight: 600, fontSize: 13 }}>
                      {log.status === 'failed' ? '❌ 失败' : '✅ 成功'}
                    </span>
                    {log.target_role && (
                      <span style={{ color: '#94a3b8', fontSize: 13 }}>
                        {log.target_role === 'developer' ? '程序员' : '产品经理'}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                    <div style={{ display: 'flex', gap: 12, fontSize: 13 }}>
                      {(log.type === 'ai_generate' || log.type === 'daily_generate') && (
                        <>
                          <span style={{ color: '#94a3b8' }}>请求 <strong style={{ color: '#e2e8f0' }}>{log.requested}</strong></span>
                          <span style={{ color: '#94a3b8' }}>入库 <strong style={{ color: '#22c55e' }}>{log.kept}</strong></span>
                          {log.dedup_dropped > 0 && (
                            <span style={{ color: '#94a3b8' }}>去重 <strong style={{ color: '#f59e0b' }}>{log.dedup_dropped}</strong></span>
                          )}
                          {log.retries > 0 && (
                            <span style={{ color: '#94a3b8' }}>重试 <strong style={{ color: '#f59e0b' }}>{log.retries}</strong></span>
                          )}
                        </>
                      )}
                      {log.type === 'daily_summary' && (
                        <>
                          <span style={{ color: '#94a3b8' }}>目标 <strong style={{ color: '#e2e8f0' }}>{log.requested}</strong></span>
                          <span style={{ color: '#94a3b8' }}>实际 <strong style={{ color: '#22c55e' }}>{log.kept}</strong></span>
                          {log.dedup_dropped > 0 && (
                            <span style={{ color: '#94a3b8' }}>去重 <strong style={{ color: '#f59e0b' }}>{log.dedup_dropped}</strong></span>
                          )}
                        </>
                      )}
                      {log.type === 'zhihu_crawl' && (
                        <>
                          <span style={{ color: '#94a3b8' }}>获取 <strong style={{ color: '#e2e8f0' }}>{log.requested}</strong></span>
                          <span style={{ color: '#94a3b8' }}>新增 <strong style={{ color: '#22c55e' }}>{log.kept}</strong></span>
                          {log.dedup_dropped > 0 && (
                            <span style={{ color: '#94a3b8' }}>重复 <strong style={{ color: '#f59e0b' }}>{log.dedup_dropped}</strong></span>
                          )}
                        </>
                      )}
                      <span style={{ color: '#64748b' }}>耗时 <strong style={{ color: '#94a3b8' }}>{formatDuration(log.duration_ms)}</strong></span>
                    </div>
                    <span style={{ color: '#64748b', fontSize: 12 }}>{fmtTime(log.created_at)}</span>
                    <span style={{ color: '#64748b', fontSize: 12, transition: 'transform .2s', transform: isExpanded ? 'rotate(180deg)' : '' }}>▼</span>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ borderTop: '1px solid #334155', padding: '14px 18px' }}>
                    {log.status === 'failed' && log.error_msg && (
                      <div style={{ background: '#451a1a', border: '1px solid #7f1d1d', borderRadius: 8, padding: '10px 14px', marginBottom: 12, color: '#fca5a5', fontSize: 13 }}>
                        <strong>错误信息：</strong>{log.error_msg}
                      </div>
                    )}

                    {log.card_titles?.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>
                          {log.type === 'ai_generate' ? '生成的卡片' : '新增的卡片'} ({log.card_titles.length})
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {log.card_titles.map((t, i) => (
                            <span key={i} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '4px 10px', fontSize: 12, color: '#e2e8f0' }}>
                              {log.card_ids?.[i] && <span style={{ color: '#64748b', marginRight: 4 }}>#{log.card_ids[i]}</span>}
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {log.dropped_titles?.length > 0 && (
                      <div>
                        <div style={{ color: '#f59e0b', fontSize: 12, marginBottom: 6 }}>去重丢弃 ({log.dropped_titles.length})</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {log.dropped_titles.map((t, i) => (
                            <span key={i} style={{ background: '#1c1917', border: '1px solid #44403c', borderRadius: 6, padding: '4px 10px', fontSize: 12, color: '#a8a29e', textDecoration: 'line-through' }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {!log.card_titles?.length && !log.dropped_titles?.length && log.status !== 'failed' && (
                      <div style={{ color: '#64748b', fontSize: 13 }}>无详细信息</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {p?.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <span style={{ color: '#64748b', fontSize: 13 }}>共 {p.total} 条，第 {p.page}/{p.totalPages} 页</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => handlePage(p.page - 1)} disabled={p.page <= 1} className="btn btn-ghost" style={{ fontSize: 13, padding: '4px 10px' }}>上一页</button>
            <button onClick={() => handlePage(p.page + 1)} disabled={p.page >= p.totalPages} className="btn btn-ghost" style={{ fontSize: 13, padding: '4px 10px' }}>下一页</button>
          </div>
        </div>
      )}
    </div>
  );
}
