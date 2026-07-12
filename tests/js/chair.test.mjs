import test from 'node:test';
import assert from 'node:assert/strict';

import { createChair } from '../../generators/createChair.js';
import { validateSculptAsset } from '../../runtime/SculptRuntime.js';


test('chair exposes complete sit affordance', () => {
  const chair = createChair({ id: 'chair', detail: 0.5 });
  const runtime = chair.userData.sculptRuntime;
  assert.ok(runtime.sockets.seat);
  assert.ok(runtime.sockets.sitApproach);
  assert.ok(runtime.sockets.sitExit);
  assert.equal(runtime.affordances.sit.actionProgram, 'sit-enter');
  assert.equal(runtime.affordances.sit.approachSocket, 'sitApproach');
  assert.equal(runtime.affordances.sit.exitSocket, 'sitExit');
  assert.ok(runtime.actionPrograms['sit-enter']);
  assert.ok(runtime.actionPrograms['sit-exit']);
  assert.deepEqual(validateSculptAsset(chair), []);
});

test('chair seat height and facing stay explicit at every detail', () => {
  for (const detail of [0, 0.5, 1]) {
    const chair = createChair({ id: 'chair', detail, seatHeight: 0.46 });
    const runtime = chair.userData.sculptRuntime;
    assert.equal(runtime.sockets.seat.position.y, 0.46);
    assert.deepEqual(runtime.metadata.seatForward, [0, 0, 1]);
    assert.equal(runtime.colliders.clearance.type, 'capsule');
    assert.equal(runtime.nodes.back.name, 'back');
  }
});
