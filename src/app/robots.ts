import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/pricing'],
      disallow: [
        '/dashboard/',
        '/session/',
        '/course/',
        '/settings/',
        '/api/',
        '/*?*', // disallow query parameters to prevent duplicate content crawls
      ],
    },
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
