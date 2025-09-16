import type { NextConfig } from "next";
import withBundleAnalyzer from '@next/bundle-analyzer';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  /* config options here */
  // Configuration pour utiliser SWC (compilateur par défaut de Next.js)
  // Pas besoin de configuration spéciale car nous utilisons SWC par défaut

  webpack: (config, { isServer }) => {
    // Optimisations pour éviter les ChunkLoadError
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Regrouper les modules React dans un seul chunk
          framework: {
            name: 'framework',
            test: /[\\/]node_modules[\\/](@react|react|react-dom|next)[\\/]/,
            priority: 40,
            chunks: 'all',
            enforce: true,
          },
          // Regrouper les modules communs dans un seul chunk
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
            chunks: 'all',
            reuseExistingChunk: true,
          },
        },
      },
    };
    return config;
  },
};

export default bundleAnalyzer(nextConfig);

