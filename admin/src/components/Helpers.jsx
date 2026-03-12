export function fmtTime(t) {
  if (!t) return '-';
  const d = new Date(t + (t.includes('Z') || t.includes('+') ? '' : 'Z'));
  const pad = n => String(n).padStart(2, '0');
  const bj = new Date(d.getTime() + 8 * 3600 * 1000);
  return `${bj.getUTCFullYear()}-${pad(bj.getUTCMonth() + 1)}-${pad(bj.getUTCDate())} ${pad(bj.getUTCHours())}:${pad(bj.getUTCMinutes())}:${pad(bj.getUTCSeconds())}`;
}

export function roleLabel(role) {
  return { developer: '程序员', product_manager: '产品经理', general: '通用' }[role] || role || '-';
}

export function eventLabel(type) {
  return { view: '浏览', click: '点击', chat_start: '开始聊天', chat_end: '结束聊天' }[type] || type;
}

export function Spinner({ size = 16 }) {
  return <span className="spinner" style={{ width: size, height: size }} />;
}

export function Badge({ type, children }) {
  const cls = { ai: 'badge-ai', zhihu: 'badge-zhihu', role: 'badge-role' }[type] || 'badge-role';
  return <span className={cls}>{children}</span>;
}

export function StatCard({ label, value, icon }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: '#64748b', fontSize: 13, marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
        </div>
        <div style={{ fontSize: 28 }}>{icon}</div>
      </div>
    </div>
  );
}

export function MiniStat({ label, value }) {
  return (
    <div>
      <div style={{ color: '#64748b', fontSize: 11 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 600 }}>{value}</div>
    </div>
  );
}
