"""Curved-sofa reference contract checks, not production mesh certification."""
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location(
    'desk_math', ROOT.parent / 'furniture/review/__tests__/test_writing_desk_spec.py')
helpers = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helpers)


def source_box(part):
    a, b = map(math.radians, part['angleDegrees'])
    low = [a, part['innerRadius'], part['zMin']]
    high = [b, part['outerRadius'], part['zMax']]
    return [(a+b)/2 for a,b in zip(low,high)], [b-a for a,b in zip(low,high)]


def field(part, radius, angle, z):
    centre, size = source_box(part)
    radial = radius - part.get('radialShear', 0) * (z-centre[2])
    return helpers.rounded_field([math.radians(angle), radial, z], centre, size, part['bevel'])


def extremum(fn, maximize=False):
    """Bounded unimodal corner search independent of stored dimension values."""
    low, high = 0., math.pi/2
    for _ in range(100):
        a, b = low+(high-low)/3, high-(high-low)/3
        if (fn(a) < fn(b)) == maximize:
            low = a
        else:
            high = b
    return fn((low+high)/2)


def arm_extents(arm):
    b = arm['bevel']; end = math.radians(arm['angleDegrees'][1])
    x = extremum(lambda t: (arm['outerRadius']-b+b*math.cos(t)) *
                 math.sin(end-b+b*math.sin(t)), True)
    y = extremum(lambda t: (arm['innerRadius']+b-b*math.cos(t)) *
                 math.cos(end-b+b*math.sin(t)))
    return x, y


class CurvedSofaSpecificationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads((ROOT/'sofa-variants-model-spec.json').read_text())
        cls.sofa = next(m for m in cls.data['modules'] if m['moduleId']=='curved-sofa')
        cls.parts = {p['partId']: p for p in cls.sofa['components']}

    def test_seats_backs_and_structure_have_real_overlap(self):
        p = self.parts
        self.assertGreater(p['base']['zMax'], p['seat-1']['zMin'])
        self.assertLess(p['back-cushion-1']['zMin'], p['seat-1']['zMax'])
        self.assertLessEqual(p['rear-shell']['zMin'], .09)
        for i in range(1,4):
            seat, back = p[f'seat-{i}'], p[f'back-cushion-{i}']
            angle = sum(seat['angleDegrees'])/2
            self.assertAlmostEqual(back['radialShear'], math.tan(math.radians(10)))
            for names, point in [
                (('base',f'seat-{i}'),(.6,angle,.2425)),
                ((f'seat-{i}',f'back-cushion-{i}'),(.815,angle,.322)),
                (('rear-shell',f'back-cushion-{i}'),(.925,angle,.54)),
            ]:
                for name in names:
                    self.assertLess(field(p[name],*point), -.003, (names,name,point))
        for names,point in [
            (('base','rear-shell'),(.94,0,.2)),
            (('base','left-arm'),(.6,-56,.2)),
            (('base','right-arm'),(.6,56,.2)),
            (('rear-shell','left-arm'),(.95,-56,.4)),
            (('rear-shell','right-arm'),(.95,56,.4)),
        ]:
            for name in names:
                self.assertLess(field(p[name],*point),-.003,(names,name))

    def test_rounded_dimensions_and_origin(self):
        s,p = self.sofa,self.parts
        self.assertEqual(s['polarCoordinates']['referenceRadius'],1)
        x,y = arm_extents(p['right-arm'])
        rear_max=p['rear-shell']['outerRadius']
        offset=(y+rear_max)/2
        self.assertAlmostEqual(s['polarCoordinates']['offsetY'],offset,places=10)
        expected=[2*x,rear_max-y,.7]
        for a,b in zip(s['nominalOverallSize'],expected):self.assertAlmostEqual(a,b,places=10)
        for axis in (0,1):
            self.assertAlmostEqual(s['nominalBounds']['min'][axis],-expected[axis]/2)
            self.assertAlmostEqual(s['nominalBounds']['max'][axis],expected[axis]/2)
        self.assertEqual(s['nominalBounds']['min'][2],0)
        self.assertEqual(s['nominalBounds']['max'][2],.7)
        # Independent dense plan boundary sampling also covers the sheared backs.
        for part in p.values():
            if part['partId']=='feet':continue
            c,size=source_box(part);b=part['bevel']
            for z in [part['zMin']+b,part['zMax']-b]:
                for ss in (-1,1):
                    for rr in (-1,1):
                        for i in range(161):
                            t=i*math.pi/320
                            theta=c[0]+ss*(size[0]/2-b+b*math.cos(t))
                            radial=c[1]+rr*(size[1]/2-b+b*math.sin(t))
                            radial+=part.get('radialShear',0)*(z-c[2])
                            px,py=radial*math.sin(theta),radial*math.cos(theta)-offset
                            self.assertLessEqual(abs(px),x+1e-10)
                            self.assertLessEqual(abs(py),(rear_max-y)/2+1e-10)
            self.assertGreater(min(size)/2,b)
        # Flat top of the centre back survives rounding at Z=.7.
        self.assertAlmostEqual(field(p['back-cushion-2'],.9,0,.7),0,places=10)

    def test_cushion_division_and_six_supported_feet(self):
        p=self.parts
        seats=[p[f'seat-{i}'] for i in range(1,4)]
        for i,seat in enumerate(seats):
            self.assertEqual(seat['zMax'],.34)
            self.assertEqual(seat['angleDegrees'],p[f'back-cushion-{i+1}']['angleDegrees'])
            self.assertAlmostEqual(seat['angleDegrees'][1]-seat['angleDegrees'][0],106/3-.4)
        for a,b in zip(seats,seats[1:]):
            self.assertAlmostEqual(b['angleDegrees'][0]-a['angleDegrees'][1],.4)
        feet=p['feet'];self.assertEqual(len(feet['polarCentres']),6)
        self.assertEqual((feet['zMin'],feet['zMax']),(0,.09))
        for foot in feet['polarCentres']:
            self.assertLess(field(p['base'],foot['radius'],foot['angleDegrees'],.08),-.003)
            # Entire top cap lies inside the base at its foot interface height.
            x=foot['radius']*math.sin(math.radians(foot['angleDegrees']))
            y=foot['radius']*math.cos(math.radians(foot['angleDegrees']))
            for i in range(48):
                a=2*math.pi*i/48
                px=x+feet['radius']*math.cos(a);py=y+feet['radius']*math.sin(a)
                self.assertLess(field(p['base'],math.hypot(px,py),math.degrees(math.atan2(px,py)),.08),0)

    def test_mapping_is_injective_and_bounded(self):
        # A positive radius and <360-degree span avoid folded or doubled sectors.
        for part in self.parts.values():
            if part['partId']=='feet':continue
            c,size=source_box(part);k=part.get('radialShear',0)
            self.assertGreater(part['innerRadius']-abs(k)*size[2]/2,0)
            self.assertLess(size[0],2*math.pi)
            for i in range(5):
                q=[c[0]+(i-2)*size[0]/5,c[1],c[2]+(i-2)*size[2]/5]
                radius=q[1]+k*(q[2]-c[2])
                x,y=radius*math.sin(q[0]),radius*math.cos(q[0])
                self.assertAlmostEqual(math.atan2(x,y),q[0])
                self.assertAlmostEqual(math.hypot(x,y)-k*(q[2]-c[2]),q[1])
                # Differentiate the stated map instead of assuming axis handedness.
                derivative_s=[radius*math.cos(q[0]),-radius*math.sin(q[0]),0]
                derivative_v=[math.sin(q[0]),math.cos(q[0]),0]
                determinant=derivative_s[0]*derivative_v[1]-derivative_s[1]*derivative_v[0]
                self.assertAlmostEqual(determinant,radius)
                self.assertGreater(determinant,0)
        doc=(ROOT/'CURVED-SOFA-SPEC.md').read_text()
        self.assertTrue('**+r/R**' in doc, 'The polar map must preserve orientation.')
        self.assertTrue('Preserve source outward triangle winding' in doc, 'Do not reverse outward winding.')

    def test_document_tables_links_and_replaceable_regions(self):
        doc=(ROOT/'CURVED-SOFA-SPEC.md').read_text()
        for path in re.findall(r'\]\(([^)#]+)(?:#[^)]*)?\)',doc):
            if '://' not in path:self.assertTrue((ROOT/path).exists(),path)
        for part in self.parts.values():
            if part['partId']=='feet':continue
            row=next(line for line in doc.splitlines() if re.match(r'\|\s*'+re.escape(part['partId'])+r'\s*\|',line))
            cells=[s.strip() for s in row.split('|')[1:-1]]
            values=[part['innerRadius']*1000,part['outerRadius']*1000,part['zMin']*1000,part['zMax']*1000,part['bevel']*1000]
            self.assertEqual(list(map(float,cells[1:6])),values)
        stated=re.search(r'physical size is \*\*([\d.]+) x ([\d.]+) x ([\d.]+) mm',doc)
        self.assertIsNotNone(stated)
        for text,actual in zip(stated.groups(),self.sofa['nominalOverallSize']):
            self.assertAlmostEqual(float(text)/1000,actual,places=9)
        for tier in self.sofa['lod']['tiers']:
            row=next(line for line in doc.splitlines() if re.match(r'\|\s*'+tier['id'].upper()+r'\s*\|',line))
            cells=[s.strip() for s in row.split('|')[1:-1]]
            self.assertEqual(float(cells[1]),tier['cornerSegments'])
            self.assertEqual(float(cells[2]),tier['maxAngleStepDegrees'])
            self.assertEqual(float(cells[3]),tier['maxRadialTriangleSpan']*1000)
            self.assertEqual(cells[4],f"{tier['footRadialSegments']} / {tier['footRimSegments']}")
            self.assertEqual(float(cells[5]),tier['maxTriangles'])
            self.assertAlmostEqual(float(cells[6])/1000,tier['maxSurfaceError'])
            self.assertAlmostEqual(float(cells[7])/1000,tier['maxFootSurfaceError'])
        regions=self.sofa['appearance']['regions']
        self.assertCountEqual([x for r in regions for x in r['parts']],list(self.parts))
        self.assertFalse(self.sofa['constructionReview']['modelVerified'])
        self.assertEqual(self.sofa['constructionReview']['partCount'],16)
        self.assertEqual(self.sofa['sizing']['instanceScaleApplications'],1)

    def test_lod_error_allowances(self):
        for tier in self.sofa['lod']['tiers']:
            _,sphere=helpers.sphere_corner(tier['cornerSegments'],'normalized-barycentric-grid')
            delta=math.radians(tier['maxAngleStepDegrees']);dr=tier['maxRadialTriangleSpan']
            # Lipschitz amplification + nonlinear polar interpolation bound.
            error=1.2*.025*sphere+1.01*delta**2/8+delta*dr/4
            self.assertLessEqual(error,tier['maxSurfaceError'])
            feet=self.parts['feet']
            err=feet['radius']*(1-math.cos(math.pi/tier['footRadialSegments']))+feet['bevel']*(1-math.cos(math.pi/(4*tier['footRimSegments'])))
            self.assertLessEqual(err,tier['maxFootSurfaceError'])
            self.assertGreater(tier['maxTriangles'],6*tier['footRadialSegments']*(4*tier['footRimSegments']+4))

    def test_accepted_assets_preserved(self):
        baseline={'lShapedSofaDigest': '418a441b5232485b4601fff3edc83fb01aedfe8fc3703e9195e1c9f2038119c8', 'materialsDigest': '338ee1984fc2fc5ee550865c5d626fac8c05860ebbb36011a33814e493dbd625', 'referenceDigests': {'01-l-shaped-sofa-v1.png': '164f81b55fb46eee19d676ff8097d72ef3e6001c22a96f871a918c5165884130', '02-curved-sofa-v1.png': '610d8366ad31511e0e17eb0be6dd0726dd7f7f39259bccea68c603077830462a'}}
        self.assertEqual(helpers.digest(self.data['modules'][0]),baseline['lShapedSofaDigest'])
        self.assertEqual(helpers.digest(self.data['materials']),baseline['materialsDigest'])
        for name,value in baseline['referenceDigests'].items():
            self.assertEqual(hashlib.sha256((ROOT/'review'/name).read_bytes()).hexdigest(),value)


if __name__=='__main__':unittest.main(verbosity=2)
