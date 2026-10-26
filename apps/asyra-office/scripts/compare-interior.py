"""Produce a 50% diagnostic overlay from the actual app canvas, without warping.

Usage: python3 apps/asyra-office/scripts/compare-interior.py <canvas.png>
The input must come from the permanent measured-reference browser case.
"""
import sys
import math
import json
from pathlib import Path
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[3]
actual=Image.open(ROOT / sys.argv[1]).convert('RGB')
reference=Image.open(ROOT/'assets/asyra-office/models/architecture/review/approved-office-reference.jpg').convert('RGB').crop((220,44,1065,800))
assert actual.size==reference.size==(845,756), 'Capture the calibrated production canvas; do not distort an image to align it.'
result=Image.new('RGB',(845*3,800),'white')
for i,(title,im) in enumerate([('Approved reference',reference),('Actual app - same projection',actual),('50% overlay - differences remain visible',Image.blend(reference,actual,.5))]):
 result.paste(im,(i*845,44));ImageDraw.Draw(result).text((i*845+12,14),title,fill='black')
out=ROOT/'apps/asyra-office/test-results/interior-reference-comparison.png'
result.save(out)
print(out)

# Fixed source-coordinate crops cover each reported defect independently.
# Both inputs use the same crop and enlargement; there is no image registration.
regions={
 'west-wall':(275,65,650,245),
 'rear-left-joint':(552,62,615,125),
 'rear-right-joint':(968,198,1030,265),
 'work-rug-platform':(350,330,655,456),
 'lounge-enclosure':(595,305,920,555),
 'lounge-rear-return':(775,325,865,405),
 'lounge-step':(730,328,832,425),
 'lounge-right-end':(875,380,925,430),
 'lounge-return-foot':(610,330,705,515),
 'lounge-left-end':(660,315,710,365),
 'pantry-wallpaper':(785,140,1008,342),
 'fridge-bottle':(695,228,789,353),
 'entrance':(475,405,615,580),
 'pantry-east-edge':(885,335,1015,435),
 'pantry-cap-planes':(675,125,1015,245),
 'foundation':(280,435,930,605),
 'work-floor':(345,285,640,430),
 'lounge-floor':(610,425,900,565)
}
folder=out.parent/'interior-correction-details';folder.mkdir(exist_ok=True)
for name,(x0,y0,x1,y1) in regions.items():
 box=(x0-220,y0-44,x1-220,y1-44)
 scale=max(2,math.ceil(320/(x1-x0)))
 width,height=(x1-x0)*scale,(y1-y0)*scale
 sheet=Image.new('RGB',(width*2,height+44),'white');draw=ImageDraw.Draw(sheet)
 for column,(title,im) in enumerate([('Approved reference',reference),('Actual app',actual)]):
  sheet.paste(im.crop(box).resize((width,height)),(column*width,44))
  draw.text((column*width+12,14),title+' - '+name,fill='black')
 sheet.save(folder/(name+'.png'))

# Point identity review: show exactly which source edge enters the contour fit.
trace=json.loads((ROOT/'apps/asyra-office/src/scene/reference/interior-landmarks.json').read_text())['details']['loungeWallContour']['tracePixels']
box=(730-220,328-44,832-220,425-44);scale=6
marked=reference.crop(box).resize((102*scale,97*scale))
draw=ImageDraw.Draw(marked)
for index,(x,y) in enumerate(trace):
 if 730<=x<832 and 328<=y<425:
  px,py=(x-730)*scale,(y-328)*scale
  draw.ellipse((px-5,py-5,px+5,py+5),outline='#ff0000',width=2)
  draw.text((px+7,py-13),str(index+1)+' '+str((x,y)),fill='#ff0000')
marked.save(folder/'lounge-step-markers.png')

for name,rect in [('lounge-right-end',(875,380,925,430)),('lounge-left-end',(660,315,710,365))]:
 x0,y0,x1,y1=rect; scale=8
 marked=reference.crop((x0-220,y0-44,x1-220,y1-44)).resize(((x1-x0)*scale,(y1-y0)*scale))
 draw=ImageDraw.Draw(marked)
 for index,(x,y) in enumerate(trace):
  if x0<=x<x1 and y0<=y<y1:
   px,py=(x-x0)*scale,(y-y0)*scale
   draw.ellipse((px-5,py-5,px+5,py+5),outline='#ff0000',width=2)
   draw.text((px+7,py-13),str(index+1)+' '+str((x,y)),fill='#ff0000')
 marked.save(folder/(name+'-markers.png'))

# Visible opening corners, independently traced on the front wall face.
source=json.loads((ROOT/'apps/asyra-office/src/scene/reference/interior-landmarks.json').read_text())
x0,y0,x1,y1=source['details']['entranceOpening']['sourceCrop'];scale=6
marked=reference.crop((x0-220,y0-44,x1-220,y1-44)).resize(((x1-x0)*scale,(y1-y0)*scale))
draw=ImageDraw.Draw(marked)
for key in source['details']['entranceOpening']['visibleCorners']:
 x,y=source['points'][key];px,py=(x-x0)*scale,(y-y0)*scale
 draw.ellipse((px-5,py-5,px+5,py+5),outline='#ff0000',width=2)
 draw.text((px+7,py-13),str((x,y)),fill='#ff0000')
marked.save(folder/'entrance-opening-markers.png')


# The pantry side parapet has a visible cap, separate from foreground foliage.
x0,y0,x1,y1=885,335,1015,435
scale=6
marked=reference.crop((x0-220,y0-44,x1-220,y1-44)).resize(((x1-x0)*scale,(y1-y0)*scale))
draw=ImageDraw.Draw(marked)
for x in range(890,1015,10):
 draw.line(((x-x0)*scale,0,(x-x0)*scale,(y1-y0)*scale),fill='#6090a0',width=1)
 draw.text(((x-x0)*scale+2,2),str(x),fill='#000000',stroke_width=1,stroke_fill='white')
for y in range(340,435,10):
 draw.line((0,(y-y0)*scale,(x1-x0)*scale,(y-y0)*scale),fill='#6090a0',width=1)
 draw.text((2,(y-y0)*scale+2),str(y),fill='#000000',stroke_width=1,stroke_fill='white')
marked.save(folder/'pantry-east-edge-grid.png')
