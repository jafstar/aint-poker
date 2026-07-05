'use client';
import { useState } from 'react';

export default function Cartoons() {
  const [scene, setScene] = useState(null);
  const [loading, setLoading] = useState(false);

  async function nextScene() {
    setLoading(true);
    const res = await fetch('/api/cartoon', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    const data = await res.json();
    setLoading(false);
    if (data.error) { alert(data.error); return; }
    setScene(data);
  }

  return (
    <div className="wrap">
      <h1>aint.poker / cartoons</h1>
      <p className="tag">same six, a different kind of table</p>

      <button className="deal-btn" onClick={nextScene} disabled={loading}>
        {loading ? 'Thinking...' : 'Next scene'}
      </button>

      {scene && (
        <div className="scene">
          <div className="situation">{scene.scenario}</div>
          <div className="panels">
            {scene.panels.map((p, i) => (
              <div className="panel" key={i}>
                <div className="panel-name">{p.name}</div>
                <div className="panel-line">"{p.line}"</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx global>{`
        body { margin:0; background:#0d0d16; color:#e8e6df; font-family: Georgia, serif; }
        .wrap { max-width: 780px; margin: 0 auto; padding: 30px 16px 80px; text-align:center; }
        h1 { color:#d7c98a; font-size:28px; margin-bottom:4px; }
        .tag { color:#8a889e; font-size:13px; margin-bottom: 30px; }
        .deal-btn {
          background:#d7c98a; color:#0d0d16; border:none;
          padding:12px 28px; font-size:14px; font-weight:bold; border-radius:6px; cursor:pointer;
        }
        .deal-btn:disabled { opacity:0.5; cursor:wait; }
        .scene { margin-top: 30px; text-align:left; }
        .situation {
          background:#1c1c2b; border-left:3px solid #d7c98a; padding:12px 16px;
          border-radius:6px; margin-bottom:20px; font-style:italic; font-size:15px;
        }
        .panels { display:grid; grid-template-columns: 1fr 1fr; gap:14px; }
        .panel { background:#14141f; border:1px solid #33334a; border-radius:8px; padding:16px; }
        .panel-name { color:#d7c98a; font-weight:bold; font-size:12px; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; }
        .panel-line { font-size:15px; line-height:1.5; }
      `}</style>
    </div>
  );
}
