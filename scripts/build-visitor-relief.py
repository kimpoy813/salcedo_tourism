#!/usr/bin/env python3
"""Draw the guide's relief plate and orientation maps. Not a runtime dependency.

    python -m pip install numpy scipy Pillow contourpy
    python scripts/build-visitor-relief.py

Inputs, registration and licenses: docs/FIELD_MAP.md. Never synthesize terrain.
"""
import json
from pathlib import Path

import numpy as np
from scipy.interpolate import RectBivariateSpline
from contourpy import contour_generator
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/app/maps'
Z = np.loadtxt(ROOT / 'scripts/data/salcedo-elevation.txt')
assert Z.shape == (41, 39)
LON = 120.46041666666667 + np.arange(39) / 240
LAT = 17.03125 + np.arange(41) / 240
SURFACE = RectBivariateSpline(LAT, LON, Z)
FIELD = json.loads((OUT / 'salcedo-field.geojson').read_text())['features']
# Pixel-centre extents, not cell edges. Common bounds for the flat reference maps.
BOUNDS = (LON[0], LAT[0], LON[-1], LAT[-1])
PLATE = (120.493, 17.078, 120.592, 17.176)


def relief(bounds, size, engraved=False):
    """Tint by elevation; ink contours at 25 m intervals (100 m index contours)."""
    w, s, e, n = bounds
    W, H = size
    x, y = np.linspace(w, e, W), np.linspace(s, n, H)
    z = np.maximum(SURFACE(y, x)[::-1], 0)
    dy, dx = np.gradient(z, (n-s)*111200/H, (e-w)*106300/W)
    illumination = np.clip((dx - dy) * 1.8, -.52, .35) if engraved else np.clip((dx - dy)*1.5, -.32, .22)
    heights = [0, 60, 180, 400, 750, 1250]
    paper = [[234,231,201], [218,219,183], [185,201,163], [147,177,143], [102,147,119], [83,122,105]]
    rgb = np.stack([np.interp(z, heights, np.array(paper)[:, i]) for i in range(3)], axis=-1)
    rgb += illumination[..., None] * (110 if engraved else 84)
    im = Image.fromarray(np.uint8(rgb.clip(0,255)))
    draw = ImageDraw.Draw(im, 'RGBA')
    # Contours are generalized from the sampled surface, not measured trail elevations.
    curves = contour_generator(z=z[::3, ::3])
    for level in range(25, int(z.max()), 25):
        for line in curves.lines(level):
            draw.line(list(map(tuple, line * 3)), fill=(57, 79, 53, 100 if level % 100 == 0 else 55), width=2 if level % 100 == 0 and engraved else 1)
    return im, z


def drape(im, bounds):
    """Registered hydrography and public roads, from the same local extract as Leaflet."""
    w, s, e, n = bounds
    W, H = im.size
    draw = ImageDraw.Draw(im, 'RGBA')
    def coords(part): return [((x-w)/(e-w)*(W-1), (n-y)/(n-s)*(H-1)) for x, y in part]
    for kind, color, thick in [('water','#83b7b7',1),('stream','#89b5b0',1),('river','#538f99',3),('street','#f9f5de',1),('highway','#fff5d6',3)]:
        for f in FIELD:
            if f['properties']['kind'] != kind: continue
            geom = f['geometry']
            if kind == 'water':
                parts = [geom['coordinates']] if geom['type']=='Polygon' else geom['coordinates']
                for poly in parts: draw.polygon(coords(poly[0]), fill=color)
            else:
                parts = [geom['coordinates']] if geom['type']=='LineString' else geom['coordinates']
                for part in parts: draw.line(coords(part), fill=color, width=thick)
    return im


def draw_block():
    # Oblique view from the southwest. Heights enlarged for legibility. The cut
    # surfaces run to a common zero datum; they do not represent geology.
    W, H = 790, 650
    texture, z = relief(PLATE, (W,H), True)
    tex = np.asarray(drape(texture, PLATE))
    us, vs = np.meshgrid(np.linspace(0,1,W), np.linspace(1,0,H))
    def project(u,v,height): return 158+455*u-142*v, 356-76*u-156*v-height*.127
    def anchor(lng,lat):
        w,s,e,n = PLATE
        return project((lng-w)/(e-w), (lat-s)/(n-s), SURFACE.ev(lat,lng))
    scale = 2.25
    view = Image.new('RGBA', (int(640*scale), int(394*scale)), (249,248,241,0))
    draw = ImageDraw.Draw(view)
    X,Y = project(us,vs,z)
    X,Y = (X*scale).round().astype(int), (Y*scale).round().astype(int)
    for i in range(H-1):
        for j in range(W-2,-1,-1):
            draw.polygon([(X[i,j],Y[i,j]),(X[i,j+1],Y[i,j+1]),(X[i+1,j+1],Y[i+1,j+1]),(X[i+1,j],Y[i+1,j])], fill=tuple(tex[i,j]))
    # Exposed west and south edges, in two distinct print tones.
    for xs,ys,bases,color in [(X[:,0],Y[:,0],project(us[:,0],vs[:,0],0)[1], '#afad94'),(X[-1,:],Y[-1,:],project(us[-1,:],vs[-1,:],0)[1], '#c6c2a9')]:
        bottom = (bases+4)*scale
        draw.polygon([*zip(xs,ys), *zip(xs[::-1],bottom[::-1])], fill=color)
        for i in range(0,len(xs),5):
            draw.line([(xs[i],ys[i]),(xs[i],bottom[i])], fill='#aaa98f', width=1)
    view.save(OUT/'valley-plate.webp', quality=93, method=6)
    # Named annotations in HomeHero use this viewBox (640 x 394).
    for label,lng,lat in [('Town plaza',120.536,17.1508),('Madarang',120.578,17.1587),('Baluarte Falls',120.5262,17.0958)]:
        print(label,tuple(round(a,1) for a in anchor(lng,lat)))


if __name__ == '__main__':
    background, _ = relief(BOUNDS, (1024,1128))
    # So a zoomed-out atlas doesn't acquire a hard rectangular edge at the
    # sample limit. No extrapolation outside the source grid.
    h, w = background.height, background.width
    iy, ix = np.mgrid[:h, :w]
    edge = np.minimum.reduce([ix, iy, w-1-ix, h-1-iy])
    overlay = background.copy()
    overlay.putalpha(Image.fromarray(np.uint8(np.clip(edge / 64, 0, 1) * 255)))
    overlay.save(OUT/'salcedo-relief.webp', quality=88, method=6)
    drape(background, BOUNDS).save(OUT/'salcedo-locator.webp', quality=91, method=6)
    draw_block()
