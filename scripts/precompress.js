'use strict';
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

function precompress(directory, files) {
  const output = path.join(directory, '.compressed');
  // Rebuild only our generated directory, so unpublished pages leave no old variants.
  fs.rmSync(output, { recursive: true, force: true });
  let original = 0,
    brotli = 0,
    gzip = 0;
  for (const file of new Set(files)) {
    const source = fs.readFileSync(path.join(directory, file));
    const variants = {
      br: zlib.brotliCompressSync(source, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9 } }),
      gzip: zlib.gzipSync(source, { level: 9 }),
    };
    original += source.length;
    brotli += variants.br.length;
    gzip += variants.gzip.length;
    for (const [encoding, content] of Object.entries(variants)) {
      const destination = path.join(output, encoding, file);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.writeFileSync(destination, content);
    }
  }
  return { original, brotli, gzip };
}
module.exports = { precompress };
