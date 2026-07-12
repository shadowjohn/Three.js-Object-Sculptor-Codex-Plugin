import test from 'node:test';
import assert from 'node:assert/strict';

import { buildAssetManifest } from '../../runtime/buildAssetManifest.js';


const input = () => ({
  recipe: {
    schemaVersion: '1.0',
    id: 'table',
    units: 'meters',
    coordinateFrame: { up: '+Y', forward: '+Z', origin: 'ground-center' },
  },
  generatorVersion: '1.0.0',
  runtime: {
    nodes: { top: {} },
    sockets: { 'surface-top': {} },
    colliders: { body: { type: 'box' } },
    articulation: {},
    affordances: {},
    actionPrograms: { inspect: { steps: [] } },
    bounds: { center: [0, 0.4, 0], size: [1.4, 0.8, 0.75] },
    metadata: { profile: 'prop' },
  },
  lods: [
    { level: 1, url: 'table-lod1.glb', maxDistance: 80 },
    { level: 0, url: 'table-lod0.glb', maxDistance: 25 },
  ],
});


test('builds ordered LOD entries and semantic metadata', async () => {
  const manifest = await buildAssetManifest(input());
  assert.equal(manifest.schemaVersion, '1.0');
  assert.equal(manifest.id, 'table');
  assert.deepEqual(manifest.lods.map(item => item.level), [0, 1]);
  assert.deepEqual(manifest.sockets, ['surface-top']);
  assert.deepEqual(manifest.colliders, ['body']);
  assert.deepEqual(manifest.nodes, ['top']);
  assert.deepEqual(Object.keys(manifest.actionPrograms), ['inspect']);
  assert.match(manifest.recipeHash, /^[a-f0-9]{64}$/);
});

test('recipe hash is independent of object key order', async () => {
  const first = await buildAssetManifest(input());
  const values = input();
  values.recipe = {
    units: 'meters',
    id: 'table',
    coordinateFrame: { origin: 'ground-center', forward: '+Z', up: '+Y' },
    schemaVersion: '1.0',
  };
  const second = await buildAssetManifest(values);
  assert.equal(first.recipeHash, second.recipeHash);
});

test('rejects duplicate LOD levels', async () => {
  const values = input();
  values.lods[1].level = 1;
  await assert.rejects(() => buildAssetManifest(values), /duplicate LOD level 1/);
});

test('rejects non-increasing LOD distance bands', async () => {
  const values = input();
  values.lods = [
    { level: 0, url: 'table-lod0.glb', maxDistance: 80 },
    { level: 1, url: 'table-lod1.glb', maxDistance: 25 },
  ];
  await assert.rejects(() => buildAssetManifest(values), /LOD maxDistance must increase/);
});
