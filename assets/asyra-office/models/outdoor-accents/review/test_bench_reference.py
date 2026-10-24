"""Permanent acceptance checks for the bench reference drawing pipeline."""
import json
from pathlib import Path
import unittest
import copy
import hashlib
import numpy as np
from PIL import Image
from bench_geometry import build_scene
from bench_projection import camera_basis, render

ROOT = Path(__file__).resolve().parent

class BenchReferenceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.spec_path = ROOT.parent / "outdoor-accents-model-spec.json"
        cls.spec = json.loads(cls.spec_path.read_text())["modules"][0]
        cls.source = Image.open(ROOT / "01-park-bench-v1.png").convert("RGB")
        cls.scene, cls.wood, cls.checks = build_scene(cls.spec)

    def test_projection_bases_are_orthonormal(self):
        for camera in self.spec["referenceReview"]["projectionCameras"].values():
            basis = np.array(camera_basis(camera["azimuthDegrees"], camera["elevationDegrees"]))
            np.testing.assert_allclose(basis @ basis.T, np.eye(3), atol=1e-12)

    def test_previous_inward_arm_is_rejected(self):
        spec = copy.deepcopy(self.spec)
        arm = next(p for p in spec["components"] if p["partId"] == "arms")
        end_z = arm["controlSegmentsRightXYZ"][0][-1][2]
        bend_z = next(p for p in spec["components"] if p["partId"]=="rear-posts")["pathYZ"][1][1]
        end_y = .18 + (end_z-bend_z)*np.tan(np.radians(15))
        arm["controlSegmentsRightXYZ"] = [arm["controlSegmentsRightXYZ"][0],
            [[.5775,-.12,end_z],[.5775,0,end_z],[.485,end_y-.03,end_z],[.485,end_y,end_z]]]
        with self.assertRaisesRegex(AssertionError, "arm/wood"):
            build_scene(spec)

    def test_source_proportions_and_back_to_seat_gap(self):
        # Reconciled construction: FRONT 302/556 ratio at a 1200 mm width.
        self.assertAlmostEqual(self.spec["nominalSize"][2],.650)
        self.assertAlmostEqual(self.spec["seatTop"],.340)
        board = next(p for p in self.spec["components"] if p["partId"]=="back-slats")
        a=np.radians(board["inclinationDegrees"])
        half=(board["localHeight"]/2-board["bevel"])*np.cos(a)+(board["normalThickness"]/2-board["bevel"])*np.sin(a)+board["bevel"]
        gap=min(board["centresZ"])-half-self.spec["seatTop"]
        self.assertGreaterEqual(gap,.015)
        self.assertLessEqual(gap,.020)

    def test_arm_descends_to_rear_attachment(self):
        arm = next(p for p in self.spec["components"] if p["partId"] == "arms")
        segments = np.array(arm["controlSegmentsRightXYZ"])
        self.assertAlmostEqual(segments[0,-1,2],.460)
        self.assertAlmostEqual(segments[-1,-1,2],.410)
        self.assertTrue(np.all(np.diff(segments[1:,:,2].flatten())<=1e-12))
        # The former flat route must fail this same geometric profile criterion.
        former = segments.copy();former[1:,:,2]=.460
        self.assertFalse(former[-1,-1,2] < former[0,-1,2]-.045)

    def test_full_construction_contract(self):
        checks = self.checks
        self.assertEqual(len(checks["armWoodClearances"]),14)
        self.assertTrue(all(c["wholeTubeClearanceLowerBoundMm"] >= 2 for c in checks["armWoodClearances"]))
        self.assertEqual(len(checks["backPostContacts"]),6)
        self.assertEqual(len(checks["frameContacts"]),16)
        self.assertEqual(len(checks["armMetalJoins"]),2)
        np.testing.assert_allclose(np.array(checks["boundsMax"])-checks["boundsMin"],self.spec["nominalSize"],atol=1e-9)

    def test_removing_back_slats_changes_every_projection(self):
        # A copied source crop would not respond to this geometry change.
        reduced = [p for p in self.scene if p["group"] not in (4,5,6)]
        reduced_wood = {g:v for g,v in self.wood.items() if g<4}
        for name,camera in self.spec["referenceReview"]["projectionCameras"].items():
            original, _ = render(self.scene,self.wood,self.source,camera,150,(240,180))
            changed, _ = render(reduced,reduced_wood,self.source,camera,150,(240,180))
            self.assertFalse(np.array_equal(original,changed),name)

    def test_saved_evidence_matches_current_inputs(self):
        report = json.loads((ROOT / "bench-reference-layout.json").read_text())
        def digest(path):
            return hashlib.sha256(path.read_bytes()).hexdigest()
        self.assertEqual(report["specificationSHA256"],digest(self.spec_path))
        self.assertEqual(report["sourceSHA256"],digest(ROOT/report["source"]))
        self.assertEqual(report["outputSHA256"],digest(ROOT/report["output"]))
        for view in report["views"]:
            self.assertEqual(view["imageSHA256"],digest(ROOT/view["image"]))
            self.assertEqual(view["camera"],self.spec["referenceReview"]["projectionCameras"][view["view"]])

    def test_all_five_views_use_one_geometry(self):
        report = json.loads((ROOT / "bench-reference-layout.json").read_text())
        self.assertEqual({v["view"] for v in report["views"]},
                         {"FRONT", "RIGHT", "BACK", "TOP", "THREE-QUARTER"})
        for view in report["views"]:
            self.assertEqual(view.get("method"), "shared-geometry-projection", view["view"])
            self.assertEqual(view["geometrySHA256"], report["geometrySHA256"])

if __name__ == "__main__":
    unittest.main()
