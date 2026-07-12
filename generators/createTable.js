import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

import { createSculptRuntime } from '../runtime/SculptRuntime.js';
import { resolveQuality } from '../runtime/quality.js';


function addBox(parent, name, size, position, material, meshes, bevelSegments) {
  const radius = Math.min(...size) * 0.08;
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(...size, bevelSegments, radius), material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  meshes[name] = mesh;
  return mesh;
}


function addLeg(root, name, x, z, size, material, nodes, meshes, bevelSegments) {
  const pivot = new THREE.Group();
  pivot.name = name;
  pivot.position.set(x, 0, z);
  root.add(pivot);
  nodes[name] = pivot;
  addBox(pivot, `${name}Mesh`, size, [0, size[1] / 2, 0], material, meshes, bevelSegments);
}


export function createTable(options = {}) {
  const id = options.id || 'table';
  const width = options.width ?? 1.4;
  const height = options.height ?? 0.75;
  const depth = options.depth ?? 0.75;
  const topThickness = options.topThickness ?? 0.08;
  const legSize = options.legSize ?? 0.09;
  const quality = resolveQuality(options);
  const materialQuality = THREE.MathUtils.clamp(options.materialQuality ?? 0.5, 0, 1);

  const root = new THREE.Group();
  root.name = id;
  const nodes = { root };
  const meshes = {};
  const wood = new THREE.MeshStandardMaterial({
    color: options.color ?? 0x8a5a36,
    roughness: THREE.MathUtils.lerp(0.92, 0.62, materialQuality),
    metalness: 0,
  });

  const top = new THREE.Group();
  top.name = 'top';
  root.add(top);
  nodes.top = top;
  addBox(top, 'topMesh', [width, topThickness, depth], [0, height - topThickness / 2, 0], wood, meshes, quality.bevelSegments);

  const x = width / 2 - legSize;
  const z = depth / 2 - legSize;
  const legHeight = height - topThickness;
  const legDimensions = [legSize, legHeight, legSize];
  addLeg(root, 'legFrontLeft', -x, z, legDimensions, wood, nodes, meshes, quality.bevelSegments);
  addLeg(root, 'legFrontRight', x, z, legDimensions, wood, nodes, meshes, quality.bevelSegments);
  addLeg(root, 'legBackLeft', -x, -z, legDimensions, wood, nodes, meshes, quality.bevelSegments);
  addLeg(root, 'legBackRight', x, -z, legDimensions, wood, nodes, meshes, quality.bevelSegments);

  if (quality.detail >= 0.5) {
    const braceHeight = height * 0.42;
    addBox(root, 'braceFront', [width - legSize * 2, legSize * 0.65, legSize * 0.65], [0, braceHeight, z], wood, meshes, quality.bevelSegments);
    addBox(root, 'braceBack', [width - legSize * 2, legSize * 0.65, legSize * 0.65], [0, braceHeight, -z], wood, meshes, quality.bevelSegments);
  }

  const surfaceTop = new THREE.Object3D();
  surfaceTop.name = 'surface-top';
  surfaceTop.position.set(0, height, 0);
  root.add(surfaceTop);

  createSculptRuntime(root, {
    assetId: id,
    nodes,
    meshes,
    sockets: { 'surface-top': surfaceTop },
    colliders: {
      body: { type: 'box', center: [0, height / 2, 0], size: [width, height, depth] },
    },
    bounds: { center: [0, height / 2, 0], size: [width, height, depth] },
    metadata: {
      profile: 'prop',
      seed: options.seed ?? 1,
      units: 'meters',
      upAxis: '+Y',
      forwardAxis: '+Z',
      origin: 'ground-center',
      quality,
    },
  });
  return root;
}
