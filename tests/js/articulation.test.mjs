import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';


const runtime = await import('../../runtime/ArticulationController.js').catch(() => ({}));

function asset(articulation) {
  const root = new THREE.Group();
  const nodes = {};
  for (const joint of Object.values(articulation)) {
    if (!nodes[joint.node]) nodes[joint.node] = new THREE.Group();
  }
  root.userData.sculptRuntime = { nodes, articulation };
  return root;
}

function controller(articulation) {
  assert.equal(typeof runtime.ArticulationController, 'function');
  return new runtime.ArticulationController(asset(articulation));
}

test('hinge clamps its value and rotates only around its declared axis', () => {
  const value = controller({ door: { type: 'hinge', node: 'door', axis: [0, 1, 0], limits: [0, 1], defaultValue: 0 } });
  value.setValue('door', 2);
  assert.equal(value.getValue('door'), 1);
  assert.ok(Math.abs(value.asset.userData.sculptRuntime.nodes.door.rotation.y - 1) < 1e-6);
});

test('slider clamps its value and preserves the node base position', () => {
  const source = asset({ drawer: { type: 'slider', node: 'drawer', axis: [1, 0, 0], limits: [-0.5, 0.5], defaultValue: 0 } });
  source.userData.sculptRuntime.nodes.drawer.position.set(2, 3, 4);
  assert.equal(typeof runtime.ArticulationController, 'function');
  const value = new runtime.ArticulationController(source);
  value.setValue('drawer', -2);
  assert.equal(value.getValue('drawer'), -0.5);
  assert.deepEqual(value.asset.userData.sculptRuntime.nodes.drawer.position.toArray(), [1.5, 3, 4]);
});

test('continuous rotation wraps deterministically', () => {
  const value = controller({ wheel: { type: 'continuous', node: 'wheel', axis: [1, 0, 0], defaultValue: 0 } });
  value.setValue('wheel', Math.PI * 2 + 0.25);
  assert.ok(Math.abs(value.getValue('wheel') - 0.25) < 1e-6);
  value.setValue('wheel', -0.25);
  assert.ok(Math.abs(value.getValue('wheel') - (Math.PI * 2 - 0.25)) < 1e-6);
});

test('missing articulation target fails before changing nodes', () => {
  const source = asset({ door: { type: 'hinge', node: 'door', axis: [0, 1, 0], limits: [0, 1], defaultValue: 0 } });
  delete source.userData.sculptRuntime.nodes.door;
  assert.equal(typeof runtime.ArticulationController, 'function');
  assert.throws(() => new runtime.ArticulationController(source), /missing node door/);
});

test('setValue and update are deterministic without owning a loop', () => {
  const value = controller({ door: { type: 'hinge', node: 'door', axis: [0, 1, 0], limits: [0, 1], defaultValue: 0 } });
  value.setValue('door', 0.6);
  value.update(1 / 60);
  assert.equal(value.getValue('door'), 0.6);
  value.update(1 / 60);
  assert.equal(value.getValue('door'), 0.6);
});
