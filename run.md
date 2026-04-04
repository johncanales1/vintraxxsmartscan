cd /home/ec2-user/vintraxxsmartscan/vintraxxBackend : port 3001
npm run build
pm2 start dist/index.js --name "vintraxx-backend" --env production


cd /home/ec2-user/vintraxxsmartscan/vintraxxFrontend : port 3000
npm run build
pm2 start "npm run start" --name "vintraxx-frontend" --env production
pm2 start ecosystem.config.js

cd /home/ec2-user/vintraxxsmartscan/vintraxxAdmin : port 3003
npm run build
pm2 start "NODE_ENV=production PORT=3003 next start" --name "vintraxx-admin" --env production