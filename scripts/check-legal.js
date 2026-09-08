'use strict';
const { issues, version } = require('../shared/legal');
const missing = issues();
if (missing.length) {
  console.error(
    'LEGAL REVIEW INCOMPLETE. Do not publish the draft legal pages. Missing approvals/data:\n' +
      missing.join('\n'),
  );
  process.exitCode = 1;
} else
  console.log(
    `Legal content completeness check passed (${version}). This is not legal certification; verify operational obligations in docs/CUMPLIMIENTO.md.`,
  );
