/** @type {import('next-sitemap').IConfig} */
module.exports = {
  // URL de base du site
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://sodiluxe-icf.netlify.app',
  
  // Générer le fichier robots.txt
  generateRobotsTxt: true,
  
  // Ne pas générer de sitemap index (utile pour les très grands sites)
  generateIndexSitemap: false,
  
  // Exclure certaines pages du sitemap
  exclude: [
    '/server-sitemap.xml',
    '/admin/*',
    '/api/*',
    '/404',
    '/500',
    '/_error',
    '/_document',
    '/_app',
    '/_middleware',
    '/middleware',
    '/middleware.ts',
    '/middleware.js',
    '/sitemap-*.xml',
  ],
  
  // Configuration du fichier robots.txt
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api',
          '/_next',
          '/*.json$',
          '/*.xml$',
        ],
      },
    ],
    additionalSitemaps: [
      `${process.env.NEXT_PUBLIC_SITE_URL || 'https://sodiluxe-icf.netlify.app'}/sitemap.xml`,
    ],
  },
  
  // Configuration des changements de fréquence et priorité
  changefreq: 'daily',
  priority: 0.7,
  
  // Options de transformation pour personnaliser les URLs
  transform: async (config, path) => {
    // Exemple de personnalisation des priorités par chemin
    let priority = config.priority;
    
    if (path === '/') {
      priority = 1.0;
    } else if (path.startsWith('/sales')) {
      priority = 0.9;
    } else if (path.startsWith('/help')) {
      priority = 0.5;
    }
    
    return {
      loc: path, // URL de la page
      changefreq: config.changefreq,
      priority: priority,
      lastmod: new Date().toISOString(),
      alternateRefs: config.alternateRefs || [],
    };
  },
  
  // Options avancées de génération
  autoLastmod: true,
  generateRobotsTxt: true,
  sourceDir: '.next',
  outDir: 'public',
  
  // Configuration pour les sites multilingues (exemple)
  // i18n: {
  //   locales: ['fr-FR', 'en-US'],
  //   defaultLocale: 'fr-FR',
  // },
};
