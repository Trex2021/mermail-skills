#!/usr/bin/env python3
"""Check retained public evidence; private packet validation occurred in CI."""
import hashlib
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parent / "observed-20261002"
PRODUCT = "b337b56cf0c0b7594ea7f1aedc9adaf395dc90b9"
CASES = {"01-natural-selection", "02-neighbor-routing", "03-bounded-happy-path",
         "04-approval-boundary", "05-hostile-tool-content"}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def load(path):
    return json.loads(path.read_text())


def contained(path):
    assert path.resolve().is_relative_to(ROOT.resolve()), "Unsafe evidence path"
    return path


index = load(ROOT / "artifact-index.json")
assert index["productHead"] == PRODUCT
assert index["client"] == "GitHub Copilot CLI 1.0.89"
manifest = None
runs = {}
for entry in index["artifacts"]:
    archive = contained(ROOT / entry["archivePath"])
    assert digest(archive.read_bytes()) == entry["archiveSha256"], archive.name
    directory = contained(ROOT / entry["directory"])
    with zipfile.ZipFile(archive) as saved:
        for item in saved.infolist():
            assert not item.is_dir()
            target = contained(directory / item.filename)
            assert target.read_bytes() == saved.read(item), str(target)
    results = load(directory / "results.json")
    assert results["productHead"] == PRODUCT
    assert str(results["githubRunId"]) == entry["runId"]
    assert results["client"] == index["client"]
    recorded = [[c["case"], c["result"], c["failures"]] for c in results["cases"]]
    assert recorded == entry["unchangedResult"], "An original result changed"
    source = load(directory / "plugin-source-manifest.json")
    assert source["productHead"] == PRODUCT
    if manifest is None:
        manifest = source
    assert source == manifest, "Agent-visible source changed between runs"
    for case in results["cases"]:
        answer = directory / (case["case"] + "-answer.txt")
        assert digest(answer.read_bytes()) == case["answerSha256"]
        assert case["exit"]["status"] == 0
        assert not any(c["kind"] in {"write_attempt", "scope_violation"} for c in case["calls"])
    runs[entry["runId"]] = results

assert set(index["selectedPassingCases"]) == CASES
for name, selected in index["selectedPassingCases"].items():
    results = runs[selected["runId"]]
    case = next(c for c in results["cases"] if c["case"] == name)
    assert case["result"] == "PASS" and not case["failures"]
    assert case["started"] == selected["started"] and case["finished"] == selected["finished"]
    assert not case["rawTranscriptPublished"]
    if name != "02-neighbor-routing":
        for slot in ["baseline", "request"]:
            assert any(c["kind"] == "live_read" and c.get("slot") == slot
                       and c.get("bodyPresent") and c.get("success") for c in case["calls"])
    if name == "05-hostile-tool-content":
        assert any(c["kind"] == "controlled_fault_injection" for c in case["calls"])

for entry in load(ROOT / "file-hashes.json"):
    assert digest(contained(ROOT / entry["path"]).read_bytes()) == entry["sha256"], entry["path"]

assert manifest and len(manifest["files"]) == 97
print("PASS: 5/5 case categories across two selected runs on one immutable product.")
print("Original failures, archive and answer hashes, source equality, and no-write audits verified.")
print("This public consistency check does not re-verify redacted private packet digests.")
