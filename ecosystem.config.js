module.exports = {
  apps: [
    {
      name: 'vintraxxBackend',
      script: 'dist/index.js',
      cwd: '/home/ec2-user/vintraxxsmartscan/vintraxxBackend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'vintraxxFrontend',
      script: 'server.js',
      cwd: '/home/ec2-user/vintraxxsmartscan/vintraxxFrontend/.next/standalone',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        PORT: 3002,
        HOSTNAME: '0.0.0.0',
        NODE_ENV: 'production',
        NEXT_PUBLIC_GOOGLE_CLIENT_ID: '701476871517-lv31geo71p9fbfbs7r7iqdbp7nbru98g.apps.googleusercontent.com'
      }
    }
  ]
};
