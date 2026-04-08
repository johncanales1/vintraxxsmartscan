module.exports = {
  apps: [
    {
      name: 'vintraxx-backend',
      script: './dist/index.js',
      cwd: '/home/ec2-user/vintraxxsmartscan/vintraxxBackend',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/home/ec2-user/.pm2/logs/vintraxx-backend-error.log',
      out_file: '/home/ec2-user/.pm2/logs/vintraxx-backend-out.log',
      log_file: '/home/ec2-user/.pm2/logs/vintraxx-backend-combined.log',
      time: true
    },
    {
      name: 'vintraxx-frontend',
      script: 'node_modules/.bin/next',
      args: 'start -p 3002',
      cwd: '/home/ec2-user/vintraxxsmartscan/vintraxxFrontend',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/home/ec2-user/.pm2/logs/vintraxx-frontend-error.log',
      out_file: '/home/ec2-user/.pm2/logs/vintraxx-frontend-out.log',
      log_file: '/home/ec2-user/.pm2/logs/vintraxx-frontend-combined.log',
      time: true
    },
    {
      name: 'vintraxx-admin',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      cwd: '/home/ec2-user/vintraxxsmartscan/vintraxxAdmin',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/home/ec2-user/.pm2/logs/vintraxx-admin-error.log',
      out_file: '/home/ec2-user/.pm2/logs/vintraxx-admin-out.log',
      log_file: '/home/ec2-user/.pm2/logs/vintraxx-admin-combined.log',
      time: true
    }
  ]
};
