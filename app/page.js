'use client';

import { useRef, useState } from 'react';

// One self-contained uploader. `kind` ('quote' | 'order') is sent alongside the file so the
// automation can audit which box a doc came from. Routing in n8n is still decided from the PDF
// itself (PQ vs SO), so the two boxes are independent and never block each other.
function Uploader({ kind, title, hint }) {
  const [file, setFile] = useState(null);
  const [state, setState] = useState('idle'); // idle | busy | ok | err
  const [msg, setMsg] = useState('');
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  const isPdf = (f) => !!f && (f.type === 'application/pdf' || /\.pdf$/i.test(f.name || ''));

  function pick(f) {
    if (!f) return;
    if (!isPdf(f)) { setState('err'); setMsg('יש להעלות קובץ PDF בלבד.'); return; }
    setFile(f); setState('idle'); setMsg('');
  }

  function onDrop(e) {
    e.preventDefault(); setDrag(false);
    pick(e.dataTransfer.files && e.dataTransfer.files[0]);
  }

  async function upload() {
    if (!file || state === 'busy') return;
    setState('busy'); setMsg('מעלה את המסמך…');
    try {
      const fd = new FormData();
      fd.append('file', file, file.name);
      fd.append('kind', kind); // 'quote' | 'order' — channel hint for the automation's audit log
      const r = await fetch('/api/upload', { method: 'POST', body: fd });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.ok) {
        setState('ok'); setMsg('המסמך נקלט בהצלחה ✓ המלאי יתעדכן בהתאם.'); setFile(null);
        if (inputRef.current) inputRef.current.value = '';
      } else {
        setState('err'); setMsg(j.error ? ('ההעלאה נכשלה: ' + j.error) : 'ההעלאה נכשלה. נסו שוב.');
      }
    } catch (e) {
      setState('err'); setMsg('ההעלאה נכשלה. בדקו את החיבור ונסו שוב.');
    }
  }

  return (
    <section className="box">
      <h2 className="box-title">{title}</h2>

      <div
        className={'drop' + (drag ? ' drag' : '')}
        onClick={() => inputRef.current && inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
      >
        <div className="icon">📄</div>
        <div className="big">גררו לכאן קובץ PDF או לחצו לבחירה</div>
        <div className="small">{hint}</div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          style={{ display: 'none' }}
          onChange={(e) => pick(e.target.files && e.target.files[0])}
        />
      </div>

      {file && (
        <div className="file">
          <span>📎 {file.name}</span>
          <span className="x" onClick={() => { setFile(null); if (inputRef.current) inputRef.current.value = ''; }}>✕</span>
        </div>
      )}

      <button className="btn" onClick={upload} disabled={!file || state === 'busy'}>
        {state === 'busy' ? 'מעלה…' : 'העלאה'}
      </button>

      <div className={'status ' + (state === 'ok' ? 'ok' : state === 'err' ? 'err' : state === 'busy' ? 'busy' : '')}>
        {msg}
      </div>
    </section>
  );
}

export default function Page() {
  return (
    <main className="card">
      <img className="logo" src="/logo.png" alt="אופיר אירועים — השכרת ציוד" />
      <h1>העלאת מסמך למלאי</h1>
      <p className="sub">
        העלו הצעת מחיר (PQ) או הזמנה מאושרת בקובץ PDF.
        המערכת תקרא את המסמך ותעדכן את המלאי לפי תאריך האירוע.
      </p>

      <div className="grid">
        <Uploader
          kind="quote"
          title="הצעת מחיר (PQ)"
          hint="קובץ PDF של הצעת מחיר בלבד"
        />
        <Uploader
          kind="order"
          title="הזמנה מאושרת"
          hint="קובץ PDF של הזמנה מאושרת בלבד"
        />
      </div>

      <div className="foot">אופיר אירועים — השכרת ציוד · עדכון מלאי אוטומטי</div>
    </main>
  );
}
