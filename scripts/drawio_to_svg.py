#!/usr/bin/env python3
import xml.etree.ElementTree as ET
from html import escape
import sys

IN_PATH = "public/system_architecture.drawio"
OUT_PATH = "public/system_architecture.svg"

def parse_drawio(path):
    tree = ET.parse(path)
    root = tree.getroot()
    mx = root.find('.//mxGraphModel')
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

def style_to_colors(style):
    parts = style.split(';')
    fill = '#ffffff'
    stroke = '#000000'
    for p in parts:
        if p.startswith('fillColor='):
            fill = p.split('=',1)[1]
        if p.startswith('strokeColor='):
            stroke = p.split('=',1)[1]
    return fill, stroke

def render_svg(cells, out_path):
    minx = min((c['x'] for c in cells), default=0)
    miny = min((c['y'] for c in cells), default=0)
    maxx = max((c['x']+c['w'] for c in cells), default=800)
    maxy = max((c['y']+c['h'] for c in cells), default=600)
    width = maxx - minx + 40
    height = maxy - miny + 40
    lines = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{int(width)}" height="{int(height)}" viewBox="{int(minx-20)} {int(miny-20)} {int(width)} {int(height)}">']
    lines.append('<style>text{font-family: Arial, Helvetica, sans-serif; font-size:14px;}</style>')
    for c in cells:
        fill, stroke = style_to_colors(c['style'])
        shape = 'rect'
        if 'ellipse' in c['style']:
            shape = 'ellipse'
        if shape == 'rect':
            lines.append(f'<rect x="{c["x"]}" y="{c["y"]}" width="{c["w"]}" height="{c["h"]}" rx="8" ry="8" fill="{fill}" stroke="{stroke}" stroke-width="1.5"/>')
            lines.append(f'<text x="{c["x"]+c["w"]/2}" y="{c["y"]+c["h"]/2 +5}" text-anchor="middle" fill="#111">{escape(c["value"])}</text>')
        else:
            cx = c['x'] + c['w']/2
            cy = c['y'] + c['h']/2
            rx = c['w']/2
            ry = c['h']/2
            lines.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{fill}" stroke="{stroke}" stroke-width="1.5"/>')
            lines.append(f'<text x="{cx}" y="{cy+5}" text-anchor="middle" fill="#111">{escape(c["value"])}</text>')
    lines.append('</svg>')
    with open(out_path,'w',encoding='utf-8') as f:
        f.write('\n'.join(lines))

def main():
    try:
        cells = parse_drawio(IN_PATH)
    except Exception as e:
        print('Failed to parse drawio:', e, file=sys.stderr)
        sys.exit(1)
    render_svg(cells, OUT_PATH)
    print('Wrote', OUT_PATH)

if __name__ == '__main__':
    main()
