import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';


test('VRM chair demo is URL-driven and exposes enter, exit, move, reset controls', async () => {
  const html = await readFile('examples/vrm-chair.html', 'utf8');
  const source = await readFile('examples/js/vrm-chair-demo.js', 'utf8');
  for (const id of ['enterButton', 'exitButton', 'moveButton', 'resetButton', 'zOffset', 'zOffsetValue', 'thighAngle', 'thighAngleValue', 'status']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(source, /searchParams\.get\('vrm'\)/);
  assert.match(source, /searchParams\.get\('z'\)/);
  assert.match(source, /searchParams\.get\('thigh'\)/);
  assert.match(source, /new VRMLoaderPlugin/);
  assert.match(source, /VRMUtils\.rotateVRM0\(vrm\)/);
  assert.match(source, /width: 0\.31/);
  assert.match(source, /depth: 0\.29/);
  assert.match(source, /backHeight: 0\.31/);
  assert.doesNotMatch(source, /chair\.scale/);
  assert.match(source, /normalizedPoseXSign\(vrm\.scene\)/);
  assert.match(source, /angle \* poseXSign/);
  assert.match(source, /new VRMAffordanceAdapter/);
  assert.match(source, /adapter\.enter\('sit'\)/);
  assert.match(source, /adapter\.exit\(\)/);
  assert.match(source, /zOffset\.addEventListener\('input'/);
  assert.match(html, /id="zOffset"[^>]+value="0\.1"/);
  assert.match(html, /id="zOffsetValue">\+0\.100 m/);
  assert.match(source, /let zOffsetValue = Number\(zOffset\.value\)/);
  assert.match(source, /zOffset\.value = String\(zOffsetValue\)/);
  assert.match(source, /vrm\.scene\.position\.y = seatedBaseY \+ zOffsetValue/);
  assert.match(source, /thighAngle\.addEventListener\('input'/);
  assert.match(source, /THREE\.MathUtils\.degToRad\(thighAngleDegrees\)/);
  assert.match(source, /node\.quaternion\.copy\(savedPose\.get\(node\)\)/);
  assert.match(source, /missing vrm query parameter/);
});
