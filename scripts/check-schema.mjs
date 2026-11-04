// Validates src/template-internet-day/schema.json against the schema checklist of the spec.
// Usage: npm run check:schema
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const schemaPath = fileURLToPath(new URL('../src/template-internet-day/schema.json', import.meta.url));
const ROOT_KEYS = ['name', 'version', 'author', 'language', 'defaultData', 'editable'];
const FIELD_TYPES = new Set([
  'block', 'text', 'textarea', 'number', 'toggle', 'select', 'color',
  'image', 'url', 'email', 'tel', 'code', 'repeater',
]);

const errors = [];
const fail = (msg) => errors.push(msg);
const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);

let schema;
try {
  schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
} catch (e) {
  console.error(`schema.json is not valid JSON: ${e.message}`);
  process.exit(1);
}

// AC-16
const keys = Object.keys(schema);
for (const k of ROOT_KEYS) if (!keys.includes(k)) fail(`missing root key "${k}"`);
for (const k of keys) if (!ROOT_KEYS.includes(k)) fail(`unexpected root key "${k}"`);
if (JSON.stringify(schema.language) !== '["vi","en"]') fail('language must be ["vi", "en"]');
const data = schema.defaultData ?? {};
if (data.customCSS !== '') fail('defaultData.customCSS must exist and be an empty string');
for (const k of ['title', 'description', 'icon']) {
  if (!(k in (data.metadata ?? {}))) fail(`defaultData.metadata.${k} is missing`);
}
// Every editable label must be English (admin UI); a quick check for Vietnamese diacritics.
JSON.stringify(schema.editable).replace(/"label":"([^"]*)"/g, (_, label) => {
  if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(label)) fail(`editable label "${label}" should be English`);
  return '';
});

// AC-17: same key tree in both directions, only allowed field types.
function compare(value, node, path) {
  if (!isObject(node)) return fail(`editable${path} must be an object`);
  if (!FIELD_TYPES.has(node.type)) fail(`editable${path}.type "${node.type}" is not an allowed field type`);
  if (typeof node.label !== 'string' || !node.label) fail(`editable${path}.label is missing`);

  if (node.type === 'repeater') {
    if (!Array.isArray(value)) return fail(`defaultData${path} must be an array (repeater)`);
    if (!isObject(node.fields)) return fail(`editable${path}.fields is missing`);
    value.forEach((item, i) => compareChildren(item, node.fields, `${path}[${i}]`));
    return;
  }
  if (node.type === 'block') {
    if (!isObject(value)) return fail(`defaultData${path} must be an object (block)`);
    if (!isObject(node.fields)) return fail(`editable${path}.fields is missing`);
    compareChildren(value, node.fields, path);
    // AC-18: bilingual block must have both vi and en text.
    if ('vi' in value || 'en' in value) {
      for (const lang of ['vi', 'en']) {
        if (typeof value[lang] !== 'string' || !value[lang].trim()) fail(`defaultData${path}.${lang} is empty`);
      }
    }
    return;
  }
  if (isObject(value) || Array.isArray(value)) fail(`defaultData${path} is nested but editable type is "${node.type}"`);
  if (node.type === 'image' && typeof value === 'string' && !value) fail(`defaultData${path} image is empty`);
  if (node.type === 'color' && !/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(value)) fail(`defaultData${path} is not a hex color`);
  if (node.type === 'toggle' && typeof value !== 'boolean') fail(`defaultData${path} must be true/false`);
  if (node.type === 'code' && path === '.customCSS' && node.language !== 'css') fail('customCSS must declare language "css"');
}

function compareChildren(value, editableChildren, path) {
  if (!isObject(value)) return fail(`defaultData${path} must be an object`);
  for (const k of Object.keys(value)) {
    if (!(k in editableChildren)) fail(`editable${path}.${k} is missing`);
  }
  for (const k of Object.keys(editableChildren)) {
    if (!(k in value)) fail(`defaultData${path}.${k} is missing`);
    else compare(value[k], editableChildren[k], `${path}.${k}`);
  }
}

compareChildren(data, schema.editable ?? {}, '');

// AC-18: minimum content.
const required = [
  'Hero.bannerDesktop', 'Hero.logo',
  'Hero.title', 'Hero.time', 'Hero.location', 'Hero.description',
  'Form.termsText', 'Confirmation.thankYouTitle',
  'Theme.primaryColor', 'Theme.backgroundColor',
  'Form.showDiscount', 'Form.showCompany', 'Form.showPosition',
];
for (const p of required) {
  const v = p.split('.').reduce((acc, k) => (acc == null ? undefined : acc[k]), data);
  if (v === undefined) fail(`required content "${p}" is missing`);
}

if (errors.length) {
  console.error(`schema.json: ${errors.length} problem(s)\n - ${errors.join('\n - ')}`);
  process.exit(1);
}
console.log('schema.json OK: root keys, key-tree parity, field types and bilingual text all valid.');
