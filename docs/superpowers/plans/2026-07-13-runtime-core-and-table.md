# Runtime Core and Table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the compact recipe, runtime metadata contract, deterministic quality controls, and a table golden asset.

**Architecture:** Keep schema validation in the existing dependency-free Python tooling and runtime validation in small JavaScript modules. Add only Three.js as an npm dependency; use Node's built-in test runner.

**Tech Stack:** Python 3.10+, JavaScript ES modules, Node 24+, Three.js 0.180.0, `node:test`, `unittest`.

---

### Task 1: JavaScript test harness

**Files:**
- Create: `package.json`
- Create: `tests/__init__.py`
- Create: `tests/python/__init__.py`
- Create: `tests/js/smoke.test.mjs`
- Create: `tests/python/test_repository_layout.py`

- [ ] **Step 1: Add a failing repository-layout test**

```python
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]

class RepositoryLayoutTest(unittest.TestCase):
    def test_runtime_directories_exist(self):
        self.assertTrue((ROOT / "runtime").is_dir())
        self.assertTrue((ROOT / "generators").is_dir())
        self.assertTrue((ROOT / "schemas").is_dir())
```

- [ ] **Step 2: Run the test and verify RED**

Run: `python -m unittest tests.python.test_repository_layout -v`

Expected: FAIL because `runtime/`, `generators/`, and `schemas/` do not exist.

- [ ] **Step 3: Add the minimal npm harness and directories**

```json
{
  "name": "threejs-object-sculptor-runtime",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test tests/js/*.test.mjs"
  },
  "dependencies": {
    "three": "0.180.0"
  }
}
```

Create `runtime/.gitkeep`, `generators/.gitkeep`, `schemas/.gitkeep`, empty `tests/__init__.py`, and empty `tests/python/__init__.py`. Add `tests/js/smoke.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';

test('Node test harness is active', () => assert.equal(1 + 1, 2));
```

- [ ] **Step 4: Install and verify GREEN**

Run: `npm install`

Run: `npm test; python -m unittest tests.python.test_repository_layout -v`

Expected: both commands exit 0.

- [ ] **Step 5: Commit**

```powershell
git add package.json package-lock.json runtime generators schemas tests
git commit -m "build: add runtime test harness"
```

### Task 2: SculptRecipe v1 validator

**Files:**
- Create: `schemas/sculpt-recipe-v1.schema.json`
- Create: `scripts/validate_sculpt_recipe.py`
- Create: `tests/fixtures/recipes/table.valid.json`
- Create: `tests/fixtures/recipes/duplicate-component.invalid.json`
- Create: `tests/python/test_validate_sculpt_recipe.py`

- [ ] **Step 1: Write failing validator tests**

```python
import json
import unittest
from pathlib import Path
from scripts.validate_sculpt_recipe import validate_recipe

ROOT = Path(__file__).resolve().parents[2]

class SculptRecipeValidationTest(unittest.TestCase):
    def load(self, name):
        return json.loads((ROOT / "tests/fixtures/recipes" / name).read_text(encoding="utf-8"))

    def test_table_recipe_is_valid(self):
        self.assertEqual(validate_recipe(self.load("table.valid.json")), [])

    def test_duplicate_component_is_rejected(self):
        errors = validate_recipe(self.load("duplicate-component.invalid.json"))
        self.assertIn("duplicate component id: leg", errors)
```

- [ ] **Step 2: Run and verify RED**

Run: `python -m unittest tests.python.test_validate_sculpt_recipe -v`

Expected: import failure for `scripts.validate_sculpt_recipe`.

- [ ] **Step 3: Implement minimum validation**

`validate_recipe(recipe)` must validate schema version `1.0`, supported profile, meter units, coordinate frame, unique IDs, parent references, articulation node references, and normalized quality values. The CLI must print every error and return exit code 1 when invalid:

```python
def validate_recipe(recipe):
    errors = []
    if recipe.get("schemaVersion") != "1.0":
        errors.append("schemaVersion must be 1.0")
    if recipe.get("units") != "meters":
        errors.append("units must be meters")
    ids = [item.get("id") for item in recipe.get("components", [])]
    for component_id in sorted({value for value in ids if value and ids.count(value) > 1}):
        errors.append(f"duplicate component id: {component_id}")
    return errors
```

Expand the same function only for the named v1 rules. Do not introduce a schema library.

- [ ] **Step 4: Verify GREEN**

Run: `python -m unittest tests.python.test_validate_sculpt_recipe -v`

Run: `python scripts/validate_sculpt_recipe.py tests/fixtures/recipes/table.valid.json`

Expected: tests pass and CLI prints `VALID SculptRecipe table`.

- [ ] **Step 5: Commit**

```powershell
git add schemas scripts/validate_sculpt_recipe.py tests
git commit -m "feat: validate sculpt recipes"
```

### Task 3: Runtime asset contract

**Files:**
- Create: `runtime/SculptRuntime.js`
- Create: `tests/js/sculpt-runtime.test.mjs`

- [ ] **Step 1: Write the failing runtime tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createSculptRuntime, validateSculptAsset } from '../../runtime/SculptRuntime.js';

test('creates stable runtime maps', () => {
  const root = new THREE.Group();
  const runtime = createSculptRuntime(root, { assetId: 'table' });
  assert.equal(root.userData.sculptRuntime, runtime);
  assert.deepEqual(Object.keys(runtime.sockets), []);
});

test('rejects affordance with a missing socket', () => {
  const root = new THREE.Group();
  createSculptRuntime(root, {
    assetId: 'chair',
    affordances: { sit: { targetSocket: 'seat' } }
  });
  assert.deepEqual(validateSculptAsset(root), ['affordance sit references missing socket seat']);
});
```

- [ ] **Step 2: Run and verify RED**

Run: `npm test`

Expected: module-not-found failure for `runtime/SculptRuntime.js`.

- [ ] **Step 3: Implement the runtime maps and validator**

```js
export function createSculptRuntime(root, values = {}) {
  const runtime = {
    schemaVersion: '1.0',
    assetId: values.assetId,
    nodes: values.nodes || {},
    meshes: values.meshes || {},
    sockets: values.sockets || {},
    colliders: values.colliders || {},
    articulation: values.articulation || {},
    affordances: values.affordances || {},
    actionPrograms: values.actionPrograms || {},
    destructionGroups: values.destructionGroups || {},
    bounds: values.bounds || {},
    metadata: values.metadata || {}
  };
  root.userData.sculptRuntime = runtime;
  return runtime;
}
```

`validateSculptAsset(root)` returns deterministic error strings for missing nodes, sockets, articulation targets, action programs, invalid axes, and absent asset IDs.

- [ ] **Step 4: Verify GREEN**

Run: `npm test`

Expected: all JavaScript tests pass.

- [ ] **Step 5: Commit**

```powershell
git add runtime/SculptRuntime.js tests/js/sculpt-runtime.test.mjs
git commit -m "feat: define runtime asset contract"
```

### Task 4: Deterministic quality controls

**Files:**
- Create: `runtime/quality.js`
- Create: `tests/js/quality.test.mjs`

- [ ] **Step 1: Write failing quality tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveQuality } from '../../runtime/quality.js';

test('maps normalized quality to deterministic segment counts', () => {
  assert.deepEqual(resolveQuality({ detail: 0, geometryQuality: 0, materialQuality: 0 }), {
    detail: 0, radialSegments: 6, bevelSegments: 1, textureSize: 256
  });
  assert.deepEqual(resolveQuality({ detail: 1, geometryQuality: 1, materialQuality: 1 }), {
    detail: 1, radialSegments: 24, bevelSegments: 4, textureSize: 2048
  });
});
```

- [ ] **Step 2: Run and verify RED**

Run: `npm test`

Expected: module-not-found failure for `runtime/quality.js`.

- [ ] **Step 3: Implement the fixed mapping**

Use clamped normalized inputs and fixed interpolation. No device probing or adaptive heuristic belongs in v1.

- [ ] **Step 4: Verify GREEN and commit**

Run: `npm test`

```powershell
git add runtime/quality.js tests/js/quality.test.mjs
git commit -m "feat: resolve deterministic asset quality"
```

### Task 5: Table golden asset

**Files:**
- Create: `generators/createTable.js`
- Create: `examples/table.html`
- Create: `tests/js/table.test.mjs`
- Modify: `README.md`

- [ ] **Step 1: Write a failing table contract test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createTable } from '../../generators/createTable.js';

test('table exposes surface and collider contracts at every LOD', () => {
  for (const detail of [0, 0.5, 1]) {
    const table = createTable({ id: 'table', seed: 1, detail });
    const runtime = table.userData.sculptRuntime;
    assert.ok(runtime.sockets['surface-top']);
    assert.ok(runtime.colliders.body);
    assert.equal(runtime.nodes.legFrontLeft.name, 'legFrontLeft');
  }
});
```

- [ ] **Step 2: Run and verify RED**

Run: `npm test`

Expected: module-not-found failure for `generators/createTable.js`.

- [ ] **Step 3: Implement the minimum table factory**

Use one top pivot, four named leg pivots, one `surface-top` socket, and one box collider descriptor. Detail changes bevel/brace geometry but never semantic IDs.

- [ ] **Step 4: Add the browser example**

`examples/table.html` must provide three native range inputs named `detail`, `geometryQuality`, and `materialQuality`, regenerate on input, dispose old geometry/materials, and display triangle/draw-call counts.

- [ ] **Step 5: Verify and commit**

Run: `npm test; node --check generators/createTable.js; git diff --check`

Open `examples/table.html` from a local server and verify the surface socket stays on the tabletop while quality changes.

```powershell
git add generators/createTable.js examples/table.html tests/js/table.test.mjs README.md
git commit -m "feat: add parameterized table asset"
```
