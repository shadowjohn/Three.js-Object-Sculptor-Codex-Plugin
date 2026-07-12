import test from 'node:test';
import assert from 'node:assert/strict';

import { createCar } from '../../generators/createCar.js';


const runtime = await import('../../runtime/VehicleController.js').catch(() => ({}));

function controller(options = {}) {
  assert.equal(typeof runtime.VehicleController, 'function');
  const car = createCar({ id: 'car', detail: 0 });
  return { car, value: new runtime.VehicleController(car, options) };
}

test('moves the root and rotates every wheel from speed', () => {
  const { car, value } = controller({ maxSpeed: 8, acceleration: 4 });
  value.setInput({ throttle: 1, steering: 0 });
  value.update(1);
  assert.ok(car.position.z > 0);
  for (const id of ['wheelFrontLeft', 'wheelFrontRight', 'wheelRearLeft', 'wheelRearRight']) {
    assert.notEqual(value.articulation.getValue(id), 0);
  }
});

test('clamps forward and reverse speed deterministically', () => {
  const { value } = controller({ maxSpeed: 6, maxReverseSpeed: 2, acceleration: 10 });
  value.setInput({ throttle: 1 });
  value.update(2);
  assert.equal(value.speed, 6);
  value.speed = 0;
  value.setInput({ throttle: -1 });
  value.update(2);
  assert.equal(value.speed, -2);
});

test('steering turns the car and front wheel pivots', () => {
  const { car, value } = controller({ acceleration: 4, steeringLimit: 0.5 });
  value.setInput({ throttle: 1, steering: 1 });
  value.update(1);
  assert.notEqual(car.rotation.y, 0);
  assert.equal(value.articulation.getValue('steeringFrontLeft'), 0.5);
  assert.equal(value.articulation.getValue('steeringFrontRight'), 0.5);
});

test('braking approaches zero without reversing direction', () => {
  const { value } = controller({ braking: 5 });
  value.speed = 3;
  value.setInput({ throttle: 0, brake: 1 });
  value.update(1);
  assert.equal(value.speed, 0);
});
