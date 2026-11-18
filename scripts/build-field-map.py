#!/usr/bin/env python3
"""Rebuild the offline orientation extract (Python 3.10+ and Shapely).

Usage: python scripts/build-field-map.py roads.zip water-lines.zip water-polygons.zip
See docs/FIELD_MAP.md for the exact inputs and license. Not part of the app build.
"""
import json
import sys
import zipfile
from pathlib import Path

from shapely.geometry import box, mapping, shape

LOCAL = box(120.476, 17.035, 120.615, 17.198)
CONTEXT = box(120.425, 17.005, 120.665, 17.23)
OUTPUT = Path(__file__).resolve().parents[1] / "public/app/maps/salcedo-field.geojson"


def classify(source, props):
    if source == "roads":
        road = props.get("highway")
        if road in ("primary", "secondary", "trunk", "motorway", "tertiary"):
            return "highway"
        if road in ("path", "footway", "track", "cycleway", "bridleway"):
            return "trail"
        if road in ("residential", "living_street", "unclassified", "road"):
            return "street"
    elif source == "lines":
        water = props.get("waterway")
        if water in ("river", "stream", "canal"):
            return "river" if water == "river" else "stream"
    elif props.get("natural") == "water" or props.get("waterway") == "riverbank":
        return "water"
    return None


def rounded(coords):
    if isinstance(coords[0], (int, float)):
        return [round(value, 5) for value in coords[:2]]
    return [rounded(part) for part in coords]


def extract(filename, source):
    with zipfile.ZipFile(filename) as archive:
        data = next(n for n in archive.namelist() if n.endswith(".geojson"))
        with archive.open(data) as stream:
            # These HOT exports have one feature per line. Skip distant features
            # before decoding their coordinates; do not load a countrywide file in RAM.
            for line in stream:
                if b'"Feature"' not in line or b'120.' not in line or b', 17.' not in line:
                    continue
                feature = json.loads(line.strip().rstrip(b","))
                props = feature["properties"]
                kind = classify(source, props)
                if kind is None:
                    continue
                extent = CONTEXT if kind in ("highway", "river", "water") else LOCAL
                geom = shape(feature["geometry"])
                if not geom.intersects(extent):
                    continue
                clipped = geom.intersection(extent).simplify(.000045, preserve_topology=True)
                if clipped.is_empty or clipped.geom_type not in ("Polygon", "MultiPolygon", "LineString", "MultiLineString"):
                    continue
                properties = {"kind": kind}
                name = props.get("name") or props.get("name:en")
                if name:
                    properties["name"] = name
                yield {"type": "Feature", "properties": properties, "geometry": {
                    "type": clipped.geom_type, "coordinates": rounded(mapping(clipped)["coordinates"])
                }}


if __name__ == "__main__":
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    features = [feature for source, path in zip(("roads", "lines", "banks"), sys.argv[1:])
                for feature in extract(path, source)]
    result = {"type": "FeatureCollection", "attribution": "© OpenStreetMap contributors. HOT export 2026-05-05.",
              "license": "https://opendatacommons.org/licenses/odbl/1-0/", "features": features}
    OUTPUT.write_text(json.dumps(result, separators=(",", ":"), ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{len(features)} features, {OUTPUT.stat().st_size:,} bytes in {OUTPUT.name}")
