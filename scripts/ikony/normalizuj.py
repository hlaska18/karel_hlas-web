"""Ořízne vygenerovanou ikonu na obrys, smaže téměř průhledný šum (alfa < 8)
a drobné zbytky, a vycentruje ji na plátno 512 × 512 (delší strana 90 %).

Použití: python3 scripts/ikony/normalizuj.py stazena.png public/images/subjects/nazev.png
Optické vyrovnání (vyrovnej) pak jemně zmenší ikony, které zabírají moc plochy.
Postup a zadání: scripts/ikony/README.md
"""
import sys
from PIL import Image
import numpy as np
from scipy import ndimage
def normalizuj(src, dst, N=512, podil=0.90):
    im=np.array(Image.open(src).convert('RGBA')).astype(np.uint8)
    a=im[:,:,3].copy(); a[a<8]=0
    lab,k=ndimage.label(a>40)
    sizes=ndimage.sum(np.ones_like(a),lab,range(1,k+1)); big=max(sizes)
    keep=np.isin(lab,[i+1 for i,s in enumerate(sizes) if s>big*0.002])
    keep=ndimage.binary_dilation(keep,iterations=6)
    im[:,:,3]=np.where(keep,a,0); im[im[:,:,3]==0]=0
    out=Image.fromarray(im); out=out.crop(out.getbbox())
    M=int(N*podil); sc=M/max(out.size)
    out=out.resize((max(1,round(out.width*sc)),max(1,round(out.height*sc))),Image.LANCZOS)
    c=Image.new('RGBA',(N,N),(0,0,0,0)); c.alpha_composite(out,((N-out.width)//2,(N-out.height)//2))
    c.save(dst,optimize=True)
def vyrovnej(soubory, cil):
    """Poloviční korekce plochy: ikona s plochou nad `cil` se zmenší na (cil/plocha)^0,25.
    Zvětšovat nejde (delší strana už je na maximu). Předměty cil 0.40, témata 0.55."""
    for p in soubory:
        im=Image.open(p).convert('RGBA'); a=np.array(im)[:,:,3]
        k=min(1.0,(cil/(a>128).mean())**0.25)
        if k>0.99: continue
        obj=im.crop(im.getbbox())
        obj=obj.resize((round(obj.width*k),round(obj.height*k)),Image.LANCZOS)
        c=Image.new('RGBA',im.size,(0,0,0,0)); c.alpha_composite(obj,((im.width-obj.width)//2,(im.height-obj.height)//2))
        c.save(p,optimize=True)

if __name__=='__main__':
    normalizuj(sys.argv[1], sys.argv[2])
    vyrovnej([sys.argv[2]], 0.40 if '/subjects/' in sys.argv[2] else 0.55)
