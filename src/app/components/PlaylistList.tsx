'use client';

import { useEffect, useRef, useState } from 'react';
import { Container, Title, Text, Stack, Center, Loader } from '@mantine/core';
import PlaylistCard from './PlaylistCard';
import RoundPreview from './RoundPreview';
import { fetchPlaylistTracks, SpotifyError } from '../lib/spotify';
import { buildRound, type Round } from '../lib/round';

type PlaylistListProps = {
  token: string;
};

export type Playlist = {
  id: string;
  name: string;
  images?: { url: string }[];
  tracks: { total: number };
  collaborative: boolean;
  public: boolean;
  owner: { display_name: string };
};

export default function PlaylistList({ token }: PlaylistListProps) {
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
    if (token) {
      setLoading(true);
      fetch('https://api.spotify.com/v1/me/playlists?limit=20', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setPlaylists(data.items || []))
        .catch(() => setError('Failed to fetch playlists.'))
        .finally(() => setLoading(false));
    }
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
      <Center style={{ minHeight: '100vh' }}>
        <Loader size="xl" />
        <Text ta="center">Loading playlists...</Text>
      </Center>
    );
  }

  if (error) {
    return (
      <Text color="red" ta="center">
        {error}
      </Text>
    );
  }

  if (!playlists?.length) {
    return <Text ta="center">No playlists found!</Text>;
  }

  return (
    <Container>
      <Title ta="center" mb="md">
        Select a playlist to start your Power Hour.
      </Title>

      <Stack gap="sm" style={{ maxWidth: 520, margin: '0 auto', paddingBottom: 32 }}>
        {playlists.map((pl) => (
          <div key={pl.id}>
            <PlaylistCard
              playlist={pl}
              onClick={() => selectPlaylist(pl)}
              selected={selectedPlaylistId === pl.id}
            />

            {selectedPlaylistId === pl.id && (
              <RoundPreview
                round={round}
                loading={buildingRound}
                error={roundError}
                onRebuild={() => selectPlaylist(pl)}
              />
            )}
          </div>
        ))}
      </Stack>
    </Container>
  );
}
