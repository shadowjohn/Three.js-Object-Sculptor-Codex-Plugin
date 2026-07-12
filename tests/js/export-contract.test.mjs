import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { createTable } from '../../generators/createTable.js';
import { cloneSculptAssetForExport } from '../../runtime/exportSculptAsset.js';


test('exporter uses binary GLTFExporter and excludes debug helpers from a clone', async () => {
  const source = await readFile('runtime/exportSculptAsset.js', 'utf8');
  assert.match(source, /new GLTFExporter\(\)/);
  assert.match(source, /root\.clone\(true\)/);
  assert.match(source, /binary: true/);
  assert.match(source, /userData\.exportable/);
  assert.match(source, /excluded\.forEach/);
  assert.match(source, /instanceof ArrayBuffer/);
});

test('export example reloads before enabling download', async () => {
  const html = await readFile('examples/export-table.html', 'utf8');
  assert.match(html, /exportAsset: exportSculptAsset/);
  assert.match(html, /loader\.parse\(/);
  assert.match(html, /getObjectByName\('top'\)/);
  assert.match(html, /EXPORT_OK/);
  assert.match(html, /downloadButton\.disabled = false/);
  assert.match(html, /exportAssetPackage\(/);
  assert.match(html, /asset-manifest\.json/);
  assert.match(html, /recipe\.json/);
});

test('export clone strips circular runtime metadata without mutating source', () => {
  const table = createTable({ id: 'table-export' });
  const runtime = table.userData.sculptRuntime;
  const debug = table.userData.sculptRuntime.sockets['surface-top'];
  debug.userData.exportable = false;
  const clone = cloneSculptAssetForExport(table);
  assert.equal(table.userData.sculptRuntime, runtime);
  assert.equal(clone.userData.sculptRuntime, undefined);
  assert.equal(clone.getObjectByName('surface-top'), undefined);
});
