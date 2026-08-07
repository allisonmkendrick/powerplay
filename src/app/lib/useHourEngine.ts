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
      // Deliberately no position_ms. Asking Spotify to begin mid-track is
      // an extra thing that can fail at the moment playback starts, and
      // starting at zero is the path proven to work. The offset is applied
      // by seeking once sound is actually coming out.
      body: JSON.stringify({ uris: [track.uri] }),
    },
  );

  // 202 means the device is still waking up, which resolves on its own.
  if (!res.ok && res.status !== 202) {
    throw new Error(`Spotify refused to play that track (${res.status}).`);
  }
}

/**
 * The REST endpoint reliably loads a track and unreliably starts it. It
 * reports `paused: false` for a moment, emits a playback error, and settles
 * back to paused at position zero. Calling resume afterwards starts the
 * track that is already loaded, which does work.
 *
 * The test that matters is whether the position moves. `paused === false`
 * appears during the failed attempt too, so trusting it returns success
 * while the track sits silent.
 */
async function ensurePlaying(player: Spotify.Player | null): Promise<boolean> {
  if (!player) return false;

  let previous = -1;

  for (let attempt = 0; attempt < 10; attempt++) {
    await new Promise((r) => setTimeout(r, 250));
    const state = await player.getCurrentState();

    // No state means this device is not the active one.
    if (!state) continue;

    // Sound is only really happening once the clock moves.
    if (!state.paused && state.position > 0 && state.position !== previous) {
      return true;
    }

    previous = state.position;
    await player.resume().catch(() => {});
  }

  return false;
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
  player: Spotify.Player | null,
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

  // The player instance arrives after the first render, so read it through
  // a ref rather than baking a null into the playback callbacks.
  const playerRef = useRef(player);
  playerRef.current = player;

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
        const track = tracks[position];
        await playTrack(token, deviceId, track);

        // The minute starts when sound does, not when the request returns.
        const playing = await ensurePlaying(playerRef.current);
        if (!playing) {
          setError('Spotify would not start that track.');
          setStatus('paused');
          return;
        }

        // Skip the intro only once audio is confirmed running, so a seek
        // can never be the thing that stops it starting.
        const offset = startOffsetMs(track);
        if (offset > 0) {
          await playerRef.current?.seek(offset).catch(() => {});
        }

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
    // The play call names the device, so no separate transfer is needed.
    // Sending one with play:false raced the first track and paused it.
    void playAt(0);
  }, [playAt]);

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
    void playTrack(token, deviceId, tracks[indexRef.current])
      .then(() => ensurePlaying(playerRef.current))
      .catch(() => {
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
