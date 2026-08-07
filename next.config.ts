import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // There is a stray package-lock.json in the home directory, so Next infers
  // the wrong workspace root and its dev cache corrupts. Pin it here.
  turbopack: {
    root: __dirname,
  },

  // The app is opened on 127.0.0.1 while the dev server binds localhost,
  // which Next now warns about and will refuse in a future version.
  allowedDevOrigins: ['127.0.0.1'],
};

export default nextConfig;
