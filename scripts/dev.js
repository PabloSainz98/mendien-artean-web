'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { build } = require('./build');
build();
const child = spawn(process.execPath, ['--watch', 'backend/src/server.js'], {
  cwd: path.resolve(__dirname, '..'),
  stdio: 'inherit',
  env: { ...process.env, HOST: process.env.HOST || '127.0.0.1' },
});
let timer;
const watchers = ['site', 'shared'].map((dir) =>
  fs.watch(path.resolve(__dirname, '..', dir), { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      Object.keys(require.cache)
        .filter((key) =>
          ['site', 'shared'].some((dir) =>
            key.startsWith(path.join(__dirname, '..', dir) + path.sep),
          ),
        )
        .forEach((key) => delete require.cache[key]);
      delete require.cache[require.resolve('./build')];
      try {
        require('./build').build();
      } catch (error) {
        console.error(error.message);
      }
    }, 150);
  }),
);
function stop() {
  clearTimeout(timer);
  watchers.forEach((watcher) => watcher.close());
  child.kill('SIGTERM');
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
child.on('exit', (code) => {
  watchers.forEach((watcher) => watcher.close());
  process.exitCode = code || 0;
});
