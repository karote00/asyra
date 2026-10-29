"""Recover visible office wall ratios from source pixels. Never replaces the source image.

Requires the already installed NumPy/SciPy environment. Run from the repository
root. Output is deterministic numeric input for the scene and its independent
reference-projection tests. Residuals remain visible, including incompatible
parallel-edge evidence in the generated reference.
"""
import argparse
import json
import hashlib
from pathlib import Path
import numpy as np
from scipy.optimize import least_squares, minimize

ROOT = Path(__file__).resolve().parents[3]
DATA = ROOT / 'apps/asyra-office/src/scene/reference'
source = json.loads((DATA / 'interior-landmarks.json').read_text())
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--check-floor-fit', action='store_true', help='Evaluate floor containment with wall projections, save diagnostics only, and leave the live layout and furniture unchanged.')
parser.add_argument('--apply-structure-fit', action='store_true', help='Apply only the constrained structural result; preserve all deferred furnishing data.')
parser.add_argument('--apply-lounge-return', action='store_true', help='Derive the rear T-return from its source corners using the accepted camera and main wall unchanged.')
parser.add_argument('--diagnose-west-divider', action='store_true', help='Offline point-identity diagnosis only: hold the owner same-line topology and omit the disputed green wall foot from fitting while reporting its residual. Never apply.')
args = parser.parse_args()
if args.diagnose_west_divider and args.apply_structure_fit: parser.error('A diagnostic cannot apply live geometry.')
fit_floor = args.check_floor_fit or args.apply_structure_fit or args.diagnose_west_divider
names = ['azimuth', 'elevation', 'distance', 'targetX', 'targetY', 'targetZ', 'rearTop', 'pantryTop', 'creamTop', 'greenTop', 'loungeTop', 'returnTop', 'facadeTop', 'pantryX', 'creamY', 'creamEnd', 'greenStart', 'greenEnd', 'loungeX', 'loungeY', 'returnLength', 'pantryFront', 'discussionFront', 'facadeEnd', 'doorX', 'doorWidth', 'doorHeight', 'discussionEnd', 'rearY', 'loungeSplit', 'loungeRightTop', 'fov']
initial = [40, 27, 29, 0.5, 0, 1.3, 3, 3, 2.2, 1.8, 2, 2.2, 2.1, 0.25, 0.5, -1.2, -1.0, -0.2, 0.7, 0.15, 0.7, 0.8, 0.6, 1.15, 0.25, 1.23, 1.62, -0.25, 2.42, 1.5, 2, 18]
low = [20, 12, 15, -3, -4, -1, 2, 2, 1, 1, 0.9, 1, 1, -1.5, -1.5, -2.8, -2.5, -1.5, -0.5, -1.5, 0.2, -1.5, -1.5, 0, -0.8, 0.5, 0.7, -1, 0.5, 0.5, 1, 5]
high = [65, 50, 60, 3, 4, 4, 4, 4, 3.5, 3.5, 3.5, 3.5, 3, 1.5, 1.5, 0.5, 1, 1.5, 2, 1.5, 2, 2, 2.3, 2.5, 1.8, 2.5, 2.6, 1.5, 4, 2.8, 3.5, 50]

# One physical first-floor datum is an owner contract, not a fitting variable.
GROUND = source['floorContract']['finishedFloor']
shell = source['shell']
architecture=json.loads((ROOT/'assets/asyra-office/models/architecture/architecture-model-spec.json').read_text())
door_spec=next(module for module in architecture['modules'] if module['moduleId']=='entry-door-set')
clear_aperture_ratio=door_spec['openingClearSizeMetres'][0]/door_spec['mounting']['roughOpeningSizeMetres'][0]
main_leaf_ratio=door_spec['mainLeafWidthMetres']/door_spec['mounting']['roughOpeningSizeMetres'][0]

# The divider endpoints may occupy the existing interior width. Historical
# seed-box limits at -2.5/-1.5 were active constraints, not image measurements.
for name in ['greenStart','greenEnd']:
 low[names.index(name)]=-3.02
 high[names.index(name)]=3.02

# Shared west-wall crown; the lounge enclosure retains its measured height step.

def geometry(p):
 d=dict(zip(names,p)); X=-3.02; Y=d['rearY']; F=shell['frontY']
 c=lambda x,y,z:[x,y,z]
 pts={
 'rear-left-top': c(X,Y,d['rearTop']),
 'discussion-rear-end-top':c(d['discussionEnd'],Y,d['rearTop']),
 'pantry-rear-left-top':c(d['pantryX'],Y,d['pantryTop']),
 'pantry-rear-right-top':c(shell['eastX']+shell['exteriorThickness']/2,Y,d['pantryTop']),
 'pantry-divider-front-top':c(d['pantryX'],d['pantryFront'],d['pantryTop']),
 'work-left-front-top':c(X,F,d['rearTop']),
 'discussion-left-front-top':c(X,d['discussionFront'],d['rearTop']),
 'work-partition-left-top':c(X,d['creamY'],d['creamTop']),
 'work-partition-right-top':c(d['creamEnd'],d['creamY'],d['creamTop']),
 'green-partition-left-top':c(d['greenStart'],d['creamY'],d['greenTop']),
 'green-partition-right-top':c(d['greenEnd'],d['creamY'],d['greenTop']),
 'green-partition-right-bottom':c(d['greenEnd'],d['creamY'],GROUND),
 'lounge-return-front-top':c(d['loungeX'],d['loungeY']-d['returnLength'],d['returnTop']),
 'lounge-return-rear-top':c(d['loungeX'],d['loungeY'],d['returnTop']),
 'lounge-wall-left-top':c(d['loungeX']+.07,d['loungeY']-.14*.27/.24/2,d['loungeTop']),
 'lounge-wall-right-top':c(shell['eastX']+shell['exteriorThickness']/2,d['loungeY']-.14*.27/.24/2,d['loungeRightTop']),
 'lounge-wall-step-low':c(d['loungeSplit'],d['loungeY']-.14*.27/.24/2,d['loungeTop']),
 'lounge-wall-step-top':c(d['loungeSplit'],d['loungeY']-.14*.27/.24/2,d['loungeRightTop']),
 'facade-right-top':c(d['facadeEnd'],F,d['facadeTop']),
 'door-left-top':c(d['doorX']-d['doorWidth']/2,F-shell['facadeThickness']/2,GROUND+d['doorHeight']),
 'door-right-top':c(d['doorX']+d['doorWidth']/2,F-shell['facadeThickness']/2,GROUND+d['doorHeight']),
 'door-right-bottom':c(d['doorX']+d['doorWidth']/2,F-shell['facadeThickness']/2,GROUND)
 }
 return pts

def camera(p):
 az,el=np.deg2rad(p[:2]); target=np.array(p[3:6]);
 right=np.array([np.cos(az),np.sin(az),0]); up=np.array([-np.sin(az)*np.sin(el),np.cos(az)*np.sin(el),np.cos(el)])
 toward=np.cross(right,up)
 return right,up,toward,target+np.array(toward)*p[2]

def project(p,point):
 right,up,toward,eye=camera(p); v=np.array(point)-eye
 focal=756/(2*np.tan(np.deg2rad(p[-1])/2)); depth=-v@toward
 return np.array([642.5+focal*(v@right)/depth,422-focal*(v@up)/depth])

def derive_lounge_return(current):
 """Fit one orthogonal T-return; never change the accepted global projection."""
 p=np.array([current['parameters'][name] for name in names[:6]]+[current['parameters'][names[-1]]])
 d=current['parameters']; evidence=source['details']['loungeRearBranch']
 ratio=shell['capDepthRatio']; z=d['loungeRightTop']
 front=d['loungeY']+shell['partitionThickness']*ratio/2
 keys=['frontLeft','frontRight','backLeft']
 observed=np.array([evidence['visibleCorners'][key] for key in keys])
 hidden=np.array(evidence['occludedCornerBox']['backRight'])
 right,up,toward,eye=camera(p)
 focal=756/(2*np.tan(np.deg2rad(p[-1])/2))
 def inverse(pixel):
  delta=(pixel[0]-642.5)/focal*right-(pixel[1]-422)/focal*up
  ray=-toward+delta
  origin=eye
  return origin+ray*((z-origin[2])/ray[2])
 measured=np.array([inverse(pixel) for pixel in observed])
 seed=[(measured[0,0]+measured[1,0])/2,abs(measured[1,0]-measured[0,0])/ratio,measured[2,1]-d['loungeY']]
 def corners(q):
  x,thickness,length=q;half=thickness*ratio/2;back=d['loungeY']+length
  return np.array([[x-half,front,z],[x+half,front,z],[x-half,back,z],[x+half,back,z]])
 def residuals(q):
  uv=np.array([project(p,point) for point in corners(q)])
  outside=np.minimum(uv[3]-hidden[:2],0)+np.maximum(uv[3]-hidden[2:],0)
  return np.concatenate([(uv[:3]-observed).ravel(),outside])
 clear_door=d['doorWidth']*clear_aperture_ratio
 def clearances(q):
  x,thickness,length=q;half=thickness*ratio/2
  return np.array([thickness,length-shell['partitionThickness']*ratio/2,x-half-d['loungeSplit'],shell['eastX']+shell['exteriorThickness']/2-x-half,d['rearY']-shell['exteriorThickness']/2-d['loungeY']-length-clear_door])
 fit=minimize(lambda q:float(residuals(q)@residuals(q)),seed,method='SLSQP',constraints=[{'type':'ineq','fun':clearances}],options={'ftol':1e-12,'maxiter':300})
 if not fit.success:raise RuntimeError('Rear T-return fit failed: '+fit.message)
 uv=np.array([project(p,point) for point in corners(fit.x)])
 errors=np.linalg.norm(uv[:3]-observed,axis=1)
 if max(errors)>=evidence['maximumVisibleErrorPixels'] or np.any(uv[3]<hidden[:2]) or np.any(uv[3]>hidden[2:]) or min(clearances(fit.x))<0:
  raise RuntimeError('Rear T-return failed source corner or passage constraints: '+str(uv.tolist()))
 return {'centerX':float(fit.x[0]),'thickness':float(fit.x[1]),'length':float(fit.x[2]),'top':z,'projectedCorners':dict(zip(keys+['backRight'],uv.tolist())),'pixelResiduals':dict(zip(keys,errors.tolist())),'rearPassage':float(clearances(fit.x)[-1]+clear_door),'method':'Local three-corner fit at the existing main wall crown, with cap and body abutting their corresponding rear faces. Camera, main walls and floors remain unchanged. The hidden fourth corner is bounded, not measured.'}

if args.apply_lounge_return:
 current=json.loads((DATA/'interior-fit.json').read_text())
 current['loungeRearBranch']=derive_lounge_return(current)
 current['landmarksSha256']=hashlib.sha256((DATA/'interior-landmarks.json').read_bytes()).hexdigest()
 target=ROOT/'tmp/setup/office-structure-fit-next.json'
 target.write_text(json.dumps(current,indent=2)+'\n');target.replace(DATA/'interior-fit.json')
 print(json.dumps(current['loungeRearBranch'],indent=2))
 raise SystemExit(0)

def floor_sample_bounds(p):
 d=dict(zip(names,p)); right,up,toward,eye=camera(p)
 focal=756/(2*np.tan(np.deg2rad(p[-1])/2)); half=shell['exteriorThickness']/2
 results=[]
 for sample in source['visibleFloorSamples']['samples']:
  pixel=sample['pixel'];delta=(pixel[0]-642.5)/focal*right-(pixel[1]-422)/focal*up
  ray=-toward+delta
  origin=eye
  point=origin+ray*((GROUND-origin[2])/ray[2])
  bounds=([[d['pantryX']+half,shell['eastX']-half],[d['loungeY']+shell['partitionThickness']/2,d['rearY']-half]] if sample['room']=='pantry' else [[shell['westX']+half,d['pantryX']-half],[d['creamY']+shell['partitionThickness']/2,d['rearY']-half]])
  clearances=[float(point[a]-bounds[a][0]) for a in range(2)]+[float(bounds[a][1]-point[a]) for a in range(2)]
  results.append({'id':sample['id'],'pixel':pixel,'point':point.tolist(),'bounds':bounds,'clearances':clearances})
 return results

def parapet_corners(p, q):
 d=dict(zip(names,p));width,back_top,front_top=q
 half=width*shell['capDepthRatio']/2
 center=shell['eastX']+shell['exteriorThickness']/2-width/2
 front=d['loungeY']+shell['partitionThickness']/2
 back=d['rearY']-shell['exteriorThickness']/2
 return [[center-half,back,back_top],[center+half,back,back_top],[center+half,front,front_top]]

def parapet_residuals(p,q):
 evidence=source['details']['pantryParapet'];box=np.array(evidence['occludedFrontOuterBox'])
 uv=np.array([project(p,point) for point in parapet_corners(p,q)])
 out=list((uv[:2]-np.array([evidence['backCorners']['inner'],evidence['backCorners']['outer']])).ravel())
 edge=uv[1]-uv[2]
 for pixel in evidence['outerTopEdgeSamples']:
  t=np.clip((np.array(pixel)-uv[2])@edge/(edge@edge),0,1)
  out.extend(uv[2]+t*edge-pixel)
 out.extend(np.minimum(uv[2]-box[:2],0)+np.maximum(uv[2]-box[2:],0))
 return np.array(out)

def parapet_clearances(p,q):
 d=dict(zip(names,p)); evidence=source['details']['pantryParapet']
 box=np.array(evidence['occludedFrontOuterBox'])
 front=project(p,parapet_corners(p,q)[2])
 errors=np.linalg.norm(parapet_residuals(p,q)[:10].reshape(-1,2),axis=1)
 host_top=GROUND+(d['loungeRightTop']-GROUND)*2.42/2.5
 return np.concatenate([evidence['maximumErrorPixels']-errors,front-box[:2],box[2:]-front,[host_top-q[1],host_top-q[2]]])

def derive_pantry_parapet(current,q):
 """Record a jointly constrained cap profile, with full source-edge evidence."""
 d=current['parameters'];p=np.array([d[name] for name in names])
 width,back_top,front_top=map(float,q)
 front=d['loungeY']+shell['partitionThickness']/2;back=d['rearY']-shell['exteriorThickness']/2
 uv=np.array([project(p,point) for point in parapet_corners(p,q)])
 errors=np.linalg.norm(parapet_residuals(p,q)[:10].reshape(-1,2),axis=1)
 if min(parapet_clearances(p,q)) < -1e-7:
  raise RuntimeError('Parapet profile fails source contour gates; live structure unchanged: '+str(errors.tolist()))
 return {'thickness':width,'frontTop':front_top,'backTop':back_top,'centerX':shell['eastX']+shell['exteriorThickness']/2-width/2,'startY':front,'endY':back,'projectedCorners':dict(zip(['backInner','backOuter','frontOuter'],uv.tolist())),'pixelErrors':errors.tolist(),'profileSlopeDegrees':float(np.rad2deg(np.arctan((back_top-front_top)/(back-front)))),'method':'Joint source-constrained continuous cap profile. The rectangular wall footprint is supported by the foundation; base stays on the shared floor. Front/back elevations are inferred from visible cap corners and the entire long edge, not independently surveyed. This profile applies only to the east pantry parapet; the lounge wall remains two level sections.'}

def circulation_clearances(p):
 d=dict(zip(names,p))
 aperture=d['doorWidth']*main_leaf_ratio
 # Fixed side panels are not part of a traversable doorway.
 # A functional ratio to the measured entrance, not a hidden source measurement.
 dy=d['pantryFront']-d['loungeY']-shell['partitionThickness']/2
 dx=max(0,d['loungeX']-shell['partitionThickness']/2-d['pantryX']-shell['exteriorThickness']/2)
 return [float(np.hypot(dx,max(0,dy)))-aperture, d['greenStart']-d['creamEnd']]

def projection_clearances(p):
 pts=geometry(p)
 return [(4 if key.startswith('door-') else 6)-float(np.linalg.norm(project(p,point)-source['points'][key])) for key,point in pts.items() if not (args.diagnose_west_divider and key=='green-partition-right-bottom')]

def residual(p):
 pts=geometry(p); out=[]
 for key, pixel in source['points'].items():
  if args.diagnose_west_divider and key=='green-partition-right-bottom': continue
  delta=project(p,pts[key])-pixel
  out.extend(delta*np.linalg.norm(delta)/12)
 d=dict(zip(names,p))
 # Topology constraints, not aesthetic target values.
 for bad in [d['greenStart']-d['greenEnd'],d['greenEnd']-d['loungeX'],d['doorX']+d['doorWidth']/2-d['facadeEnd'],d['creamTop']-d['rearTop'],d['greenTop']-d['creamTop'],d['loungeTop']-d['returnTop'],d['loungeTop']-d['loungeRightTop']]:
  out.append(max(0,bad)*100)
 if fit_floor:
  for sample in floor_sample_bounds(p):
   out.extend(min(0,c)*1000 for c in sample['clearances'])
  out.extend(min(0,c)*1000 for c in circulation_clearances(p))
 return np.array(out)

if fit_floor:
 accepted=json.loads((DATA/'interior-fit.json').read_text())
 seed=np.array([accepted['parameters'][name] for name in names])
 if 'greenY' in accepted['parameters']:
  # Seed the corrected order using source gap/length ratio; no fixed world gap.
  span=accepted['parameters']['greenEnd']-accepted['parameters']['greenStart']
  gap_pixels=source['points']['green-partition-left-top'][0]-source['points']['work-partition-right-top'][0]
  span_pixels=source['points']['green-partition-right-top'][0]-source['points']['green-partition-left-top'][0]
  seed[names.index('greenStart')]=accepted['parameters']['creamEnd']+span*gap_pixels/span_pixels
  seed[names.index('greenEnd')]=seed[names.index('greenStart')]+span
 previous=accepted.get('pantryParapet',{})
 qseed=[previous.get('thickness',.1),previous.get('backTop',1.),previous.get('frontTop',1.4)]
 def whole_residual(v):
  return np.concatenate([residual(v[:-3]),parapet_residuals(v[:-3],v[-3:])])
 def whole_clearances(v):
  p=v[:-3];q=v[-3:]
  return np.concatenate([[c for sample in floor_sample_bounds(p) for c in sample['clearances']],circulation_clearances(p),projection_clearances(p),parapet_clearances(p,q)])-1e-4
 bounds=list(zip(low,high))+[(.02,shell['exteriorThickness']*2),(GROUND+.05,3.5),(GROUND+.05,3.5)]
 # Restore a topology-consistent initialization before constrained refinement.
 # Neither stage is admitted unless every source and structural gate passes.
 warm=least_squares(whole_residual,np.concatenate([seed,qseed]),bounds=tuple(zip(*bounds)),max_nfev=1500,ftol=1e-10,xtol=1e-10,gtol=1e-10)
 fit=minimize(lambda v:float(whole_residual(v)@whole_residual(v)),warm.x,method='SLSQP',bounds=bounds,constraints=[{'type':'ineq','fun':whole_clearances}],options={'ftol':1e-8,'maxiter':1200})
 # SLSQP can stop at a feasible point without certifying objective stationarity.
 # Admission depends on independent geometric inequalities, not an optimizer flag.
 if not np.all(np.isfinite(fit.x)) or min(whole_clearances(fit.x)+1e-4) < 0:
  rejected=ROOT/'apps/asyra-office/test-results/structural-fit-rejected.json'
  rejected.parent.mkdir(parents=True,exist_ok=True)
  rejected.write_text(json.dumps({'message':fit.message,'parameters':dict(zip(names,map(float,fit.x[:-3]))),'parapet':fit.x[-3:].tolist(),'clearances':whole_clearances(fit.x).tolist()},indent=2)+'\n')
  raise RuntimeError('Constrained structural fit failed: '+fit.message+'; diagnostic: '+str(rejected))
 parapet_q=fit.x[-3:].copy()
 fit.x=fit.x[:-3]
else:
 fit=least_squares(residual,initial,bounds=(low,high),max_nfev=3000,ftol=1e-11,xtol=1e-11,gtol=1e-11)

p=fit.x.copy()
# Fix the look-at gauge without changing eye, orientation or image projection.
# The viewport center ray meets the existing office floor, which owns orbit focus.
_,_,view,fit_eye=camera(p)
p[2]=(fit_eye[2]-GROUND)/view[2]
p[3:6]=fit_eye-view*p[2]
points=geometry(p); errors={k:float(np.linalg.norm(project(p,v)-source['points'][k])) for k,v in points.items()}
right,up,toward,eye=camera(p)
result={'shell':shell,'source':source['reference'],'referenceSha256':hashlib.sha256((ROOT/source['reference']).read_bytes()).hexdigest(),'landmarksSha256':hashlib.sha256((DATA/'interior-landmarks.json').read_bytes()).hexdigest(),'method':'Single-floor constrained pinhole fit with radial fourth-power wall-endpoint loss; jointly fitted vertical field of view. Width is the similarity-scale datum; depth is fitted. The equivalent camera look-at representation is normalized to the shared floor without changing projection. This is not a recovered absolute building dimension.',
 'parameters':dict(zip(names,map(float,p))),'camera':{'position':eye.tolist(),'target':p[3:6].tolist(),'fov':float(p[-1])},
 'points':points,'pixelResiduals':errors,'rmsPixels':float(np.sqrt(np.mean(np.square(list(errors.values()))))),'maximumPixels':max(errors.values())}

if args.diagnose_west_divider:
 output=ROOT/'apps/asyra-office/test-results/west-divider-point-diagnosis.json'
 output.write_text(json.dumps({**result,'diagnosticOnly':True,'excludedFitPoint':'green-partition-right-bottom','solverSuccess':bool(fit.success),'solverMessage':fit.message},indent=2)+'\n')
 print(json.dumps({'output':str(output),'errors':errors},indent=2))
 raise SystemExit(0)

if fit_floor:
 result['floorSamples']=floor_sample_bounds(p)
 result['circulationClearances']=circulation_clearances(p)
 result['pantryParapet']=derive_pantry_parapet(result,parapet_q)
 result['loungeRearBranch']=derive_lounge_return(result)
 result['solver']={'success':bool(fit.success),'message':fit.message,'evaluations':fit.nfev,'activeBounds':{names[i]:('lower' if abs(p[i]-low[i])<1e-6 else 'upper') for i in range(len(names)) if abs(p[i]-low[i])<1e-6 or abs(p[i]-high[i])<1e-6}}
 output=ROOT/'apps/asyra-office/test-results/structural-floor-fit-candidate.json'
 output.parent.mkdir(parents=True,exist_ok=True)
 output.write_text(json.dumps(result,indent=2)+'\n')
 print(json.dumps({'candidateOnly':str(output),'rmsPixels':result['rmsPixels'],'maximumPixels':result['maximumPixels'],'floorSamples':result['floorSamples'],'solver':result['solver']},indent=2))
 if args.apply_structure_fit:
  if result['maximumPixels']>6 or any(errors[key]>4 for key in ['door-left-top','door-right-top','door-right-bottom']):raise RuntimeError('Candidate fails the existing source projection gates; live structure unchanged.')
  current=json.loads((DATA/'interior-fit.json').read_text())
  current.update(result)
  current['method']='Joint single-floor wall-projection, visible-room-floor containment and main-door-leaf circulation fit. Structural fields only; deferred furnishing measurements are preserved and not validated by this fit.'
  current['floors']=dict.fromkeys(['lounge','work','discussion','pantry'],GROUND)
  west=shell['westX']-shell['exteriorThickness']/2;east=shell['eastX']+shell['exteriorThickness']/2;front=shell['frontY']-shell['facadeThickness']/2;rear=result['parameters']['rearY']+shell['exteriorThickness']/2
  current['foundation']={'outline':[[west,front],[east,front],[east,rear],[west,rear]],'bottom':.03,'top':GROUND-.025}
  target=ROOT/'tmp/setup/office-structure-fit-next.json'
  target.write_text(json.dumps(current,indent=2)+'\n');target.replace(DATA/'interior-fit.json')
 raise SystemExit(0)

print(json.dumps({'parameters':result['parameters'],'rmsPixels':result['rmsPixels'],'maximumPixels':result['maximumPixels'],'errors':errors},indent=2))

# Screen-space vertical displacement must be explained by plan depth/camera,
# never by lifting a room. All subsequent fits share this immutable plane.
d=result['parameters']
P=lambda pt:project(p,pt)
floors=dict.fromkeys(['lounge','work','discussion','pantry'],GROUND)
result['floors']=floors
meshes=json.loads((ROOT/'tmp/setup/office-fit-meshes.json').read_text())
right,up,toward,eye=camera(p);focal=756/(2*np.tan(np.deg2rad(p[-1])/2))
def pixels(vertices):
 v=vertices-eye; depths=-(v@toward)
 return np.column_stack((642.5+focal*(v@right)/depths,422-focal*(v@up)/depths))
def invert_pixel(pixel,z):
 return least_squares(lambda xy:P([*xy,z])-pixel,[0,0]).x.tolist()
# Fit refrigerator proportions from the measured front and side
# corners. A whole-object bounding box cannot distinguish orientation or depth.
fridge_corners=source['details']['fridgeFrontCorners']
local_corners={'leftTop':[-.254,-.26,1.14], 'rightTop':[.254,-.26,1.14],
 'leftBottom':[-.254,-.26,.06], 'rightBottom':[.254,-.26,.06], 'backLeftTop':[-.26,.26,1.15]}
rot90=np.array([[0,-1,0],[1,0,0],[0,0,1]])
def fridge_corner_res(q):
 scale=np.full(3,q[2]);pos=np.array([q[0],q[1],GROUND])
 return np.concatenate([P((np.array(local)*scale)@rot90.T+pos)-fridge_corners[key] for key,local in local_corners.items()])
def fridge_clearance(q):
 return [q[0]-.297*q[2]-d['pantryX']-.08,3.02-q[0]-.297*q[2],d['rearY']-.08-q[1]-.26*q[2],q[1]-.26*q[2]-d['loungeY']-.07]
fridge_fit=minimize(lambda q:float(fridge_corner_res(q)@fridge_corner_res(q))/10000,[d['pantryX']+.5,d['rearY']-.5,1],method='SLSQP',bounds=[(-3,3),(-3,4),(.3,3)],constraints=[{'type':'ineq','fun':fridge_clearance}],options={'ftol':1e-10,'maxiter':600})
if not fridge_fit.success:raise RuntimeError('Refrigerator floor support failed: '+fridge_fit.message)
fq=fridge_fit.x
result['furniture']={}
for key,item in source['furniture'].items():
 vertices=np.array(meshes[item['mesh']]); a=np.deg2rad(item['yaw']); rotation=np.array([[np.cos(a),-np.sin(a),0],[np.sin(a),np.cos(a),0],[0,0,1]])
 vertices=vertices@rotation.T;floor=floors[item['floor']];b=np.array(item['box']);xy=invert_pixel([(b[0]+b[2])/2,b[3]],floor)
 def box_res(q):
  yy=d['loungeY']-.07-float(vertices[:,1].max())*q[2] if key=='lounge-sofa' else q[1]
  xx=d['pantryX']+.08-float(vertices[:,0].min())*q[2] if key in ['fridge','water-dispenser'] else q[0]
  vv=vertices*q[2]+np.array([xx,yy,floor]);uv=pixels(vv)
  out=list(np.array([*uv.min(axis=0),*uv.max(axis=0)])-b)
  if key=='lounge-sofa':out.append(max(0,vv[:,1].max()-(d['loungeY']-.07))*200)
  if key=='fridge' or key=='water-dispenser':out.append(max(0,d['pantryX']+.08-vv[:,0].min())*200)
  return out
 if item['floor']=='work':
  def work_support(q):
   vv=vertices*q[2]+[q[0],q[1],floor]
   return [vv[:,0].min()+2.94, d['creamY']-.08-vv[:,1].max(),vv[:,1].min()+2.33]
  fitted=minimize(lambda q:float(np.array(box_res(q))@np.array(box_res(q)))/10000,[*xy,1],method='SLSQP',bounds=[(-5,5),(-5,5),(.2,3)],constraints=[{'type':'ineq','fun':work_support}],options={'maxiter':600,'ftol':1e-10})
  if not fitted.success:raise RuntimeError('Work furniture clearance failed: '+key+' '+fitted.message)
 else:fitted=least_squares(box_res,[*xy,1],bounds=([-5,-5,.2],[5,5,3]),max_nfev=400)
 q=fitted.x
 result['furniture'][key]={'position':[float(d['pantryX']+.08-vertices[:,0].min()*q[2] if key in ['fridge','water-dispenser'] else q[0]),float(d['loungeY']-.07-vertices[:,1].max()*q[2] if key=='lounge-sofa' else q[1]),floor],'scale':[float(q[2])]*3,'rotation':item['yaw'],'boxResidual':list(map(float,box_res(q)))}

result['furniture']['fridge']={'position':[float(fq[0]),float(fq[1]),floors['pantry']], 'scale':[float(fq[2])]*3,'rotation':90,'cornerResidual':fridge_corner_res(fq).tolist()}

print(json.dumps({'floors':floors,'furniture':result['furniture']},indent=2))

# Counter top landmarks distinguish usable support from the faucet and vessels.
sink=result['furniture']['sink'];sc=source['details']['sinkCounterCorners']
sink_local=np.array([[-.45,-.25,.64],[.45,-.25,.64],[.45,.25,.64],[-.004,-.248,.068]])
sink_pixels=np.array([sc[k] for k in ['frontLeft','frontRight','backRight']]+[source['details']['sinkDoorLowerRight']])
def sink_corner_res(q):
 vv=sink_local*q[2]+[q[0],q[1],floors['pantry']]
 return (pixels(vv)-sink_pixels).ravel()
def sink_clearance(q):
 return [3.02-q[0]-.45*q[2],q[0]-.45*q[2]-d['pantryX']-.08,d['rearY']-.08-q[1]-.25*q[2]]
sf=minimize(lambda q:float(sink_corner_res(q)@sink_corner_res(q))/10000,[*sink['position'][:2],sink['scale'][0]],method='SLSQP',bounds=[(-3,4),(-3,4),(.2,3)],constraints=[{'type':'ineq','fun':sink_clearance}],options={'maxiter':700,'ftol':1e-10})
if not sf.success:raise RuntimeError('Counter support fit failed: '+sf.message)
sink.update({'position':[float(sf.x[0]),float(sf.x[1]),floors['pantry']],'scale':[float(sf.x[2])]*3,'cornerResidual':sink_corner_res(sf.x).tolist()})
sink.pop('boxResidual',None)

result['printedArtwork']=source['printedArtwork']
result['mounted']={}
for key,item in source['mounted'].items():
 axis=item['axis']; plane=-3.02+.08+.0125 if axis==0 else (d['loungeY']-.07-.0125 if item['wall']=='lounge' else d['rearY']-.08-.0125)
 if key=='meeting-art': plane=-2.927+.026/2+.0125
 bb=np.array(item['box']);center=[(bb[0]+bb[2])/2,(bb[1]+bb[3])/2]
 def mount_points(q):
  pos=np.array([plane,q[0],q[1]] if axis==0 else [q[0],plane,q[1]])
  if item.get('circle'):
   angles=np.linspace(0,2*np.pi,100); offsets=np.column_stack((np.cos(angles)*q[2]/2,np.sin(angles)*q[2]/2))
  else:offsets=np.array([[-1,-1],[-1,1],[1,1],[1,-1]])*q[2:4]/2
  vv=np.repeat([pos],len(offsets),axis=0);vv[:,1-axis]+=offsets[:,0];vv[:,2]+=offsets[:,1]
  return vv
 def residual_mount(q):
  uv=pixels(mount_points(q));return np.array([*uv.min(axis=0),*uv.max(axis=0)])-bb
 q=least_squares(residual_mount,[0,2,.7] if item.get('circle') else [0,2,.7,.9],max_nfev=400).x
 result['mounted'][key]={'position':[plane,float(q[0]),float(q[1])] if axis==0 else [float(q[0]),plane,float(q[1])],'width':float(q[2]),'height':float(q[2] if len(q)==3 else q[3]),'rotation':90 if axis==0 else 0,'pixelResidual':residual_mount(q).tolist()}

# A complete rectangle supports every room, including occluded front corners.
# The facade uses its actual body thickness, not the thinner side-wall value.
west=shell['westX']-shell['exteriorThickness']/2
east=shell['eastX']+shell['exteriorThickness']/2
front=shell['frontY']-shell['facadeThickness']/2
rear=d['rearY']+shell['exteriorThickness']/2
result['foundation']={'outline':[[west,front],[east,front],[east,rear],[west,rear]],'bottom':.03,'top':GROUND-.025}
# The wallpaper split is traced on the rear plane at the visible cap edge.
result['wallpaperEndX']=least_squares(lambda x:P([x[0],d['rearY'],d['pantryTop']])-source['details']['wallpaperEndTop'],[1.5]).x[0]
# A floor ellipse is fitted by its projected contour, not a rounded box.
angles=np.linspace(0,2*np.pi,128);b=np.array(source['details']['workRugBox'])
def rug_res(q):
 a=np.deg2rad(d['azimuth']); xx=q[2]*np.cos(angles); yy=q[3]*np.sin(angles)
 vv=np.column_stack((q[0]+xx*np.cos(a)-yy*np.sin(a),q[1]+xx*np.sin(a)+yy*np.cos(a),np.full(len(angles),floors['work']+.009)))
 uv=pixels(vv);return np.array([*uv.min(axis=0),*uv.max(axis=0)])-b
xy=invert_pixel([(b[0]+b[2])/2,(b[1]+b[3])/2],floors['work'])
rug=least_squares(rug_res,[*xy,.8,.5],bounds=([-4,-4,.1,.1],[4,4,2,2])).x
# The shared foundation supports every room; no artificial platform boundary.
work_outline=np.array(result['foundation']['outline'])
def rug_clearance(q):
 a=np.deg2rad(d['azimuth']);xx=q[2]*np.cos(angles);yy=q[3]*np.sin(angles)
 points=np.column_stack((q[0]+xx*np.cos(a)-yy*np.sin(a),q[1]+xx*np.sin(a)+yy*np.cos(a)))
 return np.concatenate([points[:,0]+3.02,3.02-points[:,0],d['rearY']-.08-points[:,1],points[:,1]-shell['frontY']])
constrained=minimize(lambda q:float(rug_res(q)@rug_res(q)),rug,method='SLSQP',bounds=[(-4,4),(-4,4),(.1,2),(.1,2)],constraints=[{'type':'ineq','fun':rug_clearance}],options={'maxiter':1000,'ftol':1e-10})
if not constrained.success: raise RuntimeError('Oval floor support could not be solved: '+constrained.message)
rug=constrained.x
result['workRug']={'position':[float(rug[0]),float(rug[1]),floors['work']+.009],'radii':rug[2:].tolist(),'rotation':d['azimuth'],'boxResidual':rug_res(rug).tolist()}
# The lounge rug is solved independently, with the new foundation and adjacent
# walls as hard constraints rather than an unchecked display scale.
lb=np.array(source['details']['loungeRugBox']);outline=np.array(result['foundation']['outline']);front_plane=float(outline[:,1].min())
def lounge_circle(q):
 return np.column_stack((q[0]+q[2]*np.cos(angles),q[1]+q[2]*np.sin(angles)))
def lounge_rug_res(q):
 vv=np.column_stack((lounge_circle(q),np.full(len(angles),floors['lounge']+.009)));uv=pixels(vv)
 return np.array([*uv.min(axis=0),*uv.max(axis=0)])-lb
def lounge_clearance(q):
 points=lounge_circle(q)
 limits=[points[:,0]-d['loungeX']-.073,3.10-points[:,0],d['loungeY']-.073-points[:,1],points[:,1]-front_plane-.003]
 return np.concatenate(limits)
xy=invert_pixel([(lb[0]+lb[2])/2,(lb[1]+lb[3])/2],floors['lounge'])
lr=minimize(lambda q:float(lounge_rug_res(q)@lounge_rug_res(q))/10000,[*xy,.8],method='SLSQP',bounds=[(-4,4),(-4,4),(.1,2)],constraints=[{'type':'ineq','fun':lounge_clearance}],options={'maxiter':1000,'ftol':1e-9})
if not lr.success:raise RuntimeError('Lounge rug support could not be solved: '+lr.message)
result['loungeRug']={'position':[float(lr.x[0]),float(lr.x[1]),floors['lounge']+.009],'radius':float(lr.x[2]),'boxResidual':lounge_rug_res(lr.x).tolist()}
# Ground contacts constrain the full-size armchair after its source bounds change.
# The measured foundation must not be enlarged merely to hide an unsupported foot.
item=source['furniture']['lounge-side-chair'];chair=result['furniture']['lounge-side-chair']
chair_vertices=np.array(meshes[item['mesh']])
feet=chair_vertices[np.abs(chair_vertices[:,2]-chair_vertices[:,2].min())<1e-6]
chair_spec=next(m for m in json.loads((ROOT/'assets/asyra-office/models/furniture/furniture-model-spec.json').read_text())['modules'] if m['moduleId']=='lounge-armchair')
contact_ids=[*item['contactPixels'],*item['occludedContactBoxes']]
contacts=np.array([next(c['bottomCentre'] for c in chair_spec['components'] if c['partId']==key) for key in contact_ids])
contact_pixels=np.array(list(item['contactPixels'].values()))
contact_boxes=np.array(list(item['occludedContactBoxes'].values()))
cb=np.array(item['box'])
def chair_points(vertices,q):
 a=np.deg2rad(q[5]);rot=np.array([[np.cos(a),-np.sin(a),0],[np.sin(a),np.cos(a),0],[0,0,1]])
 return (vertices*q[2:5])@rot.T+[q[0],q[1],floors['lounge']]
def chair_box_res(q):
 uv=pixels(chair_points(chair_vertices,q))
 return np.array([*uv.min(axis=0),*uv.max(axis=0)])-cb
def chair_res(q):
 uv=pixels(chair_points(contacts,q));hidden=uv[len(contact_pixels):]
 ranges=np.maximum(contact_boxes[:,:2]-hidden,0)+np.minimum(contact_boxes[:,2:]-hidden,0)
 return np.concatenate([chair_box_res(q),2*(uv[:len(contact_pixels)]-contact_pixels).ravel(),2*ranges.ravel()])
def chair_support(q):
 points=chair_points(feet,q)[:,:2]
 return np.concatenate([points[:,0]-d['loungeX']-.073,3.1-points[:,0],d['loungeY']-.073-points[:,1],points[:,1]-front_plane-.003])
q0=[*chair['position'][:2],*chair['scale'],0]
cf=minimize(lambda q:float(chair_res(q)@chair_res(q)),q0,method='SLSQP',bounds=[(-4,4),(-4,4),(.2,3),(.2,3),(.2,3),tuple(item['yawRange'])],constraints=[{'type':'ineq','fun':chair_support}],options={'maxiter':1000,'ftol':1e-10})
if not cf.success:raise RuntimeError('Armchair ground contact could not be solved: '+cf.message)
chair.update({'position':[float(cf.x[0]),float(cf.x[1]),floors['lounge']],'scale':cf.x[2:5].tolist(),'size':(np.array(chair_spec['size'])*cf.x[2:5]).tolist(),'rotation':float(cf.x[5]),'boxResidual':chair_box_res(cf.x).tolist(),'projectedContacts':dict(zip(contact_ids,pixels(chair_points(contacts,cf.x)).tolist()))})
# Preserve the bottle profile and ring geometry, but fit its size independently
# around the specified cabinet-top attachment. The body fitting stays unchanged.
disp=result['furniture']['water-dispenser'];body_scale=disp['scale'][0]
bottle=np.array(meshes['dispenserBottle']);pivot=np.array([0,0,.79]);a=np.deg2rad(disp['rotation']);rot=np.array([[np.cos(a),-np.sin(a),0],[np.sin(a),np.cos(a),0],[0,0,1]])
b=np.array(source['details']['dispenserBottleBox'])
def bottle_res(q):
 vv=(((bottle-pivot)*np.array([q[0],q[0],q[1]])+pivot)*body_scale)@rot.T+disp['position']
 uv=pixels(vv);return np.array([*uv.min(axis=0),*uv.max(axis=0)])-b
q=least_squares(bottle_res,[1,1.5],bounds=([.3,.3],[3,3])).x
result['dispenserBottle']={'pivot':pivot.tolist(),'scale':[float(q[0]),float(q[0]),float(q[1])],'boxResidual':bottle_res(q).tolist()}
# A shelf is fitted by corresponding corners, not its background-inclusive AABB.
sh=source['pantryShelf'];back_y=d['rearY']-.08
sh_pixels=np.array([sh['visibleCorners'][k] for k in ['frontRight','backRight']])
sh_ranges=np.array([sh['occludedCornerBoxes'][k] for k in ['frontLeft','backLeft']])
def shelf_points(q):
 x,z,width,depth=q
 return np.array([[x-width/2,back_y-depth,z],[x+width/2,back_y-depth,z],[x-width/2,back_y,z],[x+width/2,back_y,z]])
def shelf_res(q):
 uv=pixels(shelf_points(q));hidden=uv[[0,2]]
 ranges=np.maximum(sh_ranges[:,:2]-hidden,0)+np.minimum(sh_ranges[:,2:]-hidden,0)
 return np.concatenate([(uv[[1,3]]-sh_pixels).ravel(),ranges.ravel()])
sf=least_squares(shelf_res,[1,2,1.3,.22],bounds=([-3,.5,.1,.05],[4,5,4,1]))
x,z,width,depth=map(float,sf.x);thickness=sh['thicknessMetres']
result['pantryShelf']={'position':[x,back_y-depth/2,z-thickness/2],'size':[width,depth,thickness],'cornerPixels':pixels(shelf_points(sf.x)).tolist(),'cornerResidual':shelf_res(sf.x).tolist(),'canisters':[]}
jar=np.array(meshes['canister'])
for b in sh['canisters']:
 b=np.array(b);xy=invert_pixel([(b[0]+b[2])/2,b[3]],z)
 def jar_res(q):
  vv=jar*[q[2],q[2],q[3]]+[q[0],q[1],z];uv=pixels(vv)
  return np.array([*uv.min(axis=0),*uv.max(axis=0)])-b
 def support(q):
  radius=.045*q[2]
  return [q[0]-radius-(x-width/2),x+width/2-q[0]-radius,q[1]-radius-(back_y-depth),back_y-q[1]-radius]
 jf=minimize(lambda q:float(jar_res(q)@jar_res(q))/10000,[*xy,1,1],method='SLSQP',bounds=[(-3,4),(-3,4),(.2,4),(.2,4)],constraints=[{'type':'ineq','fun':support}],options={'maxiter':400,'ftol':1e-10})
 if not jf.success:raise RuntimeError('Canister fit failed: '+jf.message)
 q=jf.x
 result['pantryShelf']['canisters'].append({'position':[float(q[0]),float(q[1]),z],'scale':[float(q[2]),float(q[2]),float(q[3])],'pixelResidual':jar_res(q).tolist()})
# Separate pot and foliage bounds retain the soil attachment instead of scaling
# a tall-stemmed plant as if it were the source rosette.
result['indoorPlants']={}
pot_vertices=np.array(meshes['planterVessel']);soil_z=.108
for key,config in source['indoorPlants'].items():
 support=config['support'];support_bounds=None
 if support=='lounge-floor':z=floors['lounge']
 else:
  assembly=result['furniture'][support];mesh=np.array(meshes['sinkCountertop' if support=='sink' else 'coffeeTable'])
  support_vertices=mesh*assembly['scale']+assembly['position']
  z=float(support_vertices[:,2].max());support_bounds=np.array([support_vertices.min(axis=0),support_vertices.max(axis=0)])
  if support=='sink':support_bounds[0,0]=assembly['position'][0]+.25*assembly['scale'][0]
 pb=np.array(config['potBox']);xy=invert_pixel([(pb[0]+pb[2])/2,pb[3]],z)
 def pot_res(q):
  uv=pixels(pot_vertices*[q[2],q[2],q[3]]+[q[0],q[1],z])
  return np.array([*uv.min(axis=0),*uv.max(axis=0)])-pb
 def pot_support(q):
  if support_bounds is None:return [1]
  # Full pot envelope, not just the smaller bottom contact, must clear the basin.
  radius=.07*q[2]
  return [q[0]-radius-support_bounds[0,0],support_bounds[1,0]-q[0]-radius,q[1]-radius-support_bounds[0,1],support_bounds[1,1]-q[1]-radius]
 pf=minimize(lambda q:float(pot_res(q)@pot_res(q))/10000,[*xy,1,1],method='SLSQP',bounds=[(-4,4),(-4,4),(.2,4),(.2,4)],constraints=[{'type':'ineq','fun':pot_support}],options={'maxiter':600,'ftol':1e-10})
 if not pf.success:raise RuntimeError('Indoor pot fit failed: '+key+' '+pf.message)
 q=pf.x;pos=np.array([q[0],q[1],z]);foliage=np.array(meshes[key+'-foliage']);fb=np.array(config['foliageBox']);pivot=np.array([0,0,soil_z])
 def foliage_res(v):
  vv=(foliage-pivot)*[v[0],v[0],v[1]]+[0,0,soil_z*q[3]]+pos
  uv=pixels(vv);return np.array([*uv.min(axis=0),*uv.max(axis=0)])-fb
 ff=least_squares(foliage_res,[q[2],q[3]],bounds=([.2,.2],[6,6]))
 result['indoorPlants'][key]={'position':pos.tolist(),'potScale':[float(q[2]),float(q[2]),float(q[3])],'foliageScale':[float(ff.x[0]),float(ff.x[0]),float(ff.x[1])],'soilPivot':soil_z,'potColor':config['potColor'],'seed':config['seed'],'potResidual':pot_res(q).tolist(),'foliageResidual':foliage_res(ff.x).tolist()}
next_file=ROOT/'tmp/setup/office-fit-next.json'
next_file.write_text(json.dumps(result,indent=2)+'\n')
next_file.replace(DATA/'interior-fit.json')
