#!/usr/bin/env python3
"""Validate the compact SculptRecipe v1 runtime contract."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


SUPPORTED_PROFILES = {"prop", "weapon", "attachment", "actor", "vehicle", "gis-object"}
QUALITY_PARAMETERS = ("detail", "geometryQuality", "materialQuality")


def _duplicate_ids(items: Any, label: str) -> list[str]:
    if not isinstance(items, list):
        return [f"{label}s must be an array"]
    ids = [item.get("id") for item in items if isinstance(item, dict)]
    return [
        f"duplicate {label} id: {item_id}"
        for item_id in sorted({item_id for item_id in ids if item_id and ids.count(item_id) > 1})
    ]


def validate_recipe(recipe: Any) -> list[str]:
    if not isinstance(recipe, dict):
        return ["recipe must be an object"]

    errors: list[str] = []
    if recipe.get("schemaVersion") != "1.0":
        errors.append("schemaVersion must be 1.0")
    if not isinstance(recipe.get("id"), str) or not recipe["id"].strip():
        errors.append("id must be a non-empty string")
    if recipe.get("profile") not in SUPPORTED_PROFILES:
        errors.append("profile is not supported")
    if not isinstance(recipe.get("seed"), int) or isinstance(recipe.get("seed"), bool):
        errors.append("seed must be an integer")
    if recipe.get("units") != "meters":
        errors.append("units must be meters")

    frame = recipe.get("coordinateFrame")
    if not isinstance(frame, dict):
        errors.append("coordinateFrame must be an object")
    else:
        if frame.get("up") != "+Y":
            errors.append("coordinateFrame up must be +Y")
        if frame.get("forward") != "+Z":
            errors.append("coordinateFrame forward must be +Z")
        if frame.get("origin") != "ground-center":
            errors.append("coordinateFrame origin must be ground-center")

    parameters = recipe.get("parameters")
    if not isinstance(parameters, dict):
        errors.append("parameters must be an object")
    else:
        for name in QUALITY_PARAMETERS:
            value = parameters.get(name)
            if not isinstance(value, (int, float)) or isinstance(value, bool) or not 0 <= value <= 1:
                errors.append(f"parameter {name} must be between 0 and 1")

    components = recipe.get("components")
    errors.extend(_duplicate_ids(components, "component"))
    component_ids = {
        item.get("id") for item in components or [] if isinstance(item, dict) and item.get("id")
    }
    for component in components or []:
        if not isinstance(component, dict):
            errors.append("component must be an object")
            continue
        component_id = component.get("id")
        if not isinstance(component_id, str) or not component_id:
            errors.append("component id must be a non-empty string")
            continue
        parent = component.get("parent")
        if parent is not None and parent not in component_ids:
            errors.append(f"component {component_id} references missing parent {parent}")

    articulation = recipe.get("articulation")
    errors.extend(_duplicate_ids(articulation, "articulation"))
    for joint in articulation or []:
        if not isinstance(joint, dict):
            errors.append("articulation must be an object")
            continue
        joint_id = joint.get("id")
        node = joint.get("node")
        if node not in component_ids:
            errors.append(f"articulation {joint_id} references missing node {node}")

    for name in ("materials", "affordances"):
        if not isinstance(recipe.get(name), list):
            errors.append(f"{name} must be an array")
    if not isinstance(recipe.get("lod"), dict):
        errors.append("lod must be an object")
    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("recipe", type=Path)
    args = parser.parse_args(argv)
    recipe = json.loads(args.recipe.read_text(encoding="utf-8"))
    errors = validate_recipe(recipe)
    if errors:
        for error in errors:
            print(f"ERROR {error}")
        return 1
    print(f"VALID SculptRecipe {recipe['id']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
