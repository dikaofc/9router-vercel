export default function manifest() {
  return {
    name: '9Router - AI Infrastructure Management',
    short_name: '9Router',
    description: 'One endpoint for all your AI providers. Manage keys, monitor usage, and scale effortlessly.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    background_color: '#fef9c3',
    theme_color: '#000000',
    orientation: 'portrait-primary',
    categories: ['developer tools', 'utilities'],
    lang: 'en',
    dir: 'ltr',
    icons: [
      {
        src: '/icons/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
      },
      {
        src: '/icons/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
      },
      {
        src: '/icons/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  }
}
