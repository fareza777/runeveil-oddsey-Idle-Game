import os, sys, io, time, base64, requests, concurrent.futures as cf
from PIL import Image, ImageDraw
TOKEN=os.environ['REPLICATE_API_TOKEN']
H={"Authorization":f"Bearer {TOKEN}","Prefer":"wait=60"}
HEROES=[
 ('Character_01','pack/battlers/Character_01','He is a young man with spiky orange hair and a blue headband.'),
 ('Character_02','pack/battlers/Character_02','She is an elf woman with long pale cyan hair and a green dress.'),
 ('Character_04','pack/battlers/Character_04','He is a green-haired man in dark armor with orange trim and a grey cape.'),
 ('BlackMagusA','pack/battlers/BlackMagusA','It is a hooded mage in a dark green cloak with glowing yellow eyes, with blue lightning energy at the feet.'),
 ('Character_03','pack/battlers/Character_03','He is a young knight with purple hair, white armor and a purple cape.'),
 ('vex','gen/heroes/vex','She is a hooded rogue in a dark purple cloak with pale skin.'),
 ('thessaly','gen/heroes/thessaly','She is a woman with very long glowing cyan hair, a white dress and a blue flame floating above her.'),
]
def one(t):
    name,src,desc=t
    out=f'qa/unarm/{name}_raw.png'
    if os.path.exists(out): return name+' skip'
    im=Image.open('public/assets/'+src+'.png').convert('RGBA')
    S=max(2,int(640/max(im.size)))
    bg=Image.new('RGBA',(im.width*S+80,im.height*S+80),(128,168,128,255))
    big=im.resize((im.width*S,im.height*S),Image.NEAREST); bg.paste(big,(40,40),big)
    buf=io.BytesIO(); bg.convert('RGB').save(buf,'PNG')
    uri='data:image/png;base64,'+base64.b64encode(buf.getvalue()).decode()
    prompt=f"Edit this pixel art character: remove every weapon and held item completely. Both hands are empty and relaxed, no sword, no bow, no axe, no staff, no shield, no wand, no dagger. Keep the same character, hair, outfit, colors, pose and chunky pixel art style exactly. {desc} Plain flat green background."
    for attempt in range(3):
        r=requests.post("https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions",headers=H,json={"input":{"prompt":prompt,"input_image":uri,"output_format":"png","safety_tolerance":2}},timeout=120)
        j=r.json()
        if 'urls' not in j: time.sleep(5); continue
        while j.get('status') not in ('succeeded','failed','canceled'):
            time.sleep(2); j=requests.get(j['urls']['get'],headers=H).json()
        if j['status']=='succeeded':
            o=j['output']; o=o if isinstance(o,str) else o[0]
            open(out,'wb').write(requests.get(o).content); return name+' ok'
    return name+' FAIL'
with cf.ThreadPoolExecutor(4) as ex:
    for r in ex.map(one,HEROES): print(r,flush=True)
