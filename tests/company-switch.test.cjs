const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const bcrypt = require('bcryptjs');

const sourceCompanyId = 'a'.repeat(24);
const targetCompanyId = 'b'.repeat(24);
const target = {
  id: 'c'.repeat(24), companyId: targetCompanyId, name: 'Demo Owner',
  email: 'owner@example.com', role: 'OWNER', status: 'ACTIVE',
  company: { name: 'Second company' }, department: null,
  passwordHash: bcrypt.hashSync('target-password', 4),
};

function route({ session = { userId: 'd'.repeat(24), companyId: sourceCompanyId }, membership = target } = {}) {
  const sessions = [];
  let queries = 0;
  const exports = {};
  const prisma = { companyUser: { findFirst: async ({ where }) => {
    queries++;
    assert.equal(where.status, 'ACTIVE');
    assert.deepEqual(JSON.parse(JSON.stringify(where.company)), { is: { status: 'ACTIVE' } });
    if (where.id) {
      assert.equal(where.id, session.userId);
      assert.equal(where.companyId, sourceCompanyId);
      return { email: 'owner@example.com' };
    }
    assert.equal(where.companyId, targetCompanyId);
    assert.equal(where.email.equals, 'owner@example.com');
    return membership;
  } } };
  const compiled = ts.transpileModule(fs.readFileSync('app/api/auth/switch-company/route.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(compiled, { exports, Response, require: id => {
    if (id === '@/lib/prisma') return { prisma };
    if (id === '@/lib/profile-session') return {
      readProfileSession: async () => session,
      createProfileSession: async (userId, companyId) => sessions.push({ userId, companyId }),
    };
    return require(id);
  } });
  return { post: input => exports.POST({ json: async () => input }), sessions, queryCount: () => queries };
}

test('company switching requires a signed session and a valid request', async () => {
  const anonymous = route({ session: null });
  assert.equal((await anonymous.post({ companyId: targetCompanyId, password: 'target-password' })).status, 401);
  assert.equal(anonymous.queryCount(), 0);
  const authenticated = route();
  assert.equal((await authenticated.post({ companyId: 'invalid', password: 'target-password' })).status, 400);
  assert.equal((await authenticated.post({ companyId: targetCompanyId, password: 'x'.repeat(201) })).status, 400);
  assert.equal(authenticated.queryCount(), 0);
});

test('the selected membership password controls which company session is issued', async () => {
  const handler = route();
  const response = await handler.post({ companyId: targetCompanyId, password: 'target-password' });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.user.companyId, targetCompanyId);
  assert.equal(body.user.role, 'owner');
  assert.equal(body.user.passwordHash, undefined);
  assert.deepEqual(handler.sessions, [{ userId: target.id, companyId: targetCompanyId }]);
});

test('wrong target password and absent membership never replace the current session', async () => {
  const wrongPassword = route();
  assert.equal((await wrongPassword.post({ companyId: targetCompanyId, password: 'different-company-password' })).status, 401);
  assert.equal(wrongPassword.sessions.length, 0);
  const noMembership = route({ membership: null });
  assert.equal((await noMembership.post({ companyId: targetCompanyId, password: 'target-password' })).status, 403);
  assert.equal(noMembership.sessions.length, 0);
});
