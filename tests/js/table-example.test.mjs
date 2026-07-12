import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';


test('table example exposes zero-token quality controls and disposal', async () => {
  const html = await readFile('examples/table.html', 'utf8');
  for (const id of ['detail', 'geometryQuality', 'materialQuality']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /createTable\(/);
  assert.match(html, /geometry\?\.dispose\(\)/);
  assert.match(html, /material\?\.dispose\(\)/);
  assert.match(html, /renderer\.info\.render\.triangles/);
});
