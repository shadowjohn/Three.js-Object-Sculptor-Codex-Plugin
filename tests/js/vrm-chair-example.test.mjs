import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';


test('VRM chair demo is URL-driven and exposes enter, exit, move, reset controls', async () => {
  const html = await readFile('examples/vrm-chair.html', 'utf8');
  const source = await readFile('examples/js/vrm-chair-demo.js', 'utf8');
  for (const id of ['enterButton', 'exitButton', 'moveButton', 'resetButton', 'status']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(source, /searchParams\.get\('vrm'\)/);
  assert.match(source, /new VRMLoaderPlugin/);
  assert.match(source, /new VRMAffordanceAdapter/);
  assert.match(source, /adapter\.enter\('sit'\)/);
  assert.match(source, /adapter\.exit\(\)/);
  assert.match(source, /missing vrm query parameter/);
});
