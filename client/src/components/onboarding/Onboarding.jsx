import { useState, useEffect } from 'react';
import { Compass, Terminal, Lightbulb } from 'lucide-react';
import { api } from '../../api';
import { FALLBACK_TAGS } from '../../data/mockData';

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [recommendedTags, setRecommendedTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(false);

  const handleRoleSelect = async (r) => {
    setRole(r);
    setStep(2);
    setLoadingTags(true);
    try {
      const data = await api.getRecommendedTags();
      const tagNames = (data.tags || []).map(t => typeof t === 'string' ? t : t.name).filter(Boolean);
      if (tagNames.length >= 5) { setAvailableTags(tagNames.slice(0, 20)); setLoadingTags(false); return; }
    } catch {}
    setAvailableTags(FALLBACK_TAGS[r] || FALLBACK_TAGS.developer);
    setLoadingTags(false);
  };

  useEffect(() => {
    if (selectedTags.length === 0) return;
    const timer = setTimeout(async () => {
      try {
        const data = await api.getRecommendedTags();
        const tagNames = (data.tags || []).map(t => typeof t === 'string' ? t : t.name).filter(Boolean);
        const existing = new Set([...availableTags, ...selectedTags]);
        setRecommendedTags(tagNames.filter(t => !existing.has(t)).slice(0, 5));
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedTags]);

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) setSelectedTags(selectedTags.filter(t => t !== tag));
    else if (selectedTags.length < 5) setSelectedTags([...selectedTags, tag]);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400/20 rounded-full blur-[80px]" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-400/20 rounded-full blur-[80px]" />

      <div className="glass-panel w-full max-w-md rounded-3xl p-8 z-10 animate-slide-up">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/30 flex items-center justify-center">
            <Compass size={28} className="text-white" />
          </div>
        </div>

        {step === 1 ? (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-center mb-2 text-slate-900">你是哪类互联网人？</h1>
            <p className="text-slate-500 text-center text-sm mb-8">选择你的身份，开启专属认知探测</p>
            <div className="space-y-4">
              <button onClick={() => handleRoleSelect('developer')} className="w-full flex items-center p-5 rounded-2xl border border-slate-200 bg-white/50 hover:bg-white hover:border-blue-600 hover:shadow-md transition-all group">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mr-4 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors text-slate-600"><Terminal size={24} /></div>
                <div className="text-left">
                  <h3 className="font-semibold text-lg text-slate-900">程序员</h3>
                  <p className="text-slate-500 text-sm">写代码、搞架构、追技术趋势</p>
                </div>
              </button>
              <button onClick={() => handleRoleSelect('product_manager')} className="w-full flex items-center p-5 rounded-2xl border border-slate-200 bg-white/50 hover:bg-white hover:border-indigo-400 hover:shadow-md transition-all group">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mr-4 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors text-slate-600"><Lightbulb size={24} /></div>
                <div className="text-left">
                  <h3 className="font-semibold text-lg text-slate-900">产品经理</h3>
                  <p className="text-slate-500 text-sm">做需求、定方向、看行业增长</p>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-center mb-2 text-slate-900">选择你的兴趣雷达</h1>
            <p className="text-slate-500 text-center text-sm mb-6">选择 1-5 个你关注的领域</p>
            {loadingTags ? (
              <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" /></div>
            ) : (
              <>
                <div className="flex flex-wrap gap-3 mb-4 justify-center">
                  {availableTags.map(tag => (
                    <button key={tag} onClick={() => toggleTag(tag)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${selectedTags.includes(tag) ? 'bg-blue-50 border-blue-600 text-blue-600 shadow-sm' : 'bg-white/50 border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-white'}`}>
                      {tag}
                    </button>
                  ))}
                </div>
                {recommendedTags.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-slate-500 text-center mb-2">✨ 猜你还会感兴趣</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {recommendedTags.map(tag => (
                        <button key={tag} onClick={() => toggleTag(tag)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border border-dashed ${selectedTags.includes(tag) ? 'bg-blue-50 border-blue-600 text-blue-600' : 'border-slate-300 text-slate-500 hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50/50'}`}>
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            <button onClick={() => selectedTags.length > 0 && onComplete({ role, tags: selectedTags })} disabled={selectedTags.length === 0}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-sm ${selectedTags.length > 0 ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-md' : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'}`}>
              开启探索
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
