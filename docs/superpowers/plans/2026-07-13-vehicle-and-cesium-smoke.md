# Vehicle and Cesium Smoke Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an articulated procedural car, let a VRM enter/drive/exit it, and prove the exported GLB can be placed in Cesium.

**Architecture:** Model the car as stable pivot groups controlled by a small deterministic vehicle controller. Reuse the VRM affordance adapter for seating; Cesium consumes exported GLB and manifest, not live Three.js objects.

**Tech Stack:** Three.js, GLTF export, VRM-compatible adapter, Cesium 1.141 smoke page, Node tests.

---

### Task 1: Generic articulation controller

**Files:**
- Create: `runtime/ArticulationController.js`
- Create: `tests/js/articulation.test.mjs`

- [ ] **Step 1: Write failing joint tests**

Test hinge clamping, slider clamping, continuous rotation wrapping, missing target errors, and deterministic `setValue/getValue`.

- [ ] **Step 2: Run RED and implement**

```js
controller.setValue('leftDoor', 1);
assert.equal(controller.getValue('leftDoor'), 1);
controller.update(1 / 60);
```

The controller changes only the declared node transform channel. It does not own an animation loop.

- [ ] **Step 3: Verify and commit**

Run: `npm test`

```powershell
git add runtime/ArticulationController.js tests/js/articulation.test.mjs
git commit -m "feat: control articulated asset joints"
```

### Task 2: Procedural car golden asset

**Files:**
- Create: `generators/createCar.js`
- Create: `tests/fixtures/recipes/car.valid.json`
- Create: `tests/js/car.test.mjs`

- [ ] **Step 1: Write failing car contract tests**

Assert stable body, four wheel, two front-door, and steering-wheel nodes; driver/passenger seat sockets; driver entry/exit/camera sockets; body collider; wheelbase metadata; door hinge limits; and complete open-door/enter/exit/drive affordances.

- [ ] **Step 2: Run RED and implement blockout car**

Use boxes, cylinders, and named pivot groups. Door pivots sit on the hinge edge. Wheel pivots rotate around local X; front steering pivots rotate around local Y. Keep socket IDs stable at every LOD.

- [ ] **Step 3: Verify and commit**

Run: `npm test; python scripts/validate_sculpt_recipe.py tests/fixtures/recipes/car.valid.json`

```powershell
git add generators/createCar.js tests
git commit -m "feat: add articulated car asset"
```

### Task 3: Vehicle controller

**Files:**
- Create: `runtime/VehicleController.js`
- Create: `tests/js/vehicle-controller.test.mjs`

- [ ] **Step 1: Write failing movement tests**

```js
test('moves root and rotates wheels from speed', () => {
  const car = createCar({ id: 'car', detail: 0 });
  const controller = new VehicleController(car, { maxSpeed: 8, wheelbase: 2.4 });
  controller.setInput({ throttle: 1, steering: 0.5 });
  controller.update(1);
  assert.ok(car.position.length() > 0);
  assert.notEqual(car.userData.sculptRuntime.nodes.wheelFrontLeft.rotation.x, 0);
});
```

- [ ] **Step 2: Run RED and implement a minimal kinematic model**

Use acceleration, braking, maximum forward/reverse speed, steering limit, wheelbase bicycle yaw, and wheel circumference. Leave suspension, tire slip, rigid-body physics, networking, and terrain collision outside v1.

- [ ] **Step 3: Verify and commit**

Run: `npm test`

```powershell
git add runtime/VehicleController.js tests/js/vehicle-controller.test.mjs
git commit -m "feat: drive procedural vehicles"
```

### Task 4: VRM enter-drive-exit demo

**Files:**
- Create: `examples/vrm-car.html`
- Create: `examples/js/vrm-car-demo.js`
- Create: `tests/js/vehicle-action-program.test.mjs`

- [ ] **Step 1: Write action-program transition tests**

Verify `open-door -> enter-driver-seat -> close-door -> drive -> stop -> open-door -> exit-driver-seat`. Reject drive while the driver seat is empty and exit while moving above the configured safe speed.

- [ ] **Step 2: Implement the browser demo**

Provide Open Door, Enter, Exit buttons plus WASD driving. Reuse `VRMAffordanceAdapter`; update the seated avatar from `driverSeat` each frame. Display current state, speed, steering, driver occupancy, and door angle.

- [ ] **Step 3: Visual acceptance**

Verify with Alicia first, then Nanachi. Confirm the door hinges from the correct edge, avatar remains seated while turning, wheels rotate, front wheels steer, and exit lands at `driverExit`.

- [ ] **Step 4: Verify and commit**

Run: `npm test; node --check examples/js/vrm-car-demo.js; git diff --check`

```powershell
git add examples tests/js/vehicle-action-program.test.mjs
git commit -m "demo: enter and drive procedural car"
```

### Task 5: Cesium GLB placement smoke

**Files:**
- Create: `examples/cesium-car/index.php`
- Create: `examples/cesium-car/js/app.js`
- Create: `examples/cesium-car/css/style.css`
- Create: `tests/js/cesium-smoke-contract.test.mjs`
- Modify: `README.md`

- [ ] **Step 1: Write a failing static Cesium contract test**

Assert that the example sets `window.CESIUM_BASE_URL` before `Cesium.js`, uses `Cesium.Model.fromGltfAsync`, converts longitude/latitude/height with `Cartesian3.fromDegrees`, applies heading through `Transforms.headingPitchRollQuaternion`, reads manifest units/origin, and reports load errors visibly.

- [ ] **Step 2: Run RED and implement the 3WA-style page**

Use Cesium 1.141, explicit imagery, ellipsoid terrain fallback, one longitude/latitude/height form, heading slider, Load Car button, and status line. Load the exported car LOD0 GLB; do not embed a second Three.js renderer.

- [ ] **Step 3: Verify locally and publicly**

Run: `php -l examples/cesium-car/index.php; node --check examples/cesium-car/js/app.js`

Open the page, place the car, change heading, confirm its ground-center origin, and inspect the browser console. This smoke does not animate the car on Cesium terrain.

- [ ] **Step 4: Run full suite and commit**

Run: `npm test; python -m unittest discover -s tests/python -p "test_*.py"; git diff --check`

```powershell
git add examples/cesium-car tests/js/cesium-smoke-contract.test.mjs README.md
git commit -m "demo: load procedural car in cesium"
```
