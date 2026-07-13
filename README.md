# Three.js Object Sculptor

**繁體中文** | [English](README.en.md)

把附件圖片中的物件，製作成經過品質檢核、可供動畫使用，且完全由程式碼建立的 procedural Three.js 模型。

Three.js Object Sculptor 是一個 Codex plugin，用來將使用者附件圖片中可見的物件，重建為純程式碼的 Three.js 模型。它不是攝影測量工具，不會下載美術素材包，也不會嘗試從單張圖片直接抽出完美網格。它會引導 Codex 依序檢查圖片、精確描述物件、拆解幾何與材質系統、從 blockout 製作到細節、建立適合動畫的階層，最後把瀏覽器 render 與原始參考圖進行比較。

> 本 repository fork 自 **Vinh Hiển** 建立並以 MIT License 發布的 [vinhhien112/Three.js-Object-Sculptor-Codex-Plugin](https://github.com/vinhhien112/Three.js-Object-Sculptor-Codex-Plugin)。原始概念、plugin 工作流程、工具腳本與示範作品均歸功於上游作者。本 fork 新增 Runtime Assets v1、VRM affordance、可動車輛控制、GLB 封裝與 Cesium smoke example。

## 示範

安裝本機相依套件，並從 repository 根目錄啟動靜態伺服器：

```bash
npm install
python -m http.server 8766
```

接著開啟 `http://127.0.0.1:8766/examples/table.html`。VRM 範例要求 VRM URL 與頁面同源；需要時請從 repository 與角色資料夾的共同上層目錄啟動伺服器。

### Runtime Assets v1 桌子

開啟 `examples/table.html`。三個 slider 會在本機重新產生 deterministic table；調整細節或品質不會消耗 AI token，而 `surface-top`、桌腳 node ID、bounds 與 collider metadata 仍保持穩定。

### VRM 椅子 Affordance

開啟 `examples/vrm-chair.html?vrm=<same-origin-vrm-url>`，可驗證 normalized humanoid 能進入 procedural chair 的 `sit` affordance、跟隨椅子移動並離開。VRM 檔案維持外部／本機載入，本 plugin 不會重新散布 avatar asset。

範例提供 `z` 人物高度修正與 `thigh` 大腿角度控制。目前校正值如下：

- Alicia：`examples/vrm-chair.html?vrm=/my_vrm_mascot/models/mascot.vrm&z=0.16&thigh=87`
- 娜娜奇：`examples/vrm-chair.html?vrm=/my_vrm_mascot/local_assets/characters/nanachi_dimitriyarts/model.vrm&z=0.10&thigh=95`

這些 VRM path 僅是本機範例，不包含在本 repository 中。

### 車輛與 Cesium Smoke

開啟 `examples/vrm-car.html?vrm=<same-origin-vrm-url>` 可測試 articulated car 與 VRM 駕駛流程。`examples/cesium-car/` 會依照 meter／ground-center manifest，以經度、緯度、高度與 heading 放置匯出的車輛 LOD0 GLB。

### Tower Ship

[開啟 tower ship 線上示範](https://3dship.harrysoftware.com)

![由附件參考圖製作的 procedural Three.js tower ship 示範](assets/tower-ship-demo.png)

這個 tower ship 研究展示預期輸出型態：從附件參考圖，以程式雕塑出可在瀏覽器 render 的 Three.js 物件，包含 procedural geometry、可動零件、材質處理與互動控制。

### Ancient Autumn Tree

[開啟 ancient autumn tree 線上示範](https://tree.harrysoftware.com/)

![由附件參考圖重建的 procedural Three.js ancient autumn tree](assets/ancient-autumn-tree-demo.png)

這個植物研究以 procedural curve、deterministic branching、多層樹皮材質、濃密秋季樹葉與 animation-ready hierarchy，重建一棵複雜古樹。

## 快速了解

- **名稱：** Three.js Object Sculptor
- **類別：** 圖片轉 procedural 3D 工作流程的 Codex plugin
- **輸入：** 附件物件圖片、參考截圖或本機圖片路徑
- **輸出：** 由 `ObjectSculptSpec` 支撐的純程式碼 procedural Three.js object factory
- **主要目標：** 以適合瀏覽器的 Three.js 程式碼，重建目標物件的 silhouette、component structure、material、lighting response 與 action-ready hierarchy
- **適合：** 可動即時道具、遊戲物件、場景擺設、可破壞物件、產品型物件、植物、機械零件與風格化參考重建
- **不適合：** 攝影測量、精確 mesh extraction、掃描 asset、下載素材包，或期待單張圖片保證產出 production-perfect geometry

## 功能

- 檢查圖片是否適合進行 procedural 3D reconstruction。
- 在產生程式碼前建立 pre-spec complexity assessment。
- 建立含 component hierarchy、material、lighting、pivot、socket、animation anchor、destruction anchor 與品質目標的 `ObjectSculptSpec`。
- 強制採用 staged build pipeline：blockout、structural pass、form refinement、material pass、surface pass、lighting pass、interaction pass 與 optimization。
- 依目前解鎖的 sculpt pass 產生純程式碼 Three.js factory skeleton。
- 將產出設計成 action-ready hierarchy，讓後續動畫、transform、physics 或 destruction 能使用真正的 pivot 與 attachment point。
- 把 reference／render screenshot 合併為 comparison sheet，供 AI vision review。
- 紀錄 overall、layer 與 critical feature score 的 self-correction review。
- 支援由參考圖推導的 procedural PBR evidence：albedo、roughness estimate、height、normal 與 AO map。

## 使用情境

- 把附件物件圖片轉為完全由 TypeScript 與 geometry code 產生的 procedural Three.js model。
- 建立具有有效 pivot、socket、parent-child hierarchy 與 transform anchor 的 animation-ready Three.js prop。
- 不依賴下載 mesh 或外部素材包，將參考物件重建為適合瀏覽器的 procedural asset。
- 實作前先產生結構化 object spec，讓 Codex 理解 geometry、material、lighting、local surface feature 與 interaction readiness。
- 預先規劃 detachable part、fracture seam、collider 與 effect emitter，建立可破壞或可變形物件。
- 使用 AI vision 比較 render model 與原始附件；critical feature 不符時阻止流程繼續。
- 為 Three.js game、WebGPU demo、interactive prototype 與 visual experiment 產生可重用的 procedural object factory。

## 為何需要這個工具

Procedural 3D generation 很容易以一種特定方式失敗：silhouette「大致正確」，卻遺失讓物件可辨識的關鍵細節。這個 plugin 會要求 Codex 在正確時機慢下來：

- 先確認正在處理的物件類別與 complexity tier。
- 為此物件定義何謂「夠好」。
- 從粗略結構逐步做到細緻 surface response。
- 即使 overall score 尚可，只要 identity-defining feature 錯誤，該 pass 仍失敗。

因此結果比較接近「Codex 擔任 procedural sculptor 並逐關檢查」，而不是「一次生成 mesh」：先完成 blockout、把可動零件掛載正確、分層建立材質，再持續修整，直到模型能讀出附件中的目標物件。

## 系統需求

- 支援本機 plugin 的 Codex。
- Python 3.10 以上。
- Runtime Assets 範例與測試需要 Node.js 18 以上。
- 實作 generated factory 時，需要使用 Three.js 的 browser project。
- 進行 visual acceptance 時，需要 rendered model screenshot 與 AI vision reviewer。

Helper script 使用 Python standard library module，並在環境可用時使用 shell image tooling；不需要 Playwright 或額外下載 Chromium bundle。

## 安裝到 Codex

將 plugin source clone 到本機 plugin 資料夾。請把 `REPOSITORY_URL` 換成你使用的 repository Git URL：

```bash
mkdir -p ~/plugins
git clone REPOSITORY_URL ~/plugins/threejs-object-sculptor
```

確認本機 Codex marketplace 已加入此 plugin。若已有 `~/.agents/plugins/marketplace.json`，請把下列 object 加進 `plugins` array：

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

若尚未建立 local marketplace file，請以以下內容新增 `~/.agents/plugins/marketplace.json`：

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

在 Codex 中安裝：

```bash
codex plugin add threejs-object-sculptor@local
```

安裝後開啟新的 Codex task，讓 plugin skill 載入。

## 快速開始

在 Codex 附加一張物件圖片，接著輸入：

```text
使用 Three.js Object Sculptor，把附件中的物件製作成完全由程式碼建立的 procedural Three.js model。
```

![在 Codex 使用附件圖片與 Three.js Object Sculptor、Browser 的 prompt 範例](assets/codex-prompt-example.png)

為得到較好的結果，請一併說明預定用途：

```text
把它做成 real-time browser prop，並準備好供動畫、transform、physics 與 destruction 使用。
```

Plugin 會引導 Codex 完成：

1. 圖片適用性檢查。
2. Pre-spec complexity 與 quality contract。
3. 詳細 object sculpt spec。
4. Strict validation。
5. 逐 pass 產生 Three.js factory。
6. Browser screenshot review。
7. AI vision comparison 與 self-correction。

## 建議工作流程

從 plugin root 執行工具腳本。

檢查參考圖片：

```bash
python3 scripts/probe_reference_image.py ./reference/oak-tree.png
```

建立 pre-spec assessment：

```bash
python3 scripts/new_pre_spec_assessment.py "Ancient Autumn Oak" \
  --image ./reference/oak-tree.png \
  --complexity complex \
  --out assessment.json
```

建立初始 sculpt spec：

```bash
python3 scripts/new_sculpt_spec.py "Ancient Autumn Oak" \
  --image ./reference/oak-tree.png \
  --assessment assessment.json \
  --out object-sculpt-spec.json
```

驗證 spec：

```bash
python3 scripts/validate_sculpt_spec.py object-sculpt-spec.json --strict-quality
```

檢查目前解鎖的 sculpt pass：

```bash
python3 scripts/sculpt_pass_orchestrator.py status object-sculpt-spec.json
```

產生目前 pass：

```bash
python3 scripts/generate_threejs_factory.py object-sculpt-spec.json \
  --out src/createObjectModel.ts
```

Render model 後建立 comparison sheet：

```bash
python3 scripts/make_visual_comparison_sheet.py \
  --reference ./reference/oak-tree.png \
  --render ./screenshots/oak-render.png \
  --out ./screenshots/oak-comparison.png \
  --json
```

紀錄 AI vision review：

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

同步 pass state：

```bash
python3 scripts/sculpt_pass_orchestrator.py sync object-sculpt-spec.json --in-place
```

## Runtime Assets v1

Runtime Assets v1 會把完成的 procedural reconstruction 轉為可 deterministic regeneration、掛載、驅動關節、匯出與放置的 asset，不必每次調整都要求 AI 重建模型。AI 仍適合解讀參考圖與修改設計；一般的 `detail`、`geometryQuality`、`materialQuality` 與物件參數調整會在本機執行，不額外消耗 AI token。

### Runtime Contract

每個 generated root 都會提供 `root.userData.sculptRuntime`，其中包含以下穩定的 semantic map：

- node 與 render mesh；
- socket 與 simplified collider；
- articulation joint 與 limit；
- affordance 與 ordered action program；
- bounds、unit、axis、origin 與 asset metadata。

`SculptRecipe` 是精簡、deterministic 的 runtime input；`ObjectSculptSpec` 則保留為詳細 authoring 與 visual quality 格式。目前的 golden generator 為 `createTable()`、`createChair()` 與 `createCar()`。

### 桌子與本機品質控制

`examples/table.html` 會從本機 slider 重新產生桌子。`surface-top` 與桌腳 node 等 semantic ID 在各品質層級維持穩定。`examples/export-table.html` 會建立 LOD0-LOD2 GLB、重新載入驗證每個 artifact，通過後才完成 `asset-manifest.json`。

Package API 是 `runtime/exportAssetPackage.js` 的 `exportAssetPackage(recipe, options)`。它要求 procedural `createAsset` factory 與 `validateArtifact` callback；任何 LOD 驗證失敗時，都不會發布部分有效的 manifest。

### VRM 掛載與 Affordance

`attachSculptAsset()` 會把 runtime asset socket 掛到 normalized VRM humanoid bone，並回傳可查詢 socket、控制 visibility、detach 與 dispose 的 handle。`VRMAffordanceAdapter` 會把 avatar 對齊椅子座位等 semantic target，並在 asset 移動時保持跟隨。

Avatar animation、IK、pathfinding、collision resolution 與 permission 仍由 host application 負責。Adapter 不會進行 pose retargeting、不會產生 skinned character rig，也不會重新散布 VRM 檔案。

### 可動車輛

`createCar()` 提供 door hinge、wheel pivot、steering、seat、entry／exit socket、collider 與 vehicle action program。`examples/vrm-car.html?vrm=<same-origin-vrm-url>` 示範開啟駕駛門、進入車輛、以 W/S 與 A/D 駕駛、Space 煞車、停車及離開。`VehicleController` 會移動 vehicle root 並更新 wheel 與 steering articulation；它刻意不包含 physics engine。

### GLB Manifest 與 Cesium

匯出的 package 包含各 LOD GLB、`asset-manifest.json` 與 source recipe。Manifest 會記錄 meter unit、ground-center origin、bounds、LOD band、socket、articulation、affordance、attribution、license 與 recipe hash。

`examples/cesium-car/` 是 Cesium 1.141 placement smoke test。它會載入匯出的 LOD0 GLB，並依 manifest-oriented workflow 套用經度、緯度、高度與 heading。它不是 terrain-aware driving、Cesium editor 或 3D Tiles generator。

## PBR 擷取

Plugin 可從圖片 pixel 提取 reference-derived procedural PBR evidence：

```bash
python3 scripts/extract_reference_pbr.py ./reference/oak-bark.png \
  --out-dir ./generated/pbr/oak-bark \
  --material-id bark \
  --target-threshold 0.7 \
  --report ./generated/pbr/oak-bark/report.json
```

輸出包含 palette、albedo、roughness estimate、height、normal 與 AO map 等有用的 material evidence。這不是從單張圖片進行精確 inverse rendering。當 confidence 低於 threshold 時，除非明確加入 `--allow-low-confidence`，否則腳本會拒絕 patch spec。

## 品質關卡

Plugin 使用兩層 visual acceptance：

- Overall match：silhouette、proportion、camera／view、material read 與 lighting。
- Semantic feature match：從同一張完整 reference／render comparison image，評分選定的 critical object feature。

Critical feature target 範例：

- 船舶的 hull shape、cabin block、sail rigging 與 rail。
- 樹木的 trunk fork、major branch socket、canopy mass、bark material 與 root flare。
- 車輛的 body shell、wheel、windshield、grille 與 headlight cluster。

Critical feature 未達 threshold 時，即使 global score 很高，該 pass 仍判定失敗。

## 常見問題

### 這是攝影測量嗎？

不是。Three.js Object Sculptor 不會從 pixel 重建 scanned mesh；它協助 Codex 推導 procedural model plan，並產生近似可見物件的 Three.js code。

### 可以產生 GLB 嗎？

可以。Sculpting workflow 仍以純程式碼 Three.js factory 與 `ObjectSculptSpec` 為主要產出；Runtime Assets v1 可透過 `exportAssetPackage()` 匯出通過驗證的 LOD GLB 與 `asset-manifest.json`。Browser 流程可參考 `examples/export-table.html`。

### 產生的模型可以做動畫嗎？

可以。Animation readiness 是核心目標。Spec 會依需求加入 pivot、socket、parent-child hierarchy、transform channel、collider proxy，以及 detachable 或 breakable component role。

### 會使用下載的 asset 或素材包嗎？

不會。此工作流程以 generated geometry、procedural material、本機 image evidence 與 code-native Three.js construction 為主。

### 單張圖片可以建立精確的 production model 嗎？

不行。單張圖片可以建立實用的 procedural reconstruction，但隱藏面、精確尺寸與細緻 material behavior 仍可能需要假設、更多角度的參考圖，或降低 fidelity target。

### Plugin 如何判斷模型是否夠好？

它會使用 quality contract、staged build pass、browser screenshot、完整 reference／render comparison sheet 與 AI vision review。即使 global visual score 可接受，critical feature 仍可讓該 pass 失敗。

## 專案結構

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

重要腳本：

- `probe_reference_image.py`：檢查圖片技術 metadata。
- `new_pre_spec_assessment.py`：建立 complexity 與 quality-contract skeleton。
- `new_sculpt_spec.py`：建立初始 `ObjectSculptSpec`。
- `validate_sculpt_spec.py`：執行 structural 與 strict quality validation。
- `sculpt_pass_orchestrator.py`：控制 pass lock 與 pipeline sync。
- `generate_threejs_factory.py`：產生目前 pass 的 Three.js factory。
- `make_visual_comparison_sheet.py`：建立完整 reference／render comparison image。
- `append_sculpt_review.py`：紀錄 self-correction review。
- `extract_reference_pbr.py`：提取 reference-derived PBR evidence。

## 限制

- 單張圖片無法揭露隱藏面，也不能保證精確 geometry。
- 透明玻璃、煙、液體、毛髮、細緻布料與精確 likeness 類工作，可能需要額外參考圖或較低的 fidelity target。
- Generated factory 若要投入 production，仍需刻意進行 visual refinement；runtime quality slider 不會自行補出缺少的設計資訊。
- Acceptance 預期使用 AI vision review；腳本只負責整理 evidence，不會自行神奇地判斷 visual quality。
- Runtime articulation 以 pivot 為基礎，不能取代 character skinning、IK、physics 或 navigation system。
- Cesium 目前只支援 GLB placement，不包含 terrain driving 或 3D Tiles generation。

## 開發注意事項

修改 plugin 後，請更新 cachebuster 並重新安裝。若 Codex 已安裝 `plugin-creator` skill，可使用其中的 `update_plugin_cachebuster.py`：

```bash
python3 /path/to/plugin-creator/scripts/update_plugin_cachebuster.py ~/plugins/threejs-object-sculptor
codex plugin add threejs-object-sculptor@local
```

接著開啟新的 Codex task，以載入更新後的 skill 與腳本。

## 原作者與歸屬

Three.js Object Sculptor 由 [Vinh Hiển（`vinhhien112`）](https://github.com/vinhhien112) 建立。本 fork 保留上游 Git history、原作者聲明、專案連結、贊助連結與 MIT License。複製或重新散布本專案或其 substantial portions 時，請保留原始 copyright 與 permission notice。

Fork 的新增功能會以擴充上游專案的方式說明，不取代原作者的著作歸屬。

## 支持原始專案

若 Three.js Object Sculptor 對你有幫助，可以支持原作者與上游專案持續發展：

<a href="https://ko-fi.com/harrynguyen112">
  <img height="36" src="https://storage.ko-fi.com/cdn/kofi6.png?v=6" alt="Buy Me a Coffee on Ko-fi">
</a>

## 授權

MIT。完整條款與原始 `Copyright (c) 2026 Vinh Hiển` 聲明請見 [`LICENSE`](LICENSE)。所有 software copy 或 substantial portions 都必須包含 copyright 與 permission notice。
