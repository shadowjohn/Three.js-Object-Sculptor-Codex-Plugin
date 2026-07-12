import test from 'node:test';
import assert from 'node:assert/strict';

import { createTable } from '../../generators/createTable.js';
import { validateSculptAsset } from '../../runtime/SculptRuntime.js';


test('table exposes stable surface and collider contracts at every detail', () => {
  for (const detail of [0, 0.5, 1]) {
    const table = createTable({ id: 'table', seed: 1, detail });
    const runtime = table.userData.sculptRuntime;
    assert.ok(runtime.sockets['surface-top']);
    assert.ok(runtime.colliders.body);
    assert.equal(runtime.nodes.legFrontLeft.name, 'legFrontLeft');
    assert.equal(runtime.nodes.legFrontRight.name, 'legFrontRight');
    assert.equal(runtime.nodes.legBackLeft.name, 'legBackLeft');
    assert.equal(runtime.nodes.legBackRight.name, 'legBackRight');
    assert.deepEqual(validateSculptAsset(table), []);
  }
});

test('detail adds braces without changing semantic node ids', () => {
  const low = createTable({ id: 'table', seed: 1, detail: 0 });
  const high = createTable({ id: 'table', seed: 1, detail: 1 });
  assert.equal(low.getObjectByName('braceFront'), undefined);
  assert.ok(high.getObjectByName('braceFront'));
  assert.deepEqual(
    Object.keys(low.userData.sculptRuntime.nodes).sort(),
    Object.keys(high.userData.sculptRuntime.nodes).sort(),
  );
});

test('surface socket is located at the physical tabletop height', () => {
  const table = createTable({ id: 'table', width: 1.6, height: 0.8, depth: 0.8, topThickness: 0.08 });
  assert.equal(table.userData.sculptRuntime.sockets['surface-top'].position.y, 0.8);
  assert.deepEqual(table.userData.sculptRuntime.bounds.size, [1.6, 0.8, 0.8]);
});

test('geometry and material quality change render cost without changing contracts', () => {
  const low = createTable({ id: 'table', detail: 0, geometryQuality: 0, materialQuality: 0 });
  const high = createTable({ id: 'table', detail: 0, geometryQuality: 1, materialQuality: 1 });
  const triangleCount = root => {
    let count = 0;
    root.traverse(node => {
      if (node.geometry) {
        count += (node.geometry.index?.count ?? node.geometry.attributes.position.count) / 3;
      }
    });
    return count;
  };
  assert.ok(triangleCount(high) > triangleCount(low));
  assert.ok(high.userData.sculptRuntime.meshes.topMesh.material.roughness < low.userData.sculptRuntime.meshes.topMesh.material.roughness);
  assert.deepEqual(
    Object.keys(high.userData.sculptRuntime.nodes).sort(),
    Object.keys(low.userData.sculptRuntime.nodes).sort(),
  );
});
