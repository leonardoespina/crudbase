module.exports = {
  apps: [
    {
      name: 'crudbase',
      script: '.output/server/index.mjs',
      exec_mode: 'fork', // Para Node.js on-premise con sockets es más estable en fork
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NITRO_PORT: 3000,
        NITRO_HOST: '0.0.0.0'
      },
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      log_file: 'logs/pm2-combined.log',
      time: true
    }
  ]
}
