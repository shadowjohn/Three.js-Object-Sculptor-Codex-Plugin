function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value).sort().map(key => [key, canonicalize(value[key])]),
    );
  }
  return value;
}


async function sha256(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(canonicalize(value)));
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}


function sortedLods(lods) {
  const levels = lods.map(item => item.level);
  for (const level of new Set(levels)) {
    if (levels.filter(value => value === level).length > 1) {
      throw new Error(`duplicate LOD level ${level}`);
    }
  }
  const result = [...lods].sort((a, b) => a.level - b.level);
  for (let index = 1; index < result.length; index += 1) {
    if (result[index].maxDistance <= result[index - 1].maxDistance) {
      throw new Error('LOD maxDistance must increase');
    }
  }
  return result;
}


export async function buildAssetManifest({
  recipe,
  runtime,
  lods,
  generatorVersion,
  version = '1.0.0',
  license = {},
}) {
  if (!recipe?.id) throw new Error('recipe id is required');
  if (!runtime) throw new Error('runtime metadata is required');
  if (!Array.isArray(lods) || lods.length === 0) throw new Error('at least one LOD is required');
  return {
    schemaVersion: '1.0',
    id: recipe.id,
    version,
    generatorVersion,
    recipeHash: await sha256(recipe),
    profile: runtime.metadata?.profile || recipe.profile || 'prop',
    units: recipe.units,
    coordinateFrame: recipe.coordinateFrame,
    bounds: runtime.bounds || {},
    lods: sortedLods(lods),
    nodes: Object.keys(runtime.nodes || {}).sort(),
    sockets: Object.keys(runtime.sockets || {}).sort(),
    colliders: Object.keys(runtime.colliders || {}).sort(),
    articulation: canonicalize(runtime.articulation || {}),
    affordances: canonicalize(runtime.affordances || {}),
    actionPrograms: canonicalize(runtime.actionPrograms || {}),
    license: canonicalize(license),
  };
}
