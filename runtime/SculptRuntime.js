function isNormalizedAxis(axis) {
  if (!Array.isArray(axis) || axis.length !== 3 || axis.some(value => !Number.isFinite(value))) {
    return false;
  }
  return Math.abs(Math.hypot(...axis) - 1) <= 1e-6;
}


export function createSculptRuntime(root, values = {}) {
  const runtime = {
    schemaVersion: '1.0',
    assetId: values.assetId,
    nodes: values.nodes || {},
    meshes: values.meshes || {},
    sockets: values.sockets || {},
    colliders: values.colliders || {},
    articulation: values.articulation || {},
    affordances: values.affordances || {},
    actionPrograms: values.actionPrograms || {},
    destructionGroups: values.destructionGroups || {},
    bounds: values.bounds || {},
    metadata: values.metadata || {},
  };
  root.userData.sculptRuntime = runtime;
  return runtime;
}


export function validateSculptAsset(root) {
  const runtime = root?.userData?.sculptRuntime;
  if (!runtime) return ['asset is missing sculptRuntime'];

  const errors = [];
  if (!runtime.assetId) errors.push('sculptRuntime is missing assetId');

  for (const id of Object.keys(runtime.articulation).sort()) {
    const joint = runtime.articulation[id];
    if (!runtime.nodes[joint.node]) {
      errors.push(`articulation ${id} references missing node ${joint.node}`);
    }
    if (!isNormalizedAxis(joint.axis)) {
      errors.push(`articulation ${id} axis must be normalized`);
    }
  }

  for (const id of Object.keys(runtime.affordances).sort()) {
    const affordance = runtime.affordances[id];
    if (affordance.targetSocket && !runtime.sockets[affordance.targetSocket]) {
      errors.push(`affordance ${id} references missing socket ${affordance.targetSocket}`);
    }
    if (affordance.approachSocket && !runtime.sockets[affordance.approachSocket]) {
      errors.push(`affordance ${id} references missing socket ${affordance.approachSocket}`);
    }
    if (affordance.exitSocket && !runtime.sockets[affordance.exitSocket]) {
      errors.push(`affordance ${id} references missing socket ${affordance.exitSocket}`);
    }
    if (affordance.actionProgram && !runtime.actionPrograms[affordance.actionProgram]) {
      errors.push(`affordance ${id} references missing action program ${affordance.actionProgram}`);
    }
  }
  return errors;
}
