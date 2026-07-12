function normalized(value, fallback = 0.5) {
  const resolved = Number.isFinite(value) ? value : fallback;
  return Math.min(1, Math.max(0, resolved));
}


function textureSizeFor(value) {
  if (value < 0.25) return 256;
  if (value < 0.5) return 512;
  if (value < 0.75) return 1024;
  return 2048;
}


export function resolveQuality(values = {}) {
  const detail = normalized(values.detail);
  const geometryQuality = normalized(values.geometryQuality);
  const materialQuality = normalized(values.materialQuality);
  return {
    detail,
    radialSegments: Math.round(6 + geometryQuality * 18),
    bevelSegments: 1 + Math.round(geometryQuality * 3),
    textureSize: textureSizeFor(materialQuality),
  };
}
