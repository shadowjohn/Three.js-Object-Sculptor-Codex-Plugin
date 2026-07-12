# Runtime Assets v1 Design

## Goal

Turn Three.js Object Sculptor from a code-generation workflow into a reusable parameterized asset pipeline shared by Three.js, VRM avatars, and later Cesium scenes. Normal parameter editing and LOD changes must consume no AI tokens; AI is reserved for initial image interpretation and explicitly requested refinement.

## Product Boundary

Runtime Assets v1 delivers four capabilities:

1. compact `SculptRecipe`;
2. a runtime asset contract plus `VRMAttachmentAdapter`;
3. GLB export;
4. `asset-manifest.json` with LOD, sockets, articulation, and affordances.

The future object-generation platform is a separate phase that consumes these APIs. Accounts, cloud storage, collaboration, asset marketplace, 3D Tiles generation, full VRM authoring, IK, navmesh, and a Cesium editor are out of scope.

## Architecture

```text
reference image / prompt
          |
          v
     SculptRecipe
          |
          v
 procedural factory -----> THREE.Group + sculptRuntime
          |                           |
          |                           +--> VRMAttachmentAdapter
          |
          +--> GLB exporter --> asset-manifest.json --> Cesium / 3D Tiles later
```

`ObjectSculptSpec` remains the detailed authoring and quality-audit format. A compiler produces the smaller `SculptRecipe` used by runtime generation and the future editor.

## 1. SculptRecipe v1

`SculptRecipe` is deterministic, versioned, JSON-serializable, and normally 2-10 KB. Its required fields are:

```json
{
  "schemaVersion": "1.0",
  "id": "example-chair",
  "profile": "prop",
  "seed": 1,
  "units": "meters",
  "coordinateFrame": {
    "up": "+Y",
    "forward": "+Z",
    "origin": "ground-center"
  },
  "parameters": {},
  "components": [],
  "materials": [],
  "articulation": [],
  "affordances": [],
  "lod": {}
}
```

Supported profiles are `prop`, `weapon`, `attachment`, `actor`, `vehicle`, and `gis-object`. `detail`, `geometryQuality`, and `materialQuality` are normalized values from 0 to 1. The same recipe, seed, generator version, and quality values must reproduce the same component IDs and transforms.

The validator rejects unknown schema versions, duplicate component/socket IDs, invalid parent references, non-meter output, missing coordinate frames, and articulation that targets nonexistent nodes.

## 2. Runtime Asset Contract

Every generated root exposes:

```js
root.userData.sculptRuntime = {
  schemaVersion: '1.0',
  assetId: 'example-chair',
  nodes: {},
  meshes: {},
  sockets: {},
  colliders: {},
  articulation: {},
  affordances: {},
  actionPrograms: {},
  destructionGroups: {},
  bounds: {},
  metadata: {}
};
```

All independently movable parts use stable `THREE.Group` pivots. Sockets store local transforms. Colliders are simplified proxies and are not visual meshes. Bounds, origin, scale, forward axis, and up axis are explicit.

### Articulation

Articulation v1 supports pivot-based joints, not skinned character rigs:

- hinge;
- slider;
- continuous rotation;
- detachable group;
- visibility state;
- material state.

Each joint defines its node, axis, limits, default value, and optional speed. This covers doors, drawers, wheels, turrets, lids, triggers, and simple segmented limbs.

### Affordances

Affordances describe what an actor or application may do with the asset:

```json
{
  "id": "driver-seat",
  "verb": "sit",
  "targetSocket": "driverSeat",
  "approachSocket": "driverEntry",
  "exitSocket": "driverExit",
  "requirements": ["humanoid"],
  "actionProgram": "enter-driver-seat"
}
```

An affordance is semantic metadata. An `actionProgram` supplies the ordered transforms and state changes, but avatar animation, IK, pathfinding, collision resolution, and application permissions remain the host application's responsibility.

## 3. VRMAttachmentAdapter

The adapter accepts a loaded VRM and a runtime asset:

```js
const handle = attachSculptAsset(vrm, asset, {
  bone: 'rightHand',
  socket: 'grip',
  scaleMode: 'avatar-height',
  offset: [0, 0, 0],
  rotation: [0, 0, 0]
});
```

It supports normalized humanoid bone lookup, local offset calibration, `fixed`, `avatar-height`, `head-width`, and `hand-length` scale modes, world socket lookup, visibility, detach, and disposal. It does not perform VRM basis conversion, pose retargeting, VRMA playback, or IK.

For sit and vehicle affordances, a separate `VRMAffordanceAdapter` computes the avatar root transform from the target socket and exposes hooks for the host motion controller:

```js
await affordance.enter({ avatar, asset, affordance: 'driver-seat' });
await affordance.exit();
```

The adapter must never silently move an avatar when the required humanoid bones, target socket, or host animation hook are missing.

## 4. GLB Export and Asset Manifest

The exporter takes a generated runtime asset and emits GLB files plus a manifest:

```text
dist/<asset-id>/
  <asset-id>-lod0.glb
  <asset-id>-lod1.glb
  <asset-id>-lod2.glb
  asset-manifest.json
  recipe.json
```

Visual geometry, material assignments, node names, pivot hierarchy, and supported glTF extras are preserved. Runtime-only JavaScript functions are represented declaratively in the manifest. Debug helpers and collider meshes are excluded from GLB by default.

The manifest records asset version, generator version, units, axes, origin, bounds, LOD URLs and distance bands, sockets, articulation, affordances, collider descriptors, attribution, license, and recipe hash.

Cesium compatibility requires meter units, an explicit ground-center origin, valid bounds, GLB reload verification, and enough metadata for an external longitude/latitude/height placement adapter. Direct 3D Tiles generation is deferred.

## Golden Assets

### Table

The table validates a static structural prop:

- stable top and leg components;
- `surface-top` socket and tabletop bounds;
- simplified box collider;
- detail and LOD sliders;
- GLB/manifest round trip.

Acceptance: an application can place another object on `surface-top` without hardcoded table dimensions.

### Chair

The chair validates avatar affordances:

- `seat` target socket;
- `sitApproach` and `sitExit` sockets;
- seat height, facing, and clearance metadata;
- `sit` affordance;
- Alicia and Nanachi scale differences handled by avatar root placement, not by changing chair scale.

Acceptance: both characters can approach, align, enter a host-provided sit pose, remain attached to the seat while it moves, and exit without the chair knowing character-specific logic.

### Car

The car validates articulation and compound affordances:

- four wheel pivots;
- left/right door hinges with limits;
- steering wheel pivot;
- driver seat, passenger seat, entry, exit, and camera sockets;
- vehicle collider and wheelbase metadata;
- `open-door`, `enter-vehicle`, `exit-vehicle`, and `drive` action programs.

`drive` moves the vehicle root. The seated avatar follows the seat socket and may drive wheel rotation and steering articulation. v1 demonstrates movement in a plain Three.js scene; Cesium position/orientation binding is a later adapter using the same manifest.

Acceptance: open door, place Alicia or Nanachi in the driver seat, close door, move and steer the vehicle, stop, open door, and exit. Character-specific entry animation and hand/foot IK are explicitly outside v1.

## LOD and Quality Controls

Quality controls regenerate from the recipe rather than destructively editing the current meshes:

- `detail`: optional components and repetition density;
- `geometryQuality`: radial segments, curve sampling, bevel segments;
- `materialQuality`: texture resolution and procedural surface bands.

LOD0-LOD2 are generated artifacts with stable semantic node/socket IDs. Interaction-critical nodes such as seats, doors, muzzle, and colliders remain addressable at every interactive LOD. Extremely distant display-only LODs may drop articulation and must declare that limitation in the manifest.

## Failure Handling

- Invalid recipes fail before geometry generation.
- Missing runtime nodes or sockets produce named validation errors.
- Export failure leaves no partially valid manifest.
- GLB reload validation must pass before the manifest is finalized.
- Unsupported articulation is preserved as metadata and reported, not approximated silently.
- A chair or vehicle cannot advertise a usable affordance unless every referenced socket and action program validates.

## Verification

Automated checks cover schema validation, deterministic generation, stable IDs across quality levels, runtime contract integrity, articulation limits, affordance references, manifest generation, recipe hashing, and GLB export/reload.

Browser checks cover:

1. table detail/LOD adjustment;
2. Alicia and Nanachi sitting on the same chair;
3. car door open/close, avatar enter/exit, wheel/steering motion, and vehicle root movement;
4. exported GLB reloaded into a fresh Three.js scene;
5. one exported GLB loaded by a minimal Cesium smoke page.

## Delivery Order

1. schemas and validators;
2. runtime contract helpers;
3. table golden asset and quality controls;
4. GLB exporter and manifest;
5. VRM attachment and chair affordance;
6. car articulation and vehicle action programs;
7. Cesium GLB smoke test;
8. future object-generation platform specification.
