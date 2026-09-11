const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function compile(file, imports) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, { exports, require: imports, console, alert() {} });
  return exports;
}
function form(data = {}, typeName = 'ใบสำคัญจ่าย') {
  let cursor = 0, tree, saved, pending;
  const states = [];
  const save = async (...args) => { saved = args.at(-1); return { success: true, document: { id: 'saved' } }; };
  const Form = compile('app/(dashboard)/documents/create/CreateDocumentForm.tsx', id => {
    if (id === '@/lib/document-form-validation') return compile('lib/document-form-validation.ts', require);
    if (id === 'react') return {
      useState(initial) {
        const index = cursor++;
        if (!(index in states)) states[index] = initial;
        return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
      },
      useEffect() {},
      useTransition: () => [false, fn => { pending = fn(); }],
    };
    if (id === 'react/jsx-runtime' || id === 'lucide-react') return require(id);
    if (id === 'next/navigation') return { useRouter: () => ({ refresh() {}, push() {} }) };
    if (id.endsWith('LanguageContext')) return { useLanguage: () => ({ t: { createDocument: {}, common: {} } }) };
    if (id.endsWith('document-actor')) return { getDocumentActor: () => ({ companyId: 'company' }) };
    if (id === '@/app/actions/documents') return { createDocument: save, updateDocument: save };
    return {};
  }).default;
  const props = { folders: [], tags: [], categories: [{ id: 'cat' }], templates: [],
    documentTypes: [{ id: 'pv', categoryId: 'cat', name: typeName }],
    initialData: { id: 'doc', categoryId: 'cat', documentTypeId: 'pv', dataJson: data } };
  const render = () => { cursor = 0; tree = Form(props); };
  function nodes(node) {
    if (!node || typeof node !== 'object') return [];
    if (Array.isArray(node)) return node.flatMap(nodes);
    return [node, ...nodes(node.props?.children ?? null)];
  }
  render();
  return {
    find: predicate => nodes(tree).find(predicate),
    rows: () => nodes(tree).filter(n => n.type === 'tr' && nodes(n).some(x => x.type === 'input')),
    inputs: row => nodes(row).filter(n => n.type === 'input'),
    change(node, value) { node.props.onChange({ target: { value } }); render(); },
    click(node) { node.props.onClick(); render(); },
    async save() { tree.props.onSubmit({ preventDefault() {}, currentTarget: { querySelectorAll: () => [], reportValidity: () => true } }); await pending; return saved; },
  };
}

test('payment rows add, edit, remove and save computed totals for preview', async () => {
  const f = form({ hasVat: true, discountPercent: 10, pv_taxAmount: '30' });
  assert.equal(f.rows().length, 1);
  let inputs = f.inputs(f.rows()[0]);
  assert.equal(inputs[3].props.placeholder, '0');
  f.change(inputs[3], '');
  assert.equal(f.inputs(f.rows()[0])[3].props.value, '');
  f.change(f.inputs(f.rows()[0])[0], 'ค่าบริการ');
  f.change(f.inputs(f.rows()[0])[1], '2');
  f.change(f.inputs(f.rows()[0])[3], '500');
  const add = () => f.find(n => n.type === 'button' && n.props.children?.includes?.(' เพิ่มรายการ'));
  f.click(add());
  f.change(f.inputs(f.rows()[1])[0], 'ค่าอุปกรณ์');
  f.change(f.inputs(f.rows()[1])[3], '200');
  f.click(add());
  assert.equal(f.rows().length, 3);
  f.click(f.find(n => n.props?.['aria-label'] === 'ลบรายการที่ 3'));
  assert.equal(f.rows().length, 2);
  const saved = await f.save();
  const data = JSON.parse(saved.dataJson);
  assert.equal(data.items.length, 2);
  assert.equal(data.subtotal, 1200);
  assert.equal(data.discountAmount, 120);
  assert.equal(saved.vatSatang, 7560);
  assert.equal(saved.totalSatang, 112560);
  assert.equal(data.pv_grandTotal, data.grandTotal);
  const { mapDocumentToTemplateData } = compile('lib/template-data-mapping.ts', require);
  const preview = mapDocumentToTemplateData({ dataJson: saved.dataJson });
  assert.equal(preview.items[0].description, 'ค่าบริการ');
  assert.equal(preview.items[0].amount, 1000);
  assert.equal(preview.net_amount, '1,125.60');
  const reopened = form(data);
  assert.equal(reopened.rows().length, 2);
  assert.equal((await reopened.save()).totalSatang, saved.totalSatang);
});

test('legacy payment text and amount survive opening and saving as table', async () => {
  const f = form({ pv_itemsText: '1 | ค่าบริการ | 5000', pv_subTotal: '5000', pv_taxAmount: '150', hasVat: true,
    items: [{ name: '', qty: 1, unit: 'ชิ้น', unitPrice: '' }] });
  assert.equal(f.inputs(f.rows()[0])[0].props.value, '1 | ค่าบริการ | 5000');
  assert.equal((await f.save()).totalSatang, 485000);
});




test('quotation table calculates, saves and reopens rows with customer and payment terms', async () => {
  const f = form({ quotation_customerName: 'ลูกค้าทดสอบ', quotation_paymentTerms: 'มัดจำ 50%', hasVat: true, discountPercent: 10 }, 'ใบเสนอราคา');
  assert.equal(f.rows().length, 1);
  assert.equal(f.inputs(f.rows()[0])[3].props.placeholder, '0');
  f.change(f.inputs(f.rows()[0])[0], 'ค่าบริการ');
  f.change(f.inputs(f.rows()[0])[1], '2');
  f.change(f.inputs(f.rows()[0])[3], '1000');
  f.click(f.find(n => n.type === 'button' && n.props.children?.includes?.(' เพิ่มรายการ')));
  f.change(f.inputs(f.rows()[1])[3], '500');
  f.click(f.find(n => n.props?.['aria-label'] === 'ลบรายการที่ 2'));
  const saved = await f.save();
  assert.equal(saved.totalSatang, 192600);
  const data = JSON.parse(saved.dataJson);
  assert.equal(data.quotation_subTotal, 2000);
  assert.equal(Math.round(data.quotation_vat * 100), 12600);
  assert.equal(data.quotation_paymentTerms, 'มัดจำ 50%');
  assert.equal(data.partnerName, 'ลูกค้าทดสอบ');
  const reopened = form(data, 'ใบเสนอราคา');
  assert.equal(reopened.rows().length, 1);
  assert.equal((await reopened.save()).totalSatang, saved.totalSatang);
  const { mapDocumentToTemplateData } = compile('lib/template-data-mapping.ts', require);
  const preview = mapDocumentToTemplateData({ dataJson: saved.dataJson });
  assert.equal(preview.items[0].name, 'ค่าบริการ');
  assert.equal(preview.total_amount, '1,926.00');
});

test('legacy quotation keeps free text without treating subtotal as unit price', async () => {
  const f = form({ quotation_itemsText: 'บริการออกแบบเว็บไซต์', quotation_subTotal: '2000', quotation_vat: '140', quotation_paymentTerms: '30 วัน' }, 'ใบเสนอราคา');
  assert.equal(f.inputs(f.rows()[0])[0].props.value, 'บริการออกแบบเว็บไซต์');
  const saved = await f.save();
  assert.equal(f.inputs(f.rows()[0])[3].props.value, '');
  assert.equal(f.inputs(f.rows()[0])[3].props.placeholder, '0');
  assert.equal(saved.totalSatang, 0);
  assert.equal(JSON.parse(saved.dataJson).quotation_paymentTerms, '30 วัน');
});



test('quotation with only a legacy subtotal starts with an empty price; saved row prices remain intact', async () => {
  const empty = form({ quotation_subTotal: '2000', items: [{ name: '', qty: 1, unit: 'ชิ้น', unitPrice: '' }] }, 'ใบเสนอราคา');
  assert.equal(empty.inputs(empty.rows()[0])[3].props.value, '');
  empty.change(empty.inputs(empty.rows()[0])[3], '47');
  assert.equal(empty.inputs(empty.rows()[0])[3].props.value, '47');
  const saved = JSON.parse((await empty.save()).dataJson);
  const reopened = form(saved, 'ใบเสนอราคา');
  assert.equal(reopened.inputs(reopened.rows()[0])[3].props.value, '47');
  const existing = form({ quotation_subTotal: '2000', items: [{ name: 'สินค้า', qty: 2, unit: 'ชิ้น', unitPrice: '350' }] }, 'ใบเสนอราคา');
  assert.equal(existing.inputs(existing.rows()[0])[3].props.value, '350');
});



function validationField(value, options = {}) {
  return { value, type: 'text', required: false, disabled: false, readOnly: false, message: '',
    getClientRects: () => [1], setCustomValidity(message) { this.message = message; }, ...options };
}
test('document validation rejects blank and whitespace fields; placeholder zero is not a value', () => {
  const { validateDocumentFields } = compile('lib/document-form-validation.ts', require);
  const fields = [validationField('   '), validationField('', { type: 'number', placeholder: '0' }), validationField('')];
  const form = { querySelectorAll: () => fields, reportValidity: () => fields.every(f => !f.message) };
  assert.equal(validateDocumentFields(form), false);
  assert.ok(fields.every(f => f.required && f.message));
  fields[0].value = 'สินค้า'; fields[1].value = '0'; fields[2].value = '-';
  assert.equal(validateDocumentFields(form), true);
});

test('document validation skips automatic totals and inactive fields, preserves native validity', () => {
  const { validateDocumentFields } = compile('lib/document-form-validation.ts', require);
  const fields = [validationField('', { readOnly: true }), validationField('', { disabled: true }),
    validationField('', { type: 'checkbox' }), validationField('', { getClientRects: () => [] })];
  assert.equal(validateDocumentFields({ querySelectorAll: () => fields, reportValidity: () => true }), true);
  assert.ok(fields.every(f => !f.required && !f.message));
  assert.equal(validateDocumentFields({ querySelectorAll: () => [validationField('bad-email', { type: 'email' })], reportValidity: () => false }), false);
});

test('optional remarks may be blank and clear earlier required errors while other fields remain required', () => {
  const { validateDocumentFields } = compile('lib/document-form-validation.ts', require);
  const remarks = validationField('', { dataset: { optional: 'true' }, required: true, message: 'กรุณากรอกข้อมูล' });
  const name = validationField('');
  const form = { querySelectorAll: () => [remarks, name], reportValidity: () => !remarks.message && !name.message };
  assert.equal(validateDocumentFields(form), false);
  assert.equal(remarks.required, false);
  assert.equal(remarks.message, '');
  assert.equal(name.required, true);
  name.value = 'สินค้า';
  assert.equal(validateDocumentFields(form), true);
});
