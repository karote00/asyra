"""Bookcase construction-input checks; no production asset is generated."""
import hashlib
import itertools
import json
import math
from pathlib import Path
import re
import unittest

from test_snack_cabinet_spec import bounds, overlap

ROOT = Path(__file__).resolve().parents[2]


class BookcaseTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads((ROOT/'storage-model-spec.json').read_text())
        cls.book = next(m for m in cls.data['modules'] if m['moduleId']=='low-bookcase')
        cls.parts = {p['partId']:p for p in cls.book['components']}

    def test_original_reference_preserved(self):
        self.assertEqual(hashlib.sha256((ROOT/self.book['reviewDrawing']).read_bytes()).hexdigest(),
                         'd2b00a27fe466e7c8790b3c37bdd70f6b937e443e4d14bfab52c3f1b613d9c54')

    def test_dimensions_top_fit_and_base_insets(self):
        p = self.parts
        self.assertEqual(self.book['overallSize'], [.42,.26,.82])
        self.assertAlmostEqual(p['top']['size'][0], .376)
        for side in ['side-left','side-right']:
            self.assertAlmostEqual(bounds(p[side])[1][2], .82)
        self.assertAlmostEqual(bounds(p['top'])[0][0],bounds(p['side-left'])[1][0])
        self.assertAlmostEqual(bounds(p['top'])[1][0],bounds(p['side-right'])[0][0])
        lo,hi = bounds(p['plinth'])
        self.assertAlmostEqual(lo[2],0)
        self.assertAlmostEqual(hi[2],.035)
        for actual,expected in [(lo[0]+.21,.03),(.21-hi[0],.03),(lo[1]+.13,.04),(.13-hi[1],.02)]:
            self.assertAlmostEqual(actual,expected)
        boxes = [bounds(part) for part in p.values()]
        for axis in range(3):
            low = min(box[0][axis] for box in boxes)
            high = max(box[1][axis] for box in boxes)
            self.assertAlmostEqual(low,self.book['bounds']['min'][axis])
            self.assertAlmostEqual(high,self.book['bounds']['max'][axis])
            self.assertAlmostEqual(high-low,self.book['overallSize'][axis])

    def test_inputs_form_one_connected_nonoverlapping_union(self):
        names = list(self.parts)
        self.assertEqual(set(names),set(self.book['constructionReview']['unionInputs']))
        adjacency = {n:set() for n in names}
        for a,b in itertools.combinations(names,2):
            delta = overlap(self.parts[a],self.parts[b])
            self.assertFalse(all(d>1e-9 for d in delta),f'Overlapping inputs: {a}/{b}')
            if min(delta)>=-1e-9 and sum(d>1e-9 for d in delta)==2:
                adjacency[a].add(b)
                adjacency[b].add(a)
        seen={names[0]};pending=list(seen)
        while pending:
            for n in adjacency[pending.pop()]-seen:
                seen.add(n);pending.append(n)
        self.assertEqual(seen,set(names))
        for part in self.parts.values():
            self.assertEqual(part['primitive'],'box-union-input')
            self.assertEqual(part['constructionGroup'],'bookcase-body')
            self.assertEqual(part['radius'],.003)
        # Coordinate-cell integration verifies the union volume, without exporting a mesh.
        axes=[sorted({round(v,9) for p in self.parts.values() for v in (bounds(p)[0][i],bounds(p)[1][i])}) for i in range(3)]
        intervals=[list(zip(a,a[1:])) for a in axes]
        volume=0
        for cell in itertools.product(*intervals):
            point=[sum(interval)/2 for interval in cell]
            owners=[p for p in self.parts.values() if all(lo<q<hi for q,lo,hi in zip(point,*bounds(p)))]
            self.assertLessEqual(len(owners),1)
            if owners:volume+=math.prod(hi-lo for lo,hi in cell)
        self.assertAlmostEqual(volume,sum(math.prod(p['size']) for p in self.parts.values()))
        self.assertAlmostEqual(volume,self.book['constructionReview']['unroundedUnionVolume'])

    def test_three_real_cavities_and_backing(self):
        p=self.parts;c=self.book['compartments']
        self.assertEqual(c['openCount'],3)
        surfaces=[('bottom','shelf-1'),('shelf-1','shelf-2'),('shelf-2','top')]
        self.assertEqual(len(c['clearIntervalsZ']),len(surfaces))
        self.assertAlmostEqual(c['clearWidth'],.376)
        self.assertAlmostEqual(c['clearDepth'],.242)
        self.assertAlmostEqual(bounds(p['back'])[0][1],.112)
        self.assertAlmostEqual(bounds(p['back'])[0][2],bounds(p['bottom'])[1][2])
        self.assertAlmostEqual(bounds(p['back'])[1][2],bounds(p['top'])[0][2])
        for (lower,upper),(z0,z1) in zip(surfaces,c['clearIntervalsZ']):
            self.assertAlmostEqual(z0,bounds(p[lower])[1][2])
            self.assertAlmostEqual(z1,bounds(p[upper])[0][2])
            for point in itertools.product([-.187,0,.187],[-.129,0,.111],[z0+.001,(z0+z1)/2,z1-.001]):
                for part in p.values():
                    lo,hi=bounds(part)
                    self.assertFalse(all(a<q<b for q,a,b in zip(point,lo,hi)),f'Cavity blocked by {part["partId"]}')

    def test_whole_unit_scaling_and_grain_contract(self):
        sizing=self.book['sizing']
        self.assertEqual(sizing['origin'],[0,0,0])
        self.assertEqual(sizing['applicationCount'],1)
        self.assertEqual(sizing['defaultSize'],self.book['overallSize'])
        for target in [(.84,.39,1.23),(.21,.52,.41)]:
            scale=[a/b for a,b in zip(target,self.book['overallSize'])]
            for axis in range(3):
                values=[v*scale[axis] for p in self.parts.values() for v in (bounds(p)[0][axis],bounds(p)[1][axis])]
                self.assertAlmostEqual(max(values)-min(values),target[axis])
            self.assertAlmostEqual(bounds(self.parts['plinth'])[0][2]*scale[2],0)
            for lower,upper in [('bottom','shelf-1'),('shelf-1','shelf-2'),('shelf-2','top')]:
                expected=(bounds(self.parts[upper])[0][2]-bounds(self.parts[lower])[1][2])*scale[2]
                self.assertGreater(expected,0)
        self.assertEqual(self.book['appearance']['grainCoordinates'],'final resized local metres before world placement')
        self.assertEqual(self.book['appearance']['colorFallback'],'selected material color')

    def test_defaults_lod_and_document_tables(self):
        b=self.book
        self.assertFalse(b['constructionReview']['modelVerified'])
        self.assertEqual(b['constructionReview']['outputSolidCount'],1)
        self.assertLess(b['constructionReview']['joinTolerance'],.003)
        for part in self.parts.values():
            a=b['appearance']['parts'][part['partId']]
            self.assertEqual(a['defaultMaterial'],part['material'])
            self.assertEqual(a['defaultColorSRGB'],self.data['materials'][part['material']]['baseColorSRGB'])
        doc=(ROOT/'BOOKCASE-SPEC.md').read_text()
        for target in re.findall(r'\[[^]]+\]\(([^)]+)\)',doc):
            self.assertTrue((ROOT/target.split('#')[0]).exists(),target)
        for part in self.parts.values():
            row=next(line for line in doc.splitlines() if re.match(r'\|\s*'+re.escape(part['partId'])+r'\s*\|',line))
            cells=[v.strip() for v in row.split('|')[1:-1]]
            for text,values in [(cells[1],part['size']),(cells[2],part['centre'])]:
                numbers=[float(v.strip())/1000 for v in text.split(',')]
                self.assertEqual(len(numbers),3)
                for a,b0 in zip(numbers,values):self.assertAlmostEqual(a,b0)
        for tier in b['lod']['tiers']:
            self.assertIsNone(tier['actualTriangleCount'])
            self.assertFalse(tier['verified'])
            row=next(line for line in doc.splitlines() if re.match(r'\|\s*'+tier['id']+r'\s*\|',line))
            cells=[v.strip() for v in row.split('|')[1:-1]]
            self.assertEqual(int(cells[1]),tier['bevelSegments'])
            self.assertEqual(int(cells[2]),tier['triangleBudget'])


if __name__=='__main__':unittest.main(verbosity=2)
