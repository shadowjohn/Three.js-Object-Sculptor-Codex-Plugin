# GLB Export and Manifest Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Export deterministic LOD GLBs and finalize a validated asset manifest only after reload verification.

**Architecture:** Separate pure manifest construction from browser-only `GLTFExporter`. The exporter returns in-memory artifacts; a package writer downloads them only after every LOD succeeds.

**Tech Stack:** Three.js `GLTFExporter`/`GLTFLoader`, Web Crypto SHA-256, ES modules, Node tests, browser smoke page.

---

### Task 1: Manifest builder

**Files:**
- Create: `schemas/asset-manifest-v1.schema.json`
- Create: `runtime/buildAssetManifest.js`
- Create: `tests/js/asset-manifest.test.mjs`

- [ ] **Step 1: Write failing manifest tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAssetManifest } from '../../runtime/buildAssetManifest.js';

test('builds ordered LOD entries and semantic metadata', async () => {
  const manifest = await buildAssetManifest({
    recipe: { schemaVersion: '1.0', id: 'table', units: 'meters' },
    generatorVersion: '1.0.0',
    runtime: { sockets: { 'surface-top': {} }, articulation: {}, affordances: {} },
    lods: [{ level: 1, url: 'table-lod1.glb', maxDistance: 80 }, { level: 0, url: 'table-lod0.glb', maxDistance: 25 }]
  });
  assert.deepEqual(manifest.lods.map(item => item.level), [0, 1]);
  assert.deepEqual(manifest.sockets, ['surface-top']);
  assert.match(manifest.recipeHash, /^[a-f0-9]{64}$/);
});
```

- [ ] **Step 2: Run and verify RED**

Run: `npm test`

Expected: module-not-found failure.

- [ ] **Step 3: Implement pure manifest construction**

Canonicalize recipe objects by recursively sorting keys before SHA-256 hashing. Reject duplicate LOD levels and non-increasing distance bands.

- [ ] **Step 4: Verify and commit**

Run: `npm test`

```powershell
git add schemas/asset-manifest-v1.schema.json runtime/buildAssetManifest.js tests/js/asset-manifest.test.mjs
git commit -m "feat: build asset manifests"
```

### Task 2: Browser GLB exporter

**Files:**
- Create: `runtime/exportSculptAsset.js`
- Create: `tests/js/export-contract.test.mjs`
- Create: `examples/export-table.html`

- [ ] **Step 1: Write the static export contract test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('exporter uses binary GLTFExporter and excludes debug helpers', async () => {
  const source = await readFile('runtime/exportSculptAsset.js', 'utf8');
  assert.match(source, /new GLTFExporter\(\)/);
  assert.match(source, /binary: true/);
  assert.match(source, /userData\.exportable/);
});
```

- [ ] **Step 2: Run and verify RED**

Run: `npm test`

Expected: file-not-found failure.

- [ ] **Step 3: Implement `exportSculptAsset`**

```js
export async function exportSculptAsset(root, options = {}) {
  const clone = root.clone(true);
  clone.traverse(node => {
    if (node.userData.exportable === false) node.removeFromParent();
  });
  return exporter.parseAsync(clone, { binary: true, onlyVisible: true });
}
```

The final implementation must remove excluded nodes in a second traversal to avoid mutating the tree while iterating, preserve semantic node names, and return an `ArrayBuffer`.

- [ ] **Step 4: Add browser export/reload smoke**

`examples/export-table.html` generates the table, exports GLB, parses the returned bytes with `GLTFLoader.parse`, validates named nodes and bounds, then enables a download button. Display `EXPORT_OK` only after reload passes.

- [ ] **Step 5: Verify and commit**

Run: `npm test; node --check runtime/exportSculptAsset.js`

Open the example and verify `EXPORT_OK` without console errors.

```powershell
git add runtime/exportSculptAsset.js tests/js/export-contract.test.mjs examples/export-table.html
git commit -m "feat: export runtime assets as glb"
```

### Task 3: Atomic LOD package

**Files:**
- Create: `runtime/exportAssetPackage.js`
- Create: `tests/js/export-package.test.mjs`
- Modify: `examples/export-table.html`

- [ ] **Step 1: Write failing package tests with an injected exporter**

```js
test('does not finalize manifest when one LOD export fails', async () => {
  const calls = [];
  await assert.rejects(() => exportAssetPackage(recipe, {
    createAsset: ({ detail }) => ({ detail }),
    exportAsset: async asset => {
      calls.push(asset.detail);
      if (asset.detail === 0.5) throw new Error('LOD1 failed');
      return new ArrayBuffer(4);
    }
  }), /LOD1 failed/);
  assert.deepEqual(calls, [1, 0.5]);
});
```

- [ ] **Step 2: Run RED, implement, then run GREEN**

The implementation generates LOD0-LOD2 in order, validates each reloaded artifact through an injected callback, and calls `buildAssetManifest` only after all artifacts succeed.

Run: `npm test`

- [ ] **Step 3: Verify browser package download and commit**

The table example downloads `recipe.json`, three GLBs, and `asset-manifest.json`; each manifest URL matches a produced filename.

```powershell
git add runtime/exportAssetPackage.js tests/js/export-package.test.mjs examples/export-table.html
git commit -m "feat: package lod assets atomically"
```

### Task 4: Python manifest validation

**Files:**
- Create: `scripts/validate_asset_manifest.py`
- Create: `tests/python/test_validate_asset_manifest.py`
- Create: `tests/fixtures/manifests/table.valid.json`

- [ ] **Step 1: Write failing CLI tests**

Test valid units, axes, origin, bounds, recipe hash, ascending LODs, socket uniqueness, articulation references, affordance references, and license shape.

- [ ] **Step 2: Run RED and implement minimum validator**

Run: `python -m unittest tests.python.test_validate_asset_manifest -v`

- [ ] **Step 3: Run full verification and commit**

Run: `npm test; python -m unittest discover -s tests/python -p "test_*.py"; git diff --check`

```powershell
git add scripts/validate_asset_manifest.py tests
git commit -m "feat: validate exported asset manifests"
```
