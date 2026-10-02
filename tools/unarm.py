import os, sys, io, time, base64, requests
from PIL import Image
TOKEN=os.environ['REPLICATE_API_TOKEN']
H={"Authorization":f"Bearer {TOKEN}","Prefer":"wait=60"}
name=sys.argv[1]; src=sys.argv[2]; desc=sys.argv[3]
im=Image.open(src).convert('RGBA')
S=8
bg=Image.new('RGBA',(im.width*S+80,im.height*S+80),(128,168,128,255))
big=im.resize((im.width*S,im.height*S),Image.NEAREST)
bg.paste(big,(40,40),big)
buf=io.BytesIO(); bg.convert('RGB').save(buf,'PNG')
uri='data:image/png;base64,'+base64.b64encode(buf.getvalue()).decode()
prompt=f"Edit this pixel art character: remove the weapon completely. Both hands are empty and relaxed, no sword, no bow, no axe, no staff, no shield, no wand. Keep the same character, hair, outfit, colors, pose and pixel art style exactly. {desc} Plain flat green background."
r=requests.post("https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions",headers=H,json={"input":{"prompt":prompt,"input_image":uri,"output_format":"png","safety_tolerance":2}},timeout=120)
print(r.status_code, r.text[:300])
j=r.json()
while j.get('status') not in ('succeeded','failed','canceled'):
    time.sleep(2); j=requests.get(j['urls']['get'],headers=H).json()
print(j['status'], j.get('error'))
out=j['output']; out=out if isinstance(out,str) else out[0]
open(f'qa/unarm/{name}_raw.png','wb').write(requests.get(out).content)
