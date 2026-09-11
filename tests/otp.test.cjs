const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, mocks = {}, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code, {
    exports, require: id => mocks[id] ?? require(id), Buffer, Request, Response,
    console: { error() {} }, ...globals,
  });
  return exports;
}

test('OTP delivery, verification, replay protection, expiry, throttling and retry', async () => {
  let now = Date.now();
  const otp = load('lib/otp.ts', {}, { Date: { now: () => now } });
  const email = otp.normalizeOtpEmail(' Person@Example.com ');
  assert.equal(email, 'person@example.com');
  assert.throws(() => otp.normalizeOtpEmail(['a@example.com']));
  assert.throws(() => otp.normalizeOtpEmail('a@example.com\r\nBcc: b@example.com'));
  let code;
  const send = async (recipient, value) => { assert.equal(recipient, email); code = value; };
  await otp.issueOtp(email, send);
  assert.match(code, /^\d{6}$/);
  await assert.rejects(otp.issueOtp(email, send), error => error.status === 429);
  assert.throws(() => otp.verifyOtp('other@example.com', code));
  assert.throws(() => otp.verifyOtp(email, '000000'));
  otp.verifyOtp(email, code);
  assert.throws(() => otp.verifyOtp(email, code));

  await otp.issueOtp(email, send);
  now += 5 * 60 * 1000;
  assert.throws(() => otp.verifyOtp(email, code), /หมดอายุ/);
  await otp.issueOtp(email, send);
  for (let i = 0; i < 5; i++) assert.throws(() => otp.verifyOtp(email, '000000'));
  assert.throws(() => otp.verifyOtp(email, code), error => error.status === 429);
  now += 60 * 1000;
  await otp.issueOtp(email, send);
  otp.verifyOtp(email, code);

  await assert.rejects(otp.issueOtp(email, async () => { throw new Error('SMTP failed'); }));
  assert.throws(() => otp.verifyOtp(email, code));
  await otp.issueOtp(email, send);
  const previous = code;
  now += 60 * 1000;
  await assert.rejects(otp.issueOtp(email, async () => { throw new Error('SMTP failed'); }));
  otp.verifyOtp(email, previous);
});

test('pending delivery cannot be verified or sent twice concurrently', async () => {
  const otp = load('lib/otp.ts');
  let release, code;
  const pending = otp.issueOtp('a@example.com', async (_, value) => {
    code = value;
    await new Promise(resolve => { release = resolve; });
  });
  assert.throws(() => otp.verifyOtp('a@example.com', code));
  await assert.rejects(otp.issueOtp('a@example.com', async () => {}), error => error.status === 429);
  release();
  await pending;
  otp.verifyOtp('a@example.com', code);
});

test('send route never returns the OTP and reports SMTP failure without leaking details', async () => {
  const otp = load('lib/otp.ts');
  let code;
  let fail = false;
  const mail = {
    MailConfigurationError: class extends Error {},
    sendOtpEmail: async (_, value) => { code = value; if (fail) throw Object.assign(new Error('secret-password'), { code: 'EAUTH' }); },
  };
  const route = load('app/api/auth/send-otp/route.ts', { '@/lib/otp': otp, '@/lib/mail': mail });
  const req = email => new Request('http://localhost/api/auth/send-otp', { method: 'POST', body: JSON.stringify({ email }) });
  const result = await route.POST(req('a@example.com'));
  assert.equal(result.status, 200);
  const body = await result.json();
  assert.equal(body.mockOtp, undefined);
  assert.equal(JSON.stringify(body).includes(code), false);
  assert.equal((await route.POST(req('invalid'))).status, 400);
  fail = true;
  const failed = await route.POST(req('b@example.com'));
  assert.equal(failed.status, 503);
  assert.equal((await failed.text()).includes('secret-password'), false);
});

test('mail uses Gmail credentials and sends an OTP to one recipient', async () => {
  let options, message;
  const mail = load('lib/mail.ts', {
    nodemailer: { createTransport: config => {
      options = config;
      return { sendMail: async value => { message = value; return { accepted: ['a@example.com'] }; } };
    } },
  }, { process: { env: { MAIL_USER: 'sender@gmail.com', MAIL_PASS: 'abcd efgh ijkl mnop' } } });
  await mail.sendOtpEmail('a@example.com', '123456');
  assert.equal(options.service, 'gmail');
  assert.equal(options.auth.pass, 'abcdefghijklmnop');
  assert.equal(message.to.address, 'a@example.com');
  assert.match(message.text, /123456/);
  assert.match(message.html, /123456/);
});
