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
    .filter(s => s.length > 0 && s.length <= 30)
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
      await api.chatStream(updatedMsgs, cardCtx, (streamText) => {
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
    <div className="fixed inset-0 w-full bg-slate-50 flex flex-col z-50 animate-slide-up">
      <div className="glass-panel px-4 py-3 flex items-center justify-between sticky top-0 z-20 border-b border-slate-200">
        <button onClick={handleEndChat} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-700"><ChevronDown size={24} /></button>
        <div className="flex-1 text-center truncate px-4 text-sm font-semibold text-slate-900">{isNewChat ? '新对话' : card.title}</div>
        <button className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"><MoreHorizontal size={24} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 hide-scrollbar pb-32 chat-scroll-area">
        {messages.map((msg, idx) => {
          const isLastAi = msg.role === 'ai' && idx === messages.length - 1;
          const showQsHere = isLastAi && !isTyping && !isStreaming && dynamicQuestions.length > 0;
          const showInitQs = isLastAi && !isTyping && !isStreaming && dynamicQuestions.length === 0 && (card?.quickReplies || []).length > 0 && messages.filter(m => m.role === 'user').length === 0;
          const qsList = showQsHere ? dynamicQuestions : (showInitQs ? card.quickReplies : []);

          if (msg.role === 'card') {
            return (
              <div key={idx} className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3"><FileText size={16} className="text-blue-600" /><span className="text-xs font-medium text-blue-600">卡片内容</span></div>
                {msg.title && <div className="font-semibold text-slate-900 text-base mb-2">{msg.title}</div>}
                <div className="text-slate-700 text-[14px] leading-relaxed">{msg.content}</div>
              </div>
            );
          }

          return (
            <div key={idx}>
              <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-4 leading-relaxed text-[15px] shadow-sm ${msg.role === 'user' ? 'bg-slate-900 text-white rounded-tr-sm font-medium' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-sm'}`}>
                  {msg.role === 'ai' ? <MarkdownText text={msg.content} /> : msg.content}
                </div>
              </div>
              {qsList.length > 0 && (
                <div className="flex flex-col gap-2 mt-3 ml-1">
                  {qsList.map(q => (
                    <button key={q} onClick={() => handleSend(q)} className="text-left px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:border-blue-600 hover:text-blue-600 shadow-sm transition-colors w-fit max-w-[85%]">{q}</button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {isTyping && !isStreaming && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm p-4 flex space-x-2 w-16 justify-center shadow-sm">
              <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="absolute bottom-0 w-full glass-panel border-t border-slate-200 p-4 pb-8 z-20">
        {isStreaming && (
          <div className="flex justify-center mb-3">
            <button onClick={() => abortRef.current?.abort()} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-full text-sm text-slate-600 hover:bg-slate-50 hover:border-slate-400 shadow-sm transition-all">
              <Square size={14} className="fill-current" /> 停止生成
            </button>
          </div>
        )}
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <div className="flex-1 bg-white border border-slate-200 shadow-sm rounded-2xl p-1 flex items-center transition-colors focus-within:border-blue-600">
            <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !isStreaming && handleSend(inputValue)}
              placeholder="输入你的想法或疑问..." disabled={isStreaming}
              className="w-full bg-transparent border-none outline-none px-4 py-3 text-slate-900 placeholder-slate-400 disabled:opacity-50" />
          </div>
          <button onClick={() => handleSend(inputValue)} disabled={!inputValue.trim() || isStreaming}
            className={`p-4 rounded-2xl flex items-center justify-center transition-all ${inputValue.trim() && !isStreaming ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-md' : 'bg-slate-100 text-slate-400'}`}>
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
