import { useState, useEffect } from 'react';
import { api } from '../api';
import { Spinner, Badge, roleLabel, eventLabel, fmtTime } from '../components/Helpers';

export default function UsersManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => { loadUsers(); }, []);
  const loadUsers = async () => {
    setLoading(true);
    try { setUsers(await api('/admin/analytics/users')); } catch (e) { alert('加载失败: ' + e.message); }
    setLoading(false);
  };

  const loadDetail = async (id) => {
    if (expandedUser === id) { setExpandedUser(null); setUserDetail(null); return; }
    setDetailLoading(true);
    try {
      setUserDetail(await api(`/admin/analytics/user/${id}`));
      setExpandedUser(id);
    } catch (e) { alert('加载失败: ' + e.message); }
    setDetailLoading(false);
  };

  const metaText = (type, meta) => {
    if (type === 'chat_end' && meta) return `${meta.duration_sec || 0}s / ${meta.message_count || 0}条 / ${meta.total_chars || 0}字`;
    return '-';
  };

  if (loading) return <div className="text-center py-10"><Spinner size={24} /></div>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">用户列表</h2>
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden">
        <table className="w-full border-collapse text-sm">
          <thead><tr className="text-left text-[#94a3b8] text-[13px] font-medium border-b border-[#334155]">
            <th className="px-3 py-2.5">ID</th><th className="px-3 py-2.5">用户名</th><th className="px-3 py-2.5">角色</th>
            <th className="px-3 py-2.5">浏览</th><th className="px-3 py-2.5">点击</th><th className="px-3 py-2.5">点击率</th>
            <th className="px-3 py-2.5">聊天数</th><th className="px-3 py-2.5">均时长</th><th className="px-3 py-2.5">均字数</th>
            <th className="px-3 py-2.5">注册时间</th><th className="px-3 py-2.5">最后使用</th>
          </tr></thead>
          <tbody>
            {users.length === 0 ? <tr><td colSpan={11} className="text-center text-[#64748b] py-8">暂无用户</td></tr> :
              users.map(u => (
                <tr key={u.id}>
                  <td colSpan={11} className="p-0">
                    <table className="w-full">
                      <tbody>
                        <tr onClick={() => loadDetail(u.id)} className="cursor-pointer border-b border-[#1e293b] hover:bg-[#1e293b]">
                          <td className="px-3 py-2.5 text-[#64748b]">{u.id}</td>
                          <td className="px-3 py-2.5 font-medium">{u.username}</td>
                          <td className="px-3 py-2.5"><Badge type="role">{roleLabel(u.role)}</Badge></td>
                          <td className="px-3 py-2.5">{u.views}</td><td className="px-3 py-2.5">{u.clicks}</td><td className="px-3 py-2.5">{u.click_rate}</td>
                          <td className="px-3 py-2.5">{u.chats}</td><td className="px-3 py-2.5">{u.avg_chat_sec}s</td><td className="px-3 py-2.5">{u.avg_chars}</td>
                          <td className="px-3 py-2.5 text-xs text-[#94a3b8]">{fmtTime(u.created_at)}</td>
                          <td className="px-3 py-2.5 text-xs text-[#94a3b8]">{u.last_active ? fmtTime(u.last_active) : '-'}</td>
                        </tr>
                        {expandedUser === u.id && (
                          <tr><td colSpan={11} className="px-5 py-4 bg-[#0f172a]">
                            {detailLoading ? <div className="text-center py-4"><Spinner /></div> : userDetail && (
                              <>
                                <div className="flex gap-6 mb-3 text-[13px]">
                                  <div><span className="text-[#64748b]">兴趣标签：</span>{(userDetail.user.tags || []).map(t => <span key={t} className="inline-block bg-[#334155] text-[#94a3b8] text-[11px] px-1.5 py-0.5 rounded mr-1">{t}</span>)}</div>
                                  <div><span className="text-[#64748b]">总聊天时长：</span>{userDetail.stats.total_chat_sec}s</div>
                                  <div><span className="text-[#64748b]">总输入字数：</span>{userDetail.stats.total_chars}</div>
                                </div>
                                <div className="text-[13px] text-[#64748b] mb-2">最近操作记录</div>
                                <div className="max-h-[300px] overflow-y-auto">
                                  <table className="w-full text-[13px]">
                                    <thead><tr className="text-left text-[#94a3b8] border-b border-[#334155]">
                                      <th className="px-2 py-1.5">事件</th><th className="px-2 py-1.5">卡片</th><th className="px-2 py-1.5">来源</th><th className="px-2 py-1.5">详情</th><th className="px-2 py-1.5">时间</th>
                                    </tr></thead>
                                    <tbody>
                                      {(userDetail.recent_events || []).map((e, i) => (
                                        <tr key={i} className="border-b border-[#334155]">
                                          <td className="px-2 py-1.5"><Badge type="role">{eventLabel(e.event_type)}</Badge></td>
                                          <td className="px-2 py-1.5 max-w-[200px] truncate">{e.card_title || '-'}</td>
                                          <td className="px-2 py-1.5">{e.source ? <Badge type={e.source === 'zhihu' ? 'zhihu' : 'ai'}>{e.source === 'zhihu' ? '知乎' : 'AI'}</Badge> : '-'}</td>
                                          <td className="px-2 py-1.5 text-[#64748b]">{metaText(e.event_type, e.meta)}</td>
                                          <td className="px-2 py-1.5 text-[#64748b]">{fmtTime(e.created_at)}</td>
                                        </tr>
                                      ))}
                                      {(userDetail.recent_events || []).length === 0 && <tr><td colSpan={5} className="text-center text-[#475569] py-4">暂无记录</td></tr>}
                                    </tbody>
                                  </table>
                                </div>
                              </>
                            )}
                          </td></tr>
                        )}
                      </tbody>
                    </table>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
