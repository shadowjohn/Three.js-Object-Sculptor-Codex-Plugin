import * as THREE from 'three';

import { ArticulationController } from './ArticulationController.js';


function approachZero(value, amount) {
  if (Math.abs(value) <= amount) return 0;
  return value - Math.sign(value) * amount;
}


export class VehicleController {
  constructor(car, options = {}) {
    const metadata = car?.userData?.sculptRuntime?.metadata || {};
    this.car = car;
    this.articulation = new ArticulationController(car);
    this.maxSpeed = options.maxSpeed ?? 8;
    this.maxReverseSpeed = options.maxReverseSpeed ?? this.maxSpeed * 0.4;
    this.acceleration = options.acceleration ?? 4;
    this.braking = options.braking ?? 8;
    this.steeringLimit = options.steeringLimit ?? 0.5;
    this.wheelbase = options.wheelbase ?? metadata.wheelbase;
    this.wheelRadius = options.wheelRadius ?? metadata.wheelRadius;
    this.safeExitSpeed = options.safeExitSpeed ?? 0.2;
    this.speed = 0;
    this.steering = 0;
    this.wheelAngle = 0;
    this.driverOccupied = false;
    this.doorOpen = false;
    this.mode = 'parked';
    this.input = { throttle: 0, steering: 0, brake: 0 };
  }

  openDoor() {
    if (Math.abs(this.speed) > this.safeExitSpeed) throw new Error('vehicle is moving too fast to open door');
    this.articulation.setValue('leftDoor', 1.2);
    this.doorOpen = true;
    return this;
  }

  closeDoor() {
    this.articulation.setValue('leftDoor', 0);
    this.doorOpen = false;
    return this;
  }

  enterDriver() {
    if (!this.doorOpen) throw new Error('driver door is closed');
    this.driverOccupied = true;
    return this;
  }

  startDrive() {
    if (!this.driverOccupied) throw new Error('driver seat is empty');
    if (this.doorOpen) throw new Error('driver door is open');
    this.mode = 'driving';
    return this;
  }

  stop() {
    this.speed = 0;
    this.setInput({ brake: 1 });
    this.mode = 'parked';
    return this;
  }

  exitDriver() {
    if (Math.abs(this.speed) > this.safeExitSpeed) throw new Error('vehicle is moving too fast to exit');
    if (!this.driverOccupied) throw new Error('driver seat is empty');
    if (!this.doorOpen) throw new Error('driver door is closed');
    this.driverOccupied = false;
    this.mode = 'parked';
    return this;
  }

  setInput(input = {}) {
    this.input.throttle = THREE.MathUtils.clamp(input.throttle ?? 0, -1, 1);
    this.input.steering = THREE.MathUtils.clamp(input.steering ?? 0, -1, 1);
    this.input.brake = THREE.MathUtils.clamp(input.brake ?? 0, 0, 1);
    return this;
  }

  update(delta) {
    if (this.input.brake > 0) {
      this.speed = approachZero(this.speed, this.braking * this.input.brake * delta);
    } else {
      this.speed += this.input.throttle * this.acceleration * delta;
      this.speed = THREE.MathUtils.clamp(this.speed, -this.maxReverseSpeed, this.maxSpeed);
    }

    this.steering = this.input.steering * this.steeringLimit;
    this.car.rotation.y += this.speed / this.wheelbase * Math.tan(this.steering) * delta;
    this.car.position.x += Math.sin(this.car.rotation.y) * this.speed * delta;
    this.car.position.z += Math.cos(this.car.rotation.y) * this.speed * delta;

    this.wheelAngle += this.speed / this.wheelRadius * delta;
    for (const id of ['wheelFrontLeft', 'wheelFrontRight', 'wheelRearLeft', 'wheelRearRight']) {
      this.articulation.setValue(id, this.wheelAngle);
    }
    this.articulation.setValue('steeringFrontLeft', this.steering);
    this.articulation.setValue('steeringFrontRight', this.steering);
    this.articulation.setValue('steeringWheel', -this.steering);
    return this;
  }
}
