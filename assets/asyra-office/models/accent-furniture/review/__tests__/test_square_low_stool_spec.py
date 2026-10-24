"""Check stool document geometry without generating or certifying a model."""
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location(
    'desk_math', ROOT.parent/'furniture/review/__tests__/test_writing_desk_spec.py')
helpers = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helpers)
BASELINE = {'parts': '7060977c198503a820911d838ab915a2edf37df4f2c9dc4e3808a161f5c77f40', 'table': 'd58a93fc326e874c6e022392ba5daadf96a5359d91ae160b9a8ef60b34eb5087', 'materials': '33345ab981a38b545ca96a97bc96464c2c369360e79d3e36cf6922ec5c763d6a', 'images': {'01-square-low-stool-v1.png': '42f5db8e4bcc76f08f70eabdb75dd9c7dad98765031dab87da45d8848c88570b', '02-pedestal-side-table-v1.png': 'fe376c7f4738bbaa4ab57ae802c79f2b21f4954d2549da219c915c69e1bdeea8'}}


class SquareLowStoolSpecificationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads((ROOT/'accent-furniture-model-spec.json').read_text())
        cls.stool = cls.data['assets'][0]
        cls.parts = {p['name']:p for p in cls.stool['parts']}

    def test_geometry_and_other_asset_preserved(self):
        self.assertEqual(helpers.digest(self.stool['parts']),BASELINE['parts'])
        # Table handoff metadata and tessellation are reviewed separately.
        table_geometry=[{k:v for k,v in p.items() if k!='segments'} for p in self.data['assets'][1]['parts']]
        self.assertEqual(helpers.digest(table_geometry),'ce1c1fdc6ed35631691ffa665b02141335c86f669f375aca0e54116a55cda06e')
        self.assertEqual(helpers.digest(self.data['materials']),BASELINE['materials'])
        for name,digest in BASELINE['images'].items():
            self.assertEqual(hashlib.sha256((ROOT/'review'/name).read_bytes()).hexdigest(),digest)

    def test_actual_extents_and_four_ground_contacts(self):
        points=[];contacts=set()
        for p in self.parts.values():
            lo=[c-s/2 for c,s in zip(p['center'],p['size'])]
            hi=[c+s/2 for c,s in zip(p['center'],p['size'])]
            points.extend([lo,hi])
            if p['name']!='cushion':
                self.assertEqual(lo[2],0)
                self.assertEqual(p['size'][:2],[.035,.035])
                contacts.add(tuple(p['center'][:2]))
        self.assertEqual(contacts,{(x,y) for x in (-.125,.125) for y in (-.125,.125)})
        for axis,extent in enumerate(self.stool['bounds']):
            self.assertAlmostEqual(max(p[axis] for p in points)-min(p[axis] for p in points),extent)
        self.assertEqual(self.parts['cushion']['radius'],.035)

    def test_full_leg_cap_embedment_and_bottom_holes(self):
        c=self.parts['cushion'];z=c['center'][2]-c['size'][2]/2
        flat=[s/2-c['radius'] for s in c['size'][:2]]
        leg_area=0
        for name,p in self.parts.items():
            if name=='cushion':continue
            self.assertAlmostEqual(p['center'][2]+p['size'][2]/2-z,.015)
            for x in (-1,1):
                for y in (-1,1):
                    corner=[p['center'][0]+x*p['size'][0]/2,p['center'][1]+y*p['size'][1]/2]
                    for a in (0,1):
                        self.assertAlmostEqual(flat[a]-(abs(p['center'][a])+p['size'][a]/2),.0025)
                        self.assertLess(abs(corner[a]),flat[a])
                    self.assertLess(helpers.rounded_field([*corner,.175],c['center'],c['size'],c['radius']),-.014)
                    self.assertAlmostEqual(helpers.rounded_field([*corner,z],c['center'],c['size'],c['radius']),0)
            leg_area+=p['size'][0]*p['size'][1]
        self.assertAlmostEqual(4*flat[0]*flat[1]-leg_area,.0792)
        self.assertAlmostEqual(2*.125-.035,.215)
        assembly=self.stool['constructionReview']
        self.assertEqual(assembly['logicalPartCount'],5)
        self.assertEqual(assembly['exteriorShellCount'],1)
        self.assertEqual(assembly['flatUndersideTriangleCount'],26)
        self.assertAlmostEqual(assembly['visibleLegTopZ'],z)

    def test_lod_rounding_and_topology_budget(self):
        for tier in self.stool['lod']['tiers']:
            n=tier['cornerSegments']
            count,error=helpers.sphere_corner(n,'normalized-barycentric-grid')
            # Six faces, twelve cylindrical edges, eight corners; replace the
            # two underside triangles by 26, then add four open-top legs.
            total=12+24*n+8*count-2+26+4*10
            self.assertEqual(total,tier['analyticTriangles'])
            self.assertLessEqual(total,tier['maxTriangles'])
            self.assertLessEqual(self.parts['cushion']['radius']*error,tier['maxSurfaceError'])
            self.assertEqual(tier['bottomHoleCount'],4)

    def test_sizing_and_independent_appearance_regions(self):
        self.assertEqual(self.stool['sizing']['instanceScaleApplications'],1)
        self.assertEqual(self.stool['sizing']['invalidExtentPolicy'],'reject')
        appearance=self.stool['appearance']
        self.assertFalse(appearance['bakedLighting'])
        self.assertTrue(appearance['independentInstanceOverrides'])
        self.assertCountEqual([p for r in appearance['regions'] for p in r['parts']],self.parts)
        for region in appearance['regions']:
            self.assertEqual(region['defaultMaterial'],self.parts[region['parts'][0]]['material'])

    def test_document_numeric_tables_and_links(self):
        doc=(ROOT/'SQUARE-LOW-STOOL-SPEC.md').read_text()
        for path in re.findall(r'\]\(([^)#]+)(?:#[^)]*)?\)',doc):
            if '://' not in path:self.assertTrue((ROOT/path).exists(),path)
        for name,p in self.parts.items():
            row=next(s for s in doc.splitlines() if re.match(r'\|\s*'+re.escape(name)+r'\s*\|',s))
            cells=[s.strip() for s in row.split('|')[1:-1]]
            self.assertEqual([float(v) for v in cells[1].split(',')],[v*1000 for v in p['center']])
            self.assertEqual([float(v) for v in cells[2].split(',')],[v*1000 for v in p['size']])
        for tier in self.stool['lod']['tiers']:
            row=next(s for s in doc.splitlines() if re.match(r'\|\s*'+tier['id'].upper()+r'\s*\|',s))
            cells=[s.strip() for s in row.split('|')[1:-1]]
            self.assertEqual(list(map(float,cells[1:])),[tier['cornerSegments'],tier['analyticTriangles'],tier['maxTriangles'],tier['maxSurfaceError']*1000])
        self.assertFalse(self.stool['constructionReview']['modelVerified'])


if __name__=='__main__':unittest.main(verbosity=2)
