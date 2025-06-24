// src/app/manifest.ts

import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mediant Field Logs',
    short_name: 'MFL',
    description: 'A comprehensive field logging system by Mediant.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/favicon.ico', // Next.js automatically provides this route
        sizes: '48x48',
        type: 'image/x-icon',
      },
      {
        src: '/icon-192.png', // You'll need to add this to your /public folder
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/icon-512.png', // You'll need to add this to your /public folder
        sizes: '512x512',
        type: 'image/png'
      },
      {
        src: '/apple-icon.png', // You'll need to add this to your /public folder
        sizes: '180x180',
        type: 'image/png'
      }
    ],
  }
}