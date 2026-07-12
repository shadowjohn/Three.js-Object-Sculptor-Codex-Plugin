import * as THREE from 'three';


const SCALE_MODES = new Set(['fixed', 'avatar-height', 'head-width', 'hand-length']);


function boneNode(vrm, name) {
  const humanoid = vrm?.humanoid;
  return humanoid?.getNormalizedBoneNode?.(name) || humanoid?.getRawBoneNode?.(name) || null;
}


function scaleFor(runtime, options) {
  const mode = options.scaleMode || 'fixed';
  if (!SCALE_MODES.has(mode)) throw new Error(`unsupported scale mode ${mode}`);
  if (mode === 'fixed') return options.scale ?? 1;
  const key = mode.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  const target = options.measurements?.[key];
  const reference = runtime.metadata?.referenceSize?.[key];
  if (!(target > 0) || !(reference > 0)) {
    throw new Error(`scale mode ${mode} requires positive ${key} measurements`);
  }
  return target / reference;
}


function disposeAsset(asset) {
  asset.traverse(node => {
    node.geometry?.dispose();
    if (Array.isArray(node.material)) node.material.forEach(material => material.dispose());
    else node.material?.dispose();
  });
}


export function attachSculptAsset(vrm, asset, options = {}) {
  const runtime = asset?.userData?.sculptRuntime;
  if (!runtime) throw new Error('asset is missing sculptRuntime');
  const bone = boneNode(vrm, options.bone);
  if (!bone) throw new Error(`VRM is missing normalized bone ${options.bone}`);
  const socket = options.socket ? runtime.sockets[options.socket] : null;
  if (options.socket && !socket) throw new Error(`asset is missing socket ${options.socket}`);
  const scale = scaleFor(runtime, options);

  const original = {
    parent: asset.parent,
    position: asset.position.clone(),
    quaternion: asset.quaternion.clone(),
    scale: asset.scale.clone(),
  };
  const socketLocal = new THREE.Vector3();
  if (socket) {
    asset.updateWorldMatrix(true, false);
    socket.getWorldPosition(socketLocal);
    asset.worldToLocal(socketLocal);
  }

  bone.add(asset);
  asset.position.set(0, 0, 0);
  asset.rotation.set(...(options.rotation || [0, 0, 0]));
  asset.scale.setScalar(scale);
  const transformedSocket = socketLocal.multiplyScalar(scale).applyEuler(asset.rotation);
  asset.position.fromArray(options.offset || [0, 0, 0]).sub(transformedSocket);
  asset.updateWorldMatrix(true, true);

  let detached = false;
  return {
    asset,
    getWorldSocket(name) {
      const target = runtime.sockets[name];
      if (!target) throw new Error(`asset is missing socket ${name}`);
      return target.getWorldPosition(new THREE.Vector3());
    },
    setVisible(visible) {
      asset.visible = Boolean(visible);
    },
    detach() {
      if (detached) return;
      if (original.parent) original.parent.add(asset);
      else asset.removeFromParent();
      asset.position.copy(original.position);
      asset.quaternion.copy(original.quaternion);
      asset.scale.copy(original.scale);
      detached = true;
    },
    dispose() {
      asset.removeFromParent();
      disposeAsset(asset);
      detached = true;
    },
  };
}
