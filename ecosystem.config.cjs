// PM2 ekosystem fayli — CinemaHub AI Ultimate
// Ishlatish: pm2 start ecosystem.config.cjs
// Eslatma: PM2 o'chirilganda yoki kompyuter restart bo'lganda avtomatik ishga tushadi

module.exports = {
  apps: [
    {
      name: 'cinemahub-backend',
      script: 'node',
      args: 'dist/main.js',
      cwd: __dirname + '/backend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '800M',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Crash bo'lsa 5 soniyadan keyin qayta ishga tushiriladi
      restart_delay: 5000,
      // 60 soniya ichida 10 marta crash bo'lsa to'xtatiladi
      max_restarts: 10,
      min_uptime: '10s',
    },
    {
      name: 'cinemahub-admin',
      script: 'node',
      args: 'server.js',
      cwd: __dirname + '/admin',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: './logs/admin-error.log',
      out_file: './logs/admin-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};
