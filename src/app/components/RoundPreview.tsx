'use client';

import { Alert, Button, Card, Group, Loader, ScrollArea, Text } from '@mantine/core';
import { ROUND_LENGTH, type Round } from '../lib/round';

type RoundPreviewProps = {
  round: Round | null;
  loading: boolean;
  error: string | null;
  onRebuild: () => void;
};

function minutes(ms: number): string {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function RoundPreview({
  round,
  loading,
  error,
  onRebuild,
}: RoundPreviewProps) {
  if (loading) {
    return (
      <Card withBorder radius="lg" p="md" mb="sm" style={{ maxWidth: 480, margin: '0 auto' }}>
        <Group gap="sm">
          <Loader size="sm" />
          <Text size="sm">Building your hour...</Text>
        </Group>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert color="red" radius="lg" mb="sm" style={{ maxWidth: 480, margin: '0 auto' }}>
        <Text size="sm" mb="xs">
          {error}
        </Text>
        <Button size="xs" variant="light" onClick={onRebuild}>
          Try again
        </Button>
      </Alert>
    );
  }

  if (!round) return null;

  if (round.tracks.length === 0) {
    return (
      <Alert color="yellow" radius="lg" mb="sm" style={{ maxWidth: 480, margin: '0 auto' }}>
        <Text size="sm">
          Nothing in this playlist can be played. Local files and podcasts do not work
          in a power hour.
        </Text>
      </Alert>
    );
  }

  return (
    <Card withBorder radius="lg" p="md" mb="sm" style={{ maxWidth: 480, margin: '0 auto' }}>
      <Group justify="space-between" mb="xs">
        <Text fw={600}>
          {round.tracks.length} {round.tracks.length === 1 ? 'track' : 'tracks'} ready
        </Text>
        <Button size="xs" variant="subtle" onClick={onRebuild}>
          Reshuffle
        </Button>
      </Group>

      {round.shortfall > 0 && (
        <Text size="sm" c="dimmed" mb="sm">
          This playlist has {round.shortfall} fewer playable tracks than a full hour
          needs, so yours will run {round.tracks.length} minutes. Pick a longer
          playlist for the full {ROUND_LENGTH}.
        </Text>
      )}

      <ScrollArea.Autosize mah={260} type="auto">
        {round.tracks.map((track, i) => (
          <Group key={track.uri} justify="space-between" wrap="nowrap" py={4}>
            <Text size="sm" c="dimmed" w={28} style={{ flexShrink: 0 }}>
              {i + 1}
            </Text>
            <Text size="sm" truncate style={{ flex: 1 }}>
              {track.name}
              <Text component="span" size="sm" c="dimmed">
                {' '}
                {track.artists}
              </Text>
            </Text>
            <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
              {minutes(track.durationMs)}
            </Text>
          </Group>
        ))}
      </ScrollArea.Autosize>
    </Card>
  );
}
