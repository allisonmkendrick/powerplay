'use client';

import { useEffect, useState } from 'react';
import { Container, Title, Text, Stack, Center, Loader } from '@mantine/core';
import PlaylistCard from './PlaylistCard';

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
      <Stack gap="xs">
        <Stack gap="sm" style={{ maxWidth: 520, margin: '0 auto', paddingBottom: 32 }}>
          {playlists.map((pl) => (
            <PlaylistCard
              key={pl.id}
              playlist={pl}
              onClick={() => setSelectedPlaylistId(pl.id)}
              selected={selectedPlaylistId === pl.id}
            />
          ))}
        </Stack>
      </Stack>
    </Container>
  );
}
