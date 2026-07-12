import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

import { createSculptRuntime } from '../runtime/SculptRuntime.js';
import { resolveQuality } from '../runtime/quality.js';


function component(root, id, geometry, material, position, nodes, meshes) {
  const pivot = new THREE.Group();
  pivot.name = id;
  pivot.position.set(...position);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = `${id}Mesh`;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  pivot.add(mesh);
  root.add(pivot);
  nodes[id] = pivot;
  meshes[mesh.name] = mesh;
  return pivot;
}


function socket(root, id, position) {
  const value = new THREE.Object3D();
  value.name = id;
  value.position.set(...position);
  value.userData.exportable = false;
  root.add(value);
  return value;
}


export function createChair(options = {}) {
  const id = options.id || 'chair';
  const width = options.width ?? 0.62;
  const depth = options.depth ?? 0.58;
  const seatHeight = options.seatHeight ?? 0.45;
  const seatThickness = options.seatThickness ?? 0.08;
  const backHeight = options.backHeight ?? 0.62;
  const legSize = options.legSize ?? 0.07;
  const quality = resolveQuality(options);
  const root = new THREE.Group();
  root.name = id;
  const nodes = { root };
  const meshes = {};
  const material = new THREE.MeshStandardMaterial({ color: options.color ?? 0x76513a, roughness: 0.72 });
  const rounded = (x, y, z) => new RoundedBoxGeometry(x, y, z, quality.bevelSegments, Math.min(x, y, z) * 0.08);

  component(root, 'seat', rounded(width, seatThickness, depth), material, [0, seatHeight - seatThickness / 2, 0], nodes, meshes);
  const back = component(root, 'back', rounded(width, backHeight, seatThickness), material,
    [0, seatHeight + backHeight / 2 - seatThickness / 2, -depth / 2 + seatThickness / 2], nodes, meshes);
  back.rotation.x = -0.08;

  const x = width / 2 - legSize;
  const z = depth / 2 - legSize;
  const legHeight = seatHeight - seatThickness;
  for (const [name, px, pz] of [
    ['legFrontLeft', -x, z], ['legFrontRight', x, z],
    ['legBackLeft', -x, -z], ['legBackRight', x, -z],
  ]) {
    component(root, name, rounded(legSize, legHeight, legSize), material, [px, legHeight / 2, pz], nodes, meshes);
  }

  if (quality.detail >= 0.5) {
    component(root, 'backRail', rounded(width * 0.82, seatThickness * 0.65, seatThickness * 0.65), material,
      [0, seatHeight + backHeight * 0.58, -depth / 2 + seatThickness], {}, meshes);
  }

  const sockets = {
    seat: socket(root, 'seatSocket', [0, seatHeight, 0]),
    sitApproach: socket(root, 'sitApproach', [0, 0, depth * 1.45]),
    sitExit: socket(root, 'sitExit', [width * 0.9, 0, depth * 1.25]),
  };
  createSculptRuntime(root, {
    assetId: id,
    nodes,
    meshes,
    sockets,
    colliders: {
      body: { type: 'box', center: [0, (seatHeight + backHeight) / 2, -depth * 0.18], size: [width, seatHeight + backHeight, depth] },
      clearance: { type: 'capsule', center: [0, 0.9, depth * 0.45], radius: width * 0.5, height: 1.8, isTrigger: true },
    },
    affordances: {
      sit: { verb: 'sit', targetSocket: 'seat', approachSocket: 'sitApproach', exitSocket: 'sitExit', actionProgram: 'sit-enter', requirements: ['humanoid'] },
    },
    actionPrograms: {
      'sit-enter': { pose: 'sit', targetSocket: 'seat', followTarget: true },
      'sit-exit': { pose: 'stand', targetSocket: 'sitExit', followTarget: false },
    },
    bounds: { center: [0, (seatHeight + backHeight) / 2, 0], size: [width, seatHeight + backHeight, depth] },
    metadata: { profile: 'prop', units: 'meters', seatHeight, seatForward: [0, 0, 1], origin: 'ground-center', quality },
  });
  return root;
}
