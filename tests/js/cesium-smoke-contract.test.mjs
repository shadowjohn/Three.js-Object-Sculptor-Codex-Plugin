import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';


test('Cesium car smoke uses 3WA runtime and manifest placement contract', async () => {
  const php = await readFile('examples/cesium-car/index.php', 'utf8').catch(() => '');
  const source = await readFile('examples/cesium-car/js/app.js', 'utf8').catch(() => '');
  assert.ok(php.indexOf('window.CESIUM_BASE_URL') < php.indexOf('Cesium.js'));
  assert.match(php, /Cesium-1\.141/);
  assert.match(source, /Cesium\.Model\.fromGltfAsync/);
  assert.match(source, /Cesium\.Cartesian3\.fromDegrees/);
  assert.match(source, /Cesium\.Transforms\.headingPitchRollQuaternion/);
  assert.match(source, /manifest\.units/);
  assert.match(source, /manifest\.origin/);
  assert.match(source, /LOAD_FAILED/);
});
