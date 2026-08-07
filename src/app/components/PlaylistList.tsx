'use client';

import { useEffect, useRef, useState } from 'react';
import Window from './Window';
import { Sparkle } from './Sparkles';
import PlaylistCard from './PlaylistCard';
import RoundPreview from './RoundPreview';
import {
  fetchPlaylistTracks,
  fetchPlaylists,
  SpotifyError,
  type Playlist,
} from '../lib/spotify';
import { buildRound, type Round } from '../lib/round';

type PlaylistListProps = {
  token: string;
  canStart: boolean;
  onStart: (round: Round) => void;
};

export type { Playlist };

export default function PlaylistList({ token, canStart, onStart }: PlaylistListProps) {
  const [playlists, setPlaylists] = useState<Playlist[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [round, setRound] = useState<Round | null>(null);
  const [buildingRound, setBuildingRound] = useState(false);
  const [roundError, setRoundError] = useState<string | null>(null);

  // Switching playlists while a fetch is in flight has to cancel it, or a
  // slow earlier request can land after a newer one and win.
  const inFlight = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    setLoading(true);
    fetchPlaylists(token, controller.signal)
      .then(setPlaylists)
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(
          err instanceof SpotifyError ? err.message : 'Failed to fetch playlists.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [token]);

  useEffect(() => {
    return () => inFlight.current?.abort();
  }, []);

  async function selectPlaylist(playlist: Playlist) {
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;

    setSelectedPlaylistId(playlist.id);
    setRound(null);
    setRoundError(null);
    setBuildingRound(true);

    try {
      const tracks = await fetchPlaylistTracks(token, playlist.id, controller.signal);
      if (controller.signal.aborted) return;
      setRound(buildRound(tracks));
    } catch (err) {
      if (controller.signal.aborted) return;
      setRoundError(
        err instanceof SpotifyError
          ? err.message
          : 'Could not load that playlist. Try another one.',
      );
    } finally {
      if (!controller.signal.aborted) setBuildingRound(false);
    }
  }

  if (loading) {
    return (
      <div className="center-screen">
        <Window title="loading.exe" dialog>
          <p className="terminal center">Fetching your playlists...</p>
        </Window>
      </div>
    );
  }

  if (error) {
    return (
      <div className="center-screen">
        <Window title="error.exe" dialog>
          <p className="terminal danger center">{error}</p>
        </Window>
      </div>
    );
  }

  if (!playlists?.length) {
    return (
      <div className="center-screen">
        <Window title="empty.exe" dialog>
          <p className="terminal center">No playlists found.</p>
        </Window>
      </div>
    );
  }

  return (
    <div className="desktop relative">
      <Sparkle size={24} style={{ top: 6, right: 10 }} />
      <Sparkle size={14} style={{ top: 90, left: 0 }} />

      <Window title="pick_a_playlist.exe">
        <div className="rows">
          {playlists.map((pl) => (
            <PlaylistCard
              key={pl.id}
              playlist={pl}
              onClick={() => selectPlaylist(pl)}
              selected={selectedPlaylistId === pl.id}
            />
          ))}
        </div>
      </Window>

      {selectedPlaylistId && (
        <Window title="your_hour.exe">
          <RoundPreview
            round={round}
            loading={buildingRound}
            error={roundError}
            onRebuild={() => {
              const pl = playlists.find((p) => p.id === selectedPlaylistId);
              if (pl) selectPlaylist(pl);
            }}
            onStart={() => round && onStart(round)}
            canStart={canStart}
          />
        </Window>
      )}
    </div>
  );
}
