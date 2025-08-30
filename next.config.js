/** @type {import('next').NextConfig} */
const nextConfig = {
  // Désactiver l'exportation statique car nous avons des routes API
  // output: 'export',

  // Désactiver le header X-Powered-By pour la sécurité
  poweredByHeader: false,

  // Configuration des images
  images: {
    unoptimized: true, // Nécessaire pour l'export statique
    domains: ['fra.cloud.appwrite.io'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  // Configuration pour les requêtes API (désactivée pour l'export statique)
  // async headers() {
  //   return [
  //     {
  //       // Appliquer ces en-têtes à toutes les routes
  //       source: '/:path*',
  //       headers: [
  //         {
  //           key: 'Access-Control-Allow-Credentials',
  //           value: 'true',
  //         },
  //         {
  //           key: 'Access-Control-Allow-Origin',
  //           value: '*', // En production, remplacer par les domaines spécifiques
  //         },
  //         {
  //           key: 'Access-Control-Allow-Methods',
  //           value: 'GET,DELETE,PATCH,POST,PUT',
  //         },
  //         {
  //           key: 'Access-Control-Allow-Headers',
  //           value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
  //         },
  //       ],
  //     },
  //   ];
  // },
  // Optimisation webpack pour éviter les ChunkLoadError
  webpack: (config, { dev, isServer }) => {
    // Optimisation des chunks uniquement pour le build de production côté client
    if (!dev && !isServer) {
      // Configuration de splitChunks pour une meilleure gestion des modules
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // Regrouper React et les modules associés
          framework: {
            name: 'framework',
            test: /[\\/]node_modules[\\/](@react|react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            priority: 40,
            chunks: 'all',
            enforce: true,
          },
          // Regrouper les bibliothèques communes
          lib: {
            test: /[\\/]node_modules[\\/]/,
            priority: 30,
            chunks: 'all',
            name(module) {
              const match = module.context.match(/[\/]node_modules[\/](.+?)(?:[\/]|$)/);
              const packageName = match ? match[1] : 'unknown';
              return `lib.${packageName.replace('@', '')}`;
            },
          },
        },
      };

      // Augmenter la taille maximale des assets pour éviter trop de fragmentation
      config.optimization.minimizer.forEach((minimizer) => {
        if (minimizer.constructor.name === 'TerserPlugin') {
          minimizer.options.terserOptions.compress.drop_console = true;
        }
      });
    }
    
    return config;
  },
  

  // Fonctionnalités expérimentales pour améliorer la stabilité
  experimental: {
    // Amélioration de la restauration du défilement
    scrollRestoration: true,
  },
  // Ajout pour Netlify
  trailingSlash: true,
};

module.exports = nextConfig;