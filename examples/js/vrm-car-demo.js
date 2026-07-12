import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';

import { createCar } from '../../generators/createCar.js';
import { normalizedPoseXSign, VRMAffordanceAdapter } from '../../runtime/VRMAffordanceAdapter.js';
import { VehicleController } from '../../runtime/VehicleController.js';


const modelUrl = new URL(location.href).searchParams.get('vrm');
const viewport = document.getElementById('viewport');
const status = document.getElementById('status');
const openDoorButton = document.getElementById('openDoorButton');
const enterButton = document.getElementById('enterButton');
const exitButton = document.getElementById('exitButton');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101419);
const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 200);
camera.position.set(5.5, 3.2, 6.5);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(devicePixelRatio);
renderer.shadowMap.enabled = true;
viewport.append(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.8, 0);
scene.add(new THREE.HemisphereLight(0xddeeff, 0x283340, 2.2));
const key = new THREE.DirectionalLight(0xffffff, 3.5);
key.position.set(4, 7, 5);
scene.add(key);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: 0x303b46, roughness: 1 }));
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);
const car = createCar({ id: 'car-demo', detail: 1, geometryQuality: 0.7, materialQuality: 0.6 });
scene.add(car);
const vehicle = new VehicleController(car);
const keys = new Set();
const savedPose = new Map();
let vrm;
let adapter;
let poseXSign = 1;

function bone(name) {
  return vrm?.humanoid?.getNormalizedBoneNode?.(name) || vrm?.humanoid?.getRawBoneNode?.(name);
}

async function playPose(name) {
  if (name !== 'sit') return;
  for (const [boneName, angle] of [['leftUpperLeg', -1.15], ['rightUpperLeg', -1.15], ['leftLowerLeg', 1.35], ['rightLowerLeg', 1.35]]) {
    const node = bone(boneName);
    if (!node) continue;
    if (!savedPose.has(node)) savedPose.set(node, node.quaternion.clone());
    node.rotation.x += angle * poseXSign;
  }
}

async function stopPose() {
  for (const [node, quaternion] of savedPose) node.quaternion.copy(quaternion);
  savedPose.clear();
}

function updateButtons() {
  openDoorButton.textContent = vehicle.doorOpen ? 'Close Door' : 'Open Door';
  enterButton.disabled = !adapter || vehicle.driverOccupied;
  exitButton.disabled = !adapter || !vehicle.driverOccupied;
}

openDoorButton.addEventListener('click', () => {
  try {
    if (vehicle.doorOpen) vehicle.closeDoor(); else vehicle.openDoor();
  } catch (error) {
    status.textContent = error.message;
  }
  updateButtons();
});

enterButton.addEventListener('click', async () => {
  try {
    if (!vehicle.doorOpen) vehicle.openDoor();
    await adapter.enter('enter-vehicle');
    vehicle.enterDriver();
    vehicle.closeDoor();
    vehicle.startDrive();
  } catch (error) {
    status.textContent = `ENTER_FAILED · ${error.message}`;
  }
  updateButtons();
});

exitButton.addEventListener('click', async () => {
  try {
    vehicle.openDoor();
    await adapter.exit();
    vehicle.exitDriver();
  } catch (error) {
    status.textContent = `EXIT_FAILED · ${error.message}`;
  }
  updateButtons();
});

for (const type of ['keydown', 'keyup']) {
  window.addEventListener(type, event => {
    if (!['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'].includes(event.code)) return;
    event.preventDefault();
    if (type === 'keydown') keys.add(event.code); else keys.delete(event.code);
  });
}

async function loadVrm() {
  if (!modelUrl) throw new Error('missing vrm query parameter');
  const loader = new GLTFLoader();
  loader.register(parser => new VRMLoaderPlugin(parser));
  const gltf = await loader.loadAsync(modelUrl);
  vrm = gltf.userData.vrm;
  if (!vrm) throw new Error('model does not contain VRM data');
  VRMUtils.rotateVRM0(vrm);
  poseXSign = normalizedPoseXSign(vrm.scene);
  vrm.scene.position.set(-2.2, 0, 0.5);
  vrm.scene.traverse(node => { node.frustumCulled = false; });
  vrm.playPose = playPose;
  vrm.stopPose = stopPose;
  scene.add(vrm.scene);
  adapter = new VRMAffordanceAdapter(vrm, car);
  updateButtons();
}

function resize() {
  const width = viewport.clientWidth;
  const height = viewport.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', resize);
resize();
loadVrm().catch(error => { status.textContent = `LOAD_FAILED · ${error.message}`; });
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const delta = Math.min(clock.getDelta(), 0.05);
  if (vehicle.mode === 'driving') {
    const throttle = (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0);
    const steering = (keys.has('KeyA') ? 1 : 0) - (keys.has('KeyD') ? 1 : 0);
    vehicle.setInput({ throttle, steering, brake: keys.has('Space') || throttle === 0 ? 1 : 0 });
    vehicle.update(delta);
  }
  vrm?.update(delta);
  adapter?.update();
  controls.target.lerp(new THREE.Vector3(car.position.x, 0.8, car.position.z), 0.08);
  controls.update();
  status.textContent = `STATE ${vehicle.mode}\nSPEED ${vehicle.speed.toFixed(2)} m/s\nSTEER ${vehicle.steering.toFixed(2)} rad\nDRIVER ${vehicle.driverOccupied ? 'YES' : 'NO'}\nDOOR ${(vehicle.articulation.getValue('leftDoor') * 180 / Math.PI).toFixed(0)}°`;
  renderer.render(scene, camera);
});
