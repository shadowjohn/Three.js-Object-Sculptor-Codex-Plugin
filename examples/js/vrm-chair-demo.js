import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';

import { createChair } from '../../generators/createChair.js';
import { normalizedPoseXSign, VRMAffordanceAdapter } from '../../runtime/VRMAffordanceAdapter.js';


const pageUrl = new URL(location.href);
const modelUrl = pageUrl.searchParams.get('vrm');
const status = document.getElementById('status');
const viewport = document.getElementById('viewport');
const zOffset = document.getElementById('zOffset');
const zOffsetOutput = document.getElementById('zOffsetValue');
const thighAngle = document.getElementById('thighAngle');
const thighAngleOutput = document.getElementById('thighAngleValue');
const buttons = Object.fromEntries(['enter', 'exit', 'move', 'reset'].map(id => [id, document.getElementById(`${id}Button`)]));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f1511);
const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
camera.position.set(2.6, 1.7, 3.2);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(devicePixelRatio);
renderer.shadowMap.enabled = true;
viewport.append(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.85, 0);
controls.update();
scene.add(new THREE.HemisphereLight(0xeaffef, 0x253128, 2.5));
const key = new THREE.DirectionalLight(0xffffff, 3.5);
key.position.set(3, 5, 4);
scene.add(key);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshStandardMaterial({ color: 0x26352b, roughness: 1 }));
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);
const chair = createChair({
  id: 'chair-demo', detail: 1, geometryQuality: 0.65, materialQuality: 0.6,
  width: 0.31, depth: 0.29, seatThickness: 0.04, backHeight: 0.31, legSize: 0.035,
});
scene.add(chair);

let vrm;
let adapter;
let moved = false;
let poseXSign = 1;
let seatedBaseY = null;
let zOffsetValue = Number(zOffset.value);
const requestedZOffset = Number(pageUrl.searchParams.get('z'));
if (pageUrl.searchParams.has('z') && Number.isFinite(requestedZOffset)) {
  zOffsetValue = THREE.MathUtils.clamp(requestedZOffset, Number(zOffset.min), Number(zOffset.max));
}
zOffset.value = String(zOffsetValue);
zOffsetOutput.value = `${zOffsetValue >= 0 ? '+' : ''}${zOffsetValue.toFixed(3)} m`;
let thighAngleDegrees = Number(thighAngle.value);
const requestedThighAngle = Number(pageUrl.searchParams.get('thigh'));
if (pageUrl.searchParams.has('thigh') && Number.isFinite(requestedThighAngle)) {
  thighAngleDegrees = THREE.MathUtils.clamp(requestedThighAngle, Number(thighAngle.min), Number(thighAngle.max));
}
thighAngle.value = String(thighAngleDegrees);
thighAngleOutput.value = `${thighAngleDegrees.toFixed(0)}°`;
const savedPose = new Map();

function bone(name) {
  return vrm?.humanoid?.getNormalizedBoneNode?.(name) || vrm?.humanoid?.getRawBoneNode?.(name);
}

function applySitPose() {
  const upperLegAngle = -THREE.MathUtils.degToRad(thighAngleDegrees);
  for (const [boneName, angle] of [['leftUpperLeg', upperLegAngle], ['rightUpperLeg', upperLegAngle], ['leftLowerLeg', 1.35], ['rightLowerLeg', 1.35]]) {
    const node = bone(boneName);
    if (!node || !savedPose.has(node)) continue;
    node.quaternion.copy(savedPose.get(node));
    node.rotation.x += angle * poseXSign;
  }
}

async function playPose(name) {
  if (name !== 'sit') return;
  for (const boneName of ['leftUpperLeg', 'rightUpperLeg', 'leftLowerLeg', 'rightLowerLeg']) {
    const node = bone(boneName);
    if (node && !savedPose.has(node)) savedPose.set(node, node.quaternion.clone());
  }
  applySitPose();
}

async function stopPose() {
  for (const [node, quaternion] of savedPose) node.quaternion.copy(quaternion);
  savedPose.clear();
}

function updateButtons() {
  const ready = Boolean(adapter);
  buttons.enter.disabled = !ready || adapter.state !== 'idle';
  buttons.exit.disabled = !ready || adapter.state !== 'active';
  buttons.move.disabled = !ready;
  buttons.reset.disabled = !ready;
}

function applyZOffset() {
  if (seatedBaseY !== null) vrm.scene.position.y = seatedBaseY + zOffsetValue;
}

zOffset.addEventListener('input', () => {
  zOffsetValue = Number(zOffset.value);
  zOffsetOutput.value = `${zOffsetValue >= 0 ? '+' : ''}${zOffsetValue.toFixed(3)} m`;
  applyZOffset();
});

thighAngle.addEventListener('input', () => {
  thighAngleDegrees = Number(thighAngle.value);
  thighAngleOutput.value = `${thighAngleDegrees.toFixed(0)}°`;
  if (adapter?.state === 'active') applySitPose();
});

buttons.enter.addEventListener('click', async () => {
  try {
    await adapter.enter('sit');
    seatedBaseY = vrm.scene.position.y;
    applyZOffset();
    status.textContent = 'SIT_ACTIVE';
  } catch (error) {
    status.textContent = `SIT_FAILED · ${error.message}`;
  }
  updateButtons();
});

buttons.exit.addEventListener('click', async () => {
  try {
    await adapter.exit();
    seatedBaseY = null;
    status.textContent = 'SIT_EXITED';
  } catch (error) {
    status.textContent = `EXIT_FAILED · ${error.message}`;
  }
  updateButtons();
});

buttons.move.addEventListener('click', () => {
  moved = !moved;
  chair.position.x = moved ? 1 : 0;
  status.textContent = moved ? 'CHAIR_MOVED' : 'CHAIR_HOME';
});

buttons.reset.addEventListener('click', async () => {
  if (adapter.state === 'active') await adapter.exit();
  seatedBaseY = null;
  chair.position.set(0, 0, 0);
  vrm.scene.position.set(0, 0, 1.4);
  moved = false;
  status.textContent = 'RESET_OK';
  updateButtons();
});

async function loadVrm() {
  if (!modelUrl) throw new Error('missing vrm query parameter');
  const loader = new GLTFLoader();
  loader.register(parser => new VRMLoaderPlugin(parser));
  const gltf = await loader.loadAsync(modelUrl);
  vrm = gltf.userData.vrm;
  if (!vrm) throw new Error('model does not contain VRM data');
  VRMUtils.rotateVRM0(vrm);
  poseXSign = normalizedPoseXSign(vrm.scene);
  if (!bone('hips')) throw new Error('model is missing normalized hips');
  vrm.scene.position.set(0, 0, 1.4);
  vrm.scene.traverse(node => { node.frustumCulled = false; });
  scene.add(vrm.scene);
  vrm.playPose = playPose;
  vrm.stopPose = stopPose;
  adapter = new VRMAffordanceAdapter(vrm, chair);
  status.textContent = `READY · ${modelUrl}`;
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
  const delta = clock.getDelta();
  vrm?.update(delta);
  adapter?.update();
  controls.update();
  renderer.render(scene, camera);
});
