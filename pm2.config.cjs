module.exports = {
  apps : [{
    name: 'hackchat-websocket',
    script: './main.mjs',
    autorestart: true,
    max_memory_restart: '2G',
    exec_mode: 'fork',
    watch: false,
    no_daemon: true,
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};
