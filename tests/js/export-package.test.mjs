import test from 'node:test';
import assert from 'node:assert/strict';

import { exportAssetPackage } from '../../runtime/exportAssetPackage.js';


const recipe = {
  schemaVersion: '1.0',
  id: 'table',
  profile: 'prop',
  units: 'meters',
  coordinateFrame: { up: '+Y', forward: '+Z', origin: 'ground-center' },
};


test('does not finalize manifest when one LOD export fails', async () => {
  const calls = [];
  let builtManifest = false;
  await assert.rejects(() => exportAssetPackage(recipe, {
    createAsset: ({ detail }) => ({ detail }),
    exportAsset: async asset => {
      calls.push(asset.detail);
      if (asset.detail === 0.5) throw new Error('LOD1 failed');
      return new ArrayBuffer(4);
    },
    validateArtifact: async () => {},
    buildManifest: async () => {
      builtManifest = true;
      return {};
    },
  }), /LOD1 failed/);
  assert.deepEqual(calls, [1, 0.5]);
  assert.equal(builtManifest, false);
});

test('exports and validates every LOD before building manifest', async () => {
  const validated = [];
  const result = await exportAssetPackage(recipe, {
    createAsset: quality => ({ quality, userData: { sculptRuntime: { metadata: { profile: 'prop' }, sockets: {}, colliders: {}, articulation: {}, affordances: {}, bounds: {} } } }),
    exportAsset: async asset => new Uint8Array([asset.quality.level]).buffer,
    validateArtifact: async (bytes, quality) => validated.push([new Uint8Array(bytes)[0], quality.level]),
    buildManifest: async values => ({ id: values.recipe.id, lods: values.lods }),
  });
  assert.deepEqual(validated, [[0, 0], [1, 1], [2, 2]]);
  assert.deepEqual(result.artifacts.map(item => item.filename), [
    'table-lod0.glb',
    'table-lod1.glb',
    'table-lod2.glb',
  ]);
  assert.deepEqual(result.manifest.lods.map(item => item.level), [0, 1, 2]);
});
