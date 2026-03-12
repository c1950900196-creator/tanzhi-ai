import { useState, useEffect, useRef } from 'react';
import { ChevronDown, MoreHorizontal, Send, Square, FileText } from 'lucide-react';
import { api } from '../../api';
import MarkdownText from '../common/MarkdownText';

function parseQuestions(text) {
  const firstIdx = text.indexOf('[Q]');
  if (firstIdx === -1) return { body: text, questions: [] };
  const body = text.slice(0, firstIdx).replace(/\n+$/, '');
  const qPart = text.slice(firstIdx);
  const questions = qPart.split('[Q]')
    .map(s => s.split('\n')[0].trim())
    .filter(s => s.length > 0 && s.length <= 50)
    .slice(0, 3);
  return { body, questions };
}

export default function ChatScreen({ card, onBack }) {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [dynamicQuestions, setDynamicQuestions] = useState([]);
  const messagesEndRef = useRef(null);
  const activeDuration = useRef(0);
  const lastActiveTime = useRef(Date.now());
  const idleTimer = useRef(null);
  const isIdle = useRef(false);
  const abortRef = useRef(null);
  const totalUserChars = useRef(0);
  const isNewChat = !card;

  const markActive = () => {
    const now = Date.now();
    if (isIdle.current) { isIdle.current = false; lastActiveTime.current = now; }
    else { activeDuration.current += now - lastActiveTime.current; lastActiveTime.current = now; }
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      if (!isIdle.current) { activeDuration.current += Date.now() - lastActiveTime.current; isIdle.current = true; }
    }, 5000);
  };

  useEffect(() => {
    document.body.classList.add('no-scroll');
    const events = ['touchstart', 'touchmove', 'click', 'scroll', 'keydown', 'mousemove'];
    const handler = () => markActive();
    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    markActive();
    return () => {
      document.body.classList.remove('no-scroll');
      events.forEach(e => window.removeEventListener(e, handler));
      clearTimeout(idleTimer.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  useEffect(() => {
    activeDuration.current = 0;
    lastActiveTime.current = Date.now();
    isIdle.current = false;
    totalUserChars.current = 0;
    if (card) api.trackEvent(card.id, 'chat_start', card.source);

    const timer = setTimeout(async () => {
      if (isNewChat) {
        setMessages([{ role: 'ai', content: '你好！我是探知 AI 助手 ✨\n\n你可以和我聊任何感兴趣的技术或产品话题。\n\n想聊点什么？' }]);
        setIsTyping(false);
        return;
      }
      setMessages([{ role: 'card', content: card.summary, title: card.title }]);
      setIsStreaming(true);
      let fullText = '';
      try {
        const cardCtx = { title: card.title, summary: card.summary };
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        setMessages(prev => [...prev, { role: 'ai', content: '' }]);
        await api.chatStream([{ role: 'ai', content: card.summary }], cardCtx, (text) => {
          fullText = text;
          const { body } = parseQuestions(text);
          setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: 'ai', content: body }; return u; });
        }, ctrl.signal);
        const { body, questions } = parseQuestions(fullText);
        setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: 'ai', content: body }; return u; });
        if (questions.length > 0) setDynamicQuestions(questions);
      } catch (e) { if (e.name !== 'AbortError') console.warn('AI首条回复失败:', e.message); }
      abortRef.current = null;
      setIsStreaming(false);
      setIsTyping(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [card]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

  const handleSend = async (text) => {
    if (!text.trim() || isStreaming) return;
    totalUserChars.current += text.trim().length;
    const newMsg = { role: 'user', content: text };
    const updatedMsgs = [...messages, newMsg];
    setMessages([...updatedMsgs, { role: 'ai', content: '' }]);
    setInputValue(""); setIsStreaming(true); setDynamicQuestions([]);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let fullText = '';
    try {
      const cardCtx = card ? { title: card.title, summary: card.summary } : null;
      const chatMsgs = updatedMsgs.filter(m => m.role !== 'card');
      await api.chatStream(chatMsgs, cardCtx, (streamText) => {
        fullText = streamText;
        const { body } = parseQuestions(streamText);
        setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: 'ai', content: body }; return u; });
      }, ctrl.signal);
      const { body, questions } = parseQuestions(fullText);
      setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: 'ai', content: body }; return u; });
      if (questions.length > 0) setDynamicQuestions(questions);
    } catch (e) {
      if (e.name === 'AbortError') {
        const { body, questions } = parseQuestions(fullText);
        setMessages(prev => { const u = [...prev]; const last = u[u.length - 1]; if (last?.role === 'ai' && !last.content) return u.slice(0, -1); if (last?.role === 'ai') u[u.length - 1] = { role: 'ai', content: body }; return u; });
        if (questions.length > 0) setDynamicQuestions(questions);
      } else {
        setMessages(prev => { const u = [...prev]; const last = u[u.length - 1]; if (last?.role === 'ai' && !last.content) u[u.length - 1] = { role: 'ai', content: '抱歉，网络出了点问题，请稍后重试 🙏' }; return u; });
      }
    } finally { abortRef.current = null; setIsStreaming(false); }
  };

  const handleEndChat = () => {
    if (card) {
      if (!isIdle.current) activeDuration.current += Date.now() - lastActiveTime.current;
      const durationSec = Math.round(activeDuration.current / 1000);
      api.trackEvent(card.id, 'chat_end', card.source, {
        duration_sec: durationSec,
        message_count: messages.filter(m => m.role === 'user').length,
        total_chars: totalUserChars.current
      });
    }
    onBack();
  };

  return (
    <div className="fixed inset-0 w-full bg-[#F2F2F7] flex flex-col z-50 animate-slide-up">
      <div className="px-4 pt-[env(safe-area-inset-top,20px)] pb-3 flex items-center justify-between sticky top-0 z-20 border-b border-gray-200/50 bg-white/80 backdrop-blur-xl">
        <button onClick={handleEndChat} className="p-2 hover:bg-gray-200/50 rounded-full transition-colors text-[#007AFF]"><ChevronDown size={28} strokeWidth={2.5} /></button>
        <div className="flex-1 text-center truncate px-4 text-[17px] font-semibold text-[#1D1D1F] tracking-tight">{isNewChat ? '新对话' : card.title}</div>
        <button className="p-2 hover:bg-gray-200/50 rounded-full transition-colors text-[#007AFF]"><MoreHorizontal size={24} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 hide-scrollbar pb-32 chat-scroll-area">
        {messages.map((msg, idx) => {
          const isLastAi = msg.role === 'ai' && idx === messages.length - 1;
          const showQsHere = isLastAi && !isTyping && !isStreaming && dynamicQuestions.length > 0;
          const showInitQs = isLastAi && !isTyping && !isStreaming && dynamicQuestions.length === 0 && (card?.quickReplies || []).length > 0 && messages.filter(m => m.role === 'user').length === 0;
          const qsList = showQsHere ? dynamicQuestions : (showInitQs ? card.quickReplies : []);

          if (msg.role === 'card') {
            return (
              <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-2 mb-3"><FileText size={16} className="text-gray-400" /><span className="text-[13px] font-medium text-gray-500">卡片内容</span></div>
                {msg.title && <div className="font-semibold text-[#1D1D1F] text-[17px] mb-2 tracking-tight">{msg.title}</div>}
                <div className="text-gray-500 text-[15px] leading-relaxed">{msg.content}</div>
              </div>
            );
          }

          return (
            <div key={idx}>
              <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-[20px] px-4 py-2.5 leading-relaxed text-[16px] ${msg.role === 'user' ? 'bg-[#007AFF] text-white rounded-br-[4px]' : 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-[#1D1D1F] border border-gray-100 rounded-bl-[4px]'}`}>
                  {msg.role === 'ai' ? <MarkdownText text={msg.content} /> : msg.content}
                </div>
              </div>
              {qsList.length > 0 && (
                <div className="flex flex-col gap-2 mt-3 ml-1">
                  {qsList.map(q => (
                    <button key={q} onClick={() => handleSend(q)} className="text-left px-4 py-2.5 bg-white/50 backdrop-blur-md border border-[#007AFF]/30 rounded-2xl text-[15px] text-[#007AFF] hover:bg-[#007AFF]/10 shadow-sm transition-colors w-fit max-w-[85%]">{q}</button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {isTyping && !isStreaming && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-[20px] rounded-bl-[4px] px-4 py-3 flex items-center space-x-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="absolute bottom-0 w-full border-t border-gray-200/50 bg-white/80 backdrop-blur-xl px-4 py-3 pb-safe z-20">
        {isStreaming && (
          <div className="flex justify-center mb-3">
            <button onClick={() => abortRef.current?.abort()} className="flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-200 rounded-full text-[13px] text-gray-500 shadow-sm transition-all">
              <Square size={12} className="fill-current" /> 停止生成
            </button>
          </div>
        )}
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <div className="flex-1 bg-white border border-gray-200 shadow-sm rounded-full flex items-center transition-colors focus-within:border-[#007AFF]">
            <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !isStreaming && handleSend(inputValue)}
              placeholder="iMessage" disabled={isStreaming}
              className="w-full bg-transparent border-none outline-none px-4 py-2 text-[#1D1D1F] placeholder-gray-400 disabled:opacity-50 text-[16px]" />
          </div>
          <button onClick={() => handleSend(inputValue)} disabled={!inputValue.trim() || isStreaming}
            className={`w-9 h-9 mb-0.5 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${inputValue.trim() && !isStreaming ? 'bg-[#007AFF] text-white hover:scale-105 active:scale-95' : 'bg-gray-100 text-gray-400'}`}>
            <Send size={16} className="ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
