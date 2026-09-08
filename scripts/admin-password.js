'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { hashPassword } = require('../backend/src/admin');

function hiddenPrompt(label) {
  if (!process.stdin.isTTY)
    throw new Error('Use an interactive terminal. Do not pass a password as a command argument.');
  process.stdout.write(label);
  return new Promise((resolve, reject) => {
    let value = '';
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    const finish = (error) => {
      process.stdin.removeListener('data', onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write('\n');
      if (error) reject(error);
      else resolve(value);
    };
    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === '\u0003' || char === '\u0004') {
          finish(new Error('Cancelled'));
          return;
        }
        if (char === '\r' || char === '\n') {
          finish();
          return;
        }
        if (char === '\u007f' || char === '\b') value = [...value].slice(0, -1).join('');
        else if (char >= ' ' && value.length < 129) value += char;
      }
    };
    process.stdin.on('data', onData);
  });
}
async function main() {
  if (process.argv.length > 2) throw new Error('This command accepts no password arguments.');
  process.umask(0o077);
  const file = path.resolve(
    process.env.UXARBEITI_ENV_PATH || path.join(__dirname, '../backend/.env'),
  );
  const password = await hiddenPrompt('Nueva contraseña (12-128 caracteres, no se mostrará): ');
  const confirmation = await hiddenPrompt('Repite la contraseña: ');
  if (password !== confirmation)
    throw new Error('Las contraseñas no coinciden. No se ha modificado nada.');
  const hash = await hashPassword(password);
  const content = fs.existsSync(file)
    ? fs.readFileSync(file, 'utf8')
    : fs.readFileSync(path.join(__dirname, '../backend/.env.example'), 'utf8');
  const lines = content
    .split('\n')
    .filter((line) => !/^\s*(?:export\s+)?ADMIN_PASSWORD_HASH\s*=/.test(line));
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const temp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temp, `${lines.join('\n').trimEnd()}\nADMIN_PASSWORD_HASH='${hash}'\n`, {
    mode: 0o600,
    flag: 'wx',
  });
  fs.renameSync(temp, file);
  console.log(
    'Contraseña configurada. Solo se ha guardado su hash. Reinicia el backend para aplicarla e invalidar las sesiones anteriores.',
  );
}
if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });

module.exports = { hiddenPrompt };
