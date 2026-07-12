import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

import { createSculptRuntime } from '../../runtime/SculptRuntime.js';
import { attachSculptAsset } from '../../runtime/VRMAttachmentAdapter.js';


function pistol() {
  const asset = new THREE.Group();
  const grip = new THREE.Group();
  grip.name = 'grip';
  grip.position.set(0, 0.2, 0);
  asset.add(grip);
  createSculptRuntime(asset, {
    assetId: 'pistol',
    sockets: { grip },
    metadata: { referenceSize: { avatarHeight: 1.8, headWidth: 0.2, handLength: 0.18 } },
  });
  return asset;
}


test('attaches grip socket to normalized rightHand', () => {
  const rightHand = new THREE.Group();
  const vrm = { humanoid: { getNormalizedBoneNode: name => name === 'rightHand' ? rightHand : null } };
  const asset = pistol();
  const handle = attachSculptAsset(vrm, asset, {
    bone: 'rightHand', socket: 'grip', scaleMode: 'fixed', offset: [0, 0, 0],
  });
  assert.equal(asset.parent, rightHand);
  assert.deepEqual(handle.getWorldSocket('grip').toArray(), [0, 0, 0]);
});

test('missing bone fails without moving the asset', () => {
  const originalParent = new THREE.Group();
  const asset = pistol();
  originalParent.add(asset);
  assert.throws(
    () => attachSculptAsset({ humanoid: {} }, asset, { bone: 'head' }),
    /normalized bone head/,
  );
  assert.equal(asset.parent, originalParent);
});

test('missing socket fails before reparenting', () => {
  const originalParent = new THREE.Group();
  const hand = new THREE.Group();
  const asset = pistol();
  originalParent.add(asset);
  const vrm = { humanoid: { getRawBoneNode: () => hand } };
  assert.throws(() => attachSculptAsset(vrm, asset, { bone: 'rightHand', socket: 'missing' }), /socket missing/);
  assert.equal(asset.parent, originalParent);
});

test('avatar-height scale mode uses explicit measurements', () => {
  const hand = new THREE.Group();
  const asset = pistol();
  attachSculptAsset({ humanoid: { getNormalizedBoneNode: () => hand } }, asset, {
    bone: 'rightHand', socket: 'grip', scaleMode: 'avatar-height', measurements: { avatarHeight: 0.9 },
  });
  assert.deepEqual(asset.scale.toArray(), [0.5, 0.5, 0.5]);
});

test('handle detaches, toggles visibility, and disposes geometry', () => {
  const parent = new THREE.Group();
  const hand = new THREE.Group();
  const asset = pistol();
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshBasicMaterial();
  let geometryDisposed = false;
  let materialDisposed = false;
  geometry.dispose = () => { geometryDisposed = true; };
  material.dispose = () => { materialDisposed = true; };
  asset.add(new THREE.Mesh(geometry, material));
  parent.add(asset);
  const handle = attachSculptAsset({ humanoid: { getNormalizedBoneNode: () => hand } }, asset, {
    bone: 'rightHand', socket: 'grip', scaleMode: 'fixed',
  });
  handle.setVisible(false);
  assert.equal(asset.visible, false);
  handle.detach();
  assert.equal(asset.parent, parent);
  handle.dispose();
  assert.equal(asset.parent, null);
  assert.equal(geometryDisposed, true);
  assert.equal(materialDisposed, true);
});
