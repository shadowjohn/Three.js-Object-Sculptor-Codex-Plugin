import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

import { createSculptRuntime, validateSculptAsset } from '../../runtime/SculptRuntime.js';


test('creates stable runtime maps', () => {
  const root = new THREE.Group();
  const runtime = createSculptRuntime(root, { assetId: 'table' });
  assert.equal(root.userData.sculptRuntime, runtime);
  assert.equal(runtime.schemaVersion, '1.0');
  assert.deepEqual(Object.keys(runtime.sockets), []);
  assert.deepEqual(validateSculptAsset(root), []);
});

test('rejects affordance with a missing socket', () => {
  const root = new THREE.Group();
  createSculptRuntime(root, {
    assetId: 'chair',
    affordances: { sit: { targetSocket: 'seat' } },
  });
  assert.deepEqual(validateSculptAsset(root), [
    'affordance sit references missing socket seat',
  ]);
});

test('rejects broken articulation and action-program references deterministically', () => {
  const root = new THREE.Group();
  createSculptRuntime(root, {
    assetId: 'car',
    articulation: { door: { node: 'leftDoor', axis: [0, 2, 0] } },
    affordances: { enter: { targetSocket: 'seat', actionProgram: 'enter-car' } },
  });
  assert.deepEqual(validateSculptAsset(root), [
    'articulation door references missing node leftDoor',
    'articulation door axis must be normalized',
    'affordance enter references missing socket seat',
    'affordance enter references missing action program enter-car',
  ]);
});

test('rejects missing runtime contract', () => {
  assert.deepEqual(validateSculptAsset(new THREE.Group()), [
    'asset is missing sculptRuntime',
  ]);
});
