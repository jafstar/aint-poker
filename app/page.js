'use client';
import { useState } from 'react';
import { PLAYERS } from '../lib/game';

// Player table positions — six seats around the oval. Fixed to use % instead
// of the original vw/vh units: vw/vh always compute against the full
// viewport no matter which element they're applied to, so even though these
// players are correctly nested inside #table, the old units ignored that
// container entirely and positioned relative to the whole browser window —
// which is why Cali ended up off the table and Penny/Lilly went missing.
const SEAT_STYLE = [
  { top: '8%', left: '4%' },
  { top: '8%', left: '38%' },
  { top: '8%', left: '72%' },
  { top: '55%', left: '72%' },
  { top: '55%', left: '38%' },
  { top: '55%', left: '4%' },
];

export default function AintPoker() {
  const [hand, setHand] = useState(null);
  const [dealing, setDealing] = useState(false);
  const [revealedRounds, setRevealedRounds] = useState(0);

  async function deal() {
    setDealing(true);
    setHand(null);
    setRevealedRounds(0);
    const res = await fetch('/api/deal', { method: 'POST' });
    const data = await res.json();
    setDealing(false);
    if (data.error) { alert(data.error); return; }
    setHand(data);
    // Reveal street by street for the feel of watching a hand happen
    let r = 0;
    const iv = setInterval(() => {
      r += 1;
      setRevealedRounds(r);
      if (r >= data.rounds.length) clearInterval(iv);
    }, 1800);
  }

  return (
    <div className="wrap">
      <h1>aint.poker</h1>
      <p className="tag">six real personalities, one real hand — low stakes, high fun</p>

      <div id="table">
        <div id="felt">
          {hand && (
            <div className="board">
              {(revealedRounds > 0 ? hand.rounds[Math.min(revealedRounds, hand.rounds.length) - 1].board : []).map((c, i) => (
                <span className="card" key={i}>{c}</span>
              ))}
            </div>
          )}
        </div>
        {PLAYERS.map((p, i) => (
          <div className="player" key={p.name} style={SEAT_STYLE[i]}>
            <div className="pname">{p.name}</div>
            {hand && (
              <div className="hole-cards">
                {hand.hands[p.name].map((c, ci) => <span className="card small" key={ci}>{c}</span>)}
              </div>
            )}
          </div>
        ))}
      </div>

      <button className="deal-btn" onClick={deal} disabled={dealing}>
        {dealing ? 'Dealing...' : 'Deal a hand'}
      </button>

      {hand && (
        <div className="feed">
          {hand.rounds.slice(0, revealedRounds).map((round, ri) => (
            <div className="round" key={ri}>
              <div className="round-label">{round.stage}: {round.board.join(' ')}</div>
              {round.decisions.map((d, di) => (
                <div className="decision" key={di}><b>{d.player}:</b> {d.decision}</div>
              ))}
            </div>
          ))}
          {revealedRounds >= hand.rounds.length && (
            <div className="showdown">
              <div className="round-label">Showdown</div>
              {hand.results.map((r, i) => (
                <div className="decision" key={i}>{r.name}: {r.hand.join(' ')} — {r.handName}</div>
              ))}
              <div className="winner">🏆 {hand.winner} wins the hand!</div>
            </div>
          )}
        </div>
      )}

      <style jsx global>{`
        body { margin:0; background:#0d0d16; color:#e8e6df; font-family: Georgia, serif; }
        .wrap { max-width: 900px; margin: 0 auto; padding: 30px 16px 80px; text-align:center; }
        h1 { color:#d7c98a; font-size:32px; margin-bottom:4px; }
        .tag { color:#8a889e; font-size:13px; margin-bottom: 30px; }
        #table {
          width: 100%; max-width: 700px; height: 260px; margin: 0 auto; position: relative;
          background: #1a1a1a; border: 12px solid #3a2416; border-radius: 140px;
        }
        #felt {
          position:absolute; inset: 14px; background: #0a3d1f; border-radius: 130px;
          display:flex; align-items:center; justify-content:center;
        }
        .board { display:flex; gap:6px; }
        .player {
          position:absolute; width:90px; text-align:center; transform: translate(-30px, 0);
        }
        .pname {
          background:#0a3d1f; color:#d7c98a; font-size:11px; font-weight:bold;
          border-radius:10px; padding:4px 8px; margin-bottom:4px; display:inline-block;
        }
        .hole-cards { display:flex; gap:2px; justify-content:center; }
        .card {
          background:#f5f5f0; color:#0a0a0a; font-size:13px; font-weight:bold;
          padding:6px 8px; border-radius:4px; display:inline-block; min-width:14px;
        }
        .card.small { font-size:10px; padding:3px 5px; }
        .deal-btn {
          margin-top: 26px; background:#d7c98a; color:#0d0d16; border:none;
          padding:12px 28px; font-size:14px; font-weight:bold; border-radius:6px; cursor:pointer;
        }
        .deal-btn:disabled { opacity:0.5; cursor:wait; }
        .feed { text-align:left; margin-top: 30px; max-width: 640px; margin-left:auto; margin-right:auto; }
        .round { background:#14141f; border:1px solid #33334a; border-radius:8px; padding:14px 18px; margin-bottom:12px; }
        .round-label { color:#d7c98a; font-size:11px; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; }
        .decision { font-size:14px; margin-bottom:4px; }
        .winner { margin-top:10px; font-size:18px; color:#d7c98a; font-weight:bold; }
      `}</style>
    </div>
  );
}
