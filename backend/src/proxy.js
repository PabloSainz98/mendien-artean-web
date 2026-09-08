'use strict';
const net = require('node:net');

function configureProxy(app, env) {
  if (env.TRUST_PROXY === 'true') throw new Error('Use trusted proxy IPs, never TRUST_PROXY=true');
  app.set('trust proxy', env.TRUST_PROXY && env.TRUST_PROXY !== 'false' ? env.TRUST_PROXY : false);
  if (!env.REAL_IP_HEADER) return;
  if (env.REAL_IP_HEADER !== 'x-real-ip') throw new Error('Unsupported REAL_IP_HEADER');
  const trust = app.get('trust proxy fn');
  app.use((req, res, next) => {
    // alwaysdata overwrites X-Real-IP; never use a visitor-supplied X-Forwarded-For chain.
    if (trust(req.socket.remoteAddress, 0)) {
      const ip = req.get('X-Real-IP');
      if (!net.isIP(ip || '')) return res.status(400).json({ ok: false, error: 'proxy' });
      req.headers['x-forwarded-for'] = ip;
    }
    next();
  });
}

module.exports = { configureProxy };
