const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, prisma) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code, { exports, Buffer, console: { error() {} },
    require: id => id === './SignDocumentButton' ? { SignDocumentButton: () => null } : id === './SubmitForApprovalButton' ? { SubmitForApprovalButton: () => null } : id === './PrintHelper' ? { PrintHelper: () => null, PreviewActions: () => null, PrintActions: () => null }
      : id === '@/components/templates/builder/DocumentPreview' ? { DocumentPreview: ({ dataOverride }) => require('react').createElement('div', null, 'Saved design: ' + dataOverride.customer_name) }
      : id.startsWith('@/components/templates/') ? load(id.replace('@/', '') + '.tsx')
      : id === '@/lib/template-data-mapping' ? load('lib/template-data-mapping.ts')
      : id === '@/lib/document-numbering' ? load('lib/document-numbering.ts') : id === '@/lib/prisma' ? { prisma } : id === 'next/cache' ? { revalidatePath() {} } : id.startsWith('@/lib/') ? load(id.replace('@/', '') + '.ts') : require(id),
  });
  return exports;
}

function fixture() {
  const docs = [];
  const settings = [];
  const types = [{ id: 'type', name: 'ใบสั่งซื้อ', slug: 'PO' }, { id: 'payment', name: 'ใบสำคัญจ่าย', slug: 'PAY' }];
  const companyId = '111111111111111111111111';
  const otherCompanyId = '222222222222222222222222';
  const user = { id: '333333333333333333333333', companyId, email: 'owner@example.com', company: { id: companyId, name: 'บริษัททดสอบ' } };
  const matches = (doc, where) => (!where.id || doc.id === where.id)
    && (!where.companyId || doc.companyId === where.companyId)
    && (!where.createdById || doc.createdById === where.createdById)
    && (where.isLocked === undefined || Boolean(doc.isLocked) === where.isLocked)
    && (!where.status || where.status.in.includes(doc.status))
    && (!where.documentNo?.startsWith || doc.documentNo?.startsWith(where.documentNo.startsWith));
  const prisma = {
    companyUser: { findFirst: async ({ where }) => where.companyId === companyId && where.email === 'owner@example.com' ? user : null },
    documentCategory: { findFirst: async () => ({ id: 'category' }) },
    documentType: {
      findFirst: async () => ({ id: 'type' }),
      findUniqueOrThrow: async ({ where }) => types.find(t => t.id === where.id),
      findMany: async ({ where }) => types.filter(t => !where.id || where.id.in.includes(t.id)),
    },
    documentNumberSetting: {
      findMany: async ({ where }) => settings.filter(s => s.companyId === where.companyId),
      findUnique: async ({ where }) => settings.find(s => s.companyId === where.companyId_documentTypeId.companyId && s.documentTypeId === where.companyId_documentTypeId.documentTypeId) || null,
      upsert: async ({ where, create, update }) => {
        let setting = await prisma.documentNumberSetting.findUnique({ where });
        if (setting) Object.assign(setting, update);
        else { setting = { ...create }; settings.push(setting); }
        return { ...setting };
      },
      update: async ({ where, data }) => {
        const setting = await prisma.documentNumberSetting.findUnique({ where });
        Object.assign(setting, data);
        return { ...setting };
      },
    },
    documentTemplate: { findFirst: async () => ({ id: 'template' }) },
    document: {
      findFirst: async ({ where }) => docs.filter(doc => matches(doc, where)).at(-1) ?? null,
      findMany: async ({ where }) => docs.filter(doc => matches(doc, where)),
      create: async ({ data }) => { const doc = { ...data, id: '444444444444444444444444' }; docs.push(doc); return { ...doc }; },
      update: async ({ where, data }) => {
        const doc = docs.find(doc => matches(doc, where));
        if (!doc) throw new Error('Document outside company or not editable');
        Object.assign(doc, data);
        return { ...doc };
      },
    },
  };
  prisma.$transaction = async fn => fn(prisma);
  const input = { companyId, userEmail: ' Owner@Example.com ', title: 'ใบสั่งซื้อ',
    categoryId: 'category', documentTypeId: 'type', dataJson: JSON.stringify({ po_refNo: 'PO1', items: [{ name: 'Mouse', qty: 2 }] }),
    subtotalSatang: 0, vatSatang: 0, totalSatang: 0,
  };
  return { prisma, docs, settings, input, companyId, otherCompanyId, user };
}

test('saving uses the selected company and registered author; drafts appear in history and submissions in pending', async () => {
  const f = fixture();
  const actions = load('app/actions/documents.ts', f.prisma);
  const lists = load('app/(dashboard)/documents/actions.ts', f.prisma);
  const saved = await actions.createDocument(f.input);
  assert.equal(saved.success, true);
  assert.equal(saved.document.companyId, f.companyId);
  assert.equal(saved.document.createdById, f.user.id);
  assert.equal(saved.document.subtotalSatang, 0);
  assert.equal(saved.document.dataJson.po_refNo, 'PO1');
  assert.equal((await lists.getDocumentsByCompany(f.companyId)).length, 1);
  assert.equal((await lists.getDocumentsByCompany(f.otherCompanyId)).length, 0);
  assert.equal((await lists.getPendingDocumentsByCompany(f.companyId)).length, 0);

  const updated = await actions.updateDocument(saved.document.id, { ...f.input, templateId: 'template', totalSatang: 70000 });
  assert.equal(updated.success, true);
  assert.equal((await actions.submitDocument(saved.document.id, f.input)).success, false);
  f.docs[0].dataJson.submitterSignature = { userId: f.user.id };
  const submitted = await actions.submitDocument(saved.document.id, f.input);
  assert.equal(submitted.success, true);
  assert.equal(submitted.document.status, 'PENDING');
  assert.ok(submitted.document.dataJson.approvalSubmittedAt);
  assert.equal(submitted.document.totalSatang, 70000);
  assert.equal((await lists.getPendingDocumentsByCompany(f.companyId)).length, 1);
  assert.equal((await lists.getPendingDocumentsByCompany(f.otherCompanyId)).length, 0);
  assert.equal((await actions.updateDocument(saved.document.id, f.input)).success, false);
});

test('missing company or wrong company member never creates a demo user or document', async () => {
  const f = fixture();
  const actions = load('app/actions/documents.ts', f.prisma);
  assert.equal((await actions.createDocument({ ...f.input, companyId: '' })).success, false);
  assert.equal((await actions.createDocument({ ...f.input, companyId: f.otherCompanyId })).success, false);
  assert.equal((await actions.createDocument({ ...f.input, userEmail: 'someone@example.com' })).success, false);
  assert.equal(f.docs.length, 0);
});

test('update and submission cannot affect a document belonging to another company', async () => {
  const f = fixture();
  f.docs.push({ id: 'foreign-document', companyId: f.otherCompanyId, status: 'DRAFT' });
  const actions = load('app/actions/documents.ts', f.prisma);
  assert.equal((await actions.updateDocument('foreign-document', f.input)).success, false);
  assert.equal((await actions.submitDocument('foreign-document', f.input)).success, false);
  assert.equal(f.docs[0].status, 'DRAFT');
});

test('purchase order and invoice headings use the mapped company, with no sample company details', () => {
  const { renderToStaticMarkup } = require('react-dom/server');
  const React = require('react');
  const { mapDocumentToTemplateData } = load('lib/template-data-mapping.ts');
  const data = mapDocumentToTemplateData({ dataJson: {} }, { name: 'Registered Company' });
  for (const [file, name] of [['PurchaseOrderPrintLayout', 'PurchaseOrderPrintLayout'], ['InvoicePrintLayout', 'InvoicePrintLayout']]) {
    const component = load(`components/templates/${file}.tsx`)[name];
    const html = renderToStaticMarkup(React.createElement(component, { data }));
    assert.ok(html.includes('Registered Company'));
    assert.ok(!html.includes('FLOWACCOUNT'));
    assert.ok(!html.includes('0105558096348'));
    assert.ok(!html.includes('Tanai Digital Platform'));
  }
});

test('saved settings control prefix, padding, start and independent type counters', async () => {
  const f = fixture();
  const actions = load('app/actions/documents.ts', f.prisma);
  const config = { documentTypeId: 'type', prefix: 'BUY', digits: 5, startNumber: 12, useDate: false };
  assert.equal((await actions.saveDocumentNumberSettings(f.input, [config, { ...config, documentTypeId: 'payment', prefix: 'PAYMENT', startNumber: 3 }])).success, true);
  const first = await actions.createDocument(f.input);
  assert.equal(first.document.documentNo, 'BUY00012');
  assert.equal((await actions.createDocument(f.input)).document.documentNo, 'BUY00013');
  assert.equal((await actions.createDocument({ ...f.input, documentTypeId: 'payment' })).document.documentNo, 'PAYMENT00003');
  // Saving a stale settings screen must not rewind a consumed counter.
  await actions.saveDocumentNumberSettings(f.input, [config]);
  assert.equal((await actions.createDocument(f.input)).document.documentNo, 'BUY00014');
  await actions.saveDocumentNumberSettings(f.input, [{ ...config, prefix: 'NEW', startNumber: 1 }]);
  assert.equal((await actions.createDocument(f.input)).document.documentNo, 'NEW00001');
  assert.equal(first.document.documentNo, 'BUY00012');
  // Restore an old series: previous numbers cannot be reused.
  await actions.saveDocumentNumberSettings(f.input, [config]);
  assert.equal((await actions.createDocument(f.input)).document.documentNo, 'BUY00015');
});

test('dated numbering resets on new month and uses Bangkok month at UTC boundary', async () => {
  const { numberPeriod, formatDocumentNumber } = load('lib/document-numbering.ts');
  const boundary = new Date('2026-09-30T18:00:00Z');
  assert.equal(numberPeriod(boundary).stamp, '202610');
  assert.equal(formatDocumentNumber({ prefix: 'PV', useDate: true, digits: 4, startNumber: 7 }, 7, boundary), 'PV-202610-0007');
  const f = fixture();
  const actions = load('app/actions/documents.ts', f.prisma);
  await actions.saveDocumentNumberSettings(f.input, [{ documentTypeId: 'type', prefix: 'PO', digits: 3, startNumber: 8, useDate: true }]);
  const stamp = numberPeriod().stamp;
  assert.equal((await actions.createDocument(f.input)).document.documentNo, `PO-${stamp}-008`);
  f.settings[0].currentYear = 2000;
  // A current-month number exists already, so it is skipped even after a reset.
  assert.equal((await actions.createDocument(f.input)).document.documentNo, `PO-${stamp}-009`);
  f.settings[0].currentYear = 2000;
  f.docs.length = 0;
  assert.equal((await actions.createDocument(f.input)).document.documentNo, `PO-${stamp}-001`);
});

test('settings reject invalid input and unauthorized company; counters are scoped by company', async () => {
  const f = fixture();
  const actions = load('app/actions/documents.ts', f.prisma);
  const config = { documentTypeId: 'type', prefix: 'PO', digits: 4, startNumber: 1, useDate: false };
  assert.equal((await actions.saveDocumentNumberSettings({ ...f.input, companyId: f.otherCompanyId }, [config])).success, false);
  assert.equal((await actions.saveDocumentNumberSettings(f.input, [{ ...config, documentTypeId: 'foreign-type' }])).success, false);
  for (const invalid of [{ prefix: '' }, { digits: 0 }, { startNumber: -1 }, { startNumber: 1.5 }]) {
    assert.equal((await actions.saveDocumentNumberSettings(f.input, [{ ...config, ...invalid }])).success, false);
  }
  f.settings.push({ companyId: f.otherCompanyId, documentTypeId: 'type', prefix: 'FOREIGN', padding: 4, runningNumber: 200, resetMode: 'NEVER' });
  await actions.saveDocumentNumberSettings(f.input, [config]);
  assert.equal((await actions.createDocument(f.input)).document.documentNo, 'PO0001');
  assert.equal(f.settings[0].runningNumber, 200);
  assert.ok((await actions.getDocumentNumberSettings(f.input)).every(row => row.prefix !== 'FOREIGN'));
});

test('transaction conflicts retry and persistent conflicts report failure', async () => {
  const f = fixture();
  const actions = load('app/actions/documents.ts', f.prisma);
  let attempts = 0;
  f.prisma.$transaction = async fn => {
    attempts++;
    if (attempts === 1) throw { code: 'P2034' };
    return fn(f.prisma);
  };
  assert.equal((await actions.createDocument(f.input)).success, true);
  assert.equal(attempts, 2);
  f.prisma.$transaction = async () => { throw { code: 'P2034' }; };
  assert.equal((await actions.createDocument(f.input)).success, false);
  assert.equal(f.docs.length, 1);
});

test('quotation detail and print show submitted document, filter templates and honor standard override', async () => {
  const { renderToStaticMarkup } = require('react-dom/server');
  const document = {
    id: 'quotation', companyId: 'company', documentTypeId: 'qt', documentNo: 'QT-202609-0001',
    title: 'ใบเสนอราคา - ลูกค้า', status: 'PENDING', createdAt: new Date(), updatedAt: new Date(),
    documentType: { name: 'ใบเสนอราคา' }, category: { name: 'บัญชี' },
    company: { name: 'บริษัททดสอบ' }, createdBy: { name: 'ผู้จัดทำ' },
    templateId: null, dataJson: { partnerName: 'ลูกค้าทดสอบ', date: '2026-09-12', dueDate: '2026-09-13', quotation_refNo: 'REF123',
      items: [{ name: 'สินค้า A', qty: 2, unit: 'ชิ้น', unitPrice: 6000 }], subtotal: 12000, discountAmount: 0, afterDiscount: 12000, vatAmount: 840, grandTotal: 12840 },
  };
  const templates = [{ id: 'saved-template', layoutJson: { pages: [{}], elements: [{}] } }];
  const prisma = { document: { findUnique: async () => document }, documentTemplate: { findMany: async ({ where }) => {
    assert.equal(where.documentTypeId, 'qt');
    assert.equal(where.OR[0].companyId, 'company');
    return templates;
  } } };
  const Page = load('app/(dashboard)/documents/[id]/page.tsx', prisma).default;
  for (const searchParams of [{}, { preview: 'true' }, { print: 'true' }]) {
    const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ id: 'quotation' }), searchParams: Promise.resolve(searchParams) }));
    for (const text of ['ใบเสนอราคา', 'ลูกค้าทดสอบ', 'สินค้า A', '12,840.00', 'REF123', 'QT-202609-0001']) assert.ok(html.includes(text), text);
    assert.ok(!html.includes('quotation_refNo'));
  }
  document.templateId = 'saved-template';
  const designer = renderToStaticMarkup(await Page({ params: Promise.resolve({ id: 'quotation' }), searchParams: Promise.resolve({}) }));
  assert.ok(designer.includes('Saved design: ลูกค้าทดสอบ'));
  const standard = renderToStaticMarkup(await Page({ params: Promise.resolve({ id: 'quotation' }), searchParams: Promise.resolve({ templateId: '' }) }));
  assert.ok(standard.includes('สินค้า A'));
  assert.ok(!standard.includes('Saved design:'));
  document.isLocked = true;
  document.dataJson.submitterSignature = { image: 'data:image/png;base64,TEST', name: 'ผู้ยื่นเอกสาร', signedAt: '2026-09-11T10:00:00Z', templateId: null, layoutSnapshot: null };
  document.dataJson.electronicSignature = { image: 'data:image/png;base64,TEST', name: 'ผู้ลงนาม', signedAt: '2026-09-12T10:00:00Z', templateId: null, layoutSnapshot: null };
  const signed = renderToStaticMarkup(await Page({ params: Promise.resolve({ id: 'quotation' }), searchParams: Promise.resolve({ preview: 'true' }) }));
  assert.ok(signed.includes('ลายเซ็นผู้ยื่นขออนุมัติ'));
  assert.ok(signed.includes('ผู้ยื่นเอกสาร'));
  assert.ok(signed.includes('ลายเซ็นผู้อนุมัติสั่งซื้อ'));
  assert.ok(signed.includes('ผู้ลงนาม'));
  assert.ok(!signed.includes('บันทึกการลงนามออนไลน์'));
});


test('signed documents reject editing and forged signatures are removed from input', async () => {
  const f = fixture(); const actions = load('app/actions/documents.ts', f.prisma);
  const saved = await actions.createDocument({ ...f.input, dataJson: JSON.stringify({ electronicSignature: { name: 'fake' }, submitterSignature: { name: 'fake submitter' }, approvalSubmittedAt: 'fake', items: [] }) });
  assert.equal(saved.document.dataJson.electronicSignature, undefined);
  assert.equal(saved.document.dataJson.submitterSignature, undefined);
  assert.equal(saved.document.dataJson.approvalSubmittedAt, undefined);
  f.docs[0].isLocked = true;
  assert.equal((await actions.updateDocument(saved.document.id, f.input)).success, false);
});

test('signature digest is stable and changes when content or design changes', () => {
  const { documentDigest, validateSignatureImage } = load('lib/document-signature.ts');
  const doc = { title: 'ใบเสนอราคา', documentNo: 'QT-1', documentTypeId: 'qt', templateId: null, dataJson: { amount: 100, name: 'A' } };
  assert.equal(documentDigest(doc, null), documentDigest({ ...doc, dataJson: { name: 'A', amount: 100, electronicSignature: {}, submitterSignature: {} } }, null));
  assert.notEqual(documentDigest(doc, null), documentDigest({ ...doc, dataJson: { amount: 200 } }, null));
  assert.notEqual(documentDigest(doc, null), documentDigest(doc, { pages: [1] }));
  assert.throws(() => validateSignatureImage('data:image/svg+xml,malicious'));
});

test('online signing verifies password, consent and document version, then locks and audits the snapshot', async () => {
  const f = fixture();
  f.user.name = 'Test Signer';
  f.user.passwordHash = require('bcryptjs').hashSync('test-pass', 4);
  const version = new Date('2026-09-11T10:00:00Z');
  const doc = { id: 'signable', companyId: f.companyId, documentTypeId: 'type', documentNo: 'QT-1', title: 'Test', dataJson: { items: [] }, status: 'APPROVED', isLocked: false, updatedAt: version };
  f.docs.push(doc);
  const audit = [];
  f.prisma.auditLog = { create: async ({ data }) => { audit.push(data); return data; } };
  const bytes = Buffer.alloc(120); Buffer.from([137,80,78,71,13,10,26,10]).copy(bytes); bytes.writeUInt32BE(800, 16); bytes.writeUInt32BE(320, 20);
  const input = { ...f.input, documentId: doc.id, version: version.toISOString(), image: 'data:image/png;base64,' + bytes.toString('base64'), password: 'test-pass', consent: true, templateId: '' };
  const actions = load('app/actions/document-signing.ts', f.prisma);
  for (const invalid of [{ password: 'wrong' }, { consent: false }, { version: 'old' }, { companyId: f.otherCompanyId }]) {
    assert.equal((await actions.signDocument({ ...input, ...invalid })).success, false);
  }
  assert.equal((await actions.signDocument(input)).success, true);
  assert.equal(doc.isLocked, true);
  assert.equal(doc.dataJson.electronicSignature.name, 'Test Signer');
  assert.equal(doc.dataJson.electronicSignature.hash.length, 64);
  assert.equal(audit.length, 1);
  assert.equal((await actions.signDocument(input)).success, false);
});

test('requester signs before submission, then can send the document into approval without locking it', async () => {
  const f = fixture();
  f.user.name = 'Document Requester';
  f.user.passwordHash = require('bcryptjs').hashSync('test-pass', 4);
  const version = new Date('2026-09-11T11:00:00Z');
  const doc = { id: 'submitted', companyId: f.companyId, createdById: f.user.id, documentTypeId: 'type', documentNo: 'QT-2', title: 'Submitted', dataJson: { items: [] }, status: 'DRAFT', isLocked: false, updatedAt: version };
  f.docs.push(doc);
  const audit = [];
  f.prisma.auditLog = { create: async ({ data }) => { audit.push(data); return data; } };
  const bytes = Buffer.alloc(120); Buffer.from([137,80,78,71,13,10,26,10]).copy(bytes); bytes.writeUInt32BE(800, 16); bytes.writeUInt32BE(320, 20);
  const input = { ...f.input, documentId: doc.id, version: version.toISOString(), image: 'data:image/png;base64,' + bytes.toString('base64'), password: 'test-pass', consent: true, templateId: '', signatureRole: 'submitter' };
  const actions = load('app/actions/document-signing.ts', f.prisma);
  assert.equal((await actions.signDocument(input)).success, true);
  assert.equal(doc.isLocked, false);
  assert.equal(doc.status, 'DRAFT');
  assert.equal(doc.dataJson.submitterSignature.name, 'Document Requester');
  assert.equal(doc.dataJson.electronicSignature, undefined);
  assert.equal(audit[0].action, 'DOCUMENT_SUBMITTER_SIGNED');
  assert.equal((await actions.signDocument(input)).success, false);
  const documentActions = load('app/actions/documents.ts', f.prisma);
  assert.equal((await documentActions.submitDocument(doc.id, f.input)).success, true);
  assert.equal(doc.status, 'PENDING');
  assert.ok(doc.dataJson.approvalSubmittedAt);
  assert.equal((await documentActions.submitDocument(doc.id, f.input)).success, false);
});

test('legacy pending document signed by its creator can be submitted with the new workflow', async () => {
  const f = fixture();
  const legacySignature = { userId: f.user.id, name: 'Legacy Requester', image: 'data:image/png;base64,TEST' };
  const doc = { id: 'legacy-signed', companyId: f.companyId, createdById: f.user.id, status: 'PENDING', isLocked: true, dataJson: { items: [], electronicSignature: legacySignature } };
  f.docs.push(doc);
  const actions = load('app/actions/documents.ts', f.prisma);
  assert.equal((await actions.submitDocument(doc.id, f.input)).success, true);
  assert.equal(doc.isLocked, false);
  assert.equal(doc.dataJson.electronicSignature, undefined);
  assert.equal(doc.dataJson.submitterSignature.userId, f.user.id);
  assert.ok(doc.dataJson.approvalSubmittedAt);
});


test('creation options follow active company and distinguish default global categories from explicitly disabled categories', async () => {
  const f = fixture();
  let settings = {};
  f.prisma.company = { findUnique: async ({ where }) => { assert.equal(where.id, f.companyId); return { settings }; } };
  const categories = [{ id: 'own', companyId: f.companyId, isActive: true, isGlobal: false }, { id: 'global', isActive: true, isGlobal: true }, { id: 'foreign', companyId: f.otherCompanyId, isActive: true, isGlobal: false }];
  f.prisma.documentCategory.findMany = async ({ where }) => {
    assert.equal(where.isActive, true);
    return categories.filter(c => c.companyId === where.OR[0].companyId || c.isGlobal && (!where.OR[1].id || where.OR[1].id.in.includes(c.id)));
  };
  f.prisma.documentType.findMany = async ({ where }) => {
    assert.equal(where.OR[0].companyId, f.companyId);
    assert.equal(where.isActive, true);
    return where.categoryId.in.map(id => ({ id: 'type-' + id, categoryId: id }));
  };
  f.prisma.documentTemplate.findMany = async ({ where }) => {
    assert.equal(where.OR[0].companyId, f.companyId);
    assert.equal(where.isActive, true);
    return where.documentTypeId.in.map(id => ({ id: 'template-' + id, documentTypeId: id }));
  };
  const actions = load('app/actions/documents.ts', f.prisma);
  const initial = await actions.getDocumentFormOptions(f.input);
  assert.equal(initial.categories.map(c => c.id).join(','), 'own,global');
  assert.equal(initial.templates.length, 2);
  settings = { enabledGlobalCategoryIds: [] };
  const disabled = await actions.getDocumentFormOptions(f.input);
  assert.equal(disabled.categories.map(c => c.id).join(','), 'own');
  assert.equal(disabled.documentTypes.length, 1);
  await assert.rejects(() => actions.getDocumentFormOptions({ ...f.input, companyId: f.otherCompanyId }));
});
