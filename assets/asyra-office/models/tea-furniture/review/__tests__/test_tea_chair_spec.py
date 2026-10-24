"""Tea-chair analytic handoff checks; no production geometry is exported."""
from collections import deque
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import re
import unittest

ROOT=Path(__file__).resolve().parents[2]
BASELINE={'table': '636f0255fb7126beb926a14c385d921986dd55221ee7b14576b950eefb338aa7', 'materials': '9b195b33385396b9bedda5a08df81c563deeecf12ce58925638deec3c839fa79', 'legs': 'e979e4056f021a5c60aedc354050164dd37b5fcea148ce195d721182e7994048', 'images': {'01-round-tea-table-v1.png': 'a8e530fab320ba3eda3a34226a4fe2495e0824c66cbef529399c4b4507db9f46', '02-tea-chair-v1.png': '91665a295c1d3748fd7ea32b2089440ff421fb91cdf9bc359a2bec02f8d8ac80'}}


def load(name,file):
    spec=importlib.util.spec_from_file_location(name,ROOT.parent/'furniture/review/__tests__'/file)
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module

coffee=load('coffee_math','test_coffee_table_spec.py')
desk=load('desk_math','test_writing_desk_spec.py')


def height(shell,theta):
    h=shell['height'];a=math.radians(shell['thetaDegrees'][1])
    return h['end']+(h['rear']-h['end'])*(1-(abs(theta)/a)**h['exponent'])


def shell_map(shell,q):
    theta=q[0]/shell['mapping']['referenceRadius'];v=q[1];z0,z1=shell['mapping']['sourceZRange']
    return [(shell['innerRadiiXY'][0]+v)*math.sin(theta),
            (shell['innerRadiiXY'][1]+v)*math.cos(theta),
            z0+(q[2]-z0)/(z1-z0)*(height(shell,theta)-z0)]


def shell_field(shell,p,clearance=0):
    """Sign-correct source-space field; not a world-space distance function."""
    x,y,z=p;rx,ry=shell['innerRadiiXY'];lo=-clearance;hi=.05+clearance
    def ellipse(v):return (x/(rx+v))**2+(y/(ry+v))**2
    if ellipse(lo)<1 or ellipse(hi)>1:return 1.
    for _ in range(45):
        mid=(lo+hi)/2
        if ellipse(mid)>1:lo=mid
        else:hi=mid
    v=(lo+hi)/2;theta=math.atan2(x/(rx+v),y/(ry+v));R=shell['mapping']['referenceRadius']
    a=math.radians(shell['thetaDegrees'][1]);z0,z1=shell['mapping']['sourceZRange']
    if abs(theta)>a+clearance/R:return 1.
    H=height(shell,theta)-z0
    if H<=0:return 1.
    q=[R*theta,v,z0+(z-z0)*(z1-z0)/H]
    # Same inner box, sphere radius expanded by clearance.
    b=shell['bevel'];centre=[0,.025,(z0+z1)/2]
    size=[2*R*a+2*clearance,.05+2*clearance,z1-z0+2*clearance]
    return desk.rounded_field(q,centre,size,b+clearance)


def blank_field(p,part):
    x=p[0]-part['centreXY'][0];y=p[1]-part['centreXY'][1]
    W,D=part['width'],part['depth'];R,b=part['planCornerRadius'],part['edgeBevel']
    q=[abs(x)-(W/2-R),abs(y)-(D/2-R)]
    dxy=math.hypot(max(q[0],0),max(q[1],0))+min(max(q),0)-(R-b)
    dz=abs(p[2]-(part['zMin']+part['zMax'])/2)-((part['zMax']-part['zMin'])/2-b)
    return math.hypot(max(dxy,0),max(dz,0))+min(max(dxy,dz),0)-b


def cushion_inside(p,parts):
    seat=parts['seat-cushion'];rx,ry=seat['rearBlankEnvelopeRadii']
    in_rear_envelope=p[1]<0 or (p[0]/rx)**2+(p[1]/ry)**2<1
    return in_rear_envelope and blank_field(p,seat)<0 and shell_field(parts['wraparound-shell'],p,seat['shellClearanceSource'])>0


def as_leg(group,end):
    return dict(bottomCentre=end['bottom'],topCentre=end['top'],bottomWidth=2*group['bottomRadius'],topWidth=2*group['topRadius'],radius=group['edgeBevel'])


class TeaChairSpecificationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data=json.loads((ROOT/'tea-furniture-model-spec.json').read_text())
        cls.chair=cls.data['modules'][1];cls.p={x['partId']:x for x in cls.chair['components']}

    def test_cushion_embedment_and_seven_attachments(self):
        p=self.p;base=p['seat-base'];shell=p['wraparound-shell']
        self.assertGreater(base['zMax'],p['seat-cushion']['zMin'])
        self.assertLess(blank_field([0,0,.25],base),-.004)
        self.assertTrue(cushion_inside([0,0,.25],p))
        for sign in (-1,1):
            w=[sign*.175,0,.245]
            self.assertLess(blank_field(w,base),-.004)
            self.assertLess(shell_field(shell,w),-.004)
        for end in p['legs']['endCentres']:
            leg=as_leg(p['legs'],end);z=.222;h=leg['topCentre'][2]
            xy=[a+(b-a)*z/h for a,b in zip(end['bottom'][:2],end['top'][:2])]
            self.assertLess(blank_field([*xy,z],base),-.01)
            self.assertGreater((h-z)/coffee.shear_norm(leg),.006)

    def test_shell_mapping_round_trip_and_orientation(self):
        s=self.p['wraparound-shell'];R=s['mapping']['referenceRadius']
        for deg in (-119,-90,-45,0,45,90,119):
            theta=math.radians(deg);v=.025
            point=shell_map(s,[R*theta,v,.45])
            self.assertLess(shell_field(s,point),0)
            rx,ry=s['innerRadiiXY'];h0,h1=s['mapping']['sourceZRange']
            det=((rx+v)*math.cos(theta)**2+(ry+v)*math.sin(theta)**2)/R*(height(s,theta)-h0)/(h1-h0)
            self.assertGreater(det,0)
            eps=1e-6;q=[R*theta,v,.45];columns=[]
            for axis in range(3):
                a=q.copy();b=q.copy();a[axis]+=eps;b[axis]-=eps
                columns.append([(x-y)/(2*eps) for x,y in zip(shell_map(s,a),shell_map(s,b))])
            a,b,c=columns
            numeric=a[0]*(b[1]*c[2]-b[2]*c[1])-b[0]*(a[1]*c[2]-a[2]*c[1])+c[0]*(a[1]*b[2]-a[2]*b[1])
            self.assertAlmostEqual(numeric,det,places=6)
        self.assertAlmostEqual(height(s,0),.65)
        self.assertAlmostEqual(height(s,math.radians(120)),.39)

    def test_cutter_contains_shell_and_seat_remains_connected(self):
        p=self.p;s=p['wraparound-shell'];gap=p['seat-cushion']['shellClearanceSource']
        self.assertEqual(gap,.002)
        for degrees in range(-120,121,10):
            for v in (.001,.012,.025,.038,.049):
                for z in (.24,.3,.45,.64):
                    point=shell_map(s,[s['mapping']['referenceRadius']*math.radians(degrees),v,z])
                    if shell_field(s,point)<=0:self.assertLess(shell_field(s,point,gap),0)
        # The rear blank constraint lies inside the removed shell, so its
        # boundary must not become an exposed extra seam on the cushion.
        for degree in range(-90,91,5):
            theta=math.radians(degree)
            for z in (.245,.29,.33):
                point=[.19*math.sin(theta),.20*math.cos(theta),z]
                self.assertLess(shell_field(s,point,gap),0)
        for z in (.246,.26,.29,.32,.329):
            samples=set()
            for i in range(-36,37):
                for j in range(-46,40):
                    point=[i*.005,j*.005,z]
                    if cushion_inside(point,p):
                        self.assertGreater(shell_field(s,point),0)
                        samples.add((i,j))
            self.assertGreater(len(samples),1000)
            start=next(iter(samples));seen={start};todo=deque([start])
            while todo:
                i,j=todo.popleft()
                for v in ((i-1,j),(i+1,j),(i,j-1),(i,j+1)):
                    if v in samples and v not in seen:seen.add(v);todo.append(v)
            self.assertEqual(seen,samples,'Sampled cushion section has a disconnected fragment.')
            self.assertTrue(cushion_inside([0,-.18,z],p))
            self.assertFalse(cushion_inside([0,.19,z],p))

    def test_bounds_open_front_and_flat_feet(self):
        s=self.p['wraparound-shell'];R=s['mapping']['referenceRadius']
        points=[shell_map(s,[R*math.pi/2,.05,.45]),shell_map(s,[-R*math.pi/2,.05,.45]),shell_map(s,[0,.05,.45]),shell_map(s,[0,.025,.65])]
        for point in points:self.assertAlmostEqual(shell_field(s,point),0,places=8)
        self.assertAlmostEqual(points[0][0],.22);self.assertAlmostEqual(points[1][0],-.22)
        self.assertAlmostEqual(points[2][1],.23);self.assertAlmostEqual(points[3][2],.65)
        self.assertAlmostEqual(blank_field([0,-.23,.29],self.p['seat-cushion']),0)
        self.assertGreater(shell_field(s,[0,-.23,.29],.002),0)
        self.assertEqual(self.chair['nominalOverallSize'],[.44,.46,.65])
        for name in ('seat-base','seat-cushion'):
            p=self.p[name]
            self.assertLessEqual(abs(p['centreXY'][0])+p['width']/2,.22)
            self.assertLessEqual(abs(p['centreXY'][1])+p['depth']/2,.23+1e-12)
            self.assertGreaterEqual(p['zMin'],0);self.assertLessEqual(p['zMax'],.65)
        for end in self.p['legs']['endCentres']:
            leg=as_leg(self.p['legs'],end);h,r0,r1,b,k,q,centres=coffee.leg_profile(leg)
            self.assertEqual(end['bottom'][2],0);self.assertEqual(end['top'][2],.23)
            for axis,bound in ((0,.22),(1,.23)):
                self.assertLess(max(abs(end['bottom'][axis]),abs(end['top'][axis]))+r1,bound)
            for rc,zc in centres:self.assertAlmostEqual((r0+k*zc-rc)/q,b)
            self.assertAlmostEqual(centres[0][1]-b,0)
            self.assertAlmostEqual(centres[1][1]+b,.23)

    def test_doc_values_links_regions_and_lod(self):
        text=(ROOT/'TEA-CHAIR-SPEC.md').read_text()
        for path in re.findall(r'\]\(([^)#]+)(?:#[^)]*)?\)',text):
            if '://' not in path:self.assertTrue((ROOT/path).exists(),path)
        for name in ('seat-base','seat-cushion'):
            row=next(x for x in text.splitlines() if re.match(r'\|\s*'+name+r'\s*\|',x))
            cells=[x.strip() for x in row.split('|')[1:-1]];p=self.p[name]
            self.assertEqual(list(map(float,cells[1:])),[p['width']*1000,p['depth']*1000,p['centreXY'][1]*1000,p['zMin']*1000,p['zMax']*1000,p['planCornerRadius']*1000,p['edgeBevel']*1000])
        self.assertEqual(len(self.chair['appearance']['regions']),7)
        self.assertEqual(self.chair['constructionReview']['closedComponentCount'],7)
        self.assertFalse(self.chair['constructionReview']['modelVerified'])
        self.assertEqual(self.chair['sizing']['instanceScaleApplications'],1)
        for t in self.chair['lod']['tiers']:
            self.assertGreater(t['maxTriangles'],4*t['legRadialSegments']*(4*t['legRimSegments']+4))
            self.assertLessEqual(t['maxSeamSurfaceError'],.00015)
            row=next(x for x in text.splitlines() if re.match(r'\|\s*'+t['id'].upper()+r'\s*\|',x))
            cells=[x.strip() for x in row.split('|')[1:-1]]
            self.assertEqual(list(map(float,cells[1:])),[t['shellInitialIntervals'],t['legRadialSegments'],t['legRimSegments'],t['maxTriangles'],t['maxSurfaceError']*1000,t['maxSeamSurfaceError']*1000])

    def test_approved_table_palette_feet_and_reference_unchanged(self):
        self.assertEqual(coffee.digest(self.data['modules'][0]),BASELINE['table'])
        self.assertEqual(coffee.digest(self.data['materials']),BASELINE['materials'])
        self.assertEqual(coffee.digest(self.p['legs']),BASELINE['legs'])
        for name,value in BASELINE['images'].items():self.assertEqual(hashlib.sha256((ROOT/'review'/name).read_bytes()).hexdigest(),value)


if __name__=='__main__':unittest.main(verbosity=2)
