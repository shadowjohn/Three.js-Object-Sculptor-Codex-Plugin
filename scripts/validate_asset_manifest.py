#!/usr/bin/env python3
"""Validate Runtime Asset Manifest v1 files."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import re
from typing import Any


HASH_PATTERN = re.compile(r"^[a-f0-9]{64}$")


def _valid_vector(value: Any, *, positive: bool = False) -> bool:
    if not isinstance(value, list) or len(value) != 3:
        return False
    if any(not isinstance(item, (int, float)) or isinstance(item, bool) for item in value):
        return False
    return not positive or all(item > 0 for item in value)


def _duplicates(values: Any, label: str) -> list[str]:
    if not isinstance(values, list):
        return [f"{label}s must be an array"]
    return [
        f"duplicate {label} id: {value}"
        for value in sorted({value for value in values if values.count(value) > 1})
    ]


def validate_manifest(manifest: Any) -> list[str]:
    if not isinstance(manifest, dict):
        return ["manifest must be an object"]

    errors: list[str] = []
    if manifest.get("schemaVersion") != "1.0":
        errors.append("schemaVersion must be 1.0")
    for field in ("id", "version", "generatorVersion", "profile"):
        if not isinstance(manifest.get(field), str) or not manifest[field].strip():
            errors.append(f"{field} must be a non-empty string")
    if not isinstance(manifest.get("recipeHash"), str) or not HASH_PATTERN.fullmatch(manifest["recipeHash"]):
        errors.append("recipeHash must be 64 lowercase hexadecimal characters")
    if manifest.get("units") != "meters":
        errors.append("units must be meters")

    frame = manifest.get("coordinateFrame")
    if not isinstance(frame, dict):
        errors.append("coordinateFrame must be an object")
    else:
        if frame.get("up") != "+Y":
            errors.append("coordinateFrame up must be +Y")
        if frame.get("forward") != "+Z":
            errors.append("coordinateFrame forward must be +Z")
        if frame.get("origin") != "ground-center":
            errors.append("coordinateFrame origin must be ground-center")

    bounds = manifest.get("bounds")
    if not isinstance(bounds, dict):
        errors.append("bounds must be an object")
    else:
        if not _valid_vector(bounds.get("center")):
            errors.append("bounds center must be a three-number vector")
        size = bounds.get("size")
        if not _valid_vector(size):
            errors.append("bounds size must be a three-number vector")
        elif not _valid_vector(size, positive=True):
            errors.append("bounds size values must be greater than 0")

    lods = manifest.get("lods")
    if not isinstance(lods, list) or not lods:
        errors.append("lods must be a non-empty array")
    else:
        levels = [item.get("level") for item in lods if isinstance(item, dict)]
        for level in sorted({level for level in levels if levels.count(level) > 1}):
            errors.append(f"duplicate LOD level: {level}")
        if levels != list(range(len(levels))):
            errors.append("LOD levels must be ordered from lowest to highest")
        distances = [item.get("maxDistance") for item in lods if isinstance(item, dict)]
        if any(not isinstance(value, (int, float)) for value in distances) or any(
            distances[index] <= distances[index - 1] for index in range(1, len(distances))
        ):
            errors.append("LOD maxDistance must increase")
        for item in lods:
            if not isinstance(item, dict) or not isinstance(item.get("url"), str) or not item["url"].strip():
                errors.append("LOD url must be a non-empty string")

    nodes = manifest.get("nodes")
    sockets = manifest.get("sockets")
    action_programs = manifest.get("actionPrograms")
    errors.extend(_duplicates(nodes, "node"))
    errors.extend(_duplicates(sockets, "socket"))
    errors.extend(_duplicates(manifest.get("colliders"), "collider"))
    node_ids = set(nodes) if isinstance(nodes, list) else set()
    socket_ids = set(sockets) if isinstance(sockets, list) else set()
    action_ids = set(action_programs) if isinstance(action_programs, dict) else set()

    articulation = manifest.get("articulation")
    if not isinstance(articulation, dict):
        errors.append("articulation must be an object")
    else:
        for joint_id in sorted(articulation):
            node = articulation[joint_id].get("node") if isinstance(articulation[joint_id], dict) else None
            if node not in node_ids:
                errors.append(f"articulation {joint_id} references missing node {node}")

    affordances = manifest.get("affordances")
    if not isinstance(affordances, dict):
        errors.append("affordances must be an object")
    else:
        for affordance_id in sorted(affordances):
            affordance = affordances[affordance_id]
            if not isinstance(affordance, dict):
                errors.append(f"affordance {affordance_id} must be an object")
                continue
            for field in ("targetSocket", "approachSocket", "exitSocket"):
                socket = affordance.get(field)
                if socket and socket not in socket_ids:
                    errors.append(f"affordance {affordance_id} references missing socket {socket}")
            program = affordance.get("actionProgram")
            if program and program not in action_ids:
                errors.append(f"affordance {affordance_id} references missing action program {program}")

    if not isinstance(action_programs, dict):
        errors.append("actionPrograms must be an object")
    if not isinstance(manifest.get("license"), dict):
        errors.append("license must be an object")
    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", type=Path)
    args = parser.parse_args(argv)
    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    errors = validate_manifest(manifest)
    if errors:
        for error in errors:
            print(f"ERROR {error}")
        return 1
    print(f"VALID AssetManifest {manifest['id']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
