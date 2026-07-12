import * as THREE from 'three';

import { createSculptRuntime } from '../runtime/SculptRuntime.js';
import { resolveQuality } from '../runtime/quality.js';


function pivot(parent, id, position, nodes) {
  const value = new THREE.Group();
  value.name = id;
  value.position.set(...position);
  parent.add(value);
  nodes[id] = value;
  return value;
}

function visual(parent, id, geometry, material, position, meshes) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = id;
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  meshes[id] = mesh;
  return mesh;
}

function socket(parent, id, position) {
  const value = new THREE.Object3D();
  value.name = id;
  value.position.set(...position);
  value.userData.exportable = false;
  parent.add(value);
  return value;
}


export function createCar(options = {}) {
  const id = options.id || 'car';
  const width = options.width ?? 1.8;
  const length = options.length ?? 4.2;
  const wheelbase = options.wheelbase ?? 2.5;
  const wheelRadius = options.wheelRadius ?? 0.34;
  const quality = resolveQuality(options);
  const root = new THREE.Group();
  root.name = id;
  const nodes = { root };
  const meshes = {};
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: options.color ?? 0x356fa3, roughness: 0.48, metalness: 0.18 });
  const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x17191b, roughness: 0.82 });
  const glassMaterial = new THREE.MeshStandardMaterial({ color: 0x7fa6b8, roughness: 0.22, metalness: 0.05 });
  const body = pivot(root, 'body', [0, 0, 0], nodes);

  visual(body, 'bodyShellMesh', new THREE.BoxGeometry(width * 0.94, 0.55, length * 0.88), bodyMaterial, [0, 0.62, 0], meshes);
  visual(body, 'cabinMesh', new THREE.BoxGeometry(width * 0.76, 0.68, length * 0.38), glassMaterial, [0, 1.18, -0.25], meshes);
  visual(body, 'hoodMesh', new THREE.BoxGeometry(width * 0.82, 0.18, length * 0.28), bodyMaterial, [0, 0.94, length * 0.29], meshes);

  const doorLength = 0.96;
  for (const [nodeId, side] of [['doorLeftFront', -1], ['doorRightFront', 1]]) {
    const door = pivot(body, nodeId, [side * width * 0.47, 1.02, 0.68], nodes);
    visual(door, `${nodeId}Mesh`, new THREE.BoxGeometry(0.06, 0.62, doorLength), bodyMaterial, [0, 0, -doorLength / 2], meshes);
  }

  const wheelZ = wheelbase / 2;
  const wheelX = width / 2;
  const wheelGeometry = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.24, quality.radialSegments);
  function wheel(id, position, parent = body) {
    const value = pivot(parent, id, position, nodes);
    const mesh = visual(value, `${id}Mesh`, wheelGeometry, darkMaterial, [0, 0, 0], meshes);
    mesh.rotation.z = Math.PI / 2;
    return value;
  }
  for (const [side, x] of [['Left', -wheelX], ['Right', wheelX]]) {
    const steering = pivot(body, `steeringFront${side}`, [x, wheelRadius, wheelZ], nodes);
    wheel(`wheelFront${side}`, [0, 0, 0], steering);
    wheel(`wheelRear${side}`, [x, wheelRadius, -wheelZ]);
  }

  const steeringWheel = pivot(body, 'steeringWheel', [-0.43, 1.2, 0.38], nodes);
  const steeringMesh = visual(steeringWheel, 'steeringWheelMesh', new THREE.TorusGeometry(0.18, 0.025, 6, quality.radialSegments), darkMaterial, [0, 0, 0], meshes);
  steeringMesh.rotation.x = Math.PI / 2;

  if (quality.detail >= 0.5) {
    const lampMaterial = new THREE.MeshStandardMaterial({ color: 0xffe4a3, emissive: 0x664415, emissiveIntensity: 0.6 });
    visual(body, 'headlightsMesh', new THREE.BoxGeometry(width * 0.66, 0.12, 0.035), lampMaterial, [0, 0.73, length * 0.442], meshes);
  }

  const sockets = {
    driverSeat: socket(root, 'driverSeat', [-0.43, 0.82, 0.18]),
    passengerSeat: socket(root, 'passengerSeat', [0.43, 0.82, 0.18]),
    driverEntry: socket(root, 'driverEntry', [-1.18, 0, 0.34]),
    driverExit: socket(root, 'driverExit', [-1.5, 0, 0.34]),
    driverCamera: socket(root, 'driverCamera', [0, 1.42, -0.72]),
  };

  createSculptRuntime(root, {
    assetId: id,
    nodes,
    meshes,
    sockets,
    colliders: {
      body: { type: 'box', center: [0, 0.72, 0], size: [width, 1.44, length] },
      driverEntry: { type: 'capsule', center: [-1.18, 0.9, 0.34], radius: 0.45, height: 1.8, isTrigger: true },
    },
    articulation: {
      leftDoor: { type: 'hinge', node: 'doorLeftFront', axis: [0, 1, 0], limits: [0, 1.2], defaultValue: 0 },
      rightDoor: { type: 'hinge', node: 'doorRightFront', axis: [0, 1, 0], limits: [-1.2, 0], defaultValue: 0 },
      wheelFrontLeft: { type: 'continuous', node: 'wheelFrontLeft', axis: [1, 0, 0], defaultValue: 0 },
      wheelFrontRight: { type: 'continuous', node: 'wheelFrontRight', axis: [1, 0, 0], defaultValue: 0 },
      wheelRearLeft: { type: 'continuous', node: 'wheelRearLeft', axis: [1, 0, 0], defaultValue: 0 },
      wheelRearRight: { type: 'continuous', node: 'wheelRearRight', axis: [1, 0, 0], defaultValue: 0 },
      steeringFrontLeft: { type: 'hinge', node: 'steeringFrontLeft', axis: [0, 1, 0], limits: [-0.5, 0.5], defaultValue: 0 },
      steeringFrontRight: { type: 'hinge', node: 'steeringFrontRight', axis: [0, 1, 0], limits: [-0.5, 0.5], defaultValue: 0 },
      steeringWheel: { type: 'hinge', node: 'steeringWheel', axis: [0, 0, 1], limits: [-0.7, 0.7], defaultValue: 0 },
    },
    affordances: {
      'open-door': { verb: 'open', actionProgram: 'open-door' },
      'enter-vehicle': { verb: 'enter', targetSocket: 'driverSeat', approachSocket: 'driverEntry', exitSocket: 'driverExit', requirements: ['humanoid'], actionProgram: 'enter-driver-seat' },
      'exit-vehicle': { verb: 'exit', targetSocket: 'driverSeat', exitSocket: 'driverExit', requirements: ['humanoid'], actionProgram: 'exit-driver-seat' },
      drive: { verb: 'drive', targetSocket: 'driverSeat', requirements: ['driver'], actionProgram: 'drive' },
    },
    actionPrograms: {
      'open-door': { articulation: [{ joint: 'leftDoor', value: 1.2 }] },
      'close-door': { articulation: [{ joint: 'leftDoor', value: 0 }] },
      'enter-driver-seat': { pose: 'sit', targetSocket: 'driverSeat', followTarget: true },
      'exit-driver-seat': { pose: 'stand', targetSocket: 'driverExit', followTarget: false },
      drive: { targetSocket: 'driverSeat', followTarget: true },
    },
    bounds: { center: [0, 0.75, 0], size: [width, 1.5, length] },
    metadata: {
      profile: 'vehicle', units: 'meters', origin: 'ground-center', up: [0, 1, 0], forward: [0, 0, 1],
      wheelbase, wheelRadius, trackWidth: width, quality,
    },
  });
  return root;
}
