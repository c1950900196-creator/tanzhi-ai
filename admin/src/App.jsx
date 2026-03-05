import { useState, useEffect } from 'react';
import { api, getAdminKey, clearAdminKey } from './api';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CardsManager from './pages/CardsManager';
import UsersManager from './pages/UsersManager';
import TagsManager from './pages/TagsManager';
import RagTest from './pages/RagTest';

const TABS = [
  { id: 'dashboard', label: '数据看板', icon: '📊' },
  { id: 'cards', label: '卡片管理', icon: '🃏' },
  { id: 'users', label: '用户管理', icon: '👥' },
  { id: 'tags', label: '标签管理', icon: '🏷️' },
  { id: 'rag', label: 'RAG测试', icon: '🔬' }
];

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState('dashboard');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (getAdminKey()) {
      api('/admin/cards-stats')
        .then(() => setAuthed(true))
        .catch(() => clearAdminKey())
        .finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, []);

  const logout = () => { clearAdminKey(); setAuthed(false); };

  if (checking) return <div className="min-h-screen flex items-center justify-center text-[#64748b]">验证中...</div>;
  if (!authed) return <Login onLogin={() => setAuthed(true)} />;

  const PageComponent = { dashboard: Dashboard, cards: CardsManager, users: UsersManager, tags: TagsManager, rag: RagTest }[tab] || Dashboard;

  return (
    <div className="min-h-screen">
      <div className="bg-[#1e293b] border-b border-[#334155] px-5">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <div className="text-lg font-bold">探知 Admin</div>
            <div className="flex gap-1">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`px-4 py-2 rounded-lg text-sm flex items-center gap-1.5 transition-all ${tab === t.id ? 'bg-blue-500 text-white' : 'text-[#94a3b8] border border-[#334155] hover:bg-[#1e293b] hover:text-[#e2e8f0]'}`}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={logout} className="text-[13px] text-[#94a3b8] border border-[#334155] px-3 py-1.5 rounded-lg hover:bg-[#1e293b] hover:text-[#e2e8f0] transition-colors">退出</button>
        </div>
      </div>
      <div className="max-w-[1200px] mx-auto px-5 py-4 pb-10">
        <PageComponent key={tab} />
      </div>
    </div>
  );
}
