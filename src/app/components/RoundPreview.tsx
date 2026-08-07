'use client';

import { ROUND_LENGTH, type Round } from '../lib/round';

type RoundPreviewProps = {
  round: Round | null;
  loading: boolean;
  error: string | null;
  onRebuild: () => void;
  onStart: () => void;
  /** False while the Spotify player is still connecting. */
  canStart: boolean;
};

export default function RoundPreview({
  round,
  loading,
  error,
  onRebuild,
  onStart,
  canStart,
}: RoundPreviewProps) {
  if (loading) {
    return <p className="terminal">Building your hour...</p>;
  }

  if (error) {
    return (
      <div className="stack">
        <p className="terminal danger">{error}</p>
        <div className="btn-row">
          <button className="btn" onClick={onRebuild}>
            TRY AGAIN
          </button>
        </div>
      </div>
    );
  }

  if (!round) return null;

  if (round.tracks.length === 0) {
    return (
      <p className="terminal">
        Nothing here can be played. Local files and podcasts do not work in a
        power hour.
      </p>
    );
  }

  return (
    <div className="stack">
      <p className="pixel" style={{ fontSize: 12 }}>
        {round.tracks.length} READY
      </p>

      {round.shortfall > 0 && (
        <p className="terminal muted">
          {round.shortfall} short of a full hour, so yours runs{' '}
          {round.tracks.length} minutes. Pick a longer playlist for all{' '}
          {ROUND_LENGTH}.
        </p>
      )}

      <div className="tracklist">
        {round.tracks.map((track, i) => (
          <div key={track.uri}>
            <span>{i + 1}</span>
            <span className="truncate">
              {track.name} <span className="muted">{track.artists}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="btn-row">
        <button className="btn btn--primary btn--big" onClick={onStart} disabled={!canStart}>
          {canStart ? 'START THE HOUR' : 'CONNECTING...'}
        </button>
        <button className="btn" onClick={onRebuild}>
          RESHUFFLE
        </button>
      </div>
    </div>
  );
}
