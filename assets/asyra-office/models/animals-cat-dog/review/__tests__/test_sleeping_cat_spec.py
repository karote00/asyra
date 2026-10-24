"""Document-stage checks for the sleeping cat; no mesh or renderer is created."""
import hashlib
import json
import math
from pathlib import Path
import re
import struct
import unittest

ROOT = Path(__file__).resolve().parents[2]


def ellipsoid_value(point, part):
    return sum(((p-c)/r)**2 for p,c,r in zip(point,part[1],part[2]))


def catmull(points, index, t):
    p0,p1,p2,p3 = [points[max(0,min(len(points)-1,i))] for i in (index-1,index,index+1,index+2)]
    return [.5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t) for a,b,c,d in zip(p0,p1,p2,p3)]


def tail_samples(tail, intervals):
    result=[]
    for i in range(len(tail['centres'])-1):
        for j in range(intervals+1):
            if i and j==0:continue
            t=j/intervals
            result.append((catmull(tail['centres'],i,t),(1-t)*tail['radii'][i]+t*tail['radii'][i+1]))
    return result


def head_front(head,x,z):
    q=1-((x-head[1][0])/head[2][0])**2-((z-head[1][2])/head[2][2])**2
    if q<=0:raise ValueError('Face point is outside the front-hemisphere projection domain')
    return head[1][1]-head[2][1]*math.sqrt(q)


class SleepingCatSpecificationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.batch=json.loads((ROOT/'animals-model-spec.json').read_text())
        cls.cat=next(a for a in cls.batch['animals'] if a['id']=='sleeping-orange-cat')
        cls.parts={p[0]:p for p in cls.cat['ellipsoids']}

    def test_reference_is_preserved_and_bound_to_review(self):
        record=self.cat['review']
        data=(ROOT/record['reference']).read_bytes()
        self.assertEqual(hashlib.sha256(data).hexdigest(),record['referenceSHA256'])
        self.assertEqual(list(struct.unpack('>II',data[16:24])),record['imagePixels'])
        self.assertEqual(record['shapeStatus'],'user-approved')
        self.assertFalse(record['modelVerified'])

    def test_corgi_geometry_baseline_is_preserved(self):
        dog=next(a for a in self.batch['animals'] if a['id']=='standing-corgi')
        baseline={key:dog[key] for key in ('id','finalSize','ellipsoids','ears','tail','eyes','nose')}
        digest=hashlib.sha256(json.dumps(baseline,sort_keys=True,separators=(',',':')).encode()).hexdigest()
        self.assertEqual(digest,'4a9bec9a45e7ff101e37c4df785ba10a41ffffa6ae56b658060c6874dd91e570')

    def test_default_size_and_scaling_contract(self):
        self.assertEqual(self.cat['finalSize'],[.38,.50,.26])
        sizing=self.cat['sizing']
        self.assertEqual(sizing['defaultBoundsSource'],'complete-default-surface')
        self.assertEqual(sizing['instanceScaleApplications'],1)
        self.assertEqual(sizing['invalidExtentPolicy'],'reject')
        # Raw normalization and instance resizing are distinct transforms.
        low=[-.155,-.255,0];high=[.212,.235,.255] # Arithmetic fixture, not measured bounds.
        target=self.cat['finalSize']
        def normalize(p):
            origin=[(low[0]+high[0])/2,(low[1]+high[1])/2,low[2]]
            return [(v-o)*size/(hi-lo) for v,o,size,lo,hi in zip(p,origin,target,low,high)]
        a,b=normalize(low),normalize(high)
        self.assertEqual([round(y-x,9) for x,y in zip(a,b)],target)
        self.assertEqual(a[2],0)
        self.assertEqual([round(x+y,9) for x,y in zip(a[:2],b[:2])],[0,0])

    def test_parts_and_ear_roots(self):
        self.assertEqual(set(self.parts),{'torso','head','front-paw-left','front-paw-right','hind-paw-left','hind-paw-right'})
        self.assertEqual(len(self.cat['ears']),2)
        for part in self.parts.values():
            self.assertTrue(all(math.isfinite(v) for v in part[1]+part[2]))
            self.assertTrue(all(r>0 for r in part[2]))
        for ear in self.cat['ears']:
            rows=ear['rings'];self.assertTrue(all(a[2]<b[2] for a,b in zip(rows,rows[1:])))
            self.assertTrue(all(min(row[3:])>0 for row in rows))
            self.assertLess(ellipsoid_value(rows[0][:3],self.parts['head']),1)
        for a,b in zip(self.cat['ears'][0]['rings'],self.cat['ears'][1]['rings']):
            self.assertEqual([-a[0],*a[1:]],b)

    def test_paws_and_head_have_positive_body_overlap(self):
        for name in ('head','front-paw-left','front-paw-right','hind-paw-left','hind-paw-right'):
            part=self.parts[name];parent=self.parts['torso' if name=='head' or name.startswith('hind') else 'head']
            best=math.inf
            for i in range(25):
                theta=math.pi*i/24
                for j in range(48):
                    phi=math.tau*j/48
                    p=[part[1][0]+part[2][0]*math.sin(theta)*math.cos(phi),part[1][1]+part[2][1]*math.sin(theta)*math.sin(phi),part[1][2]+part[2][2]*math.cos(theta)]
                    best=min(best,ellipsoid_value(p,parent))
            self.assertLess(best,1,name)

    def test_tail_has_root_overlap_continuity_and_correct_side(self):
        tail=self.cat['tail'];self.assertEqual(len(tail['centres']),len(tail['radii']))
        self.assertLess(ellipsoid_value(tail['centres'][0],self.parts['torso']),1)
        samples=tail_samples(tail,self.batch['construction']['tailSamplesPerSpan'])
        self.assertEqual(len(samples),129)
        self.assertEqual(samples[0][0],tail['centres'][0])
        for a,b in zip(samples[-1][0],tail['centres'][-1]):self.assertAlmostEqual(a,b)
        for (a,ra),(b,rb) in zip(samples,samples[1:]):
            self.assertGreater(math.dist(a,b),0)
            self.assertLess(math.dist(a,b),min(ra,rb))
        self.assertTrue(all(p[0]>0 and r>0 for p,r in samples))

    def test_face_strokes_and_nose_fit_without_clamping(self):
        self.assertEqual(self.cat['facialProjection']['invalidDomainPolicy'],'reject')
        self.assertEqual(self.cat['facialProjection']['unionHit'],'frontmost-head-owned')
        head=self.parts['head']
        for name in ('eyes','mouth'):
            for a,b,c in self.cat[name]['curvesXZ']:
                for i in range(65):
                    t=i/64;x,z=[(1-t)**2*a[k]+2*(1-t)*t*b[k]+t*t*c[k] for k in (0,1)]
                    for j in range(16):
                        angle=math.tau*j/16;r=self.cat[name]['lineRadius']
                        self.assertTrue(math.isfinite(head_front(head,x+r*math.cos(angle),z+r*math.sin(angle))))
        nose=self.cat['nose']
        for j in range(128):
            phi=math.tau*j/128
            head_front(head,nose['centreXZ'][0]+nose['radiiXZ'][0]*math.cos(phi),nose['centreXZ'][1]+nose['radiiXZ'][1]*math.sin(phi))
        with self.assertRaises(ValueError):head_front(head,head[1][0]+2*head[2][0],head[1][2])

    def test_paw_pads_stay_inside_their_paw_projection(self):
        pads=self.cat['pawPads']
        for name,part in self.parts.items():
            if 'paw' not in name:continue
            disks=[([0,0],pads['centralRadiiXY'])]+[(c,[pads['toeRadius']]*2) for c in pads['toeCentresXY']]
            for centre,radii in disks:
                for j in range(128):
                    phi=math.tau*j/128
                    x=centre[0]+radii[0]*math.cos(phi);y=centre[1]+radii[1]*math.sin(phi)
                    self.assertLess((x/part[2][0])**2+(y/part[2][1])**2,1,name)
        self.assertEqual(pads['surfaceSelection'],'paw-owned-downward-facing')

    def test_replaceable_appearance_and_lod_are_explicit(self):
        appearance=self.cat['appearance']
        self.assertFalse(appearance['bakedLighting'])
        self.assertTrue(appearance['independentInstanceOverrides'])
        for region in appearance['regions']:
            self.assertIn(region['defaultMaterial'],self.batch['palette'])
        tiers=self.cat['lod']['tiers']
        self.assertEqual([t['id'] for t in tiers],['lod0','lod1','lod2'])
        self.assertTrue(all(a['maxTriangles']>b['maxTriangles'] for a,b in zip(tiers,tiers[1:])))
        self.assertTrue(all(t['maxTriangles']>0 and t['maxSurfaceError']>0 for t in tiers))
        self.assertFalse(self.cat['lod']['verified'])

    def test_document_part_table_matches_numeric_geometry(self):
        text=(ROOT/'SLEEPING-CAT-SPEC.md').read_text()
        section=text.split('## Raw part dimensions and joins',1)[1].split('## Tail path',1)[0]
        names={'Torso':'torso','Head':'head','Front paw - left':'front-paw-left',
               'Front paw - right':'front-paw-right','Hind paw - left':'hind-paw-left',
               'Hind paw - right':'hind-paw-right'}
        seen=set()
        for line in section.splitlines():
            cells=[c.strip() for c in line.split('|')[1:-1]]
            if len(cells)!=3 or cells[0] not in names:continue
            name=names[cells[0]];part=self.parts[name];seen.add(name)
            centre=[float(v) for v in re.findall(r'-?\d+(?:\.\d+)?',cells[1])]
            size=[float(v) for v in re.findall(r'-?\d+(?:\.\d+)?',cells[2])]
            self.assertEqual(centre,[round(v*1000,9) for v in part[1]],name)
            self.assertEqual(size,[round(v*2000,9) for v in part[2]],name)
        self.assertEqual(seen,set(self.parts))

    def test_document_tail_and_lod_tables_match_numeric_inputs(self):
        text=(ROOT/'SLEEPING-CAT-SPEC.md').read_text()
        section=text.split('## Tail path and continuity',1)[1].split('## Surface construction',1)[0]
        controls=[]
        for line in section.splitlines():
            cells=[c.strip() for c in line.split('|')[1:-1]]
            if len(cells)!=3 or cells[0] not in ('Root','2','3','4','Tip'):continue
            controls.append(([float(v) for v in re.findall(r'-?\d+(?:\.\d+)?',cells[1])],float(cells[2])))
        tail=self.cat['tail']
        self.assertEqual(controls,[([round(v*1000,9) for v in p],round(r*1000,9)) for p,r in zip(tail['centres'],tail['radii'])])
        tiers={t['id'].upper():t for t in self.cat['lod']['tiers']};seen=set()
        for line in text.splitlines():
            cells=[c.strip() for c in line.split('|')[1:-1]]
            if len(cells)!=3 or cells[0] not in tiers:continue
            tier=tiers[cells[0]];seen.add(cells[0])
            self.assertEqual(int(cells[1]),tier['maxTriangles'])
            self.assertEqual(float(cells[2]),tier['maxSurfaceError'])
        self.assertEqual(seen,set(tiers))

    def test_document_links_and_finite_numbers(self):
        for name in ('README.md','GEOMETRY-SUPPLEMENT.md','SURFACE-RECIPES.md','SLEEPING-CAT-SPEC.md','review/README.md'):
            file=ROOT/name
            for target in re.findall(r'\[[^\]]+\]\(([^)]+)\)',file.read_text()):
                if '://' not in target and not target.startswith('#'):
                    self.assertTrue((file.parent/target.split('#')[0]).is_file(),target)
        def walk(value):
            if isinstance(value,dict):
                for item in value.values():walk(item)
            elif isinstance(value,list):
                for item in value:walk(item)
            elif isinstance(value,(float,int)):self.assertTrue(math.isfinite(value))
        walk(self.cat)


if __name__=='__main__':unittest.main(verbosity=2)
