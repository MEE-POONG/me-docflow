const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(file, deps) {
  const m = { exports: {} };
  new Function('module','exports','require',ts.transpileModule(fs.readFileSync(file,'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS } }).outputText)(m,m.exports,id => deps[id] ?? require(id));
  return m.exports;
}
function setup() {
  const owner = '111111111111111111111111', editor = '222222222222222222222222';
  const state = { user: { id: owner, companyId: 'c', email: 'one@test', status: 'ACTIVE', role: 'STAFF', position: null, departmentId: 'a' }, session: true,
    doc: { id: 'd', companyId: 'c', createdById: owner, editorUserIds: [], createdBy: { departmentId: 'a' }, updatedAt: new Date('2026-09-15') }, writes: 0 };
  const prisma = {
    companyUser: { findFirst: async ({where}) => state.user.status === where.status && state.user.companyId === where.companyId ? state.user : null, count: async ({where}) => where.id.in.filter(id => [owner,editor].includes(id)).length },
    document: { findFirst: async ({where}) => where.companyId === state.doc.companyId && (!where.createdBy?.is || where.createdBy.is.departmentId === state.doc.createdBy.departmentId) && (!where.createdById || where.createdById === state.doc.createdById) ? state.doc : null, update: async ({data}) => { state.writes++; Object.assign(state.doc,data); } },
  };
  const access = load('lib/document-access.ts', { '@/lib/prisma': { prisma }, '@/lib/profile-session': { readProfileSession: async () => state.session ? {userId: state.user.id,companyId: state.user.companyId} : null } });
  const actions = load('app/actions/document-access.ts', { '@/lib/prisma': {prisma}, '@/lib/document-access': access, 'next/cache': {revalidatePath(){}} });
  return {state,access,actions,owner,editor};
}
test('grant permits editing, revoke denies; editors cannot manage or cross companies', async () => {
  const {state,access,actions,editor} = setup();
  assert.equal((await actions.saveDocumentAccess('d',[editor],state.doc.updatedAt.toISOString())).success,true);
  state.user.id=editor;
  assert.equal((await access.requireDocumentAccess('d','edit')).canEdit,true);
  await assert.rejects(() => access.requireDocumentAccess('d','manage'));
  assert.equal((await actions.saveDocumentAccess('d',[],state.doc.updatedAt.toISOString())).success,false);
  state.doc.editorUserIds=[];
  await assert.rejects(() => access.requireDocumentAccess('d','edit'));
  state.user.companyId='other';
  await assert.rejects(() => access.requireDocumentAccess('d','view'));
});
test('reject foreign recipients, stale version, spoofed actors, inactive and anonymous accounts', async () => {
  const {state,access,actions,editor} = setup();
  assert.equal((await actions.saveDocumentAccess('d',['333333333333333333333333'],state.doc.updatedAt.toISOString())).success,false);
  assert.equal((await actions.saveDocumentAccess('d',[editor],'old')).success,false);
  assert.equal(state.writes,0);
  await assert.rejects(() => access.requireDocumentUser({companyId:'c',userEmail:'spoof@test'}));
  state.user.status='SUSPENDED'; await assert.rejects(() => access.requireDocumentUser());
  state.user.status='ACTIVE'; state.session=false; await assert.rejects(() => access.requireDocumentUser());
});
test('creator, head and owner manage; ordinary staff have view only', () => {
  const {access,state,editor}=setup();
  for (const [role,position,expected] of [['STAFF',null,false],['STAFF','หัวหน้า',true],['OWNER',null,true]]) {
    assert.equal(access.documentPermissions({...state.user,id:editor,role,position},state.doc).canManage,expected);
  }
  assert.equal(access.documentPermissions(state.user,state.doc).canManage,true);
});

test('visibility follows creator department, denies shared cross-department documents and handles unassigned users', async () => {
  const {state,access,editor}=setup();
  state.user.id=editor; state.doc.editorUserIds=[editor];
  assert.equal((await access.requireDocumentAccess('d')).document.id,'d');
  state.doc.createdBy.departmentId='b';
  await assert.rejects(() => access.requireDocumentAccess('d'));
  await assert.rejects(() => access.requireDocumentAccess('d','edit'));
  state.user.role='OWNER'; assert.equal((await access.requireDocumentAccess('d')).document.id,'d');
  state.user.role='STAFF'; state.user.departmentId=null;
  await assert.rejects(() => access.requireDocumentAccess('d'));
  state.doc.createdById=editor; assert.equal((await access.requireDocumentAccess('d')).document.id,'d');
});
