import './globals.css'
import { MantineProvider } from '@mantine/core';

export const metadata = {
  title: 'PowerPlay',
  description: 'The ultimate 60-minute music drinking game!',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MantineProvider defaultColorScheme="dark" withCssVariables>
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
