import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { api } from '../../api';

export default function AuthScreen({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) { setError('请填写用户名和密码'); return; }
    setError(''); setLoading(true);
    try {
      const data = isLogin ? await api.login(username, password) : await api.register(username, password);
      localStorage.setItem('tanzhi_token', data.token);
      onAuthSuccess(data.token, data.user);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400/20 rounded-full blur-[80px]" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-400/20 rounded-full blur-[80px]" />

      <div className="glass-panel w-full max-w-md rounded-3xl p-8 z-10 animate-slide-up">
        <div className="flex justify-center mb-4">
          <img src="/logo.png" alt="探知" style={{ height: '48px', objectFit: 'contain' }} />
        </div>
        <h1 className="text-2xl font-bold text-center mb-1 text-slate-900">探知</h1>
        <p className="text-slate-500 text-center text-sm mb-8">AI 认知主动探测器</p>

        <div className="flex mb-6 bg-slate-100 rounded-xl p-1">
          <button onClick={() => { setIsLogin(true); setError(''); }} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>登录</button>
          <button onClick={() => { setIsLogin(false); setError(''); }} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${!isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>注册</button>
        </div>

        <div className="space-y-4 mb-6">
          <input type="text" placeholder="用户名" value={username} onChange={e => setUsername(e.target.value)}
            className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white/60 outline-none focus:border-blue-600 transition-colors text-slate-900 placeholder-slate-400" />
          <div className="relative">
            <input type={showPwd ? 'text' : 'password'} placeholder="密码" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full px-4 py-3.5 pr-12 rounded-xl border border-slate-200 bg-white/60 outline-none focus:border-blue-600 transition-colors text-slate-900 placeholder-slate-400" />
            <button type="button" onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors">
              {showPwd ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {error && <div className="text-rose-500 text-sm text-center mb-4">{error}</div>}

        <button onClick={handleSubmit} disabled={loading}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${loading ? 'bg-slate-300 text-slate-500' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-md'}`}>
          {loading ? '请稍候...' : (isLogin ? '登录' : '注册')}
        </button>
      </div>
    </div>
  );
}
