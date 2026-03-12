import { Compass, Plus, User } from 'lucide-react';

export default function TabBar({ activeTab, onTabChange, onNewChat }) {
  return (
    <div className="absolute bottom-0 left-0 w-full z-40 bg-white/70 backdrop-blur-xl border-t border-gray-200/50 pb-safe">
      <div className="flex items-center justify-around px-2 pt-2 pb-6 max-w-md mx-auto">
        <button onClick={() => onTabChange('feed')}
          className={`flex flex-col items-center w-16 transition-colors ${activeTab === 'feed' ? 'text-[#007AFF]' : 'text-gray-400 hover:text-gray-600'}`}>
          <Compass size={24} strokeWidth={activeTab === 'feed' ? 2.5 : 2} className="mb-1" />
          <span className="text-[10px] font-medium">发现</span>
        </button>
        <button onClick={onNewChat}
          className="w-12 h-12 rounded-full bg-[#1D1D1F] flex items-center justify-center text-white shadow-md hover:scale-105 active:scale-95 transition-transform mb-2">
          <Plus size={26} strokeWidth={2.5} />
        </button>
        <button onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center w-16 transition-colors ${activeTab === 'profile' ? 'text-[#007AFF]' : 'text-gray-400 hover:text-gray-600'}`}>
          <User size={24} strokeWidth={activeTab === 'profile' ? 2.5 : 2} className="mb-1" />
          <span className="text-[10px] font-medium">我的</span>
        </button>
      </div>
    </div>
  );
}
