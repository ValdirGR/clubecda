/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.clubecda.com.br',
        pathname: '/2018/img_mod/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // Permitir conexão com Neon PostgreSQL em serverless
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
};

module.exports = nextConfig;
