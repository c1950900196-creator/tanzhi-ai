import { Terminal, Lightbulb, Radar, Zap, Database } from 'lucide-react';

export default function ProfileScreen({ userProfile, username, onLogout }) {
  return (
    <div className="h-screen w-full relative bg-[#F2F2F7] overflow-y-auto pb-24 animate-fade-in">
      <div className="px-5 pt-[env(safe-area-inset-top,20px)] pb-2 bg-[#F2F2F7] sticky top-0 z-20 flex flex-col">
        <h1 className="text-[34px] font-bold text-[#1D1D1F] tracking-tight mt-6 mb-2">我的</h1>
      </div>

      <div className="px-4 space-y-5">
        <div className="bg-white rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="p-4 flex items-center space-x-4">
            <div className="w-[60px] h-[60px] rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-2xl font-medium">
              {userProfile.role === 'developer' ? 'D' : 'P'}
            </div>
            <div>
              <h2 className="text-[22px] font-semibold text-[#1D1D1F] tracking-tight">{username || 'Explorer'}</h2>
              <p className="text-gray-500 text-[15px] mt-0.5 flex items-center">
                {userProfile.role === 'developer' ? <Terminal size={14} className="mr-1" /> : <Lightbulb size={14} className="mr-1" />}
                {userProfile.role === 'developer' ? '程序员' : '产品经理'}
              </p>
            </div>
          </div>
          <div className="border-t border-gray-100 ml-4 pb-4 pr-4 pt-4">
            <h3 className="font-medium text-[#1D1D1F] mb-3 flex items-center text-[15px]">
              <Radar size={16} className="mr-2 text-[#007AFF]" /> 关注领域
            </h3>
            <div className="flex flex-wrap gap-2">
              {userProfile.tags.map(tag => (
                <span key={tag} className="px-3 py-1.5 bg-gray-100 text-[#1D1D1F] rounded-[10px] text-[13px]">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center text-[16px] font-medium text-[#1D1D1F]">
              <div className="w-7 h-7 rounded-md bg-[#FF9500] flex items-center justify-center mr-3"><Zap size={16} className="text-white" /></div>
              剩余芝士
            </div>
            <div className="text-[16px] font-normal text-gray-500">1.25M / 2M</div>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-[#FF9500] w-[60%]" />
          </div>
          <button className="w-full py-2.5 bg-gray-100 text-[#007AFF] rounded-xl font-medium text-[15px] hover:bg-gray-200 transition-colors">获取更多</button>
        </div>

        <button onClick={onLogout} className="w-full py-3.5 bg-white rounded-2xl text-[#FF3B30] text-[17px] font-normal hover:bg-gray-50 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)]">退出登录</button>
      </div>
    </div>
  );
}
