# Three.js Object Sculptor

[繁體中文](README.md) | **English**

Turn the object in an attached image into a quality-gated, animation-ready procedural Three.js model built entirely with code.

Three.js Object Sculptor is a Codex plugin for rebuilding the visible object in a user-provided attachment image as a code-only Three.js model. It does not try to do photogrammetry, download an art pack, or extract a perfect mesh from one image. Instead, it guides Codex through a sculpting workflow: validate the image, describe the object precisely, decompose it into geometry and material systems, build from blockout to detail, wire an animation-friendly hierarchy, then compare the browser render against the original reference.

> This repository is a fork of [vinhhien112/Three.js-Object-Sculptor-Codex-Plugin](https://github.com/vinhhien112/Three.js-Object-Sculptor-Codex-Plugin), created by **Vinh Hiển** and released under the MIT License. The original concept, plugin workflow, scripts, and demo studies remain credited to the upstream author. Runtime Assets v1, VRM affordances, articulated vehicle controls, GLB packaging, and the Cesium smoke example are additions made in this fork.

## Demo

Install the local dependency and start a static server from the repository root:

```bash
npm install
python -m http.server 8766
```

Then open `http://127.0.0.1:8766/examples/table.html`. VRM examples require a same-origin VRM URL; serve the repository and avatar folder from a common parent directory when needed.

### Runtime Assets v1 Table

Run a local server from the repository root and open `examples/table.html`. The three sliders regenerate a deterministic table locally; changing detail or quality consumes no AI tokens, while `surface-top`, leg node IDs, bounds, and collider metadata remain stable.

### VRM Chair Affordance

Open `examples/vrm-chair.html?vrm=<same-origin-vrm-url>` to verify that a normalized humanoid can enter, follow, and exit the procedural chair's `sit` affordance. VRM files remain external/local-only; the plugin does not redistribute avatar assets.

The demo exposes `z` avatar-height correction and `thigh` upper-leg angle controls. Current calibrated examples are:

- Alicia: `examples/vrm-chair.html?vrm=/my_vrm_mascot/models/mascot.vrm&z=0.16&thigh=87`
- Nanachi: `examples/vrm-chair.html?vrm=/my_vrm_mascot/local_assets/characters/nanachi_dimitriyarts/model.vrm&z=0.10&thigh=95`

These VRM paths are local examples only and are not distributed with this repository.

### Vehicle and Cesium Smoke

Open `examples/vrm-car.html?vrm=<same-origin-vrm-url>` for the articulated car and VRM driver flow. `examples/cesium-car/` places an exported car LOD0 GLB from its meter/ground-center manifest using longitude, latitude, height, and heading.

### Tower Ship

[Open the live tower ship demo](https://3dship.harrysoftware.com)

![Procedural Three.js tower ship demo generated from an attached reference image](assets/tower-ship-demo.png)

This tower ship study shows the intended output shape: a browser-rendered, code-sculpted Three.js object rebuilt from an attached reference image, with procedural geometry, articulated parts, material work, and interactive controls.

### Ancient Autumn Tree

[Open the live ancient autumn tree demo](https://tree.harrysoftware.com/)

![Procedural Three.js ancient autumn tree reconstructed from an attached reference image](assets/ancient-autumn-tree-demo.png)

This botanical study reconstructs a complex ancient tree with procedural curves, deterministic branching, layered bark materials, dense autumn foliage, and an animation-ready hierarchy.

## At A Glance

- **Name:** Three.js Object Sculptor
- **Category:** Codex plugin for image-to-procedural-3D workflows
- **Input:** an attached object image, reference screenshot, or local image path
- **Output:** a code-only procedural Three.js object factory, backed by an `ObjectSculptSpec`
- **Primary goal:** recreate the target object's silhouette, component structure, materials, lighting response, and action-ready hierarchy in browser-friendly Three.js code
- **Best for:** animation-ready real-time props, game objects, scene dressing, destructible objects, product-style objects, botanical objects, mechanical parts, and stylized reference reconstructions
- **Not for:** photogrammetry, exact mesh extraction, scanned assets, downloaded art packs, or guaranteed production-perfect geometry from one image

## What It Does

- Validates whether an image is suitable for procedural 3D reconstruction.
- Creates a pre-spec complexity assessment before code generation.
- Writes an `ObjectSculptSpec` with component hierarchy, materials, lighting, pivots, sockets, animation anchors, destruction anchors, and quality targets.
- Enforces a staged build pipeline: blockout, structural pass, form refinement, material pass, surface pass, lighting pass, interaction pass, and optimization.
- Generates a code-only Three.js factory skeleton from the current unlocked sculpt pass.
- Designs the generated object as an action-ready hierarchy, so later animation, transformation, physics, or destruction requests have real pivots and attachment points to use.
- Packages reference/render screenshots into one comparison sheet for AI vision review.
- Records self-correction reviews with overall, layer, and critical feature scores.
- Supports reference-derived procedural PBR evidence: albedo, roughness estimate, height, normal, and AO maps.

## Use Cases

- Convert an attached object image into a procedural Three.js model generated entirely with TypeScript and geometry code.
- Build animation-ready Three.js props with meaningful pivots, sockets, parent-child hierarchy, and transform anchors.
- Recreate reference objects as browser-friendly procedural assets without relying on downloaded meshes or external art packs.
- Generate a structured object spec before implementation, so Codex understands geometry, materials, lighting, local surface features, and interaction readiness.
- Create destructible or transformable objects by planning detachable parts, fracture seams, colliders, and effect emitters before the model is coded.
- Compare the rendered model against the original attachment with AI vision and block progress when critical features do not match.
- Produce reusable procedural object factories for Three.js games, WebGPU demos, interactive prototypes, and visual experiments.

## Why This Exists

Procedural 3D generation can fail in a very specific way: the silhouette is "kind of right", but the object loses the details that make it recognizable. This plugin is designed to slow Codex down at the right moments:

- First understand what object class and complexity tier it is dealing with.
- Define what "good enough" means for this specific object.
- Build from coarse structure to fine surface response.
- Fail a pass if an identity-defining feature is wrong, even when the overall score looks acceptable.

The result is less "one-shot generated mesh" and more "Codex as a procedural sculptor with checkpoints": block out the form, attach the moving parts correctly, layer the materials, then keep refining until the model reads like the object in the attachment.

## Requirements

- Codex with local plugin support.
- Python 3.10 or newer.
- Node.js 18 or newer for Runtime Assets examples and tests.
- A browser project using Three.js when you want to implement the generated factory.
- For visual acceptance: a screenshot from the rendered model and an AI vision reviewer.

The helper scripts use Python standard-library modules and shell image tooling when available. They do not require Playwright or a downloaded Chromium bundle.

## Install For Codex

Clone the plugin source into your local plugin folder. Replace `REPOSITORY_URL` with the Git URL for your copy of this repository:

```bash
mkdir -p ~/plugins
git clone REPOSITORY_URL ~/plugins/threejs-object-sculptor
```

Make sure your local Codex marketplace has an entry for the plugin. If you already have `~/.agents/plugins/marketplace.json`, add this object to its `plugins` array:

```json
{
  "name": "threejs-object-sculptor",
  "source": {
    "source": "local",
    "path": "./plugins/threejs-object-sculptor"
  },
  "policy": {
    "installation": "AVAILABLE",
    "authentication": "ON_INSTALL"
  },
  "category": "Productivity"
}
```

If you do not have a local marketplace file yet, create `~/.agents/plugins/marketplace.json` with:

```json
{
  "name": "local",
  "interface": {
    "displayName": "Local Plugins"
  },
  "plugins": [
    {
      "name": "threejs-object-sculptor",
      "source": {
        "source": "local",
        "path": "./plugins/threejs-object-sculptor"
      },
      "policy": {
        "installation": "AVAILABLE",
        "authentication": "ON_INSTALL"
      },
      "category": "Productivity"
    }
  ]
}
```

Install it in Codex:

```bash
codex plugin add threejs-object-sculptor@local
```

Start a new Codex thread after installation so the plugin skill is loaded.

## Quick Start

In Codex, attach an object image and ask:

```text
Use Three.js Object Sculptor to turn the object in this attachment into a procedural Three.js model built entirely with code.
```

![Codex prompt example using an attached object image with Three.js Object Sculptor and Browser](assets/codex-prompt-example.png)

For best results, include the intended use:

```text
Make it a real-time browser prop, action-ready for animation, transformation, physics, and destruction.
```

The plugin will guide Codex through:

1. Image suitability check.
2. Pre-spec complexity and quality contract.
3. Detailed object sculpt spec.
4. Strict validation.
5. Pass-by-pass Three.js factory generation.
6. Browser screenshot review.
7. AI vision comparison and self-correction.

## Recommended Workflow

Use the scripts from the plugin root.

Probe a reference image:

```bash
python3 scripts/probe_reference_image.py ./reference/oak-tree.png
```

Create a pre-spec assessment:

```bash
python3 scripts/new_pre_spec_assessment.py "Ancient Autumn Oak" \
  --image ./reference/oak-tree.png \
  --complexity complex \
  --out assessment.json
```

Create a starter sculpt spec:

```bash
python3 scripts/new_sculpt_spec.py "Ancient Autumn Oak" \
  --image ./reference/oak-tree.png \
  --assessment assessment.json \
  --out object-sculpt-spec.json
```

Validate the spec:

```bash
python3 scripts/validate_sculpt_spec.py object-sculpt-spec.json --strict-quality
```

Check which sculpt pass is unlocked:

```bash
python3 scripts/sculpt_pass_orchestrator.py status object-sculpt-spec.json
```

Generate the current pass:

```bash
python3 scripts/generate_threejs_factory.py object-sculpt-spec.json \
  --out src/createObjectModel.ts
```

Create a comparison sheet after rendering the model:

```bash
python3 scripts/make_visual_comparison_sheet.py \
  --reference ./reference/oak-tree.png \
  --render ./screenshots/oak-render.png \
  --out ./screenshots/oak-comparison.png \
  --json
```

Record an AI vision review:

```bash
python3 scripts/append_sculpt_review.py object-sculpt-spec.json \
  --pass-id blockout \
  --fidelity 0.82 \
  --action continue \
  --summary "Blockout silhouette and primary trunk fork are acceptable." \
  --render-screenshot ./screenshots/oak-render.png \
  --comparison-image ./screenshots/oak-comparison.png \
  --ai-vision-score 0.82 \
  --feature-reviews-json ./reviews/blockout-features.json \
  --ai-vision-notes "Main proportions pass; canopy microstructure remains deferred." \
  --in-place
```

Sync the pass state:

```bash
python3 scripts/sculpt_pass_orchestrator.py sync object-sculpt-spec.json --in-place
```

## Runtime Assets v1

Runtime Assets v1 turns a finished procedural reconstruction into a deterministic asset that can be regenerated, attached, articulated, exported, and placed without asking AI to rebuild the model for every change. AI is still useful for interpreting the reference and revising the design; ordinary `detail`, `geometryQuality`, `materialQuality`, and object parameter changes run locally and consume no additional AI tokens.

### Runtime Contract

Each generated root exposes `root.userData.sculptRuntime`, including stable semantic maps for:

- nodes and render meshes;
- sockets and simplified colliders;
- articulation joints and limits;
- affordances and ordered action programs;
- bounds, units, axes, origin, and asset metadata.

`SculptRecipe` is the compact, deterministic runtime input. `ObjectSculptSpec` remains the detailed authoring and visual quality format. The current golden generators are `createTable()`, `createChair()`, and `createCar()`.

### Table and Local Quality Controls

`examples/table.html` regenerates the table from local sliders. Semantic IDs such as `surface-top` and the leg nodes remain stable across quality levels. `examples/export-table.html` creates LOD0-LOD2 GLBs, reload-validates every artifact, and only then finalizes `asset-manifest.json`.

The package API is `exportAssetPackage(recipe, options)` from `runtime/exportAssetPackage.js`. It requires a procedural `createAsset` factory and a `validateArtifact` callback; a failed LOD validation prevents a partially valid manifest from being published.

### VRM Attachment and Affordances

`attachSculptAsset()` mounts a runtime asset socket to a normalized VRM humanoid bone and returns a handle for socket lookup, visibility, detach, and disposal. `VRMAffordanceAdapter` aligns the avatar to semantic targets such as a chair seat and keeps it attached while the asset moves.

The host application still owns avatar animation, IK, pathfinding, collision resolution, and permissions. The adapters do not perform pose retargeting, generate a skinned character rig, or redistribute VRM files.

### Articulated Vehicle

`createCar()` exposes door hinges, wheel pivots, steering, seats, entry/exit sockets, colliders, and vehicle action programs. `examples/vrm-car.html?vrm=<same-origin-vrm-url>` demonstrates opening the driver door, entering, driving with W/S and A/D, braking with Space, stopping, and exiting. `VehicleController` moves the vehicle root and updates wheel and steering articulation; it intentionally does not provide a physics engine.

### GLB Manifest and Cesium

An exported package contains LOD GLBs, `asset-manifest.json`, and the source recipe. The manifest records meter units, ground-center origin, bounds, LOD bands, sockets, articulation, affordances, attribution, license, and recipe hash.

`examples/cesium-car/` is a Cesium 1.141 placement smoke test. It loads the exported LOD0 GLB and applies longitude, latitude, height, and heading from the manifest-oriented workflow. It is not terrain-aware driving, a Cesium editor, or a 3D Tiles generator.

## PBR Extraction

The plugin can extract reference-derived procedural PBR evidence from image pixels:

```bash
python3 scripts/extract_reference_pbr.py ./reference/oak-bark.png \
  --out-dir ./generated/pbr/oak-bark \
  --material-id bark \
  --target-threshold 0.7 \
  --report ./generated/pbr/oak-bark/report.json
```

This produces useful material evidence such as palette, albedo, roughness estimate, height, normal, and AO maps. It is not exact inverse rendering from a single image. When confidence is below the threshold, the script refuses to patch the spec unless `--allow-low-confidence` is explicitly used.

## Quality Gates

The plugin uses two levels of visual acceptance:

- Overall match: silhouette, proportions, camera/view, material read, and lighting.
- Semantic feature match: selected critical object features scored from the same full reference/render comparison image.

Examples of critical feature targets:

- Hull shape, cabin blocks, sail rigging, and rails for a boat.
- Trunk fork, major branch sockets, canopy mass, bark material, and root flare for a tree.
- Body shell, wheels, windshield, grille, and headlight clusters for a vehicle.

If a critical feature fails its threshold, the pass fails even if the global score is high.

## FAQ

### Is this photogrammetry?

No. Three.js Object Sculptor does not reconstruct a scanned mesh from pixels. It helps Codex infer a procedural model plan and generate Three.js code that approximates the visible object.

### Does it generate a GLB file?

Yes. The sculpting workflow still produces a code-only Three.js factory and an `ObjectSculptSpec`, while Runtime Assets v1 can export validated LOD GLBs plus `asset-manifest.json` through `exportAssetPackage()`. See `examples/export-table.html` for the browser flow.

### Can the generated model be animated?

Yes. Animation readiness is a core goal. The spec asks for pivots, sockets, parent-child hierarchy, transform channels, collider proxies, and detachable or breakable component roles where relevant.

### Does it use downloaded assets or art packs?

No. The workflow is designed around generated geometry, procedural materials, local image evidence, and code-native Three.js construction.

### Can one image create an exact production model?

No. One image can be enough for a useful procedural reconstruction, but hidden sides, exact dimensions, and fine material behavior may need assumptions, extra reference views, or a lower-fidelity target.

### How does the plugin decide whether the model is good enough?

It uses a quality contract, staged build passes, browser screenshots, one reference/render comparison sheet, and AI vision review. Critical features can fail a pass even when the global visual score looks acceptable.

## Project Layout

```text
.codex-plugin/plugin.json
LICENSE
README.md
README.en.md
skills/object-to-threejs-procedural/SKILL.md
skills/object-to-threejs-procedural/references/
schemas/              SculptRecipe and asset manifest schemas
runtime/              Runtime contract, adapters, controllers, and exporters
generators/           Table, chair, and car procedural factories
examples/             Browser demos and Cesium placement smoke test
scripts/              ObjectSculptSpec and validation tools
tests/js/             Runtime and browser-contract tests
tests/python/         Schema and repository-layout tests
```

Important scripts:

- `probe_reference_image.py`: technical image metadata probe.
- `new_pre_spec_assessment.py`: complexity and quality-contract skeleton.
- `new_sculpt_spec.py`: starter `ObjectSculptSpec`.
- `validate_sculpt_spec.py`: structural and strict quality validation.
- `sculpt_pass_orchestrator.py`: pass locking and pipeline sync.
- `generate_threejs_factory.py`: current-pass Three.js factory generator.
- `make_visual_comparison_sheet.py`: full reference/render comparison image.
- `append_sculpt_review.py`: self-correction review recorder.
- `extract_reference_pbr.py`: reference-derived PBR evidence extraction.

## Limitations

- A single image cannot reveal hidden sides or guarantee exact geometry.
- Transparent glass, smoke, liquid, fur, fine cloth, and exact likeness tasks may require extra references or a lower-fidelity target.
- The generated factory still requires deliberate visual refinement for production use; runtime quality sliders do not invent missing design information.
- AI vision review is expected for acceptance; the scripts package evidence but do not magically judge visual quality by themselves.
- Runtime articulation is pivot-based and does not replace character skinning, IK, physics, or navigation systems.
- Cesium support currently covers GLB placement only, not terrain driving or 3D Tiles generation.

## Development Notes

After changing the plugin, update the cachebuster and reinstall. If you have Codex's `plugin-creator` skill installed, use its `update_plugin_cachebuster.py` helper:

```bash
python3 /path/to/plugin-creator/scripts/update_plugin_cachebuster.py ~/plugins/threejs-object-sculptor
codex plugin add threejs-object-sculptor@local
```

Then open a new Codex thread to pick up the updated skill and scripts.

## Attribution

Three.js Object Sculptor was created by [Vinh Hiển (`vinhhien112`)](https://github.com/vinhhien112). This fork preserves the upstream Git history, original author notice, project links, support link, and MIT license. Please retain the original copyright and permission notice when copying or redistributing this project or substantial portions of it.

Fork-specific work is documented as an extension of the upstream project, not a replacement of its authorship.

## Support The Original Project

If Three.js Object Sculptor helps you, you can support the original author and continued upstream development:

<a href="https://ko-fi.com/harrynguyen112">
  <img height="36" src="https://storage.ko-fi.com/cdn/kofi6.png?v=6" alt="Buy Me a Coffee on Ko-fi">
</a>

## License

MIT. See [`LICENSE`](LICENSE) for the complete terms and the original `Copyright (c) 2026 Vinh Hiển` notice. The copyright and permission notice must be included in all copies or substantial portions of the software.
