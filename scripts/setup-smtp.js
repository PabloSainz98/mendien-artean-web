'use strict';
const fs = require('node:fs');
const crypto = require('node:crypto');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const { hiddenPrompt } = require('./admin-password');

const recipient = 'pablosainz1998@gmail.com';
const mailbox = 'reservas@uxarbeiti.eus';

function quoteSecret(value) {
  if (typeof value !== 'string' || !value || value.length > 128 || /[\x00-\x1f\x7f]/.test(value))
    throw new Error('Invalid password format');
  for (const quote of ["'", '`', '"']) {
    const encoded = quote + value + quote;
    if (!value.includes(quote) && dotenv.parse(`VALUE=${encoded}`).VALUE === value) return encoded;
  }
  throw new Error('Password cannot be represented safely in the environment file');
}

async function configureSmtp(file, password, createTransport = nodemailer.createTransport) {
  const encoded = quoteSecret(password);
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || (stat.mode & 0o077) !== 0)
    throw new Error('Use an existing private environment file with mode 600');
  const original = fs.readFileSync(file, 'utf8');
  const env = dotenv.parse(original);
  if (env.NODE_ENV !== 'production' || env.PUBLIC_ORIGIN !== 'https://uxarbeiti.eus')
    throw new Error('This setup is only for the UXARBEITI production environment');
  if (env.SMTP_ENABLED === 'true')
    throw new Error('Initial setup refuses to change an already active SMTP configuration');
  const values = {
    SMTP_HOST: 'smtp-uxarbeiti.alwaysdata.net',
    SMTP_PORT: '465',
    SMTP_USER: mailbox,
    SMTP_PASS: password,
    SMTP_FROM: `Uxarbeiti Baserria <${mailbox}>`,
    BOOKING_NOTIFICATION_TO: recipient,
    SMTP_MESSAGE_DOMAIN: 'uxarbeiti.eus',
    SMTP_ENABLED: 'false',
    ACCEPT_BOOKINGS_WITHOUT_EMAIL: 'false',
  };
  const lines = original.split('\n').filter((line) => {
    const key = /^\s*(?:export\s+)?([A-Z_]+)\s*=/.exec(line)?.[1];
    return !Object.hasOwn(values, key || '');
  });
  const content = `${lines.join('\n').trimEnd()}\n${Object.entries(values)
    .map(([key, value]) => `${key}=${key === 'SMTP_PASS' ? encoded : quoteSecret(value)}`)
    .join('\n')}\n`;
  const transport = createTransport({
    host: values.SMTP_HOST,
    port: 465,
    secure: true,
    auth: { user: mailbox, pass: password },
    tls: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  const temporary = `${file}.${crypto.randomUUID()}.tmp`;
  try {
    await transport.verify();
    const result = await transport.sendMail({
      from: values.SMTP_FROM,
      to: recipient,
      replyTo: mailbox,
      messageId: `<setup-${crypto.randomUUID()}@uxarbeiti.eus>`,
      subject: 'UXARBEITI | Prueba del correo de reservas',
      text: 'La conexion del correo de UXARBEITI se ha comprobado.\n\nEste es un mensaje de prueba, no una reserva.\n\nRemitente: reservas@uxarbeiti.eus\nDestinatario: pablosainz1998@gmail.com\n\nLas solicitudes automaticas siguen desactivadas hasta terminar la puesta en marcha. Confirma que este mensaje ha llegado a tu bandeja de entrada.',
      html: '<!doctype html><html lang="es"><body style="font-family:Verdana,sans-serif;color:#243e32;background:#f4f3ec;padding:24px"><main style="max-width:560px;background:#fff;padding:32px;margin:auto"><p>UXARBEITI BASERRIA</p><h1 style="font-family:Georgia,serif">Prueba del correo de reservas</h1><p>La conexion con el servidor de correo se ha comprobado.</p><p><strong>Esto es una prueba, no una reserva.</strong></p><p>Remitente: reservas@uxarbeiti.eus<br>Destinatario: pablosainz1998@gmail.com</p><p>Las solicitudes automaticas siguen desactivadas hasta terminar la puesta en marcha.</p><p>Confirma que este mensaje ha llegado a tu bandeja de entrada.</p></main></body></html>',
    });
    if (!result.accepted?.includes(recipient)) throw new Error('Test recipient not accepted');
    // Do not overwrite configuration changed by another administrator during the SMTP test.
    if (fs.readFileSync(file, 'utf8') !== original)
      throw new Error('Environment changed during setup');
    fs.writeFileSync(temporary, content, { mode: 0o600, flag: 'wx' });
    fs.renameSync(temporary, file);
    return { recipient, smtpEnabled: false };
  } finally {
    transport.close();
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

async function main() {
  if (process.argv.length > 2 || !process.env.UXARBEITI_ENV_PATH?.startsWith('/'))
    throw new Error('Set UXARBEITI_ENV_PATH; do not pass passwords as command arguments');
  process.umask(0o077);
  console.log(`Se enviara un unico correo de prueba a ${recipient}. No se crearan reservas.`);
  const password = await hiddenPrompt('Contrasena del buzon (no se mostrara): ');
  await configureSmtp(process.env.UXARBEITI_ENV_PATH, password);
  console.log('SMTP autenticado con TLS. Correo de prueba aceptado por el servidor.');
  console.log(
    'Credencial guardada solo en la configuracion privada. Las reservas siguen desactivadas.',
  );
}

if (require.main === module)
  main().catch((error) => {
    const code = /^[A-Z0-9_]+$/.test(error.code || '') ? error.code : 'SETUP_ERROR';
    console.error(`No se pudo completar la configuracion (${code}). No se activaron reservas.`);
    process.exitCode = 1;
  });

module.exports = { configureSmtp, quoteSecret };
