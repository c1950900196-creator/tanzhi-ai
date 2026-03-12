import { useState, useEffect } from 'react';
import { api, getAdminKey, clearAdminKey } from './api';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CardsManager from './pages/CardsManager';
import UsersManager from './pages/UsersManager';
import TagsManager from './pages/TagsManager';
import RagTest from './pages/RagTest';
import GenerationLogs from './pages/GenerationLogs';

const TABS = [
  { id: 'dashboard', label: '数据看板', icon: '📊' },
  { id: 'cards', label: '卡片管理', icon: '🃏' },
  { id: 'logs', label: '生成记录', icon: '📋' },
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

  if (checking) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>验证中...</div>;
  if (!authed) return <Login onLogin={() => setAuthed(true)} />;

  const PageComponent = { dashboard: Dashboard, cards: CardsManager, logs: GenerationLogs, users: UsersManager, tags: TagsManager, rag: RagTest }[tab] || Dashboard;

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '0 20px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>探知 Admin</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={tab === t.id ? 'btn btn-primary' : 'btn btn-ghost'}
                  style={{ fontSize: 14, padding: '6px 14px' }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={logout} className="btn btn-ghost" style={{ fontSize: 13, padding: '4px 12px' }}>退出</button>
        </div>
      </div>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 20px 40px' }}>
        <PageComponent key={tab} />
      </div>
    </div>
  );
}
