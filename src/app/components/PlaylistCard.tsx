import { Card, Group, Avatar, Text, Badge } from '@mantine/core';
import { Playlist } from './PlaylistList';

type PlaylistCardProps = {
  playlist: Playlist;
  onClick?: () => void;
  selected?: boolean;
};

export default function PlaylistCard({ playlist, onClick, selected }: PlaylistCardProps) {
  const isCollaborative = playlist.collaborative;
  const isPrivate = playlist.public === false;

  return (
    <Card
      withBorder
      shadow={selected ? 'md' : 'sm'}
      radius="lg"
      p="sm"
      mb="sm"
      onClick={onClick}
      style={{
        cursor: 'pointer',
        maxWidth: 480,
        margin: '0 auto',
        borderColor: selected ? '#4dabf7' : undefined,
        background: selected ? 'rgba(77,171,247,0.09)' : undefined,
        transition: 'box-shadow 0.15s, transform 0.12s',
        transform: selected ? 'scale(1.03)' : undefined,
      }}
      className="playlist-card"
    >
      <Group align="center" gap={16}>
        <Avatar src={playlist.images?.[0]?.url} size={56} radius="md" />
        <div style={{ flex: 1 }}>
          <Text fw={600} size="lg" mb={2}>
            {playlist.name}
          </Text>
          <Text size="sm" color="dimmed" mb={2}>
            {playlist.owner.display_name}
          </Text>
          <Text size="xs" color="dimmed">
            {playlist.tracks.total} tracks
          </Text>
          <Group mt="xs">
            {isPrivate && (
              <Badge color="red" size="xs">
                Private
              </Badge>
            )}
            {isCollaborative && (
              <Badge color="grape" size="xs">
                Collaborative
              </Badge>
            )}
            {playlist.public && (
              <Badge color="green" size="xs">
                Public
              </Badge>
            )}
          </Group>
        </div>
      </Group>
    </Card>
  );
}
