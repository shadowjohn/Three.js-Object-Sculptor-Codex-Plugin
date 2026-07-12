import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveQuality } from '../../runtime/quality.js';


test('maps normalized quality to deterministic endpoints', () => {
  assert.deepEqual(resolveQuality({ detail: 0, geometryQuality: 0, materialQuality: 0 }), {
    detail: 0,
    radialSegments: 6,
    bevelSegments: 1,
    textureSize: 256,
  });
  assert.deepEqual(resolveQuality({ detail: 1, geometryQuality: 1, materialQuality: 1 }), {
    detail: 1,
    radialSegments: 24,
    bevelSegments: 4,
    textureSize: 2048,
  });
});

test('clamps inputs and uses stable discrete steps', () => {
  assert.deepEqual(resolveQuality({ detail: -1, geometryQuality: 0.5, materialQuality: 2 }), {
    detail: 0,
    radialSegments: 15,
    bevelSegments: 3,
    textureSize: 2048,
  });
  assert.deepEqual(resolveQuality({}), {
    detail: 0.5,
    radialSegments: 15,
    bevelSegments: 3,
    textureSize: 1024,
  });
});
