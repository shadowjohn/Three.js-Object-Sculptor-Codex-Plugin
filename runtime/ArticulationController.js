import * as THREE from 'three';


const TAU = Math.PI * 2;

function wrap(value) {
  return ((value % TAU) + TAU) % TAU;
}


export class ArticulationController {
  constructor(asset) {
    this.asset = asset;
    this.joints = {};
    const runtime = asset?.userData?.sculptRuntime;
    if (!runtime) throw new Error('asset is missing sculptRuntime');

    for (const [id, joint] of Object.entries(runtime.articulation || {})) {
      const node = runtime.nodes[joint.node];
      if (!node) throw new Error(`articulation ${id} references missing node ${joint.node}`);
      if (!['hinge', 'slider', 'continuous'].includes(joint.type)) {
        throw new Error(`unsupported articulation type ${joint.type}`);
      }
      this.joints[id] = {
        joint,
        node,
        axis: new THREE.Vector3().fromArray(joint.axis).normalize(),
        basePosition: node.position.clone(),
        baseQuaternion: node.quaternion.clone(),
        value: 0,
      };
      this.setValue(id, joint.defaultValue ?? 0);
    }
  }

  setValue(id, requested) {
    const state = this.joints[id];
    if (!state) throw new Error(`unknown articulation ${id}`);
    const { joint, node } = state;
    let value = requested;
    if (joint.type === 'continuous') value = wrap(value);
    else if (joint.limits) value = THREE.MathUtils.clamp(value, joint.limits[0], joint.limits[1]);

    if (joint.type === 'slider') {
      node.position.copy(state.basePosition).addScaledVector(state.axis, value);
    } else {
      node.quaternion.copy(state.baseQuaternion).multiply(new THREE.Quaternion().setFromAxisAngle(state.axis, value));
    }
    state.value = value;
    return this;
  }

  getValue(id) {
    const state = this.joints[id];
    if (!state) throw new Error(`unknown articulation ${id}`);
    return state.value;
  }

  update() {
    return this;
  }
}
