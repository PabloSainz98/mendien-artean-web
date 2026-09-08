'use strict';
const fs = require('node:fs');

function assertLocalStorage(directory, statfs = fs.statfsSync) {
  // SQLite WAL coordinates processes through shared memory, not network mounts.
  const type = Number(statfs(directory).type) >>> 0;
  if ([0x6969, 0xff534d42, 0xfe534d42].includes(type)) {
    throw new Error(
      'SQLite WAL requires local storage. Run the application and backups on the web server, not through NFS/SMB.',
    );
  }
}

module.exports = { assertLocalStorage };
