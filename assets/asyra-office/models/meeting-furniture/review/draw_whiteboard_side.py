"""Correct only the whiteboard RIGHT diagram using its numeric specification.

Uses the repository's existing Node/sharp runtime; no Blender or asset export.
Run with --check to verify saved outputs without writing them.
"""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

ROOT=Path(__file__).resolve().parent
MODEL=ROOT.parent/'meeting-furniture-model-spec.json'
SOURCE=ROOT/'02-blank-whiteboard-v1.png'
TARGET=ROOT/'02-blank-whiteboard-v2.png'
SVG=ROOT/'02-blank-whiteboard-side-v2.svg'
RECORD=ROOT/'whiteboard-side-record.json'


def drawing():
    board=json.loads(MODEL.read_text())['assets'][1]
    frame=board['parts']['frame'];tray=board['parts']['tray']
    scale=500.0  # Pixels per metre; same scale on both axes.
    rear_x=796.0;top_y=136.0
    def screen(y,z):return [rear_x+y*scale,top_y+(frame['outer'][1]/2-z)*scale]
    def rect(y0,y1,z0,z1):
        x,y=screen(y0,z1)
        return [x,y,(y1-y0)*scale,(z1-z0)*scale]
    bar=rect(*frame['yRange'],-frame['outer'][1]/2,frame['outer'][1]/2)
    shelf=rect(tray['min'][1],tray['max'][1],tray['min'][2],tray['max'][2])
    assert abs(bar[1]+bar[3]-shelf[1])<1e-9
    assert abs(bar[0]+bar[2]-shelf[0]-shelf[2])<1e-9
    assert shelf[0]<bar[0]
    patch=[700,70,185,465]
    elements=[f'<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024" viewBox="0 0 1536 1024">',
              '<rect x="700" y="70" width="185" height="465" fill="white"/>',
              '<g fill="#B9864E" stroke="#514536" stroke-width="1">']
    for name,values in [('frame',bar),('tray',shelf)]:
        x,y,w,h=values
        elements.append(f'<rect id="{name}" x="{x:g}" y="{y:g}" width="{w:g}" height="{h:g}"/>')
    elements.append('</g><g fill="none" stroke="#222" stroke-width="1">')
    # Extension lines and compact inward arrowheads for both horizontal dimensions.
    for x0,x1,y,object_y in [(bar[0],bar[0]+bar[2],116,bar[1]),(shelf[0],shelf[0]+shelf[2],458,shelf[1]+shelf[3])]:
        extension=y-7 if object_y>y else y+7
        elements.append(f'<path d="M{x0:g},{object_y:g} V{extension:g} M{x1:g},{object_y:g} V{extension:g} M{x0:g},{y:g} H{x1:g}"/>')
        elements.append(f'<path fill="#222" d="M{x0:g},{y:g} l4,-2 v4 z M{x1:g},{y:g} l-4,-2 v4 z"/>')
    elements.append('</g><g fill="#111" font-family="Arial,Helvetica,sans-serif" text-anchor="middle">')
    elements.append(f'<text x="789.75" y="99" font-size="23">{frame["yRange"][1]-frame["yRange"][0]:g} m</text>')
    elements.append(f'<text x="781" y="484" font-size="23">{tray["max"][1]-tray["min"][1]:g} m</text>')
    elements.append('<text x="781" y="519" font-size="25">RIGHT</text></g></svg>')
    svg='\n'.join(elements)+'\n'
    record={'source':SOURCE.name,'current':TARGET.name,'patchBoundsXYWH':patch,'pixelsPerMetre':scale,
            'camera':{'positionAxis':'+X','lookDirection':'-X','screenRight':'+Y','screenUp':'+Z'},
            'frameRectXYWH':bar,'trayRectXYWH':shelf,
            'sourceSha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
            'svgSha256':hashlib.sha256(svg.encode()).hexdigest(),
            'scope':'Only the RIGHT inset is replaced. Other four views retain original pixels. No model geometry or production render is generated.'}
    return svg,record


def main():
    args=argparse.ArgumentParser();args.add_argument('--check',action='store_true');check=args.parse_args().check
    module=next((p/'node_modules/sharp' for p in ROOT.parents if (p/'node_modules/sharp').is_dir()),None)
    if module is None:raise RuntimeError('Existing repository sharp dependency is required; do not install automatically.')
    svg,record=drawing()
    # sharp rasterizes the numeric SVG layer; source illustration is not regenerated.
    code=r'''
const fs=require('fs');const sharp=require(process.argv[1]);
const [source,target,mode]=process.argv.slice(2);const svg=fs.readFileSync(0);
(async()=>{
 const generated=await sharp(source).composite([{input:svg}]).png().toBuffer();
 if(mode==='check') {
   const a=await sharp(generated).raw().toBuffer();
   const b=await sharp(target).raw().toBuffer();
   if(!a.equals(b))throw Error('Saved sheet differs from deterministic drawing');
 }else fs.writeFileSync(target,generated);
 const a=await sharp(source).ensureAlpha().raw().toBuffer();
 const b=await sharp(generated).ensureAlpha().raw().toBuffer();
 let changed=0;
 for(let y=0;y<1024;y++)for(let x=0;x<1536;x++){
   const i=(y*1536+x)*4;let different=false;
   for(let c=0;c<4;c++)if(a[i+c]!==b[i+c])different=true;
   if(different){changed++;if(!(x>=700&&x<885&&y>=70&&y<535))throw Error('Changed pixel outside RIGHT inset');}
 }
 if(!changed)throw Error('RIGHT inset was not changed');
 console.log(JSON.stringify({changedPixels:changed,outsidePatchChangedPixels:0}));
})().catch(e=>{console.error(e.message);process.exit(1)});
'''
    result=subprocess.run(['node','-e',code,str(module),str(SOURCE),str(TARGET),'check' if check else 'write'],input=svg,text=True,capture_output=True,check=True)
    record['pixelVerification']=json.loads(result.stdout)
    if check:
        assert SVG.read_text()==svg,'SVG needs regeneration'
        assert json.loads(RECORD.read_text())==record,'Drawing record needs regeneration'
    else:
        SVG.write_text(svg);RECORD.write_text(json.dumps(record,indent=2)+'\n')
    print('Whiteboard RIGHT view: dimensions, shared edge and unchanged surrounding pixels verified.')


if __name__=='__main__':main()
