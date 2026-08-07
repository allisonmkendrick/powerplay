/**
 * Building a round.
 *
 * A power hour is 60 tracks, one minute each. This picks them from a
 * playlist. The point of the app is that the hour comes from music the
 * listener already chose, so the only decision left is which 60 and in
 * what order.
 */

import type { Track } from './spotify';

export const ROUND_LENGTH = 60;

export type Round = {
  tracks: Track[];
  /** How many were asked for, normally 60. */
  requested: number;
  /** How many short the playlist left us. Zero for a full hour. */
  shortfall: number;
};

/**
 * Fisher-Yates. The rng is injectable so the shuffle can be tested without
 * depending on chance.
 */
function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Picks the round. Tracks are never repeated to pad a short playlist: an
 * hour that plays the same song twice is worse than an honest short hour,
 * so the shortfall is reported and the caller decides what to say.
 */
export function buildRound(
  tracks: Track[],
  length: number = ROUND_LENGTH,
  rng?: () => number,
): Round {
  const unique = dedupeByUri(tracks);
  const picked = shuffle(unique, rng).slice(0, length);

  return {
    tracks: picked,
    requested: length,
    shortfall: Math.max(0, length - picked.length),
  };
}

/**
 * The same track can sit in a playlist more than once, and hearing it twice
 * in an hour reads as a bug even when the playlist asked for it.
 */
function dedupeByUri(tracks: Track[]): Track[] {
  const seen = new Set<string>();
  return tracks.filter((t) => {
    if (seen.has(t.uri)) return false;
    seen.add(t.uri);
    return true;
  });
}
