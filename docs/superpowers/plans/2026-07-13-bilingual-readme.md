# Bilingual README Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Traditional Chinese the repository landing README and keep a feature-equivalent English README as the secondary language page.

**Architecture:** Preserve the current English file history by moving it to `README.en.md`, then update its stale runtime sections. Build `README.md` as a natural Traditional Chinese counterpart with matching headings, commands, paths, attribution, and limitations.

**Tech Stack:** GitHub-flavored Markdown, PowerShell, Node.js test runner.

---

### Task 1: Preserve and refresh the English README

**Files:**
- Move: `README.md` to `README.en.md`
- Modify: `README.en.md`

- [ ] **Step 1: Move the existing English document**

Run: `git mv README.md README.en.md`

Expected: Git records a rename before the content update.

- [ ] **Step 2: Refresh the English document**

Add the language link `**繁體中文** | [English](README.en.md)`, the upstream author/fork notice, local demo startup command, Runtime Assets v1 sections, current chair calibration URLs, vehicle and Cesium behavior, current project layout, updated limitations, and the complete attribution/license wording from the approved design.

Replace the obsolete GLB FAQ answer with the shipped `exportAssetPackage()` flow. Keep existing installation commands, sculpt workflow commands, PBR extraction, quality gates, demo images, upstream support link, and external URLs operational.

- [ ] **Step 3: Check English references**

Run: `rg -n "README.en.md|vinhhien112|Vinh Hiển|exportAssetPackage|z=0.16&thigh=87|z=0.10&thigh=95|Cesium 1.141" README.en.md`

Expected: every required attribution and shipped-runtime marker appears.

### Task 2: Add the Traditional Chinese primary README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write the full Traditional Chinese counterpart**

Use the same heading order and operational content as `README.en.md`. Keep identifiers such as `ObjectSculptSpec`, `SculptRecipe`, `sculptRuntime`, `VRMAttachmentAdapter`, `VRMAffordanceAdapter`, `VehicleController`, `exportAssetPackage()`, paths, commands, JSON, and URLs unchanged.

Use the language link `**繁體中文** | [English](README.en.md)` and place the fork/upstream/original-author notice directly below the introduction. Translate prose naturally into Traditional Chinese without shortening the workflow, limitations, FAQ, attribution, or license obligations.

- [ ] **Step 2: Check language parity and required markers**

Run: `(rg "^## " README.md).Count; (rg "^## " README.en.md).Count; rg -n "README.en.md|vinhhien112|Vinh Hiển|exportAssetPackage|z=0.16&thigh=87|z=0.10&thigh=95|Cesium 1.141" README.md`

Expected: both files have the same number of level-two sections and all required markers appear in Chinese.

### Task 3: Verify and commit the documentation

**Files:**
- Verify: `README.md`
- Verify: `README.en.md`
- Verify: `docs/superpowers/specs/2026-07-13-readme-localization-design.md`

- [ ] **Step 1: Verify local references**

Run: `@('LICENSE','skills/object-to-threejs-procedural/SKILL.md','examples/table.html','examples/export-table.html','examples/vrm-chair.html','examples/vrm-car.html','examples/cesium-car/index.php','runtime/exportAssetPackage.js') | ForEach-Object { if (-not (Test-Path -LiteralPath $_)) { throw "Missing README target: $_" } }`

Expected: command exits successfully with no output.

- [ ] **Step 2: Run repository verification**

Run: `npm test`

Expected: all Node tests pass.

Run: `python -m unittest discover -s tests/python -v`

Expected: all Python tests pass.

Run: `git diff --check`

Expected: no whitespace errors.

- [ ] **Step 3: Inspect and commit**

Run: `git diff --stat; git diff -- README.md README.en.md docs/superpowers/specs/2026-07-13-readme-localization-design.md`

Commit:

```powershell
git add README.md README.en.md docs/superpowers/specs/2026-07-13-readme-localization-design.md docs/superpowers/plans/2026-07-13-bilingual-readme.md
git commit -m "docs: add Traditional Chinese project guide"
```
