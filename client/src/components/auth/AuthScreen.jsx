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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative bg-[#F2F2F7]">
      <div className="w-full max-w-md bg-white rounded-[32px] p-8 z-10 shadow-[0_8px_32px_rgba(0,0,0,0.04)] animate-slide-up border border-gray-100">
        <div className="flex justify-center mb-4">
          <img src="/logo.png" alt="探知" style={{ height: '56px', objectFit: 'contain' }} />
        </div>
        <h1 className="text-2xl font-bold text-center mb-1 text-[#1D1D1F] tracking-tight">探知</h1>
        <p className="text-gray-500 text-center text-sm mb-8">人类认知进化加速器</p>

        <div className="flex mb-6 bg-gray-100/80 rounded-[14px] p-1">
          <button onClick={() => { setIsLogin(true); setError(''); }} className={`flex-1 py-2 rounded-xl text-[13px] font-semibold transition-all ${isLogin ? 'bg-white text-[#1D1D1F] shadow-sm' : 'text-gray-500'}`}>登录</button>
          <button onClick={() => { setIsLogin(false); setError(''); }} className={`flex-1 py-2 rounded-xl text-[13px] font-semibold transition-all ${!isLogin ? 'bg-white text-[#1D1D1F] shadow-sm' : 'text-gray-500'}`}>注册</button>
        </div>

        <div className="space-y-4 mb-6">
          <input type="text" placeholder="用户名" value={username} onChange={e => setUsername(e.target.value)}
            className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50/50 outline-none focus:border-[#007AFF] focus:bg-white transition-colors text-[#1D1D1F] placeholder-gray-400 text-[15px]" />
          <div className="relative">
            <input type={showPwd ? 'text' : 'password'} placeholder="密码" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full px-4 py-3.5 pr-12 rounded-2xl border border-gray-200 bg-gray-50/50 outline-none focus:border-[#007AFF] focus:bg-white transition-colors text-[#1D1D1F] placeholder-gray-400 text-[15px]" />
            <button type="button" onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors">
              {showPwd ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {error && <div className="text-red-500 text-sm text-center mb-4">{error}</div>}

        <button onClick={handleSubmit} disabled={loading}
          className={`w-full py-3.5 rounded-2xl font-semibold text-[15px] transition-all ${loading ? 'bg-gray-200 text-gray-400' : 'bg-[#1D1D1F] text-white hover:bg-black hover:scale-[0.98] active:scale-95'}`}>
          {loading ? '请稍候...' : (isLogin ? '登录' : '注册')}
        </button>
      </div>
    </div>
  );
}
