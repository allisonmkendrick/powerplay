'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Track } from './spotify';
import { MINUTE_MS, startOffsetMs } from './startOffset';

/**
 * The power hour itself: play a minute of a track, move to the next, sixty
 * times over.
 *
 * Timing is held as a deadline rather than a countdown. Adding up sixty
 * intervals would drift by the end of the hour, and a power hour that runs
 * long is a power hour nobody finishes.
 */

export type HourStatus = 'idle' | 'playing' | 'paused' | 'finished';

export type Hour = {
  status: HourStatus;
  /** Zero based position in the round. */
  index: number;
  current: Track | null;
  next: Track | null;
  /** Milliseconds left in this minute, for a countdown. */
  remainingMs: number;
  total: number;
  error: string | null;
  start: () => void;
  pause: () => void;
  resume: () => void;
  skip: () => void;
  stop: () => void;
};

const TICK_MS = 200;

async function playTrack(
  token: string,
  deviceId: string,
  track: Track,
): Promise<void> {
  const res = await fetch(
    `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uris: [track.uri],
        position_ms: startOffsetMs(track),
      }),
    },
  );

  // 202 means the device is still waking up, which resolves on its own.
  if (!res.ok && res.status !== 202) {
    throw new Error(`Spotify refused to play that track (${res.status}).`);
  }
}

/**
 * Points Spotify at this browser tab. Without it, audio can keep going to
 * whatever device was last active, so the hour runs silently here while
 * playing on a desktop app in another room.
 */
async function transferPlayback(token: string, deviceId: string): Promise<void> {
  await fetch('https://api.spotify.com/v1/me/player', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ device_ids: [deviceId], play: false }),
  }).catch(() => {
    // The play call names the device too, so this is belt and braces.
  });
}

async function pausePlayback(token: string, deviceId: string): Promise<void> {
  await fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {
    // Pausing something already paused is not worth surfacing.
  });
}

export function useHourEngine(
  token: string | null,
  deviceId: string | null,
  tracks: Track[],
): Hour {
  const [status, setStatus] = useState<HourStatus>('idle');
  const [index, setIndex] = useState(0);
  const [remainingMs, setRemainingMs] = useState(MINUTE_MS);
  const [error, setError] = useState<string | null>(null);

  // The moment the current minute is due to end. Held in a ref so the tick
  // reads it without re-arming on every render.
  const deadlineRef = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const indexRef = useRef(0);

  const clearTick = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  /** Starts the minute for a given position and arms its deadline. */
  const playAt = useCallback(
    async (position: number) => {
      if (!token || !deviceId) return;

      if (position >= tracks.length) {
        clearTick();
        deadlineRef.current = null;
        setStatus('finished');
        return;
      }

      indexRef.current = position;
      setIndex(position);
      setRemainingMs(MINUTE_MS);

      try {
        await playTrack(token, deviceId, tracks[position]);
        deadlineRef.current = Date.now() + MINUTE_MS;
        setStatus('playing');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Playback failed.');
        setStatus('paused');
      }
    },
    [token, deviceId, tracks, clearTick],
  );

  // One ticker for the whole hour. It only reads the deadline, so pausing
  // and resuming never leaves a stray timer behind.
  useEffect(() => {
    if (status !== 'playing') {
      clearTick();
      return;
    }

    tickRef.current = setInterval(() => {
      const deadline = deadlineRef.current;
      if (deadline === null) return;

      const left = deadline - Date.now();
      if (left <= 0) {
        void playAt(indexRef.current + 1);
      } else {
        setRemainingMs(left);
      }
    }, TICK_MS);

    return clearTick;
  }, [status, playAt, clearTick]);

  useEffect(() => clearTick, [clearTick]);

  const start = useCallback(() => {
    setError(null);
    if (!token || !deviceId) return;
    // Claim the device before the first track, or Spotify may keep sending
    // audio to whatever was playing last.
    void transferPlayback(token, deviceId).then(() => playAt(0));
  }, [token, deviceId, playAt]);

  const pause = useCallback(() => {
    if (!token || !deviceId) return;
    clearTick();
    // Bank what is left so resuming gives back the same minute, not a new one.
    const deadline = deadlineRef.current;
    setRemainingMs(deadline ? Math.max(0, deadline - Date.now()) : MINUTE_MS);
    deadlineRef.current = null;
    setStatus('paused');
    void pausePlayback(token, deviceId);
  }, [token, deviceId, clearTick]);

  const resume = useCallback(() => {
    if (!token || !deviceId) return;
    // Resuming re-issues the track, so the offset is honoured rather than
    // picking up wherever Spotify happened to stop.
    deadlineRef.current = Date.now() + remainingMs;
    setStatus('playing');
    void playTrack(token, deviceId, tracks[indexRef.current]).catch(() => {
      setError('Could not resume. Try again.');
      setStatus('paused');
    });
  }, [token, deviceId, tracks, remainingMs]);

  const skip = useCallback(() => {
    void playAt(indexRef.current + 1);
  }, [playAt]);

  const stop = useCallback(() => {
    clearTick();
    deadlineRef.current = null;
    indexRef.current = 0;
    setIndex(0);
    setRemainingMs(MINUTE_MS);
    setStatus('idle');
    if (token && deviceId) void pausePlayback(token, deviceId);
  }, [token, deviceId, clearTick]);

  return {
    status,
    index,
    current: tracks[index] ?? null,
    next: tracks[index + 1] ?? null,
    remainingMs,
    total: tracks.length,
    error,
    start,
    pause,
    resume,
    skip,
    stop,
  };
}
