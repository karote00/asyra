"""Retain source/candidate visual evidence; uniform alignment is not calibration."""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
EVIDENCE = ROOT/'bench-v4-evidence'
CROPS = {
    'FRONT':(20,126,598,446), 'RIGHT':(635,125,887,446),
    'BACK':(944,126,1512,446),'TOP':(90,590,685,837),
    'THREE-QUARTER':(825,508,1505,968),
}

def object_box(image):
    a=np.array(image)
    mask=a.min(axis=2)<200
    yy,xx=np.where(mask)
    return (int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1))

def main():
    source=Image.open(ROOT/'01-park-bench-v1.png').convert('RGB')
    records=[]
    font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',25)
    for name,box in CROPS.items():
        original=source.crop(box)
        if name=='THREE-QUARTER':
            ImageDraw.Draw(original).rectangle((125,435,385,459),fill='white')
        candidate=Image.open(EVIDENCE/(name.lower()+'.png')).convert('RGB')
        a_box,b_box=object_box(original),object_box(candidate)
        a,b=original.crop(a_box),candidate.crop(b_box)
        # One scale per complete image; use common object width and a bottom datum.
        target_width=780
        scale_a=target_width/a.width;scale_b=target_width/b.width
        a=a.resize((target_width,round(a.height*scale_a)),Image.Resampling.LANCZOS)
        b=b.resize((target_width,round(b.height*scale_b)),Image.Resampling.LANCZOS)
        h=max(a.height,b.height)+160
        left=Image.new('RGB',(850,h),'white');right=left.copy()
        left.paste(a,(35,h-50-a.height));right.paste(b,(35,h-50-b.height))
        sheet=Image.new('RGB',(1700,h),'white');sheet.paste(left,(0,0));sheet.paste(right,(850,0))
        d=ImageDraw.Draw(sheet);d.text((35,25),name+' - ORIGINAL',font=font,fill='#28343C')
        d.text((885,25),name+' - SHARED GEOMETRY',font=font,fill='#28343C')
        sheet.save(EVIDENCE/(name.lower()+'-comparison.png'))
        Image.blend(left,right,.5).save(EVIDENCE/(name.lower()+'-overlay.png'))
        records.append(dict(view=name,sourceCropPixels=list(box),sourceObjectBox=list(a_box),
            candidateObjectBox=list(b_box),sourceScale=scale_a,candidateScale=scale_b,
            alignedWidthPixels=target_width,alignedHeightDifferencePixels=b.height-a.height,
            method='Uniform width alignment and bottom datum; no camera calibration or geometric acceptance implied'))
    # Review saved pixels at native resolution, then enlarge local connection regions.
    for name,box in {
        'top-rear-return':('top',(70,130,340,410)),
        'right-arm-post':('right',(390,130,670,490)),
        'oblique-seat-frame':('three-quarter',(770,400,1120,720)),
        'back-caps':('back',(50,20,360,260)),
    }.items():
        image=Image.open(EVIDENCE/(box[0]+'.png')).crop(box[1])
        image.resize((image.width*3,image.height*3),Image.Resampling.LANCZOS).save(EVIDENCE/(name+'-detail.png'))
    (EVIDENCE/'comparison.json').write_text(json.dumps(records,indent=2)+'\n')
    print(json.dumps(records,indent=2))

if __name__=='__main__':
    main()
