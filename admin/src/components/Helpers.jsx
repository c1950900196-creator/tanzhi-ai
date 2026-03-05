export function fmtTime(t) {
  if (!t) return '-';
  const d = new Date(t + (t.includes('Z') || t.includes('+') ? '' : 'Z'));
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function roleLabel(role) {
  return { developer: '程序员', product_manager: '产品经理', general: '通用' }[role] || role || '-';
}

export function eventLabel(type) {
  return { view: '浏览', click: '点击', chat_start: '开始聊天', chat_end: '结束聊天' }[type] || type;
}

export function Spinner({ size = 16 }) {
  return <div className="inline-block rounded-full border-2 border-[#475569] border-t-blue-500 animate-spin" style={{ width: size, height: size }} />;
}

export function Badge({ type, children }) {
  const cls = {
    ai: 'bg-blue-800 text-blue-200',
    zhihu: 'bg-orange-800 text-orange-200',
    role: 'bg-[#334155] text-[#94a3b8]'
  }[type] || 'bg-[#334155] text-[#94a3b8]';
  return <span className={`text-xs px-2 py-0.5 rounded-full ${cls}`}>{children}</span>;
}

export function StatCard({ label, value, icon }) {
  return (
    <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-[#64748b] text-[13px] mb-1.5">{label}</div>
          <div className="text-3xl font-bold">{value}</div>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
}

export function MiniStat({ label, value }) {
  return (
    <div>
      <div className="text-[#64748b] text-[11px]">{label}</div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  );
}
