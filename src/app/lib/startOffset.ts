/**
 * Where in a track its minute begins.
 *
 * This is the whole reason a power hour off YouTube feels better than a
 * shuffle: somebody chose the good sixty seconds. We cannot do that yet,
 * so we skip the intro and take what follows.
 *
 * Everything about picking the minute lives behind `startOffsetMs`. When
 * Spotify's audio analysis is wired up (#10) it replaces the body of this
 * one function and nothing else has to change.
 */

import type { Track } from './spotify';

export const MINUTE_MS = 60_000;

/** Far enough in to clear most intros without landing past the hook. */
const PREFERRED_SKIP_MS = 45_000;

/** Never skip more than this share of a track, so short songs stay sane. */
const MAX_SKIP_FRACTION = 0.25;

export function startOffsetMs(track: Track): number {
  // A track shorter than the minute plays whatever it has, from the top.
  if (track.durationMs <= MINUTE_MS) return 0;

  const preferred = Math.min(
    PREFERRED_SKIP_MS,
    Math.floor(track.durationMs * MAX_SKIP_FRACTION),
  );

  // Leave a full minute of track after the offset, or the song runs out
  // mid-minute and the hour goes quiet.
  const latestUsable = track.durationMs - MINUTE_MS;

  return Math.max(0, Math.min(preferred, latestUsable));
}
