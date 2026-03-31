module.exports = {
  apps: [
    {
      name: 'api',
      cwd: '/var/www/asia-builders-erp/apps/api',
      script: 'node',
      args: 'dist/main.js',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'web',
      cwd: '/var/www/asia-builders-erp/apps/web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
