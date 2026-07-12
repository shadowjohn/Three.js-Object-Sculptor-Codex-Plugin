(function () {
  "use strict";

  var viewer = new Cesium.Viewer("cesiumContainer", {
    animation: false,
    baseLayer: false,
    baseLayerPicker: false,
    fullscreenButton: false,
    geocoder: false,
    homeButton: false,
    infoBox: false,
    navigationHelpButton: false,
    sceneModePicker: false,
    selectionIndicator: false,
    timeline: false,
    terrainProvider: new Cesium.EllipsoidTerrainProvider(),
  });
  viewer.imageryLayers.addImageryProvider(new Cesium.UrlTemplateImageryProvider({
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    credit: "© OpenStreetMap contributors",
  }));

  var model = null;
  var status = document.getElementById("status");
  var heading = document.getElementById("heading");
  var headingValue = document.getElementById("headingValue");
  heading.addEventListener("input", function () { headingValue.value = heading.value + "°"; });

  document.getElementById("controls").addEventListener("submit", async function (event) {
    event.preventDefault();
    status.textContent = "LOADING";
    try {
      var manifest = await Cesium.Resource.fetchJson(document.getElementById("manifestUrl").value);
      if (manifest.units !== "meters" || manifest.origin !== "ground-center") {
        throw new Error("manifest units/origin must be meters/ground-center");
      }
      var longitude = Number(document.getElementById("longitude").value);
      var latitude = Number(document.getElementById("latitude").value);
      var height = Number(document.getElementById("height").value);
      var position = Cesium.Cartesian3.fromDegrees(longitude, latitude, height);
      var hpr = new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(Number(heading.value)), 0, 0);
      var orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);
      var modelMatrix = Cesium.Matrix4.fromTranslationQuaternionRotationScale(
        position, orientation, new Cesium.Cartesian3(1, 1, 1)
      );
      if (model) viewer.scene.primitives.remove(model);
      model = await Cesium.Model.fromGltfAsync({
        url: document.getElementById("glbUrl").value,
        modelMatrix: modelMatrix,
      });
      viewer.scene.primitives.add(model);
      viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height + 60) });
      status.textContent = "LOADED · " + manifest.assetId;
    } catch (error) {
      status.textContent = "LOAD_FAILED · " + error.message;
    }
  });
}());
