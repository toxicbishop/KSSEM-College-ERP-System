#!/usr/bin/env python3
from xml.etree import ElementTree as ET
from PIL import Image, ImageDraw, ImageFont
import os

IN_PATH = "public/system_architecture.drawio"
SVG_PATH = "public/system_architecture.svg"
OUT_PATH = "public/system_architecture.png"

def parse_cells(path):
    tree = ET.parse(path)
    mx = tree.find('.//mxGraphModel')
    cells = []
    for cell in mx.findall('.//mxCell'):
        if cell.get('vertex') == '1':
            val = cell.get('value') or ''
            style = cell.get('style') or ''
            geom = cell.find('.//mxGeometry')
            if geom is None:
                continue
            x = float(geom.get('x') or 0)
            y = float(geom.get('y') or 0)
            w = float(geom.get('width') or 100)
            h = float(geom.get('height') or 40)
            cells.append({'x':x,'y':y,'w':w,'h':h,'style':style,'value':val})
    return cells

def style_colors(style):
    parts = style.split(';')
    fill = (255,255,255)
    stroke = (0,0,0)
    for p in parts:
        if p.startswith('fillColor='):
            c = p.split('=',1)[1]
            if c.startswith('#') and len(c)==7:
                fill = tuple(int(c[i:i+2],16) for i in (1,3,5))
        if p.startswith('strokeColor='):
            c = p.split('=',1)[1]
            if c.startswith('#') and len(c)==7:
                stroke = tuple(int(c[i:i+2],16) for i in (1,3,5))
    return fill, stroke

def render_png(cells, out_path):
    minx = min((c['x'] for c in cells), default=0)
    miny = min((c['y'] for c in cells), default=0)
    maxx = max((c['x']+c['w'] for c in cells), default=800)
    maxy = max((c['y']+c['h'] for c in cells), default=600)
    width = int(maxx - minx + 40)
    height = int(maxy - miny + 40)
    img = Image.new('RGB', (width, height), (250,250,250))
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype('arial.ttf', 14)
    except Exception:
        font = ImageFont.load_default()
    for c in cells:
        fill, stroke = style_colors(c['style'])
        x = int(c['x'] - minx + 20)
        y = int(c['y'] - miny + 20)
        w = int(c['w'])
        h = int(c['h'])
        if 'ellipse' in c['style']:
            bbox = [x, y, x+w, y+h]
            draw.ellipse(bbox, fill=fill, outline=stroke)
            bbox = draw.textbbox((0,0), c['value'], font=font)
            tw = bbox[2] - bbox[0]
            th = bbox[3] - bbox[1]
            draw.text((x + w/2 - tw/2, y + h/2 - th/2), c['value'], fill=(17,17,17), font=font)
        else:
            draw.rounded_rectangle([x, y, x+w, y+h], radius=8, fill=fill, outline=stroke)
            bbox = draw.textbbox((0,0), c['value'], font=font)
            tw = bbox[2] - bbox[0]
            th = bbox[3] - bbox[1]
            draw.text((x + w/2 - tw/2, y + h/2 - th/2), c['value'], fill=(17,17,17), font=font)
    img.save(out_path)

def main():
    if not os.path.exists(IN_PATH):
        print('DrawIO file not found at', IN_PATH)
        return
    cells = parse_cells(IN_PATH)
    render_png(cells, OUT_PATH)
    print('Wrote', OUT_PATH)

if __name__ == '__main__':
    main()
