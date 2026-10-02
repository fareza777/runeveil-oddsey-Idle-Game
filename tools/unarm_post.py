import os
from PIL import Image, ImageDraw
LIST=[('Character_01','pack/battlers/Character_01'),('Character_02','pack/battlers/Character_02'),('Character_04','pack/battlers/Character_04'),('BlackMagusA','pack/battlers/BlackMagusA'),('Character_03','pack/battlers/Character_03'),('vex','gen/heroes/vex'),('thessaly','gen/heroes/thessaly')]
os.makedirs('public/assets/gen/heroes_work',exist_ok=True)
rows=[]
for name,src in LIST:
    orig=Image.open('public/assets/'+src+'.png').convert('RGBA')
    im=Image.open(f'qa/unarm/{name}_raw.png').convert('RGBA')
    w,h=im.size
    for p in ((0,0),(w-1,0),(0,h-1),(w-1,h-1),(w//2,0),(w//2,h-1),(0,h//2),(w-1,h//2)):
        if im.getpixel(p)[3]!=0: ImageDraw.floodfill(im,p,(0,0,0,0),thresh=42)
    if name=='BlackMagusA':
        bgc=im.getpixel((5,5))
        px=im.load()
        for yy in range(h):
            for xx in range(w):
                q=px[xx,yy]
                if (abs(q[0]-bgc[0])+abs(q[1]-bgc[1])+abs(q[2]-bgc[2])<50) or (q[0]>95 and q[1]>q[0]+12 and q[1]>q[2]+10 and q[1]>140): px[xx,yy]=(0,0,0,0)
    al=im.getchannel('A').point(lambda v:255 if v>128 else 0)
    bb=al.getbbox(); im.putalpha(al); im=im.crop(bb)
    ob=orig.getbbox(); th=ob[3]-ob[1]
    tw=max(1,round(im.width*th/im.height))
    small=im.resize((tw,th),Image.BOX)
    small.putalpha(small.getchannel('A').point(lambda v:255 if v>110 else 0))
    cv=Image.new('RGBA',orig.size,(0,0,0,0)); cv.paste(small,((ob[0]+ob[2]-tw)//2,ob[3]-th),small); cv.save(f'public/assets/gen/heroes_work/{name}.png')
    rows.append((orig.crop(ob),small))
S=4
W=sum(max(o.width,s.width)*S+20 for o,s in rows); Hh=max(o.height for o,s in rows)*S*2+20
sheet=Image.new('RGBA',(W,Hh),(60,60,80,255)); x=0
for o,s in rows:
    for k,im in enumerate((o,s)):
        b=im.resize((im.width*S,im.height*S),Image.NEAREST); sheet.paste(b,(x,k*(Hh//2)),b)
    x+=max(o.width,s.width)*S+20
sheet.save('qa/unarm_sheet.png'); print(sheet.size)
