import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Quote, Star, Share2, ThumbsDown } from 'lucide-react';
import { api } from '../../api';
import { MOCK_DATA, DAILY_QUOTES } from '../../data/mockData';
import TypewriterText from '../common/TypewriterText';

const currentQuote = DAILY_QUOTES[Math.floor(Math.random() * DAILY_QUOTES.length)];

export default function CardFeed({ userProfile, onOpenChat }) {
  const fallbackCards = MOCK_DATA[userProfile.role]?.cards || MOCK_DATA.developer.cards;
  const [cards, setCards] = useState(fallbackCards);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSnapping, setIsSnapping] = useState(false);
  const containerRef = useRef(null);
  const offsetY = useRef(0);
  const startY = useRef(0);
  const animFrameRef = useRef(null);
  const trackRef = useRef(null);
  const holdTimerRef = useRef(null);
  const hasRestored = useRef(false);
  const pendingReset = useRef(false);

  useEffect(() => {
    api.getCards().then(data => {
      if (data?.length > 0) {
        setCards(data);
        if (!hasRestored.current) {
          hasRestored.current = true;
          const lastId = localStorage.getItem('tanzhi_last_card_id');
          if (lastId) {
            const lastIdx = data.findIndex(c => String(c.id) === lastId);
            if (lastIdx >= 0) {
              const nextIdx = (lastIdx + 1) % data.length;
              setCurrentIndex(nextIdx);
            }
          }
        }
      }
    }).catch(e => console.warn('获取卡片失败:', e.message))
      .finally(() => setCardsLoading(false));
  }, []);

  useEffect(() => {
    if (cardsLoading || !cards[currentIndex]) return;
    const card = cards[currentIndex];
    api.trackEvent(card.id, 'view', card.source);
    localStorage.setItem('tanzhi_last_card_id', String(card.id));
  }, [currentIndex, cardsLoading]);

  const wrapIndex = (i) => ((i % cards.length) + cards.length) % cards.length;
  const getContainerH = () => containerRef.current ? containerRef.current.offsetHeight : 600;
  const setTrackY = (val) => { offsetY.current = val; if (trackRef.current) trackRef.current.style.transform = `translateY(${val}px)`; };

  useLayoutEffect(() => {
    if (pendingReset.current) {
      setTrackY(0);
      pendingReset.current = false;
    }
  });

  const snapTo = (targetIndex) => {
    setIsSnapping(true);
    const h = getContainerH();
    const diff = targetIndex - currentIndex;
    const targetY = -diff * (h + 16);
    const startVal = offsetY.current;
    const startTime = performance.now();
    const duration = 350;
    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setTrackY(startVal + (targetY - startVal) * ease);
      if (progress < 1) { animFrameRef.current = requestAnimationFrame(animate); }
      else {
        pendingReset.current = true;
        setCurrentIndex(wrapIndex(targetIndex));
        setIsSnapping(false);
      }
    };
    animFrameRef.current = requestAnimationFrame(animate);
  };

  const handlePointerDown = (e) => {
    if (isSnapping) return;
    cancelAnimationFrame(animFrameRef.current);
    startY.current = e.clientY || e.touches?.[0]?.clientY || 0;
    setIsDragging(false);
    holdTimerRef.current = setTimeout(() => setShowActionMenu(true), 600);
    const onMove = (ev) => {
      const clientY = ev.clientY || ev.touches?.[0]?.clientY || 0;
      const dy = clientY - startY.current;
      if (Math.abs(dy) > 5) { clearTimeout(holdTimerRef.current); setIsDragging(true); }
      setTrackY(dy);
    };
    const onUp = () => {
      clearTimeout(holdTimerRef.current);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
      const dy = offsetY.current;
      const h = getContainerH() + 16;
      const threshold = h * 0.2;
      if (dy < -threshold) snapTo(currentIndex + 1);
      else if (dy > threshold) snapTo(currentIndex - 1);
      else snapTo(currentIndex);
      setTimeout(() => setIsDragging(false), 60);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onUp);
  };

  const handleWheel = (e) => {
    if (isSnapping) return;
    if (e.deltaY > 30) snapTo(currentIndex + 1);
    else if (e.deltaY < -30) snapTo(currentIndex - 1);
  };

  const handleCardClick = () => {
    if (!isDragging) {
      const card = cards[currentIndex];
      api.trackEvent(card.id, 'click', card.source);
      onOpenChat(card);
    }
  };

  const renderCardContent = (card, isCurrent) => (
    <>
      <div className="absolute inset-0 overflow-hidden bg-white">
      </div>
      <div className="absolute inset-0 p-6 pb-6 flex flex-col" style={{ paddingTop: '8%' }}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-base font-semibold shadow-sm" style={{ backgroundColor: card.author.color }}>{card.author.avatar}</div>
          <div>
            <div className="text-[15px] font-semibold text-[#1D1D1F]">{card.author.name}</div>
            <div className="text-[13px] text-gray-500">{card.author.title}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-5">
          <span className="px-3 py-1.5 bg-[#FF3B30]/10 text-[#FF3B30] rounded-xl text-[13px] font-semibold">{card.heat}</span>
          {card.tags.map(tag => <span key={tag} className="px-3 py-1.5 text-gray-600 bg-gray-100/80 rounded-xl text-[13px] font-medium">{tag}</span>)}
        </div>
        <h2 className="text-[28px] font-bold leading-tight mb-4 tracking-tight text-[#1D1D1F]">{card.title}</h2>
        <div className="text-gray-500 text-[17px] leading-relaxed flex-1 overflow-hidden">{isCurrent ? <TypewriterText text={card.summary} /> : null}</div>
        <div className="pt-3 mt-auto flex items-center justify-center">
          <Quote size={10} className="mr-1.5 text-gray-300" />
          <span className="text-[11px] text-gray-400">{currentQuote}</span>
        </div>
      </div>
    </>
  );

  const prevIdx = wrapIndex(currentIndex - 1);
  const nextIdx = wrapIndex(currentIndex + 1);

  return (
    <div className="h-screen w-full relative bg-[#F2F2F7] overflow-hidden flex flex-col justify-center items-center pb-24" onWheel={handleWheel}>
      {/* 顶部导航栏，标准 iOS 磨砂玻璃 */}
      <div className="absolute top-0 left-0 w-full z-20 pointer-events-none">
        <div className="px-5 pt-[env(safe-area-inset-top,20px)] pb-3 flex justify-between items-center bg-white/70 backdrop-blur-2xl border-b border-gray-200/50">
          <div className="flex items-center space-x-2.5">
            <img src="/logo.png" alt="探知" className="w-9 h-9 object-contain" />
            <span className="font-semibold text-[22px] tracking-tight text-[#1D1D1F]">探知</span>
          </div>
          <div className="text-[12px] font-medium text-gray-500 bg-gray-100/80 px-3 py-1.5 rounded-full">
            点击卡片进行话题讨论
          </div>
        </div>
      </div>

      {cardsLoading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-100/80">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <div className="text-sm text-slate-500">正在为你准备认知卡片...</div>
          </div>
        </div>
      )}

      <div ref={containerRef}
        className="w-full max-w-md h-[calc(100vh-140px)] relative z-10 mt-12 overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handlePointerDown} onTouchStart={handlePointerDown} onClick={handleCardClick}>
        <div ref={trackRef} style={{ position: 'absolute', inset: 0, willChange: 'transform' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, height: '100%', top: 'calc(-100% - 16px)' }}>{renderCardContent(cards[prevIdx], false)}</div>
          <div style={{ position: 'absolute', left: 0, right: 0, height: '100%', top: 0 }}>{renderCardContent(cards[currentIndex], true)}</div>
          <div style={{ position: 'absolute', left: 0, right: 0, height: '100%', top: 'calc(100% + 16px)' }}>{renderCardContent(cards[nextIdx], false)}</div>
        </div>
      </div>

      {showActionMenu && (
        <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center animate-fade-in" onClick={(e) => { e.stopPropagation(); setShowActionMenu(false); }}>
          <div className="glass-panel p-2 rounded-2xl flex flex-col gap-2 w-48 shadow-2xl" onClick={e => e.stopPropagation()}>
            <button className="w-full flex items-center p-3 hover:bg-slate-100 rounded-xl transition-colors font-medium text-slate-700" onClick={() => setShowActionMenu(false)}><Star className="mr-3 text-amber-500" size={20} /> 收藏卡片</button>
            <button className="w-full flex items-center p-3 hover:bg-slate-100 rounded-xl transition-colors font-medium text-slate-700" onClick={() => setShowActionMenu(false)}><Share2 className="mr-3 text-blue-600" size={20} /> 分享洞察</button>
            <div className="h-px bg-slate-200 my-1 w-full" />
            <button className="w-full flex items-center p-3 hover:bg-rose-50 text-rose-600 rounded-xl transition-colors font-medium" onClick={() => { setShowActionMenu(false); snapTo(currentIndex + 1); }}><ThumbsDown className="mr-3" size={20} /> 不感兴趣</button>
          </div>
        </div>
      )}
    </div>
  );
}
