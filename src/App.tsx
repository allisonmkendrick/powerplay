import { Button, Container, Title, Text } from '@mantine/core';

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const RESPONSE_TYPE = 'token';
const SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'streaming',
  'user-read-email',
  'user-read-private',
].join(' ');

function App() {
  const handleLogin = () => {
    const authUrl = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&response_type=${RESPONSE_TYPE}&scope=${encodeURIComponent(SCOPES)}`;
    window.location.href = authUrl;
  };

  return (
    <Container size="sm" py="xl">
      <Title ta="center" mb="md">
        🍻 PowerPlay!
      </Title>
      <Text ta="center" color="dimmed" mb="lg">
        The ultimate 60-minute music drinking game.<br />
        Login with Spotify to begin.
      </Text>
      <Button
        fullWidth
        size="lg"
        radius="md"
        onClick={handleLogin}
        style={{ marginTop: 32 }}
      >
        Login with Spotify
      </Button>
    </Container>
  );
}

export default App;
