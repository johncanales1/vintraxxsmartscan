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
      name: 'vintraxx-frontend',
      script: 'server.js',
      cwd: '/home/ec2-user/vintraxxsmartscan/vintraxxFrontend/.next/standalone',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        PORT: 3002,
        HOSTNAME: '0.0.0.0',
        NODE_ENV: 'production'
      }
    }
  ]
};
