'use client';

import { Pause, Play, SkipForward, Square } from 'lucide-react';
import Window from './Window';
import { Sparkle } from './Sparkles';
import type { Hour } from '../lib/useHourEngine';
import { MINUTE_MS } from '../lib/startOffset';

type HourPlayerProps = {
  hour: Hour;
  onExit: () => void;
};

function seconds(ms: number): string {
  return String(Math.max(0, Math.ceil(ms / 1000)));
}

export default function HourPlayer({ hour, onExit }: HourPlayerProps) {
  const { status, index, current, next, remainingMs, total, error } = hour;

  if (status === 'finished') {
    return (
      <div className="center-screen">
        <Window title="powerplay.exe" dialog>
          <div className="stack center">
            <h1 className="pixel">THAT IS THE HOUR</h1>
            <p className="terminal">
              {total} {total === 1 ? 'track' : 'tracks'}, one minute each.
            </p>
            <div className="btn-row" style={{ justifyContent: 'center' }}>
              <button className="btn btn--primary" onClick={onExit}>
                GO AGAIN
              </button>
            </div>
          </div>
        </Window>
      </div>
    );
  }

  const elapsed = MINUTE_MS - remainingMs;
  const pct = Math.min(100, (elapsed / MINUTE_MS) * 100);

  return (
    <div className="desktop relative">
      <Sparkle size={26} style={{ top: 8, right: 12 }} />
      <Sparkle size={16} style={{ top: 130, left: 2 }} />
      <Sparkle size={20} style={{ bottom: 40, right: 40 }} />

      <Window title={`now_playing.exe  ·  ${index + 1} of ${total}`}>
        <div className="stack">
          <p className="countdown">{seconds(remainingMs)}</p>

          <div className="progress">
            <div className="progress__fill" style={{ width: `${pct}%` }} />
          </div>

          <div className="stack--tight center" style={{ marginTop: 4 }}>
            <p className="now-playing">{current?.name ?? ''}</p>
            <p className="terminal muted">{current?.artists ?? ''}</p>
          </div>

          {error && <p className="center danger">{error}</p>}

          <div className="btn-row" style={{ justifyContent: 'center' }}>
            {status === 'playing' ? (
              <button className="btn btn--primary" onClick={hour.pause}>
                <Pause size={14} strokeWidth={2} style={{ verticalAlign: -2 }} /> PAUSE
              </button>
            ) : (
              <button className="btn btn--primary" onClick={hour.resume}>
                <Play size={14} strokeWidth={2} style={{ verticalAlign: -2 }} /> PLAY
              </button>
            )}
            <button className="btn" onClick={hour.skip}>
              <SkipForward size={14} strokeWidth={2} style={{ verticalAlign: -2 }} /> SKIP
            </button>
            <button className="btn btn--danger" onClick={onExit}>
              <Square size={14} strokeWidth={2} style={{ verticalAlign: -2 }} /> END
            </button>
          </div>
        </div>
      </Window>

      {next && (
        <Window title="up_next.txt">
          <p className="truncate">
            <span className="label">Next</span>
            <br />
            {next.name} <span className="muted">{next.artists}</span>
          </p>
        </Window>
      )}
    </div>
  );
}
