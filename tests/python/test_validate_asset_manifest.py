import copy
import json
from pathlib import Path
import unittest

from scripts.validate_asset_manifest import validate_manifest


ROOT = Path(__file__).resolve().parents[2]


class AssetManifestValidationTest(unittest.TestCase):
    def manifest(self):
        path = ROOT / "tests" / "fixtures" / "manifests" / "table.valid.json"
        return json.loads(path.read_text(encoding="utf-8"))

    def test_table_manifest_is_valid(self):
        self.assertEqual(validate_manifest(self.manifest()), [])

    def test_coordinate_bounds_and_hash_are_validated(self):
        manifest = self.manifest()
        manifest["units"] = "centimeters"
        manifest["coordinateFrame"] = {"up": "+Z", "forward": "+X", "origin": "center"}
        manifest["bounds"]["size"][1] = 0
        manifest["recipeHash"] = "bad"
        self.assertEqual(validate_manifest(manifest), [
            "recipeHash must be 64 lowercase hexadecimal characters",
            "units must be meters",
            "coordinateFrame up must be +Y",
            "coordinateFrame forward must be +Z",
            "coordinateFrame origin must be ground-center",
            "bounds size values must be greater than 0",
        ])

    def test_lods_must_be_unique_ordered_and_increasing(self):
        manifest = self.manifest()
        manifest["lods"] = [
            {"level": 1, "url": "one.glb", "maxDistance": 80},
            {"level": 1, "url": "two.glb", "maxDistance": 25},
        ]
        self.assertEqual(validate_manifest(manifest), [
            "duplicate LOD level: 1",
            "LOD levels must be ordered from lowest to highest",
            "LOD maxDistance must increase",
        ])

    def test_semantic_references_and_unique_ids_are_validated(self):
        manifest = self.manifest()
        manifest["sockets"] = ["surface-top", "surface-top"]
        manifest["articulation"]["topHinge"]["node"] = "missing-node"
        manifest["affordances"]["inspect"]["targetSocket"] = "missing-socket"
        manifest["affordances"]["inspect"]["actionProgram"] = "missing-program"
        self.assertEqual(validate_manifest(manifest), [
            "duplicate socket id: surface-top",
            "articulation topHinge references missing node missing-node",
            "affordance inspect references missing socket missing-socket",
            "affordance inspect references missing action program missing-program",
        ])

    def test_license_must_be_an_object(self):
        manifest = copy.deepcopy(self.manifest())
        manifest["license"] = "MIT"
        self.assertEqual(validate_manifest(manifest), ["license must be an object"])
