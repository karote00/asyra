"""Numeric handoff and abstract topology proofs; no model files are generated."""
from collections import Counter
import hashlib
import json
import math
from pathlib import Path
import re
import unittest

ROOT=Path(__file__).resolve().parents[2]
BASELINE={'tableGeometry': 'ce1c1fdc6ed35631691ffa665b02141335c86f669f375aca0e54116a55cda06e', 'stool': 'cb011bdb8c2bffd28911c547155e2fa54e91bc132360d12acbc0d2192e2361f3', 'materials': '33345ab981a38b545ca96a97bc96464c2c369360e79d3e36cf6922ec5c763d6a', 'images': {'01-square-low-stool-v1.png': '42f5db8e4bcc76f08f70eabdb75dd9c7dad98765031dab87da45d8848c88570b', '02-pedestal-side-table-v1.png': 'fe376c7f4738bbaa4ab57ae802c79f2b21f4954d2549da219c915c69e1bdeea8'}}


def digest(value):
    return hashlib.sha256(json.dumps(value,sort_keys=True,separators=(',',':')).encode()).hexdigest()


def geometry(parts):
    return [{k:v for k,v in p.items() if k!='segments'} for p in parts]


def revolve(profile,n):
    """Minimal indexed surface used only to test the specified shared-ring recipe."""
    vertices=[];rings=[];faces=[];edges=[]
    for radius,z in profile:
        ring=[]
        for i in range(n if radius else 1):
            angle=2*math.pi*i/n
            ring.append(len(vertices));vertices.append((radius*math.cos(angle),radius*math.sin(angle),z))
        rings.append(ring)
    for edge,(a,b) in enumerate(zip(rings,rings[1:])):
        for i in range(n):
            j=(i+1)%n
            if len(a)==1:triangles=[(a[0],b[j],b[i])]
            elif len(b)==1:triangles=[(a[i],a[j],b[0])]
            else:triangles=[(a[i],a[j],b[j]),(a[i],b[j],b[i])]
            faces.extend(triangles);edges.extend([edge]*len(triangles))
    return vertices,faces,edges


def cross(a,b):return (a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
def dot(a,b):return sum(x*y for x,y in zip(a,b))


class PedestalSideTableSpecificationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data=json.loads((ROOT/'accent-furniture-model-spec.json').read_text())
        cls.table=cls.data['assets'][1]
        cls.parts={p['name']:p for p in cls.table['parts']}

    def test_original_dimensions_and_accepted_stool_preserved(self):
        self.assertEqual(digest(geometry(self.table['parts'])),BASELINE['tableGeometry'])
        self.assertEqual(digest(self.data['assets'][0]),BASELINE['stool'])
        self.assertEqual(digest(self.data['materials']),BASELINE['materials'])
        for name,value in BASELINE['images'].items():
            self.assertEqual(hashlib.sha256((ROOT/'review'/name).read_bytes()).hexdigest(),value)

    def test_shared_ring_sampling_and_embedded_column(self):
        p=self.parts
        self.assertEqual({part['segments'] for part in p.values()},{96})
        self.assertAlmostEqual(p['pedestal']['zMax']-min(z for r,z in p['top']['profile']),.006)
        self.assertAlmostEqual(max(z for r,z in p['base']['profile'])-p['pedestal']['zMin'],.003)
        self.assertLess(p['pedestal']['radius'],.123)
        self.assertLess(p['pedestal']['radius'],.207)
        self.assertEqual(self.table['bounds'],[.42,.42,.44])

    def test_exterior_profile_is_exact_union_boundary(self):
        top=self.parts['top']['profile'];base=self.parts['base']['profile'];r=self.parts['pedestal']['radius']
        expected=base[:-1]+[[r,.018],[r,.412]]+top[1:]
        actual=self.table['constructionReview']['exteriorProfile']
        self.assertEqual(actual,expected)
        self.assertEqual(sum(r>0 for r,z in actual),10)
        self.assertTrue(all(b[1]>=a[1] for a,b in zip(actual,actual[1:])))
        self.assertEqual(self.table['constructionReview']['logicalPartCount'],3)
        self.assertEqual(self.table['constructionReview']['exteriorShellCount'],1)
        self.assertEqual(self.table['constructionReview']['profileEdgeRegions'],['base']*5+['pedestal']+['top']*5)

    def test_all_lod_abstract_surfaces_are_closed_and_outward(self):
        profile=self.table['constructionReview']['exteriorProfile']
        ideal=sum(math.pi*(b[1]-a[1])*(a[0]**2+a[0]*b[0]+b[0]**2)/3 for a,b in zip(profile,profile[1:]))
        for tier in self.table['lod']['tiers']:
            n=tier['radialSegments'];v,f,regions=revolve(profile,n)
            self.assertEqual(n%4,0)
            self.assertEqual(len(v),10*n+2);self.assertEqual(len(f),20*n)
            undirected=Counter();directed=Counter();volume=0
            for face,edge in zip(f,regions):
                a,b,c=[v[i] for i in face]
                normal=cross([y-x for x,y in zip(a,b)],[y-x for x,y in zip(a,c)])
                self.assertGreater(dot(normal,normal),1e-20)
                pa,pb=profile[edge:edge+2]
                theta=math.atan2(sum(p[1] for p in (a,b,c)),sum(p[0] for p in (a,b,c)))
                expected=((pb[1]-pa[1])*math.cos(theta),(pb[1]-pa[1])*math.sin(theta),-(pb[0]-pa[0]))
                self.assertGreater(dot(normal,expected),0)
                volume+=dot(a,cross(b,c))/6
                for i,j in zip(face,face[1:]+face[:1]):
                    undirected[tuple(sorted((i,j)))]+=1;directed[i,j]+=1
            adjacency={i:set() for i in range(len(v))}
            for a,b in undirected:
                adjacency[a].add(b);adjacency[b].add(a)
            seen={0};pending=[0]
            while pending:
                for nxt in adjacency[pending.pop()]-seen:
                    seen.add(nxt);pending.append(nxt)
            self.assertEqual(len(seen),len(v))
            self.assertEqual(set(undirected.values()),{2})
            self.assertTrue(all(directed[b,a]==count for (a,b),count in directed.items()))
            self.assertEqual(len(v)-len(undirected)+len(f),2)
            self.assertAlmostEqual(volume,ideal*n*math.sin(2*math.pi/n)/(2*math.pi),places=11)
            for axis,extent in enumerate(self.table['bounds']):
                self.assertAlmostEqual(max(p[axis] for p in v)-min(p[axis] for p in v),extent)
            self.assertEqual(min(p[2] for p in v),0)
            self.assertEqual(tier['analyticTriangles'],len(f))
            self.assertLessEqual(len(f),tier['maxTriangles'])
            self.assertLessEqual(.21*(1-math.cos(math.pi/n)),tier['maxSurfaceError'])

    def test_region_and_sizing_contract(self):
        regions=self.table['appearance']['regions']
        self.assertCountEqual([p for r in regions for p in r['parts']],self.parts)
        for region in regions:
            self.assertEqual(region['defaultMaterial'],self.parts[region['parts'][0]]['material'])
        self.assertEqual(self.table['sizing']['instanceScaleApplications'],1)
        self.assertEqual(self.table['sizing']['invalidExtentPolicy'],'reject')
        self.assertFalse(self.table['appearance']['bakedLighting'])
        self.assertTrue(self.table['appearance']['independentInstanceOverrides'])
        self.assertFalse(self.table['constructionReview']['modelVerified'])

    def test_document_tables_links_and_profile(self):
        doc=(ROOT/'PEDESTAL-SIDE-TABLE-SPEC.md').read_text()
        for path in re.findall(r'\]\(([^)#]+)(?:#[^)]*)?\)',doc):
            if '://' not in path:self.assertTrue((ROOT/path).exists(),path)
        for i,(r,z) in enumerate(self.table['constructionReview']['exteriorProfile']):
            row=next(line for line in doc.splitlines() if re.match(r'\|\s*P'+str(i)+r'\s*\|',line))
            cells=[s.strip() for s in row.split('|')[1:-1]]
            self.assertEqual(list(map(float,cells[1:3])),[r*1000,z*1000])
        for tier in self.table['lod']['tiers']:
            row=next(line for line in doc.splitlines() if re.match(r'\|\s*'+tier['id'].upper()+r'\s*\|',line))
            cells=[s.strip() for s in row.split('|')[1:-1]]
            self.assertEqual(list(map(float,cells[1:])),[tier['radialSegments'],tier['analyticTriangles'],tier['maxTriangles'],tier['maxSurfaceError']*1000])


if __name__=='__main__':unittest.main(verbosity=2)
