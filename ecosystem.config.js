module.exports = {
  apps: [
    {
      name: 'my-store-server',
      script: 'server/index.js',
      instances: process.env.WEB_CONCURRENCY || 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3306,
        TRUST_PROXY: 'true',
        FORCE_HTTPS: process.env.FORCE_HTTPS || 'false',
        SERVE_CLIENT: process.env.SERVE_CLIENT || 'false',
        CORS_ORIGIN: process.env.CORS_ORIGIN || '',
        RATE_LIMIT_AUTH_MAX: process.env.RATE_LIMIT_AUTH_MAX || 200,
        RATE_LIMIT_PAY_MAX: process.env.RATE_LIMIT_PAY_MAX || 600
      }
    }
  ]
};
