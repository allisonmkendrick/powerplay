'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Track } from './spotify';
import { MINUTE_MS, startOffsetMs } from './startOffset';

/**
 * The power hour itself: play a minute of a track, move to the next, sixty
 * times over.
 *
 * The whole round is handed to Spotify as one queue rather than a track at
 * a time. Playing single tracks left Spotify with nothing lined up behind
 * each one, so it filled the gap from its own recommendations and a stranger
 * turned up between minutes.
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

/** How long to let Spotify settle on a track before giving up on it. */
const TRACK_CHANGE_TIMEOUT_MS = 4_000;

/**
 * Hands Spotify the entire round in one call, so its queue is exactly our
 * round and there is no gap for it to fill.
 */
async function queueRound(
  token: string,
  deviceId: string,
  tracks: Track[],
): Promise<void> {
  const res = await fetch(
    `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      // No position_ms. Starting mid-track is an extra thing that can fail
      // as playback begins; the offset is applied by seeking afterwards.
      body: JSON.stringify({ uris: tracks.map((t) => t.uri) }),
    },
  );

  // 202 means the device is still waking up, which resolves on its own.
  if (!res.ok && res.status !== 202) {
    throw new Error(`Spotify refused to start the round (${res.status}).`);
  }
}

/**
 * Waits until sound is genuinely coming out, then reports whether it is.
 *
 * The test is whether the position moves. `paused === false` is not enough:
 * a track that fails to stream still reports itself unpaused for a moment
 * before erroring back to zero, so trusting that flag means starting the
 * minute against silence.
 */
async function ensurePlaying(player: Spotify.Player | null): Promise<boolean> {
  if (!player) return false;

  let previous = -1;

  for (let attempt = 0; attempt < 10; attempt++) {
    await new Promise((r) => setTimeout(r, 250));
    const state = await player.getCurrentState();

    if (!state) continue;

    if (!state.paused && state.position > 0 && state.position !== previous) {
      return true;
    }

    previous = state.position;
    await player.resume().catch(() => {});
  }

  return false;
}

/**
 * Spotify changes track a moment after being asked. Seeking before it lands
 * would seek the outgoing song, so wait for the one we expect.
 */
async function waitForTrack(
  player: Spotify.Player | null,
  uri: string,
): Promise<boolean> {
  if (!player) return false;
  const deadline = Date.now() + TRACK_CHANGE_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const state = await player.getCurrentState();
    if (state?.track_window?.current_track?.uri === uri) return true;
    await new Promise((r) => setTimeout(r, 100));
  }

  return false;
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

  const finish = useCallback(() => {
    clearTick();
    deadlineRef.current = null;
    setStatus('finished');
    void playerRef.current?.pause().catch(() => {});
  }, [clearTick]);

  /** Skips the intro, but only once the right track is actually playing. */
  const applyOffset = useCallback(async (track: Track) => {
    const offset = startOffsetMs(track);
    if (offset > 0) {
      await playerRef.current?.seek(offset).catch(() => {});
    }
  }, []);

  /** Arms the minute for whatever is playing now. */
  const beginMinute = useCallback((position: number) => {
    indexRef.current = position;
    setIndex(position);
    setRemainingMs(MINUTE_MS);
    deadlineRef.current = Date.now() + MINUTE_MS;
    setStatus('playing');
  }, []);

  /**
   * Moves to the next track in Spotify's queue, which is our round. Falls
   * back to naming the track directly if the queue has drifted.
   */
  const advanceTo = useCallback(
    async (position: number) => {
      if (!token || !deviceId) return;

      if (position >= tracks.length) {
        finish();
        return;
      }

      const track = tracks[position];
      const player = playerRef.current;

      await player?.nextTrack().catch(() => {});
      let landed = await waitForTrack(player, track.uri);

      if (!landed) {
        // The queue drifted, so put Spotify back on the right track by
        // name. This restarts the context, which is why it is the fallback.
        await queueRound(token, deviceId, tracks.slice(position)).catch(() => {});
        landed = await waitForTrack(player, track.uri);
      }

      if (!landed) {
        setError('Lost track of the queue. Try starting the hour again.');
        setStatus('paused');
        return;
      }

      await applyOffset(track);
      beginMinute(position);
    },
    [token, deviceId, tracks, finish, applyOffset, beginMinute],
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
        // Stop the clock while the next track is being cued, or the tick
        // fires again before the change lands.
        deadlineRef.current = null;
        void advanceTo(indexRef.current + 1);
      } else {
        setRemainingMs(left);
      }
    }, TICK_MS);

    return clearTick;
  }, [status, advanceTo, clearTick]);

  useEffect(() => clearTick, [clearTick]);

  const start = useCallback(() => {
    setError(null);
    if (!token || !deviceId || !tracks.length) return;

    void (async () => {
      try {
        await queueRound(token, deviceId, tracks);

        if (!(await ensurePlaying(playerRef.current))) {
          setError('Spotify would not start the music.');
          setStatus('paused');
          return;
        }

        await applyOffset(tracks[0]);
        beginMinute(0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Playback failed.');
        setStatus('paused');
      }
    })();
  }, [token, deviceId, tracks, applyOffset, beginMinute]);

  const pause = useCallback(() => {
    clearTick();
    // Bank what is left so resuming gives back the same minute, not a new one.
    const deadline = deadlineRef.current;
    setRemainingMs(deadline ? Math.max(0, deadline - Date.now()) : MINUTE_MS);
    deadlineRef.current = null;
    setStatus('paused');
    void playerRef.current?.pause().catch(() => {});
  }, [clearTick]);

  const resume = useCallback(() => {
    // The queue holds its position, so this picks up where it stopped
    // rather than restarting the track.
    deadlineRef.current = Date.now() + remainingMs;
    setStatus('playing');
    void playerRef.current?.resume().catch(() => {
      setError('Could not resume. Try again.');
      setStatus('paused');
    });
  }, [remainingMs]);

  const skip = useCallback(() => {
    deadlineRef.current = null;
    void advanceTo(indexRef.current + 1);
  }, [advanceTo]);

  const stop = useCallback(() => {
    clearTick();
    deadlineRef.current = null;
    indexRef.current = 0;
    setIndex(0);
    setRemainingMs(MINUTE_MS);
    setStatus('idle');
    void playerRef.current?.pause().catch(() => {});
  }, [clearTick]);

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
