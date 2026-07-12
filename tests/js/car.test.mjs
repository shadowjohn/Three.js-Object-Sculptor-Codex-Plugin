import test from 'node:test';
import assert from 'node:assert/strict';

import { validateSculptAsset } from '../../runtime/SculptRuntime.js';


const module = await import('../../generators/createCar.js').catch(() => ({}));

function car(options = {}) {
  assert.equal(typeof module.createCar, 'function');
  return module.createCar({ id: 'car', ...options });
}

test('car keeps interaction-critical nodes and sockets at every detail', () => {
  const nodeIds = [
    'body', 'doorLeftFront', 'doorRightFront', 'steeringWheel',
    'wheelFrontLeft', 'wheelFrontRight', 'wheelRearLeft', 'wheelRearRight',
  ];
  const socketIds = ['driverSeat', 'passengerSeat', 'driverEntry', 'driverExit', 'driverCamera'];

  for (const detail of [0, 0.5, 1]) {
    const runtime = car({ detail }).userData.sculptRuntime;
    for (const id of nodeIds) assert.ok(runtime.nodes[id], `missing node ${id}`);
    for (const id of socketIds) assert.ok(runtime.sockets[id], `missing socket ${id}`);
  }
});

test('car exposes door, wheel, steering, collider, and wheelbase contracts', () => {
  const value = car();
  const runtime = value.userData.sculptRuntime;
  assert.deepEqual(runtime.articulation.leftDoor.limits, [0, 1.2]);
  assert.deepEqual(runtime.articulation.rightDoor.limits, [-1.2, 0]);
  assert.equal(runtime.articulation.wheelFrontLeft.type, 'continuous');
  assert.equal(runtime.articulation.steeringFrontLeft.type, 'hinge');
  assert.equal(runtime.colliders.body.type, 'box');
  assert.equal(runtime.metadata.wheelbase, 2.5);
  assert.deepEqual(runtime.metadata.forward, [0, 0, 1]);
  assert.deepEqual(validateSculptAsset(value), []);
});

test('car exposes complete vehicle action programs and affordances', () => {
  const runtime = car().userData.sculptRuntime;
  for (const id of ['open-door', 'enter-vehicle', 'exit-vehicle', 'drive']) {
    assert.ok(runtime.affordances[id], `missing affordance ${id}`);
    assert.ok(runtime.actionPrograms[runtime.affordances[id].actionProgram]);
  }
  assert.equal(runtime.affordances['enter-vehicle'].targetSocket, 'driverSeat');
  assert.equal(runtime.affordances['enter-vehicle'].approachSocket, 'driverEntry');
  assert.equal(runtime.affordances['exit-vehicle'].exitSocket, 'driverExit');
});

test('front door visual meshes start behind their hinge pivots', () => {
  const runtime = car().userData.sculptRuntime;
  assert.ok(runtime.nodes.doorLeftFront.children[0].position.z < 0);
  assert.ok(runtime.nodes.doorRightFront.children[0].position.z < 0);
});
