<?php $assetVersion = time(); ?>
<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Cesium Car Placement Smoke</title>
  <script>window.CESIUM_BASE_URL = "/inc/javascript/cesium/Cesium-1.141/Build/Cesium/";</script>
  <script src="/inc/javascript/cesium/Cesium-1.141/Build/Cesium/Cesium.js"></script>
  <link rel="stylesheet" href="/inc/javascript/cesium/Cesium-1.141/Build/Cesium/Widgets/widgets.css">
  <link rel="stylesheet" href="css/style.css?v=<?= $assetVersion ?>">
</head>
<body>
  <div id="cesiumContainer"></div>
  <form id="controls">
    <strong>Car GLB Placement</strong>
    <label>Manifest <input id="manifestUrl" value="../../output/car/asset-manifest.json"></label>
    <label>GLB <input id="glbUrl" value="../../output/car/car-lod0.glb"></label>
    <label>Longitude <input id="longitude" type="number" step="0.000001" value="120.6485"></label>
    <label>Latitude <input id="latitude" type="number" step="0.000001" value="24.1790"></label>
    <label>Height <input id="height" type="number" step="0.1" value="0"></label>
    <label>Heading <input id="heading" type="range" min="0" max="360" value="0"><output id="headingValue">0°</output></label>
    <button type="submit">Load Car</button>
    <div id="status">READY</div>
  </form>
  <script src="js/app.js?v=<?= $assetVersion ?>"></script>
</body>
</html>
