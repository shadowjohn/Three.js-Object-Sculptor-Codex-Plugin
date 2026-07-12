import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { createCar } from '../../generators/createCar.js';
import { VehicleController } from '../../runtime/VehicleController.js';


function session() {
  const car = createCar({ id: 'car', detail: 0 });
  const vehicle = new VehicleController(car, { safeExitSpeed: 0.2 });
  for (const method of ['openDoor', 'enterDriver', 'closeDoor', 'startDrive', 'stop', 'exitDriver']) {
    assert.equal(typeof vehicle[method], 'function', `missing ${method}`);
  }
  return vehicle;
}

test('runs open, enter, close, drive, stop, open, exit in order', () => {
  const vehicle = session();
  vehicle.openDoor();
  assert.equal(vehicle.articulation.getValue('leftDoor'), 1.2);
  vehicle.enterDriver();
  vehicle.closeDoor();
  vehicle.startDrive();
  vehicle.setInput({ throttle: 1 });
  vehicle.update(0.5);
  assert.ok(vehicle.speed > 0);
  vehicle.stop();
  vehicle.openDoor();
  vehicle.exitDriver();
  assert.equal(vehicle.driverOccupied, false);
  assert.equal(vehicle.mode, 'parked');
});

test('rejects drive while the driver seat is empty', () => {
  const vehicle = session();
  assert.throws(() => vehicle.startDrive(), /driver seat is empty/);
});

test('rejects exit while moving above safe speed', () => {
  const vehicle = session();
  vehicle.openDoor();
  vehicle.enterDriver();
  vehicle.speed = 1;
  assert.throws(() => vehicle.exitDriver(), /moving too fast/);
});

test('VRM car demo exposes door, enter, exit, and WASD driving', async () => {
  const html = await readFile('examples/vrm-car.html', 'utf8').catch(() => '');
  const source = await readFile('examples/js/vrm-car-demo.js', 'utf8').catch(() => '');
  for (const id of ['openDoorButton', 'enterButton', 'exitButton', 'status', 'viewport']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(source, /new VRMLoaderPlugin/);
  assert.match(source, /new VRMAffordanceAdapter/);
  assert.match(source, /new VehicleController/);
  assert.match(source, /adapter\.enter\('enter-vehicle'\)/);
  assert.match(source, /vehicle\.startDrive\(\)/);
  for (const code of ['KeyW', 'KeyA', 'KeyS', 'KeyD']) assert.match(source, new RegExp(code));
});
