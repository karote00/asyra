"""Female reference/specification checks; no model, image or app output.

Only Python's standard library is required. Analytic samples cannot certify
Boolean topology, complete mesh budgets, or rendered likeness.
"""

import hashlib
import importlib.util
import json
import math
from pathlib import Path
import re
import struct
import unittest

ROOT = Path(__file__).resolve().parents[2]
loader = importlib.util.spec_from_file_location('puppet_numeric_review', ROOT / 'review/test_puppet_spec.py')
numeric = importlib.util.module_from_spec(loader)
loader.loader.exec_module(numeric)


def dot(a, b):
    return sum(x * y for x, y in zip(a, b))


def norm(a):
    length = math.sqrt(dot(a, a))
    if length < 1e-12:
        raise AssertionError('Degenerate construction frame')
    return [x / length for x in a]


def cross(a, b):
    return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]


def bezier(points, t):
    weights = [(1-t)**3, 3*(1-t)**2*t, 3*(1-t)*t*t, t**3]
    return [sum(w*p[i] for w, p in zip(weights, points)) for i in range(len(points[0]))]


def derivative(points, t):
    return [sum(3*w*(b[i]-a[i]) for w, a, b in zip([(1-t)**2, 2*(1-t)*t, t*t], points, points[1:])) for i in range(len(points[0]))]


def leaf_section(hair, leaf, t):
    theta, phi = [math.radians(v) for v in bezier(leaf['controlAnglesDegrees'], t)]
    dt, dp = [math.radians(v) for v in derivative(leaf['controlAnglesDegrees'], t)]
    rx, ry, rz = hair['scalpRadii']
    relative = [rx*math.sin(theta)*math.sin(phi), -ry*math.sin(theta)*math.cos(phi), rz*math.cos(theta)]
    tangent = norm([rx*(math.cos(theta)*math.sin(phi)*dt+math.sin(theta)*math.cos(phi)*dp),
                    -ry*(math.cos(theta)*math.cos(phi)*dt-math.sin(theta)*math.sin(phi)*dp),
                    -rz*math.sin(theta)*dt])
    normal = norm([relative[i]/hair['scalpRadii'][i]**2 for i in range(3)])
    depth_axis = norm([normal[i]-dot(normal, tangent)*tangent[i] for i in range(3)])
    width_axis = norm(cross(tangent, depth_axis))
    samples = hair['leafProfile']['widthSamples']
    for a, b in zip(samples, samples[1:]):
        if a[0] <= t <= b[0]:
            u = (t-a[0])/(b[0]-a[0]); u = u*u*(3-2*u)
            f = a[1]+u*(b[1]-a[1]); break
    centre = [hair['scalpCentre'][i]+relative[i]+depth_axis[i]*(leaf['depth']*f/2-hair['leafProfile']['rootInset']) for i in range(3)]
    extent = [math.hypot(width_axis[i]*leaf['width']*f/2, depth_axis[i]*leaf['depth']*f/2) for i in range(3)]
    return centre, extent


def hair_envelope(hair):
    # The cap includes its crown and both equators; lower cap extrema are not
    # needed for width/top. All leaf section extrema are analytic per sample.
    lower = [hair['scalpCentre'][i]-hair['scalpRadii'][i] for i in range(3)]
    upper = [hair['scalpCentre'][i]+hair['scalpRadii'][i] for i in range(3)]
    for leaf in hair['locks']:
        for j in range(1025):
            centre, extent = leaf_section(hair, leaf, j/1024)
            for i in range(3):
                lower[i] = min(lower[i], centre[i]-extent[i])
                upper[i] = max(upper[i], centre[i]+extent[i])
    return {'width':upper[0]-lower[0], 'depth':upper[1]-lower[1], 'top':upper[2]}


def ellipsoid_points(part):
    for i in range(25):
        theta = math.pi*i/24
        for j in range(48):
            phi = math.tau*j/48
            yield [part['centre'][0]+part['radii'][0]*math.sin(theta)*math.sin(phi),
                   part['centre'][1]-part['radii'][1]*math.sin(theta)*math.cos(phi),
                   part['centre'][2]+part['radii'][2]*math.cos(theta)]


def limb_points(part):
    a, b = part['start'], part['end']; tangent = norm([y-x for x,y in zip(a,b)])
    width = norm(cross([0,1,0], tangent))
    for j in range(25):
        t=j/24; smooth=t*t*(3-2*t)
        radius=[x+smooth*(y-x) for x,y in zip(part['startRadii'],part['endRadii'])]
        for k in range(48):
            phi=math.tau*k/48
            yield [a[i]+t*(b[i]-a[i])+width[i]*radius[0]*math.cos(phi)+(radius[1]*math.sin(phi) if i==1 else 0) for i in range(3)]
    for centre,radius,sign in [(a,part['startRadii'],-1),(b,part['endRadii'],1)]:
        for j in range(9):
            angle=math.pi*j/16
            for k in range(48):
                phi=math.tau*k/48
                yield [centre[i]+sign*tangent[i]*part['endCapLength']*math.sin(angle)+width[i]*radius[0]*math.cos(phi)*math.cos(angle)+(radius[1]*math.sin(phi)*math.cos(angle) if i==1 else 0) for i in range(3)]


def cavity_value(point, rows, thickness, clearance=0):
    try:
        row=numeric.loft_row(rows,point[2])
    except ValueError:
        return math.inf
    rx,ry=row[3]-thickness-clearance,row[4]-thickness-clearance
    if min(rx,ry)<=0: return math.inf
    return ((point[0]-row[1])/rx)**2+((point[1]-row[2])/ry)**2



def flap_points(collar, flap, count=48):
    """Both normal-offset faces of the linear band-to-free-edge flap."""
    phi0, phi1 = map(math.radians, flap['rootPhiDegrees'])
    rx, ry = [r-flap['rootEmbed'] for r in collar['bandOuterRadii']]
    edge_delta = [b-a for a, b in zip(*flap['freeEdge'])]
    for j in range(count+1):
        u = j/count
        phi = phi0+(phi1-phi0)*u
        root = [rx*math.sin(phi), -ry*math.cos(phi), flap['rootZ']]
        root_du = [rx*math.cos(phi)*(phi1-phi0), ry*math.sin(phi)*(phi1-phi0), 0]
        edge = [a+u*d for a, d in zip(flap['freeEdge'][0], edge_delta)]
        dv = [b-a for a, b in zip(root, edge)]
        for k in range(count+1):
            v = k/count
            du = [(1-v)*a+v*b for a, b in zip(root_du, edge_delta)]
            normal = norm(cross(du, dv))
            centre = [(1-v)*a+v*b for a, b in zip(root, edge)]
            for sign in (-1, 1):
                yield [x+sign*n*flap['wallThickness']/2 for x, n in zip(centre, normal)]


def shared_loft_containment(inner_rows, outer_rows, outer_wall, clearance=0):
    """Nested garments must not intersect anywhere in their shared Z range."""
    low = max(inner_rows[0][0], outer_rows[0][0])
    high = min(inner_rows[-1][0], outer_rows[-1][0])
    if low >= high:
        raise AssertionError('Expected an overlapping garment join')
    heights = {low+(high-low)*j/128 for j in range(129)}
    heights.update(row[0] for row in inner_rows+outer_rows if low <= row[0] <= high)
    return max(cavity_value(numeric.ring_point(numeric.loft_row(inner_rows, z), math.tau*k/128),
                            outer_rows, outer_wall, clearance)
               for z in heights for k in range(128))


def resolve(spec, source):
    if source=='head.centre[2] - head.radii[2]':
        head=next(p for p in spec['bodyAndFaceParts'] if p['id']=='head')
        return head['centre'][2]-head['radii'][2]
    value=spec
    for key in source.split('/')[1:]:
        if isinstance(value,list):
            value=value[int(key)] if key.lstrip('-').isdigit() else next(p for p in value if p['id']==key)
        else: value=value[key]
    return value


class WomanPuppetSpecificationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.spec=json.loads((ROOT/'woman-puppet-model-spec.json').read_text())
        cls.parts={p['id']:p for p in cls.spec['bodyAndFaceParts']}
        cls.measurements=json.loads((ROOT/'woman-reference-measurements.json').read_text())

    def test_original_image_and_pixel_arithmetic(self):
        m=self.measurements
        image=(ROOT/m['source']).read_bytes()
        self.assertEqual(hashlib.sha256(image).hexdigest(),m['sha256'])
        self.assertEqual(list(struct.unpack('>II',image[16:24])),m['imagePixels'])
        self.assertEqual(m['heightPixels'],m['soleY']-m['crownY'])
        self.assertAlmostEqual(m['metresPerPixel'],m['adoptedHeightMetres']/m['heightPixels'])
        for a in m['anchors']:
            if a['measurementKind']=='span': pixels=a['pixels'][1]-a['pixels'][0]
            elif a['measurementKind']=='height': pixels=m['soleY']-a['pixels'][0]
            else: pixels=a['pixels'][0]-m['frontOriginPixels'][0]
            self.assertAlmostEqual(pixels*m['metresPerPixel'],a['measuredMetres'])
            value=resolve(self.spec,a['modelValueSource'])
            self.assertAlmostEqual(value,a['modelDefaultMetres'])
            self.assertAlmostEqual(value-a['measuredMetres'],a['differenceFromMeasurementMetres'])
            self.assertLessEqual(abs(value-a['measuredMetres']),m['modelDeviationToleranceMetres'])

    def test_complete_parts_and_independent_clothing(self):
        male=json.loads((ROOT/'man-puppet-model-spec.json').read_text())
        self.assertEqual(set(self.parts),{p['id'] for p in male['bodyAndFaceParts']}|{'cheek-left','cheek-right'})
        self.assertEqual(len(self.parts),len(self.spec['bodyAndFaceParts']))
        self.assertNotEqual(male['bodyProfile'],self.spec['bodyProfile'])
        self.assertIsNone(self.spec['glasses'])
        self.assertFalse(self.spec['optionalEyewear']['defaultEnabled'])
        for garment in [self.spec['clothing']['shirt'],self.spec['clothing']['trousers'],*self.spec['clothing']['shoes']]:
            self.assertEqual(garment['bodyProfile'],self.spec['bodyProfile'])
            self.assertGreater(garment['wallThickness'],0)
        self.assertIsNone(self.spec['clothing']['shirt']['buttons'])
        self.assertIsNone(self.spec['clothing']['trousers']['waistButton'])
        self.assertTrue(all(s['soleSeam'] is None for s in self.spec['clothing']['shoes']))

    def test_socket_tree_and_replacement_slots(self):
        sockets={s['id']:s for s in self.spec['sockets']}
        self.assertEqual(len(sockets),32)
        for socket in sockets.values():
            seen=set(); current=socket
            while current['parent'] is not None:
                self.assertNotIn(current['id'],seen);seen.add(current['id'])
                current=sockets[current['parent']]
            self.assertEqual(current['id'],'root')
        for part in self.parts.values():
            self.assertIn(part['anchor'],sockets)
            self.assertIn(part['id'],self.spec['replacementContract']['slots'])
            if part['recipe']=='tapered-limb':
                self.assertEqual(part['start'],sockets[part['anchor']]['positionRest'])
        self.assertEqual(sockets['hair']['positionRest'],self.spec['hair']['scalpCentre'])
        self.assertEqual(sockets['head']['positionRest'],self.parts['head']['centre'])

    def test_material_defaults_resolve(self):
        def walk(value):
            if isinstance(value,dict):
                for key,item in value.items():
                    if key in ('defaultMaterial','cuffDefaultMaterial'):self.assertIn(item,self.spec['materials'])
                    walk(item)
            elif isinstance(value,list):
                for item in value:walk(item)
        walk(self.spec)
        self.assertTrue(self.spec['appearance']['noBakedLighting'])
        for part in ('cheek-left','cheek-right'):
            self.assertEqual(self.parts[part]['defaultMaterial'],'blush')

    def test_all_face_samples_stay_on_skin(self):
        head=self.parts['head']
        for part in self.parts.values():
            if part['recipe']=='face-ellipse':
                samples=[(part['centreXZ'][0]+part['radiiXZ'][0]*math.cos(math.tau*j/128),part['centreXZ'][1]+part['radiiXZ'][1]*math.sin(math.tau*j/128)) for j in range(128)]
            elif part['recipe']=='face-curve':samples=[bezier(part['pointsXZ'],j/128) for j in range(129)]
            elif part['recipe']=='face-ellipsoid':samples=[part['centreXZ']]
            else:continue
            for x,z in samples:
                q=1-(x/head['radii'][0])**2-((z-head['centre'][2])/head['radii'][2])**2
                self.assertGreater(q,0,part['id'])

    def test_hair_decomposition_and_envelope(self):
        hair=self.spec['hair'];locks=hair['locks']
        self.assertEqual(len(locks),8)
        self.assertEqual(sum(p['id'].startswith('fringe-') for p in locks),3)
        self.assertEqual(len({p['id'] for p in locks}),8)
        self.assertNotIn('normalizeCombinedHairTopTo',hair)
        bounds=hair_envelope(hair)
        self.assertLessEqual(abs(bounds['width']-self.spec['defaultDimensions']['hairWidthTarget']),.010)
        self.assertLessEqual(abs(bounds['top']-1.2),.002)
        evidence=self.measurements['numericEnvelopeReview']
        canonical=json.dumps(hair,sort_keys=True,separators=(',',':')).encode()
        self.assertEqual(hashlib.sha256(canonical).hexdigest(),evidence['hairInputSHA256'])
        for key,value in bounds.items():self.assertAlmostEqual(value,evidence['sampledBoundsMetres'][key])
        print('Female sampled hair envelope (m):',bounds)

    def test_former_cheek_disk_cannot_be_projected_without_clamping(self):
        # Retain the rejected first draft as a negative geometric oracle.
        values=[]
        for j in range(128):
            angle=math.tau*j/128
            x=.153+.037*math.cos(angle);z=.708+.035*math.sin(angle)
            values.append(1-(x/.235)**2-((z-.872)/.245)**2)
        self.assertLess(min(values),0)

    def test_bare_and_shod_ankles_keep_skin_overlap(self):
        overlap=self.spec['replacementContract']['jointOverlapDefault']
        for side in ('left','right'):
            shin=self.parts['shin-'+side];foot=self.parts['foot-'+side]
            tangent=norm([b-a for a,b in zip(shin['start'],shin['end'])])
            bottom=shin['end'][2]+tangent[2]*shin['endCapLength']
            # At the ankle's X/Y axis, the foot must overlap the shin cap
            # before and after the fitted offset; bounding boxes alone fail.
            shoe=next(s for s in self.spec['clothing']['shoes'] if s['id']=='shoe-'+side)
            for offset in (shoe['barefootPoseOffset'],shoe['footPoseOffset']):
                q=1-sum(((shin['end'][i]-foot['centre'][i]-offset[i])/foot['radii'][i])**2 for i in (0,1))
                top=foot['centre'][2]+offset[2]+foot['radii'][2]*math.sqrt(q)
                self.assertGreaterEqual(top-bottom,overlap)

    def test_limb_chains_and_neck_are_joined(self):
        for side in ('left','right'):
            self.assertEqual(self.parts['upper-arm-'+side]['end'],self.parts['forearm-'+side]['start'])
            self.assertEqual(self.parts['thigh-'+side]['end'],self.parts['shin-'+side]['start'])
            hand=self.parts['hand-'+side];wrist=self.parts['forearm-'+side]['end']
            self.assertLess(sum(((wrist[i]-hand['centre'][i])/hand['radii'][i])**2 for i in range(3)),1)
        neck=self.parts['neck'];head=self.parts['head']
        self.assertGreater(neck['centre'][2]+neck['radii'][2],head['centre'][2]-head['radii'][2])
        self.assertLess(neck['centre'][2]-neck['radii'][2],self.parts['torso']['rings'][-1][0])

    def test_index_uses_profiles_without_obsolete_inline_geometry(self):
        index=json.loads((ROOT/'people-model-spec.json').read_text())
        self.assertNotIn('sharedAnatomy',index)
        self.assertNotIn('sharedClothing',index)
        entry=next(p for p in index['characters'] if p['moduleId']=='office-woman')
        self.assertEqual(entry['specification'],'woman-puppet-model-spec.json')
        self.assertEqual(self.spec['reference'],entry['reviewDrawing'])
        for name in (self.spec['recipe'],self.spec['measurements'],self.spec['reference']):self.assertTrue((ROOT/name).is_file())

    def test_default_spans_and_ground(self):
        dimensions=self.spec['defaultDimensions']
        for name,span in [('hand','handSpan'),('ear','earSpan')]:
            a,b=self.parts[name+'-left'],self.parts[name+'-right']
            self.assertAlmostEqual(b['centre'][0]+b['radii'][0]-a['centre'][0]+a['radii'][0],dimensions[span])
        self.assertEqual([2*r for r in self.parts['head']['radii']],dimensions['skinHeadSize'])
        self.assertEqual(self.parts['head']['centre'],dimensions['skinHeadCentre'])
        self.assertAlmostEqual(2*max(r[3] for r in self.spec['clothing']['shirt']['bodyOuterRings']),dimensions['shirtWidthMax'])
        for side in ('left','right'):
            foot=self.parts['foot-'+side]
            self.assertAlmostEqual(foot['centre'][2]-foot['radii'][2],0)
        shoe_extent=max(r[1]+r[3] for s in self.spec['clothing']['shoes'] for r in s['outerRings'])
        self.assertAlmostEqual(2*shoe_extent,dimensions['shoeSpan'])

    def test_shoulder_terminals_and_arm_clearance(self):
        shirt=self.spec['clothing']['shirt'];rows=[shirt['bodyOuterRings']]+[s['rings'] for s in shirt['sleeves']]
        for sleeve in shirt['sleeves']:
            for j in range(96):
                point=numeric.ring_point(sleeve['rings'][-1],math.tau*j/96)
                self.assertLess(cavity_value(point,rows[0],shirt['wallThickness']),1)
        for part in self.parts.values():
            if part['id'].startswith(('upper-arm-','forearm-')):
                worst=0
                for point in limb_points(part):
                    if point[2]<self.spec['replacementContract']['fitChecks']['coveredArmMinimumZ']:continue # Intentional cuff exit.
                    value=min(cavity_value(point,r,shirt['wallThickness'],self.spec['replacementContract']['fitChecks']['coveredArmAxisInset']) for r in rows)
                    worst=max(worst,value)
                self.assertLessEqual(worst,1,part['id'])

    def test_body_and_trousers_cavity_coverage(self):
        shirt=self.spec['clothing']['shirt'];trousers=self.spec['clothing']['trousers']
        cavities=[(shirt['bodyOuterRings'],shirt['wallThickness']),(trousers['pelvisOuterRings'],trousers['wallThickness'])]+[(p['rings'],trousers['wallThickness']) for p in trousers['legs']]
        cavities += [(p['outerRings'],p['wallThickness']) for p in self.spec['clothing']['shoes']]
        for part in self.parts.values():
            if part['id']=='torso':
                points=[numeric.ring_point(numeric.loft_row(part['rings'],part['rings'][0][0]+j*(part['rings'][-1][0]-part['rings'][0][0])/120),math.tau*k/48) for j in range(121) for k in range(48)]
            elif part['id']=='pelvis':points=ellipsoid_points(part)
            elif part['id'].startswith(('thigh-','shin-')):points=limb_points(part)
            else:continue
            worst=max(min(cavity_value(point,r,w,self.spec['replacementContract']['fitChecks']['otherSkinAxisInset']) for r,w in cavities) for point in points)
            self.assertLessEqual(worst,1,part['id'])

    def test_shoe_cavities_hold_fitted_feet(self):
        for shoe in self.spec['clothing']['shoes']:
            foot=self.parts[shoe['coverageRegions'][0]]
            for point in ellipsoid_points(foot):
                point=[x+y for x,y in zip(point,shoe['footPoseOffset'])]
                self.assertGreaterEqual(point[2],shoe['soleThickness'])
                self.assertLessEqual(cavity_value(point,shoe['outerRings'],shoe['wallThickness']),1,shoe['id'])

    def test_shirt_hem_fits_inside_trouser_waist(self):
        shirt=self.spec['clothing']['shirt'];pants=self.spec['clothing']['trousers']
        self.assertLessEqual(shared_loft_containment(shirt['bodyOuterRings'],pants['pelvisOuterRings'],pants['wallThickness'],self.spec['replacementContract']['fitChecks']['garmentPairAxisInset']),1)
        band=pants['waistband']
        rows=[[z,0,0,*band['outerRadii']] for z in band['zRange']]
        self.assertLessEqual(shared_loft_containment(shirt['bodyOuterRings'],rows,band['wallThickness'],self.spec['replacementContract']['fitChecks']['garmentPairAxisInset']),1)

    def test_trouser_hems_clear_shoe_uppers(self):
        pants=self.spec['clothing']['trousers']
        for leg,shoe in zip(pants['legs'],self.spec['clothing']['shoes']):
            self.assertLessEqual(shared_loft_containment(shoe['outerRings'],leg['rings'],pants['wallThickness'],self.spec['replacementContract']['fitChecks']['garmentPairAxisInset']),1,leg['id'])

    def test_collar_flap_thickness_stays_outside_shirt(self):
        shirt=self.spec['clothing']['shirt'];collar=shirt['collar']
        flap=collar['frontFlaps'][0]
        self.assertGreaterEqual(min(cavity_value(p,shirt['bodyOuterRings'],0) for p in flap_points(collar,flap)),1)

    def test_covered_forearms_have_explicit_coverage_regions(self):
        regions=self.spec['clothing']['shirt']['coverageRegions']
        for side in ('left','right'):
            self.assertIn('forearm-'+side,regions)

    def test_skin_cannot_hide_in_another_garments_cavity(self):
        shirt=self.spec['clothing']['shirt'];pants=self.spec['clothing']['trousers']
        groups=[('shirt',[shirt['bodyOuterRings']]+[p['rings'] for p in shirt['sleeves']],shirt['wallThickness']),
                ('trousers',[pants['pelvisOuterRings']]+[p['rings'] for p in pants['legs']],pants['wallThickness'])]
        groups.extend((shoe['id'],[shoe['outerRings']],shoe['wallThickness']) for shoe in self.spec['clothing']['shoes'])
        collar=shirt['collar'];band=pants['waistband']
        attachments=[('collar',collar['zRange'],[[z,0,0,*collar['bandOuterRadii']] for z in collar['zRange']],
                      collar['bandInnerRadii'][0]-collar['bandOuterRadii'][0],0),
                     ('waistband',band['zRange'],[[z,0,0,*band['outerRadii']] for z in band['zRange']],-band['wallThickness'],0)]
        self.assertAlmostEqual(collar['bandOuterRadii'][0]-collar['bandInnerRadii'][0],collar['bandOuterRadii'][1]-collar['bandInnerRadii'][1])
        for sleeve in shirt['sleeves']:
            attachments.append((sleeve['id']+'-cuff',sleeve['cuffZRange'],sleeve['rings'],sleeve['cuffOffset'],sleeve['cuffOffset']+sleeve['cuffThickness']))
            attachments.append((sleeve['id']+'-bridge',[sleeve['cuffZRange'][1]-sleeve['cuffBridgeHeight'],sleeve['cuffZRange'][1]],sleeve['rings'],-shirt['wallThickness'],sleeve['cuffOffset']+sleeve['cuffThickness']))
        for part in self.parts.values():
            if part['recipe']=='ellipsoid':points=ellipsoid_points(part)
            elif part['recipe']=='tapered-limb':points=limb_points(part)
            elif part['id']=='torso':
                rows=part['rings']
                points=[numeric.ring_point(numeric.loft_row(rows,rows[0][0]+j*(rows[-1][0]-rows[0][0])/120),math.tau*k/48) for j in range(121) for k in range(48)]
            else:continue
            offset=[0,0,0]
            if part['id'].startswith('foot-'):
                shoe=next(s for s in self.spec['clothing']['shoes'] if part['id'] in s['coverageRegions'])
                offset=shoe['footPoseOffset']
            for raw in points:
                point=[a+b for a,b in zip(raw,offset)]
                for name,rows,wall in groups:
                    if min(cavity_value(point,r,0) for r in rows)<=1:
                        self.assertLessEqual(min(cavity_value(point,r,wall) for r in rows),1,f'{part["id"]} intersects {name} at {point}')
                for name,z_range,rows,inner_offset,outer_offset in attachments:
                    if z_range[0]<=point[2]<=z_range[1] and cavity_value(point,rows,-outer_offset)<=1:
                        self.assertLessEqual(cavity_value(point,rows,-inner_offset),1,f'{part["id"]} intersects {name} at {point}')

    def test_rejected_garment_joins_remain_detectable(self):
        import copy
        pants=self.spec['clothing']['trousers'];shoe=self.spec['clothing']['shoes'][0]
        old_leg=copy.deepcopy(pants['legs'][0]['rings']);old_leg[0][0]=.060
        self.assertGreater(shared_loft_containment(shoe['outerRings'],old_leg,pants['wallThickness']),1)
        collar=self.spec['clothing']['shirt']['collar'];old_flap=copy.deepcopy(collar['frontFlaps'][0])
        old_flap['rootZ']=.609;old_flap['freeEdge'][0][1]=-.069;old_flap['freeEdge'][1][1]=-.082
        self.assertLess(min(cavity_value(p,self.spec['clothing']['shirt']['bodyOuterRings'],0) for p in flap_points(collar,old_flap)),1)

    def test_collar_cuff_and_waistband_have_solid_connections(self):
        shirt=self.spec['clothing']['shirt'];pants=self.spec['clothing']['trousers']
        collar=shirt['collar'];band=pants['waistband']
        pairs=[(shirt['bodyOuterRings'],shirt['wallThickness'],collar['zRange'],collar['bandInnerRadii'],collar['bandOuterRadii']),
               (pants['pelvisOuterRings'],pants['wallThickness'],band['zRange'],[r-band['wallThickness'] for r in band['outerRadii']],band['outerRadii'])]
        def radius(radii,phi):
            return 1/math.sqrt((math.cos(phi)/radii[0])**2+(math.sin(phi)/radii[1])**2)
        for rows,wall,z_range,inner,outer in pairs:
            z=min(rows[-1][0],z_range[1])-.001
            self.assertGreater(z,max(rows[0][0],z_range[0]))
            row=numeric.loft_row(rows,z)
            for k in range(128):
                phi=math.tau*k/128
                overlap=min(radius(row[3:],phi),radius(outer,phi))-max(radius([r-wall for r in row[3:]],phi),radius(inner,phi))
                self.assertGreater(overlap,0,'Annular attachment needs positive volume overlap at every angle')
        for sleeve in shirt['sleeves']:
            height=sleeve['cuffBridgeHeight'];start,end=sleeve['cuffZRange']
            self.assertGreater(height,0);self.assertLess(height,end-start)
            for z in (end-height,(2*end-height)/2,end):
                row=numeric.loft_row(sleeve['rings'],z)
                for r in row[3:]:
                    self.assertGreater(r-shirt['wallThickness'],0)
                    self.assertGreater(r+sleeve['cuffOffset']+sleeve['cuffThickness'],r+sleeve['cuffOffset'])
        for point in flap_points(collar,collar['frontFlaps'][0],32):
            self.assertLess(point[2],collar['zRange'][1],'Flap thickness must not project through collar top')

    def test_fit_metadata_and_former_palm_intersection(self):
        import copy
        fit=self.spec['replacementContract']['fitChecks']
        self.assertEqual(fit['coveredArmAxisInset'],self.spec['replacementContract']['clearanceDefault'])
        self.assertGreater(fit['garmentPairAxisInset'],0)
        self.assertEqual(fit['otherSkinAxisInset'],0)
        shirt=self.spec['clothing']['shirt']
        for side in ('left','right'):
            self.assertIn('hand-'+side,shirt['coverageRegions'])
        former=copy.deepcopy(shirt['sleeves'][0]['rings']);former[0][3]=.041
        intersecting=[p for p in ellipsoid_points(self.parts['hand-left'])
                      if cavity_value(p,former,0)<=1<cavity_value(p,former,shirt['wallThickness'])]
        self.assertTrue(intersecting,'Former cuff must be rejected even though arm-only checks passed')

    def test_all_lofts_are_ordered_and_shells_positive(self):
        shirt=self.spec['clothing']['shirt'];pants=self.spec['clothing']['trousers']
        for rows,wall in [(shirt['bodyOuterRings'],shirt['wallThickness']),(pants['pelvisOuterRings'],pants['wallThickness'])]+[(p['rings'],shirt['wallThickness']) for p in shirt['sleeves']]+[(p['rings'],pants['wallThickness']) for p in pants['legs']]+[(p['outerRings'],p['wallThickness']) for p in self.spec['clothing']['shoes']]:
            self.assertTrue(all(a[0]<b[0] for a,b in zip(rows,rows[1:])))
            self.assertTrue(all(min(r[3:])>wall for r in rows))

    def test_lod_and_shared_algorithm_contract(self):
        male=json.loads((ROOT/'man-puppet-model-spec.json').read_text())
        self.assertEqual([x['maxTriangles'] for x in self.spec['lod']['tiers']],[24000,10000,4000])
        self.assertEqual(self.spec['construction']['loftInterpolation'],male['construction']['loftInterpolation'])
        self.assertEqual(self.spec['transforms'],male['transforms'])
        self.assertEqual(self.spec['construction']['segmentCountMeaning'],'starting-samples')
        for tier in self.spec['lod']['tiers']:self.assertEqual(tier['sampling']['grooveProfileIntervals'],0)

    def test_documents_resolve_and_numeric_inputs_are_finite(self):
        for name in ('README.md','PUPPET-SPEC.md','WOMAN-PUPPET-SPEC.md','GEOMETRY-SUPPLEMENT.md','SURFACE-RECIPES.md','review/README.md'):
            document=ROOT/name
            for target in re.findall(r'\[[^\]]+\]\(([^)]+)\)',document.read_text()):
                if '://' not in target and not target.startswith('#'):
                    self.assertTrue((document.parent/target.split('#')[0]).exists(),f'{name}: {target}')
        def check(value):
            if isinstance(value,dict):
                for child in value.values():check(child)
            elif isinstance(value,list):
                for child in value:check(child)
            elif isinstance(value,(int,float)):self.assertTrue(math.isfinite(value))
        check(self.spec)
        check(self.measurements)

    def test_plain_shoe_surface_precision_at_every_lod(self):
        left,right=self.spec['clothing']['shoes']
        for a,b in zip(left['outerRings'],right['outerRings']):
            self.assertEqual([a[0],-a[1],*a[2:]],b)
        for index,tier in enumerate(self.spec['lod']['tiers']):
            heights,count=numeric.refine_shoe(left,self.spec,index)
            error=max(numeric.sampled_cell_error(left,a,b,count,self.spec['construction']['meshSampling']['validationProbes']) for a,b in zip(heights,heights[1:]))
            self.assertLessEqual(error,tier['sampling']['surfaceTolerance'])
            for a,b in zip(heights,heights[1:]):
                for j in range(count):
                    p0,p1=math.tau*j/count,math.tau*(j+1)/count
                    vertices=[numeric.shoe_point(left,z,phi) for z,phi in [(a,p0),(b,p0),(b,p1),(a,p1)]]
                    for u,v in ((.125,.25),(.375,.75),(.625,.25),(.875,.75)):
                        point=numeric.cell_interpolate(vertices,u,v)
                        self.assertGreater(cavity_value(point,left['outerRings'],left['wallThickness']),1)
            print(f"Female {tier['id']} shoe: {count} angular samples, {len(heights)} rings, sampled error {error*1000:.4f} mm; no sampled cavity crossing")


if __name__=='__main__':
    unittest.main(verbosity=2)
