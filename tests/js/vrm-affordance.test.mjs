import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

import { createChair } from '../../generators/createChair.js';
import { VRMAffordanceAdapter } from '../../runtime/VRMAffordanceAdapter.js';


function avatar() {
  const scene = new THREE.Group();
  const hips = new THREE.Group();
  hips.position.y = 0.9;
  scene.add(hips);
  const calls = [];
  return {
    scene,
    humanoid: { getNormalizedBoneNode: name => name === 'hips' ? hips : null },
    calls,
    playPose: async name => calls.push(['play', name]),
    stopPose: async name => calls.push(['stop', name]),
  };
}


test('enter aligns hips to seat, follows chair, and exit restores parent', async () => {
  const world = new THREE.Group();
  const chair = createChair({ id: 'chair', seatHeight: 0.46 });
  const vrm = avatar();
  world.add(chair, vrm.scene);
  const adapter = new VRMAffordanceAdapter(vrm, chair);
  await adapter.enter('sit');
  assert.equal(adapter.state, 'active');
  assert.deepEqual(vrm.calls, [['play', 'sit']]);
  const seat = chair.userData.sculptRuntime.sockets.seat;
  assert.ok(vrm.humanoid.getNormalizedBoneNode('hips').getWorldPosition(new THREE.Vector3()).distanceTo(seat.getWorldPosition(new THREE.Vector3())) < 1e-6);
  chair.position.x = 2;
  adapter.update();
  assert.ok(vrm.humanoid.getNormalizedBoneNode('hips').getWorldPosition(new THREE.Vector3()).distanceTo(seat.getWorldPosition(new THREE.Vector3())) < 1e-6);
  await adapter.exit();
  assert.equal(adapter.state, 'idle');
  assert.equal(vrm.scene.parent, world);
  assert.deepEqual(vrm.calls, [['play', 'sit'], ['stop', 'sit']]);
  const exit = chair.userData.sculptRuntime.sockets.sitExit.getWorldPosition(new THREE.Vector3());
  assert.ok(vrm.scene.getWorldPosition(new THREE.Vector3()).distanceTo(exit) < 1e-6);
});

test('rejects a second enter while active', async () => {
  const chair = createChair({ id: 'chair' });
  const vrm = avatar();
  const adapter = new VRMAffordanceAdapter(vrm, chair);
  await adapter.enter('sit');
  await assert.rejects(() => adapter.enter('sit'), /cannot enter while active/);
});

test('missing hips fails before moving avatar', async () => {
  const parent = new THREE.Group();
  const scene = new THREE.Group();
  parent.add(scene);
  const adapter = new VRMAffordanceAdapter({ scene, humanoid: {} }, createChair({ id: 'chair' }));
  await assert.rejects(() => adapter.enter('sit'), /normalized hips bone/);
  assert.equal(scene.parent, parent);
  assert.equal(adapter.state, 'idle');
});
