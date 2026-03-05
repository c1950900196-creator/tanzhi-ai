export default function MarkdownText({ text }) {
  const renderInline = (str) => {
    const parts = [];
    let k = 0;
    const re = /(\*\*(.+?)\*\*)|(`(.+?)`)/g;
    let last = 0, m;
    while ((m = re.exec(str)) !== null) {
      if (m.index > last) parts.push(str.slice(last, m.index));
      if (m[1]) parts.push(<strong key={k++} className="font-semibold text-slate-900">{m[2]}</strong>);
      else if (m[3]) parts.push(<code key={k++} className="px-1.5 py-0.5 bg-slate-100 rounded text-[13px] font-mono text-indigo-600">{m[4]}</code>);
      last = m.index + m[0].length;
    }
    if (last < str.length) parts.push(str.slice(last));
    return parts.length > 0 ? parts : [str];
  };

  const lines = text.split('\n');
  const els = [];
  let i = 0, k = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.match(/^```/)) {
      const codeLang = line.replace(/^```/, '').trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].match(/^```/)) { codeLines.push(lines[i]); i++; }
      i++;
      els.push(
        <div key={k++} className="my-3 rounded-xl overflow-hidden border border-slate-200">
          {codeLang && <div className="bg-slate-100 text-slate-500 text-xs px-4 py-1.5 border-b border-slate-200">{codeLang}</div>}
          <pre className="bg-slate-50 p-4 overflow-x-auto text-[13px] leading-relaxed font-mono text-slate-800">{codeLines.join('\n')}</pre>
        </div>
      );
      continue;
    }
    const olMatch = line.match(/^(\d+)[.)]\s+(.+)/);
    if (olMatch) {
      const items = [];
      while (i < lines.length) {
        const om = lines[i].match(/^(\d+)[.)]\s+(.+)/);
        if (!om) break;
        items.push(<li key={k++} className="pl-1">{renderInline(om[2])}</li>);
        i++;
      }
      els.push(<ol key={k++} className="list-decimal list-inside space-y-1.5 my-2 text-slate-700">{items}</ol>);
      continue;
    }
    if (line.match(/^[-•]\s+(.+)/)) {
      const items = [];
      while (i < lines.length) {
        const um = lines[i].match(/^[-•]\s+(.+)/);
        if (!um) break;
        items.push(<li key={k++} className="pl-1">{renderInline(um[1])}</li>);
        i++;
      }
      els.push(<ul key={k++} className="list-disc list-inside space-y-1.5 my-2 text-slate-700">{items}</ul>);
      continue;
    }
    const h3Match = line.match(/^###\s+(.+)/);
    if (h3Match) { els.push(<h4 key={k++} className="font-bold text-slate-800 mt-4 mb-1 text-[15px]">{renderInline(h3Match[1])}</h4>); i++; continue; }
    const h2Match = line.match(/^##\s+(.+)/);
    if (h2Match) { els.push(<h3 key={k++} className="font-bold text-slate-900 mt-4 mb-1 text-base">{renderInline(h2Match[1])}</h3>); i++; continue; }
    if (line.trim() === '') { els.push(<div key={k++} className="h-2"></div>); i++; continue; }
    els.push(<p key={k++} className="my-1 text-slate-700 leading-relaxed">{renderInline(line)}</p>);
    i++;
  }
  return <div className="space-y-0.5">{els}</div>;
}
