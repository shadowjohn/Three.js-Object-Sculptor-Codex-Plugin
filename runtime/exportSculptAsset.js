import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';


export function cloneSculptAssetForExport(root) {
  const runtime = root.userData.sculptRuntime;
  delete root.userData.sculptRuntime;
  let clone;
  try {
    clone = root.clone(true);
  } finally {
    if (runtime !== undefined) root.userData.sculptRuntime = runtime;
  }
  const excluded = [];
  clone.traverse(node => {
    if (node.userData.exportable === false) excluded.push(node);
  });
  excluded.forEach(node => node.removeFromParent());

  // Runtime maps may contain Object3D references and are serialized separately in the manifest.
  delete clone.userData.sculptRuntime;
  return clone;
}


export async function exportSculptAsset(root, options = {}) {
  const clone = cloneSculptAssetForExport(root);
  const exporter = new GLTFExporter();
  const result = await exporter.parseAsync(clone, {
    binary: true,
    onlyVisible: true,
    includeCustomExtensions: false,
    ...options,
  });
  if (!(result instanceof ArrayBuffer)) {
    throw new Error('GLTFExporter did not return an ArrayBuffer');
  }
  return result;
}
