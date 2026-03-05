import { Compass, Plus, User } from 'lucide-react';

export default function TabBar({ activeTab, onTabChange, onNewChat }) {
  return (
    <div className="absolute bottom-0 left-0 w-full p-4 z-40 bg-gradient-to-t from-slate-100 via-slate-100/95 to-transparent pt-12">
      <div className="glass-panel rounded-2xl flex items-center p-2 shadow-lg max-w-sm mx-auto relative">
        <button onClick={() => onTabChange('feed')}
          className={`flex-1 flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'feed' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
          <Compass size={22} className={activeTab === 'feed' ? 'mb-1 scale-110 transition-transform' : 'mb-1 opacity-70'} />
          <span className="text-[10px] font-medium">发现</span>
        </button>
        <div className="flex-1 flex justify-center items-center">
          <button onClick={onNewChat}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95 transition-transform">
            <Plus size={26} strokeWidth={2.5} />
          </button>
        </div>
        <button onClick={() => onTabChange('profile')}
          className={`flex-1 flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-white text-indigo-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
          <User size={22} className={activeTab === 'profile' ? 'mb-1 scale-110 transition-transform' : 'mb-1 opacity-70'} />
          <span className="text-[10px] font-medium">我的</span>
        </button>
      </div>
    </div>
  );
}
