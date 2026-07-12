import json
from pathlib import Path
import unittest

from scripts.validate_sculpt_recipe import validate_recipe


ROOT = Path(__file__).resolve().parents[2]


class SculptRecipeValidationTest(unittest.TestCase):
    def load(self, name):
        path = ROOT / "tests" / "fixtures" / "recipes" / name
        return json.loads(path.read_text(encoding="utf-8"))

    def test_table_recipe_is_valid(self):
        self.assertEqual(validate_recipe(self.load("table.valid.json")), [])

    def test_duplicate_component_is_rejected(self):
        errors = validate_recipe(self.load("duplicate-component.invalid.json"))
        self.assertIn("duplicate component id: leg", errors)

    def test_missing_parent_and_articulation_node_are_rejected(self):
        recipe = self.load("table.valid.json")
        recipe["components"][1]["parent"] = "missing-parent"
        recipe["articulation"][0]["node"] = "missing-node"
        self.assertEqual(
            validate_recipe(recipe),
            [
                "component leg references missing parent missing-parent",
                "articulation leg-adjust references missing node missing-node",
            ],
        )

    def test_quality_values_must_be_normalized(self):
        recipe = self.load("table.valid.json")
        recipe["parameters"]["detail"] = 1.1
        self.assertEqual(validate_recipe(recipe), ["parameter detail must be between 0 and 1"])
