import { useState, useEffect, useRef } from 'react';
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

  useEffect(() => {
    api.getCards().then(data => {
      if (data?.length > 0) setCards(data);
    }).catch(e => console.warn('获取卡片失败:', e.message))
      .finally(() => setCardsLoading(false));
  }, []);

  useEffect(() => {
    if (cardsLoading || !cards[currentIndex]) return;
    const card = cards[currentIndex];
    api.trackEvent(card.id, 'view', card.source);
  }, [currentIndex, cardsLoading]);

  const wrapIndex = (i) => ((i % cards.length) + cards.length) % cards.length;
  const getContainerH = () => containerRef.current ? containerRef.current.offsetHeight : 600;
  const setTrackY = (val) => { offsetY.current = val; if (trackRef.current) trackRef.current.style.transform = `translateY(${val}px)`; };

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
        setTrackY(0);
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
      <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/80" style={{ background: card.gradient }}>
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/70 to-white/95" />
      </div>
      <div className="absolute inset-0 p-8 flex flex-col border border-slate-100/50 rounded-3xl" style={{ paddingTop: '10%' }}>
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-base font-bold shadow-md" style={{ backgroundColor: card.author.color }}>{card.author.avatar}</div>
          <div>
            <div className="text-base font-semibold text-slate-800">{card.author.name}</div>
            <div className="text-xs text-slate-400">{card.author.title}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5 mb-6">
          <span className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-semibold shadow-sm border border-rose-100">{card.heat}</span>
          {card.tags.map(tag => <span key={tag} className="px-3 py-1.5 text-slate-600 bg-white/60 backdrop-blur-sm rounded-lg text-xs font-medium border border-slate-200">{tag}</span>)}
        </div>
        <h2 className="text-3xl font-bold leading-snug mb-5 tracking-tight text-slate-900">{card.title}</h2>
        <div className="text-slate-500 text-base leading-loose">{isCurrent ? <TypewriterText text={card.summary} /> : null}</div>
      </div>
    </>
  );

  const prevIdx = wrapIndex(currentIndex - 1);
  const nextIdx = wrapIndex(currentIndex + 1);

  return (
    <div className="h-screen w-full relative bg-slate-100 overflow-hidden flex flex-col justify-center items-center pb-24" onWheel={handleWheel}>
      <div className="absolute top-0 left-0 w-full px-5 pt-3 pb-1 flex justify-start items-center z-20 pointer-events-none">
        <div className="flex items-center space-x-2.5">
          <img src="/logo.png" alt="探知" style={{ height: '42px', objectFit: 'contain' }} />
          <span className="font-bold text-xl tracking-wide text-slate-900">探知</span>
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
        className="w-full max-w-md h-[78vh] px-4 relative z-10 mt-2 overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handlePointerDown} onTouchStart={handlePointerDown} onClick={handleCardClick}>
        <div ref={trackRef} style={{ position: 'absolute', inset: 0, willChange: 'transform' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, height: '100%', top: 'calc(-100% - 16px)' }}>{renderCardContent(cards[prevIdx], false)}</div>
          <div style={{ position: 'absolute', left: 0, right: 0, height: '100%', top: 0 }}>{renderCardContent(cards[currentIndex], true)}</div>
          <div style={{ position: 'absolute', left: 0, right: 0, height: '100%', top: 'calc(100% + 16px)' }}>{renderCardContent(cards[nextIdx], false)}</div>
        </div>
      </div>

      <div className="absolute bottom-[90px] w-full px-8 z-10 flex justify-center pointer-events-none">
        <div className="text-[11px] font-medium text-slate-400 px-4 py-1.5 flex items-center">
          <Quote size={10} className="mr-1.5 text-slate-300" />
          {currentQuote}
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
