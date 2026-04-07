cd /home/ec2-user/vintraxxsmartscan/vintraxxBackend : port 3001
npm run build
pm2 start ecosystem.config.js --only vintraxx-backend


cd /home/ec2-user/vintraxxsmartscan/vintraxxFrontend : port 3000
npm run build
pm2 start npm --name "vintraxx-frontend" -- start -- --hostname dev.vintraxx.com --port 3000

cd /home/ec2-user/vintraxxsmartscan/vintraxxAdmin : port 3003
npm run build
pm2 start "NODE_ENV=production PORT=3003 next start" --name "vintraxx-admin" --env production