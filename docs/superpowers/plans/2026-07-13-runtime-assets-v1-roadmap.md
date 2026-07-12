# Runtime Assets v1 Roadmap

Source design: `docs/superpowers/specs/2026-07-13-runtime-assets-v1-design.md`.

Execute these plans in order:

1. `2026-07-13-runtime-core-and-table.md` — npm test harness, `SculptRecipe`, runtime contract, deterministic quality controls, table golden asset.
2. `2026-07-13-glb-export-and-manifest.md` — GLB export, manifest, recipe hash, reload gate, LOD package.
3. `2026-07-13-vrm-chair-affordance.md` — VRM attachment, affordance adapter, chair, Alicia/Nanachi acceptance.
4. `2026-07-13-vehicle-and-cesium-smoke.md` — articulated car, enter/drive/exit action program, Cesium GLB smoke.

The future object-generation platform begins only after all four plans pass. It will edit `SculptRecipe`; it will not own geometry generation, export, VRM attachment, or vehicle logic.

Common completion gate for every phase:

```powershell
npm test
python -m unittest discover -s tests/python -p "test_*.py"
git diff --check
```
