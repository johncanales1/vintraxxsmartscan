module.exports = {
  apps: [
    {
      name: 'vintraxx-backend',
      script: './dist/index.js',
      cwd: '/home/ec2-user/vintraxxsmartscan/vintraxxBackend',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        FRONTEND_URL: 'https://dev.vintraxx.com',
        ADMIN_URL: 'https://admin.vintraxx.com',
        API_URL: 'https://api.vintraxx.com'
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
      script: './.next/standalone/server.js',
      cwd: '/home/ec2-user/vintraxxsmartscan/vintraxxFrontend',
      interpreter: 'node',
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOSTNAME: '0.0.0.0',
        NEXT_PUBLIC_API_URL: 'https://api.vintraxx.com',
        NEXT_PUBLIC_FRONTEND_URL: 'https://dev.vintraxx.com'
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
      script: './.next/standalone/server.js',
      cwd: '/home/ec2-user/vintraxxsmartscan/vintraxxAdmin',
      interpreter: 'node',
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
        HOSTNAME: '0.0.0.0',
        NEXT_PUBLIC_API_URL: 'https://api.vintraxx.com/api/v1/admin',
        NEXT_PUBLIC_ADMIN_URL: 'https://admin.vintraxx.com'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/home/ec2-user/.pm2/logs/vintraxx-admin-error.log',
      out_file: '/home/ec2-user/.pm2/logs/vintraxx-admin-out.log',
      log_file: '/home/ec2-user/.pm2/logs/vintraxx-admin-combined.log',
      time: true
    },
    {
      // vintraxx-gateway: standalone JT/T 808 TCP server. Lives in the same
      // vintraxxBackend repo as the REST API but runs as its own PM2 app so
      // long-lived TCP sockets and binary parsing can't impact REST traffic.
      name: 'vintraxx-gateway',
      script: './dist/gateway/index.js',
      cwd: '/home/ec2-user/vintraxxsmartscan/vintraxxBackend',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        // The gateway loads DATABASE_URL / JWT_SECRET / OPENAI_API_KEY from
        // the same .env as vintraxx-backend. Only GPS_*-prefixed values need
        // to live here.
        GPS_TCP_PORT: 7808,
        GPS_TLS_PORT: 0,
        GPS_AUTO_PROVISION: 'false',
        GPS_HEARTBEAT_TIMEOUT_SEC: 180
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1500M',
      error_file: '/home/ec2-user/.pm2/logs/vintraxx-gateway-error.log',
      out_file: '/home/ec2-user/.pm2/logs/vintraxx-gateway-out.log',
      log_file: '/home/ec2-user/.pm2/logs/vintraxx-gateway-combined.log',
      time: true
    }
  ]
};
