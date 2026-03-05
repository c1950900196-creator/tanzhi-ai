import { Terminal, Lightbulb, Radar, Zap, Database } from 'lucide-react';

export default function ProfileScreen({ userProfile, username, onLogout }) {
  return (
    <div className="h-screen w-full relative bg-slate-100 overflow-y-auto pb-24 animate-fade-in">
      <div className="px-5 pt-3 pb-4 bg-white/70 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 flex flex-col">
        <div className="flex items-center space-x-2.5 mb-3">
          <img src="/logo.png" alt="探知" style={{ height: '42px', objectFit: 'contain' }} />
          <span className="font-bold text-xl tracking-wide text-slate-900">探知</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">我的</h1>
      </div>

      <div className="p-6 space-y-6">
        <div className="glass-panel p-6 rounded-3xl">
          <div className="flex items-center space-x-4 mb-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20">
              {userProfile.role === 'developer' ? 'D' : 'P'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{username || 'Explorer'}</h2>
              <p className="text-slate-500 text-sm mt-1 flex items-center">
                {userProfile.role === 'developer' ? <Terminal size={14} className="mr-1" /> : <Lightbulb size={14} className="mr-1" />}
                {userProfile.role === 'developer' ? '程序员' : '产品经理'}
              </p>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-4">
            <h3 className="font-bold text-slate-900 mb-3 flex items-center text-sm">
              <Radar size={16} className="mr-1.5 text-indigo-500" /> 关注领域
            </h3>
            <div className="flex flex-wrap gap-2">
              {userProfile.tags.map(tag => (
                <span key={tag} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm border border-indigo-100 font-medium">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-[40px]" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-slate-300 text-sm mb-1 flex items-center"><Zap size={14} className="mr-1 text-yellow-400" /> 剩余芝士 (Tokens)</div>
                <div className="text-3xl font-bold flex items-baseline">1,250,000 <span className="text-sm font-normal text-slate-400 ml-2">/ 2M</span></div>
              </div>
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md"><Database className="text-blue-600" /></div>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-6">
              <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-400 w-[60%] shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
            </div>
            <button className="w-full py-3.5 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-100 transition-colors shadow-lg">补充芝士</button>
          </div>
        </div>

        <button onClick={onLogout} className="w-full py-4 bg-white border border-slate-200 rounded-2xl text-rose-500 font-semibold hover:bg-rose-50 transition-colors">退出登录</button>
      </div>
    </div>
  );
}
