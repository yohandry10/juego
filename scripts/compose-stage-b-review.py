from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'design/etapa-b'
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',22)
for width in [1440,390]:
    screens=['despacho','inicio-mapa','tarjetas-cargo','carta-decision','congreso','prensa']
    tile_width=720 if width==1440 else 390
    tile_height=480 if width==1440 else 960
    columns=2 if width==1440 else 3
    rows=(len(screens)+columns-1)//columns
    sheet=Image.new('RGB',(columns*tile_width,rows*(tile_height+36)), '#101C18')
    draw=ImageDraw.Draw(sheet)
    for index,name in enumerate(screens):
        img=Image.open(OUT/'capturas'/f'{name}-{width}.png').convert('RGB').resize((tile_width,tile_height),Image.Resampling.LANCZOS)
        x=(index%columns)*tile_width;y=(index//columns)*(tile_height+36)
        draw.text((x+12,y+6),f'{name} · {width} px',font=font,fill='#F4EAD3')
        sheet.paste(img,(x,y+36))
    sheet.save(OUT/f'revision-{width}.jpg',quality=91)

moods=['dia','noche','crisis']
sheet=Image.new('RGB',(900,len(moods)*636),'#101C18')
draw=ImageDraw.Draw(sheet)
for index,mood in enumerate(moods):
    img=Image.open(OUT/'capturas'/f'despacho-{mood}-1440.png').convert('RGB').resize((900,600),Image.Resampling.LANCZOS)
    draw.text((12,index*636+6),f'Atmósfera {mood} · componente real en /ui-kit',font=font,fill='#F4EAD3')
    sheet.paste(img,(0,index*636+36))
sheet.save(OUT/'atmosferas.jpg',quality=91)
print('Three review contact sheets created from real application captures.')
