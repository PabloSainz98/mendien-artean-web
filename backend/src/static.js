'use strict';
const path = require('node:path');

function cacheControl(file) {
  return /\.[a-f0-9]{10}\.(css|js)$/.test(file)
    ? 'public, max-age=31536000, immutable'
    : file.endsWith('.html') || file.endsWith('sw.js')
      ? 'no-cache'
      : 'public, max-age=86400';
}

function precompressed(publicDir) {
  return (req, res, next) => {
    if (!['GET', 'HEAD'].includes(req.method)) return next();
    let file = req.path.slice(1);
    if (file === '' || /^(en|eu)\/$/.test(file)) file += 'index.html';
    else if (/^(?:(?:en|eu)\/)?[a-z0-9-]+$/.test(file)) file += '.html';
    // Explicitly exclude APIs, management, secrets, traversal and direct sidecar requests.
    if (
      !/^(?:(?:(?:en|eu)\/)?[a-z0-9-]+\.html|assets\/(?:app|booking|pricing|styles)\.[a-f0-9]{10}\.(?:js|css))$/.test(
        file,
      )
    )
      return next();
    res.vary('Accept-Encoding');
    if (req.get('Range')) return next();
    const encoding = req.acceptsEncodings('br', 'gzip', 'identity');
    if (!encoding) return res.status(406).end();
    if (encoding === 'identity') return next();
    res.sendFile(
      file,
      {
        root: path.join(publicDir, '.compressed', encoding),
        dotfiles: 'allow',
        acceptRanges: false,
        headers: { 'Content-Encoding': encoding, 'Cache-Control': cacheControl(file) },
      },
      (error) => {
        if (!error) return;
        if (!res.headersSent && [404, 403].includes(error.statusCode)) {
          res.removeHeader('Content-Encoding');
          res.removeHeader('Cache-Control');
          return next(); // Uncompressed files also support development and static previews.
        }
        next(error);
      },
    );
  };
}
module.exports = { precompressed, cacheControl };
