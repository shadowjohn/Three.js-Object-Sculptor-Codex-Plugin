# VRM Chair Affordance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Attach sculpt assets to normalized VRM bones and let differently scaled avatars enter, follow, and exit a procedural chair seat.

**Architecture:** Keep the attachment adapter independent of `three-vrm` imports by depending only on the normalized humanoid lookup contract. Keep sit animation in the host; the affordance adapter controls root alignment and seat following.

**Tech Stack:** Three.js, `three-vrm`-compatible humanoid API, ES modules, Node tests with minimal fake VRM objects, browser integration page.

---

### Task 1: VRM attachment adapter

**Files:**
- Create: `runtime/VRMAttachmentAdapter.js`
- Create: `tests/js/vrm-attachment.test.mjs`

- [ ] **Step 1: Write failing attachment tests**

```js
test('attaches grip socket to normalized rightHand', () => {
  const rightHand = new THREE.Group();
  const vrm = { humanoid: { getNormalizedBoneNode: name => name === 'rightHand' ? rightHand : null } };
  const asset = new THREE.Group();
  const grip = new THREE.Group();
  asset.add(grip);
  createSculptRuntime(asset, { assetId: 'pistol', sockets: { grip } });
  const handle = attachSculptAsset(vrm, asset, { bone: 'rightHand', socket: 'grip', scaleMode: 'fixed' });
  assert.equal(asset.parent, rightHand);
  assert.ok(handle.getWorldSocket('grip').isVector3);
});

test('missing bone fails without moving the asset', () => {
  const asset = new THREE.Group();
  assert.throws(() => attachSculptAsset({ humanoid: {} }, asset, { bone: 'head' }), /normalized bone head/);
  assert.equal(asset.parent, null);
});
```

- [ ] **Step 2: Run and verify RED**

Run: `npm test`

- [ ] **Step 3: Implement attachment handle**

Support normalized lookup with raw lookup fallback, fixed/avatar-height/head-width/hand-length scale modes, local offset and Euler rotation, socket world position, visibility, detach, and dispose. Apply all validation before reparenting.

- [ ] **Step 4: Verify and commit**

Run: `npm test; node --check runtime/VRMAttachmentAdapter.js`

```powershell
git add runtime/VRMAttachmentAdapter.js tests/js/vrm-attachment.test.mjs
git commit -m "feat: attach sculpt assets to vrm bones"
```

### Task 2: Chair generator and affordance contract

**Files:**
- Create: `generators/createChair.js`
- Create: `tests/fixtures/recipes/chair.valid.json`
- Create: `tests/js/chair.test.mjs`

- [ ] **Step 1: Write a failing chair test**

```js
test('chair exposes complete sit affordance', () => {
  const chair = createChair({ id: 'chair', detail: 0.5 });
  const runtime = chair.userData.sculptRuntime;
  assert.ok(runtime.sockets.seat);
  assert.ok(runtime.sockets.sitApproach);
  assert.ok(runtime.sockets.sitExit);
  assert.equal(runtime.affordances.sit.actionProgram, 'sit-enter');
  assert.deepEqual(validateSculptAsset(chair), []);
});
```

- [ ] **Step 2: Run RED and implement the chair**

Build stable seat, back, and four-leg pivots. Define seat height, forward direction, clearance capsule, approach/exit sockets, box colliders, `sit` affordance, and `sit-enter`/`sit-exit` program references.

- [ ] **Step 3: Verify and commit**

Run: `npm test; python scripts/validate_sculpt_recipe.py tests/fixtures/recipes/chair.valid.json`

```powershell
git add generators/createChair.js tests
git commit -m "feat: add chair sit affordance"
```

### Task 3: VRM affordance adapter

**Files:**
- Create: `runtime/VRMAffordanceAdapter.js`
- Create: `tests/js/vrm-affordance.test.mjs`

- [ ] **Step 1: Write failing enter/follow/exit tests**

The fake avatar has `scene`, a hips node, and host hooks `playPose(name)` and `stopPose(name)`. Assert that `enter('sit')` validates first, aligns avatar ground/root to the seat socket, calls `playPose('sit')`, follows a moved chair in `update()`, and restores world parenting on `exit()`.

- [ ] **Step 2: Run RED and implement state transitions**

States are `idle`, `entering`, `active`, and `exiting`. Reject a second enter while active. Preserve the avatar's original parent and world transform. Do not synthesize IK or character-specific joint rotations.

- [ ] **Step 3: Verify and commit**

Run: `npm test; node --check runtime/VRMAffordanceAdapter.js`

```powershell
git add runtime/VRMAffordanceAdapter.js tests/js/vrm-affordance.test.mjs
git commit -m "feat: execute vrm affordances"
```

### Task 4: Alicia and Nanachi browser acceptance

**Files:**
- Create: `examples/vrm-chair.html`
- Create: `examples/js/vrm-chair-demo.js`
- Modify: `README.md`

- [ ] **Step 1: Build a model-URL-driven demo**

The page accepts `?vrm=<url>`, loads one VRM, creates one chair, and provides Enter Sit, Exit Sit, Move Chair, and Reset buttons. It reports missing model, missing hips, invalid affordance, and model-load failure in a visible status field.

- [ ] **Step 2: Verify Alicia**

Run the local server and load the repository's permitted Alicia model URL. Verify approach alignment, sit hook, seat following, and exit.

- [ ] **Step 3: Verify Nanachi**

Load the permitted local Nanachi model URL. Keep the chair unchanged; only avatar root placement and host sit pose may vary. Capture one screenshot for each avatar.

- [ ] **Step 4: Run full checks and commit**

Run: `npm test; python -m unittest discover -s tests/python -p "test_*.py"; git diff --check`

```powershell
git add examples README.md
git commit -m "demo: verify vrm chair affordance"
```
