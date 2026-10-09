"""Compose one five-view bench sheet from a single validated numeric construction."""
from pathlib import Path
import hashlib
import json
import shutil
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from bench_geometry import build_scene
from bench_projection import render

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT/'01-park-bench-v1.png'
SPEC_PATH = ROOT.parent/'outdoor-accents-model-spec.json'
OUTPUT = ROOT/'01-park-bench-v4.png'
EVIDENCE = ROOT/'bench-v4-evidence'

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def geometry_digest(primitives):
    serial = [{k:v.tolist() if isinstance(v,np.ndarray) else v for k,v in p.items()} for p in primitives]
    return hashlib.sha256(json.dumps(serial,sort_keys=True).encode()).hexdigest()

def main():
    spec = json.loads(SPEC_PATH.read_text())['modules'][0]
    source = Image.open(SOURCE).convert('RGB')
    scene, wood, validation = build_scene(spec)
    digest = geometry_digest(scene)
    EVIDENCE.mkdir(exist_ok=True)
    paper = Image.new('RGB',(3072,2048),'white')
    draw = ImageDraw.Draw(paper)
    fonts = Path('/System/Library/Fonts/Supplemental')
    def text(x,y,value,size=28,bold=False,anchor='lt'):
        font = ImageFont.truetype(str(fonts/('Arial Bold.ttf' if bold else 'Arial.ttf')),size)
        draw.text((x,y),value,font=font,fill='#28343C',anchor=anchor)
    text(70,45,'PARK BENCH - SINGLE UNIT',56,True)
    text(70,127,'Five projections of one construction - original wood and metal colour family',29)
    layouts = [
        ('FRONT',(30,190),(1080,720)),
        ('RIGHT',(1140,190),(760,720)),
        ('BACK',(1940,190),(1080,720)),
        ('TOP',(50,1020),(1200,750)),
        ('THREE-QUARTER',(1550,970),(1450,850)),
    ]
    records=[]
    for name,position,size in layouts:
        picture, details = render(scene,wood,source,spec['referenceReview']['projectionCameras'][name],800,size)
        filename = name.lower()+'.png'
        picture.save(EVIDENCE/filename)
        paper.paste(picture,position)
        text(position[0]+size[0]/2,position[1]+size[1]+16,name,34,True,'mt')
        records.append(dict(view=name,method='shared-geometry-projection',geometrySHA256=digest,
            image=str((EVIDENCE/filename).relative_to(ROOT)),imageSHA256=sha(EVIDENCE/filename),
            destinationXY=list(position),**details))
    # Dimensions refer to the whole object, not the white view rectangles.
    text(70,960,'Width 1200 mm',27)
    text(1160,960,f"Height {spec['nominalSize'][2]*1000:.0f} mm / seat {spec['seatTop']*1000:.0f} mm",27)
    text(1940,960,'Rear inset 92.5 mm per side',27)
    text(70,1845,'4 seat slats / 3 back slats',29,True)
    text(70,1894,'Seat: 1140 x 100 x 35 mm / gaps: 10 mm',26)
    text(70,1938,'Back: 1070 x 90 x 30 mm / lean: 15 degrees',26)
    text(70,1982,'Default size: '+' x '.join(f'{v*1000:.3f}'.rstrip('0').rstrip('.') for v in spec['nominalSize'])+' mm',26)
    text(1540,1894,'Post diameter: 45 mm / wood beyond rear posts: 27.5 mm',26)
    text(1540,1938,'Arm / wood gap: at least 2 mm / flat post caps',26)
    text(1540,1982,'Replaceable colours and materials / no baked shadows',26)
    paper.save(OUTPUT)
    report = dict(source=SOURCE.name,sourceSHA256=sha(SOURCE),specificationSHA256=sha(SPEC_PATH),
        output=OUTPUT.name,outputSHA256=sha(OUTPUT),sheetPixels=list(paper.size),
        geometrySHA256=digest,views=records,constructionChecks=validation,
        scope='One numeric construction projected five ways; source illustrations are uncalibrated appearance references. User approval and production mesh verification remain separate.')
    report['generatorSHA256'] = {name:sha(ROOT/name) for name in (
        'compose-bench-reference.py','bench_geometry.py','bench_projection.py')}
    key = hashlib.sha256(json.dumps({k:report[k] for k in ('specificationSHA256','sourceSHA256','generatorSHA256')},sort_keys=True).encode()).hexdigest()[:16]
    run = ROOT/'bench-review-runs'/key
    report['retainedRun'] = str(run.relative_to(ROOT))
    (ROOT/'bench-reference-layout.json').write_text(json.dumps(report,indent=2)+'\n')
    if not run.exists():
        run.mkdir(parents=True)
        shutil.copy2(SPEC_PATH,run/SPEC_PATH.name)
        shutil.copy2(OUTPUT,run/OUTPUT.name)
        shutil.copy2(ROOT/'bench-reference-layout.json',run/'bench-reference-layout.json')
        for name in report['generatorSHA256']:
            shutil.copy2(ROOT/name,run/(name+'.txt'))
        for name,_,_ in layouts:
            shutil.copy2(EVIDENCE/(name.lower()+'.png'),run/(name.lower()+'.png'))
    print(json.dumps({'output':str(OUTPUT),'views':len(records),'geometrySHA256':digest,
        'minimumArmWoodClearanceMm':min(x['wholeTubeClearanceLowerBoundMm'] for x in validation['armWoodClearances'])}))

if __name__ == '__main__':
    main()
