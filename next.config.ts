const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
    domains: [
      'laravel.test',
      'localhost',
      '127.0.0.1',
      'i.imgur.com'
    ],
  },
}

module.exports = nextConfig