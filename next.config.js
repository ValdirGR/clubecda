/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.clubecda.com.br',
        pathname: '/2018/img_mod/**',
      },
    ],
  },
  // Permitir conexão com MySQL externo em serverless
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
};

module.exports = nextConfig;
