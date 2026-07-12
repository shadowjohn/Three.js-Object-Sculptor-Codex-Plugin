import * as THREE from 'three';


function normalizedBone(vrm, name) {
  return vrm?.humanoid?.getNormalizedBoneNode?.(name) || vrm?.humanoid?.getRawBoneNode?.(name) || null;
}


function worldQuaternion(object) {
  return object.getWorldQuaternion(new THREE.Quaternion());
}


export class VRMAffordanceAdapter {
  constructor(avatar, asset) {
    this.avatar = avatar;
    this.asset = asset;
    this.state = 'idle';
    this.activeAffordance = null;
    this.originalParent = null;
  }

  async enter(id) {
    if (this.state !== 'idle') throw new Error(`cannot enter while ${this.state}`);
    const runtime = this.asset?.userData?.sculptRuntime;
    const affordance = runtime?.affordances?.[id];
    if (!affordance) throw new Error(`asset is missing affordance ${id}`);
    const target = runtime.sockets[affordance.targetSocket];
    if (!target) throw new Error(`affordance ${id} is missing target socket ${affordance.targetSocket}`);
    const program = runtime.actionPrograms[affordance.actionProgram];
    if (!program) throw new Error(`affordance ${id} is missing action program ${affordance.actionProgram}`);
    const hips = normalizedBone(this.avatar, 'hips');
    if (!hips) throw new Error('avatar is missing normalized hips bone');
    if (!this.avatar?.scene) throw new Error('avatar is missing scene root');

    this.state = 'entering';
    this.originalParent = this.avatar.scene.parent;
    try {
      await this.avatar.playPose?.(program.pose);
      this.avatar.scene.updateWorldMatrix(true, false);
      const hipsLocal = this.avatar.scene.worldToLocal(hips.getWorldPosition(new THREE.Vector3()));
      target.add(this.avatar.scene);
      this.avatar.scene.quaternion.identity();
      this.avatar.scene.position.copy(hipsLocal).multiply(this.avatar.scene.scale).multiplyScalar(-1);
      this.avatar.scene.updateWorldMatrix(true, true);
      this.activeAffordance = { id, affordance, program, target };
      this.state = 'active';
    } catch (error) {
      this.state = 'idle';
      this.activeAffordance = null;
      throw error;
    }
  }

  update() {
    if (this.state === 'active') this.avatar.scene.updateWorldMatrix(true, true);
  }

  async exit() {
    if (this.state !== 'active') throw new Error(`cannot exit while ${this.state}`);
    this.state = 'exiting';
    const runtime = this.asset.userData.sculptRuntime;
    const exitSocket = runtime.sockets[this.activeAffordance.affordance.exitSocket];
    if (!exitSocket) throw new Error('active affordance is missing exit socket');
    const exitPosition = exitSocket.getWorldPosition(new THREE.Vector3());
    const exitQuaternion = worldQuaternion(exitSocket);
    await this.avatar.stopPose?.(this.activeAffordance.program.pose);

    const scene = this.avatar.scene;
    if (this.originalParent) {
      this.originalParent.add(scene);
      scene.position.copy(this.originalParent.worldToLocal(exitPosition.clone()));
      const parentQuaternion = worldQuaternion(this.originalParent).invert();
      scene.quaternion.copy(parentQuaternion.multiply(exitQuaternion));
    } else {
      scene.removeFromParent();
      scene.position.copy(exitPosition);
      scene.quaternion.copy(exitQuaternion);
    }
    scene.updateWorldMatrix(true, true);
    this.activeAffordance = null;
    this.originalParent = null;
    this.state = 'idle';
  }
}
