import { buildAssetManifest } from './buildAssetManifest.js';
import { exportSculptAsset } from './exportSculptAsset.js';


export const DEFAULT_LODS = Object.freeze([
  { level: 0, detail: 1, geometryQuality: 1, materialQuality: 1, maxDistance: 25 },
  { level: 1, detail: 0.5, geometryQuality: 0.5, materialQuality: 0.5, maxDistance: 80 },
  { level: 2, detail: 0, geometryQuality: 0, materialQuality: 0, maxDistance: 250 },
]);


export async function exportAssetPackage(recipe, options) {
  const createAsset = options?.createAsset;
  const exportAsset = options?.exportAsset || exportSculptAsset;
  const validateArtifact = options?.validateArtifact;
  const buildManifest = options?.buildManifest || buildAssetManifest;
  const lods = options?.lods || DEFAULT_LODS;
  if (typeof createAsset !== 'function') throw new Error('createAsset is required');
  if (typeof validateArtifact !== 'function') throw new Error('validateArtifact is required');

  const artifacts = [];
  let runtime;
  for (const quality of lods) {
    const asset = createAsset(quality);
    runtime ||= asset.userData?.sculptRuntime;
    const bytes = await exportAsset(asset, quality);
    await validateArtifact(bytes, quality, asset);
    artifacts.push({
      level: quality.level,
      filename: `${recipe.id}-lod${quality.level}.glb`,
      bytes,
      maxDistance: quality.maxDistance,
    });
  }
  if (!runtime) throw new Error('LOD0 asset is missing sculptRuntime');

  const manifest = await buildManifest({
    recipe,
    runtime,
    generatorVersion: options.generatorVersion || '1.0.0',
    version: options.version || '1.0.0',
    license: options.license || {},
    lods: artifacts.map(({ level, filename, maxDistance }) => ({
      level,
      url: filename,
      maxDistance,
    })),
  });
  return { artifacts, manifest };
}
