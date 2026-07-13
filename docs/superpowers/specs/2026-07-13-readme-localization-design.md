# README Localization Design

## Goal

Refresh the English README and add a complete Traditional Chinese README that accurately documents the shipped runtime asset pipeline without weakening the original author's attribution or MIT license notice.

## Attribution and License

Both README files will identify this repository as a fork near the top of the document and link directly to the upstream project:

- upstream: `vinhhien112/Three.js-Object-Sculptor-Codex-Plugin`;
- original author: Vinh Hiển;
- license: MIT;
- fork additions: Runtime Assets v1, VRM affordances, articulated vehicle controls, GLB packaging, and the Cesium smoke example.

The wording will distinguish the original Object Sculptor concept from later fork additions. `LICENSE` remains unchanged, including the original `Copyright (c) 2026 Vinh Hiển` notice. The README license section will state that copies and substantial portions must retain the copyright and permission notice.

## Files

- Replace `README.md` with the full Traditional Chinese primary document.
- Move and update the English source document as `README.en.md`.
- Add a language switch at the top of both files.

No changelog or release version will be introduced for this documentation pass.

## Content Structure

The two README files will use the same section order and feature coverage:

1. project purpose and fork attribution;
2. demos and quick start;
3. image-to-procedural-Three.js workflow and suitability limits;
4. plugin installation and `ObjectSculptSpec` workflow;
5. Runtime Assets v1 capabilities;
6. VRM attachment and chair affordance calibration;
7. articulated car, vehicle controller, GLB export, and Cesium smoke usage;
8. project layout, tests, limitations, FAQ, attribution, and MIT license.

The Traditional Chinese edition will be a natural technical rewrite, not a shortened summary. Commands, paths, API identifiers, schema names, and URLs remain unchanged so both documents stay operationally equivalent.

## Shipped Behavior to Document

- deterministic parameter and quality changes run locally without additional AI tokens;
- `SculptRecipe`, `sculptRuntime`, stable nodes, sockets, colliders, articulation, affordances, and action programs;
- GLB LOD export, reload validation, `asset-manifest.json`, and recipe packaging;
- `VRMAttachmentAdapter` and `VRMAffordanceAdapter` boundaries;
- chair demo query calibration with `z` and `thigh`, including current Alicia and Nanachi examples;
- articulated car doors, wheels, steering, enter/exit flow, and `VehicleController` movement;
- Cesium 1.141 GLB placement smoke example using longitude, latitude, height, and heading.

## Accuracy Boundaries

The README will state explicitly:

- the tool reconstructs objects procedurally from visual references; it is not photogrammetry or direct image-to-mesh extraction;
- external VRM files stay local and are not redistributed;
- the runtime adapters do not provide character IK, pose retargeting, or full skinned-rig generation;
- the Cesium example validates manifest-driven placement only, not terrain-aware vehicle driving or 3D Tiles generation;
- generated output quality still depends on reference coverage and deliberate refinement.

The obsolete FAQ claim that GLB export is unavailable will be replaced with the actual export/package flow. The project layout will list the current `runtime`, `generators`, `schemas`, `examples`, `scripts`, and `tests` directories.

## Verification

- compare English and Traditional Chinese headings and links for feature parity;
- verify every referenced local file and example exists;
- run `npm test` to ensure the documentation pass did not disturb the runtime workspace;
- inspect `git diff --check` and the final Markdown diff.
