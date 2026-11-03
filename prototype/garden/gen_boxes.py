"""The About page's desk plate, approach (c): the desk built in code as boxes and cylinders in
millimetres, rendered by a tiny software renderer (perspective, z-buffer, a fixed sun) into the woodcut
look: Bayer-dithered tone in each part's garden colour, cross-hatched shade, crisp outlines, and an id
buffer for picking. Writes AboutDeskBoxes."""
from gen_garden2 import (JS_BASE, nav, FOOTER, PAGE_CSS, MONO, SERIF, INK, MUTED, CANOPY, RIVER,
                         FERN, MOSS, MANGO, HIBISCUS, ORCHID, LAGOON, EARTH, BARK)

PW, PH = 1032, 600          # the plate in css px
CELL = 3                    # one buffer cell is 3 css px

JS = r'''
  // ================================================================ the model
  // Every part is a few boxes and cylinders in millimetres, in its parent's frame. The tower's parts
  // are authored in the case's corner frame: x 0 (open side) .. 215 (motherboard side), y up from the
  // floor, z 0 (front) .. -447 (back). Each part has a slide (where a click moves it) and an ex (where
  // the exploded view moves it), both along its own axis in its parent's frame.
  model() {
    if (this._m) return this._m;
    const parts = [], by = {};
    const part = (key, o) => {
      const p = Object.assign({ key, prims: [], parent: null, origin: [0, 0, 0], rot: 0, slide: [0, 0, 0], ex: [0, 0, 0], tone: 0.3, pick: true, col: '#1F2B23' }, o);
      p.i = parts.length; parts.push(p); by[key] = p; return p;
    };
    const box = (p, a, b, o) => p.prims.push(Object.assign({ t: 'box', a, b }, o || {}));
    const cyl = (p, axis, c, r, l0, l1, o) => p.prims.push(Object.assign({ t: 'cyl', axis, c, r, l0, l1, n: 20 }, o || {}));
    const TO = [-107.5, 0, 223.5];

    const desk = part('desk', { pick: false, col: '#A88B6A', tone: 0.02 });
    box(desk, [-820, -40, -540], [860, 0, 340], { tex: { py: 'wood', pz: 'edge' } });

    part('tower', { pick: false, origin: [-500, 0, 60] });

    // The case: walls round an open left side, a shroud over the PSU, a mesh top.
    const cs = part('case', { parent: 'tower', origin: TO, col: '#1F2B23', tone: 0.22, hatch: true });
    for (const [x, z] of [[10, -40], [175, -40], [10, -437], [175, -437]]) box(cs, [x, 0, z], [x + 30, 12, z + 30]);
    box(cs, [0, 12, -447], [215, 20, 0]);
    box(cs, [0, 461, -447], [215, 469, 0], { tex: { py: 'mesh' }, ex: [0, 120, 0] });
    box(cs, [207, 20, -447], [215, 461, -22], { ex: [170, 0, 0] });
    box(cs, [0, 20, -447], [207, 461, -439], { ex: [0, 0, -150] });
    box(cs, [0, 12, -22], [8, 469, 0]);
    box(cs, [207, 12, -22], [215, 469, 0], { ex: [170, 0, 0] });
    box(cs, [8, 12, -22], [207, 26, 0]);
    box(cs, [8, 455, -22], [207, 469, 0], { ex: [0, 120, 0] });
    box(cs, [8, 108, -439], [207, 114, -22]);

    // The side panel, tinted glass: drawn as a screen door, so the inside shows through it.
    const sp = part('panel', { parent: 'tower', origin: TO, col: '#1F2B23', tone: 0.62, hatch: true });
    box(sp, [-5, 13, -446], [0, 468, -1], { tex: { nx: 'glass', px: 'glass', py: 'glass', ny: 'glass', pz: 'glass', nz: 'glass' } });

    // The walnut front: a dark mesh behind thirteen slats.
    const fr = part('front', { parent: 'tower', origin: TO, col: '#7A5C42', tone: 0.18, soft: true, slide: [0, 0, 150], ex: [90, 0, 230] });
    box(fr, [8, 26, -20], [207, 455, -14], { tex: { pz: 'mesh' } });
    for (let i = 0; i < 10; i++) { const x = 10 + i * 19.8; box(fr, [x, 30, -14], [x + 14.5, 451, 0], { tex: { pz: 'grain' } }); }

    // The cooler's radiator at the front, its two fans pushing through it.
    const rad = part('radiator', { parent: 'tower', origin: TO, col: '#A87400', tone: 0.3, slide: [-230, 0, 0], ex: [-110, 20, 190] });
    box(rad, [36, 112, -84], [179, 427, -56], { tex: { nx: 'fins', px: 'fins' } });
    box(rad, [37.5, 128, -56], [177.5, 268, -31], { tex: { pz: 'fan', nz: 'fan', nx: 'fanside' }, ex: [0, 0, 70] });
    box(rad, [37.5, 270, -56], [177.5, 410, -31], { tex: { pz: 'fan', nz: 'fan', nx: 'fanside' }, ex: [0, 0, 70] });

    const psu = part('psu', { parent: 'tower', origin: TO, col: '#5C4636', tone: 0.38, slide: [-200, 0, 0], ex: [-210, 0, 0] });
    box(psu, [32, 21, -438], [182, 107, -278], { tex: { nx: 'psu' } });

    // The motherboard carries the CPU (which carries the pump), the RAM, the SSD and the GPU.
    const mb = part('mobo', { parent: 'tower', origin: TO, col: '#5E8E4A', tone: 0.3, slide: [-50, 0, 0], ex: [90, 0, 0] });
    box(mb, [192, 134, -431], [196, 439, -187], { tex: { nx: 'pcb' } });
    box(mb, [174, 322, -430], [192, 437, -402]);
    box(mb, [178, 414, -402], [192, 434, -330]);
    box(mb, [184, 150, -262], [192, 196, -206]);

    const cpu = part('cpu', { parent: 'mobo', col: '#B5476E', tone: 0.2, slide: [-70, 0, 0], ex: [-80, 0, 0] });
    box(cpu, [186, 344, -330], [192, 384, -290], { tex: { nx: 'ihs' } });
    const pump = part('pump', { parent: 'cpu', col: '#A87400', tone: 0.34, slide: [-110, 0, 0], ex: [-130, 0, 0] });
    cyl(pump, 'x', [0, 364, -310], 39, 142, 186, { tex: { cap0: 'pump' } });

    const ram = part('ram', { parent: 'mobo', col: '#8A4F98', tone: 0.3, slide: [-90, 0, 0], ex: [-110, 0, 0] });
    box(ram, [158, 300, -254], [192, 433, -247], { tex: { nz: 'ram', pz: 'ram' } });
    box(ram, [158, 300, -238], [192, 433, -231], { tex: { nz: 'ram', pz: 'ram' } });

    const ssd = part('ssd', { parent: 'mobo', col: '#1D5A8F', tone: 0.3, slide: [-60, 0, 0], ex: [-60, 0, 0] });
    box(ssd, [188.5, 262, -334], [192, 284, -254], { tex: { nx: 'ssd' } });

    const gpu = part('gpu', { parent: 'mobo', col: '#2A7099', tone: 0.32, slide: [-170, 0, 0], ex: [-210, -10, 0] });
    box(gpu, [76, 202, -440], [192, 250, -137], { tex: { nx: 'gpuedge', ny: 'gpufans', py: 'plate' } });
    box(gpu, [76, 250, -440], [192, 254, -139]);

    // The monitor: a 34-inch panel on an 1500R curve, in eleven segments, on its stand.
    const mon = part('monitor', { origin: [190, 0, -330], col: '#2B7349', body: '#1F2B23', tone: 0.3, hatch: true, slide: [0, 0, 90] });
    box(mon, [-150, 0, -140], [150, 10, 70]);
    box(mon, [-32, 10, -128], [32, 300, -100]);
    box(mon, [-170, 180, -100], [170, 330, -52]);
    const R = 1500, half = 403, N = 11, ang = half / R;
    for (let i = 0; i < N; i++) {
      const th = -ang + (2 * ang) * (i + 0.5) / N, cw = 2 * R * Math.sin(ang / N) + 1.5;
      box(mon, [-cw / 2, 0, -24], [cw / 2, 360, 0], { ry: -th, at: [R * Math.sin(th), 112, R * (1 - Math.cos(th))], grp: 'scr', uOff: i * (cw - 1.5), uTot: N * (cw - 1.5), tex: { pz: 'screen' } });
    }

    // The ThinkPad, open at an easy angle.
    const lap = part('laptop', { origin: [560, 0, 120], rot: -0.32, col: '#C24E39', body: '#1F2B23', tone: 0.3, hatch: true, slide: [0, 0, 90] });
    box(lap, [-164, 0, -113], [164, 18, 113], { tex: { py: 'keys' } });
    box(lap, [-164, 0, -6], [164, 215, 0], { rx: -0.3, at: [0, 18, -110], tex: { pz: 'lapscreen' } });

    // Polygons, built once in each part's frame. Faces in one smoothing group share an outline id.
    let gid = 0;
    const groups = {};
    const rot = (p, pr) => {
      let [x, y, z] = p;
      if (pr.rx) { const c = Math.cos(pr.rx), s = Math.sin(pr.rx); [y, z] = [y * c - z * s, y * s + z * c]; }
      if (pr.ry) { const c = Math.cos(pr.ry), s = Math.sin(pr.ry); [x, z] = [x * c + z * s, -x * s + z * c]; }
      const at = pr.at || [0, 0, 0];
      return [x + at[0], y + at[1], z + at[2]];
    };
    const nrot = (n, pr) => { const a = rot(n, Object.assign({}, pr, { at: null })); return a; };
    for (const p of parts) {
      p.polys = [];
      for (const pr of p.prims) {
        const tex = pr.tex || {}, ex = pr.ex || [0, 0, 0];
        const add = (pts, uv, n, face, w, h, smooth) => {
          let g;
          if (smooth || pr.grp) { const k = p.key + ':' + (pr.grp || '') + ':' + face + ':' + (smooth ? p.prims.indexOf(pr) : ''); g = groups[k] === undefined ? (groups[k] = gid++) : groups[k]; }
          else g = gid++;
          p.polys.push({ p: pts.map((q) => rot(q, pr)), uv, n: nrot(n, pr), tag: tex[face] || null, w, h, g, ex });
        };
        if (pr.t === 'box') {
          const a = pr.a, b = pr.b, uo = pr.uOff || 0;
          // [face, fixed axis, value, u axis, v axis, normal sign]
          for (const [face, k, val, ua, va, sg] of [['px', 0, b[0], 2, 1, 1], ['nx', 0, a[0], 2, 1, -1], ['py', 1, b[1], 0, 2, 1], ['ny', 1, a[1], 0, 2, -1], ['pz', 2, b[2], 0, 1, 1], ['nz', 2, a[2], 0, 1, -1]]) {
            const corner = (ui, vi) => { const q = [0, 0, 0]; q[k] = val; q[ua] = ui ? b[ua] : a[ua]; q[va] = vi ? b[va] : a[va]; return q; };
            const n = [0, 0, 0]; n[k] = sg;
            const w = b[ua] - a[ua], h = b[va] - a[va];
            add([corner(0, 0), corner(1, 0), corner(1, 1), corner(0, 1)], [[uo, 0], [uo + w, 0], [uo + w, h], [uo, h]], n, face, pr.uTot || w, h);
          }
        } else {
          // A cylinder along x, y or z: two caps and a smooth side.
          const ax = { x: 0, y: 1, z: 2 }[pr.axis], o1 = (ax + 1) % 3, o2 = (ax + 2) % 3, n = pr.n, r = pr.r;
          const at = (l, k) => { const q = pr.c.slice(); q[ax] = l; q[o1] += r * Math.cos(2 * Math.PI * k / n); q[o2] += r * Math.sin(2 * Math.PI * k / n); return q; };
          for (const [l, s, face] of [[pr.l0, -1, 'cap0'], [pr.l1, 1, 'cap1']]) {
            const pts = [], uv = [];
            for (let k = 0; k < n; k++) { pts.push(at(l, k)); uv.push([r + r * Math.cos(2 * Math.PI * k / n), r + r * Math.sin(2 * Math.PI * k / n)]); }
            const nn = [0, 0, 0]; nn[ax] = s;
            add(pts, uv, nn, face, 2 * r, 2 * r, false);
          }
          for (let k = 0; k < n; k++) {
            const nn = [0, 0, 0], m = (k + 0.5) / n * 2 * Math.PI; nn[o1] = Math.cos(m); nn[o2] = Math.sin(m);
            add([at(pr.l0, k), at(pr.l0, k + 1), at(pr.l1, k + 1), at(pr.l1, k)], [[0, 0], [1, 0], [1, 1], [0, 1]], nn, 'side', 1, 1, true);
          }
        }
      }
    }
    this._m = { parts, by };
    return this._m;
  }

  // ================================================================ textures
  // A face's marks, from its tag and its (u, v) in mm. 0 none, 1 dark, 2 paper, 3 the part's accent,
  // 4 a hole (nothing drawn, so what is behind shows), 10+k a fixed colour from FIX.
  tex(tag, u, v, w, h, x, y) {
    const B = this._B;
    switch (tag) {
      case 'glass': return B[(y & 3) * 4 + (x & 3)] < 9 ? 4 : ((x + y * 2) % 23 === 0 ? 2 : 0);
      case 'mesh': return (u % 9 < 4 && v % 9 < 4) ? 1 : 0;
      case 'grain': { if (u < 3.2) return 1; const g = Math.sin(v * 0.035 + u * 0.9) + Math.sin(v * 0.11 + u * 2.1) * 0.5; return g > 1.38 ? 1 : 0; }
      case 'wood': { const g = Math.sin(v * 0.06 + Math.sin(u * 0.004) * 4) + 0.6 * Math.sin(u * 0.013 + v * 0.02); return g > 1.3 && (x & 1) ? 1 : 0; }
      case 'edge': return 0;
      case 'fins': return (Math.floor(v / 9) % 2 === 0) ? 1 : 0;
      case 'fanside': return (v > 4 && v < 136 && u > 4 && u < 21) ? 1 : 0;
      case 'fan': {
        const r = Math.hypot(u - 70, v - 70);
        if (r > 67) return 0;
        if (r > 62) return 1;
        if (r < 16) return r > 13 ? 1 : 0;
        const a = Math.atan2(v - 70, u - 70) + r * 0.022, k = ((a / (2 * Math.PI) * 7) % 1 + 1) % 1;
        return k < 0.2 ? 1 : 2;
      }
      case 'psu': return (u > 40 && u < 120 && v > 26 && v < 62) ? ((Math.floor(v) % 9 < 2 && u > 50 && u < 110) ? 1 : 2) : 0;
      case 'pcb': {
        if ((Math.floor(u / 23) + Math.floor(v / 31)) % 5 === 0 && Math.floor(v) % 6 < 2) return 1;
        return (Math.floor(u) % 41 < 2 && Math.floor(v / 40) % 2 === 0) ? 1 : 0;
      }
      case 'ihs': return (u > 8 && u < 32 && v > 8 && v < 32) ? 2 : 0;
      case 'pump': { const r = Math.hypot(u - 39, v - 39); return r < 25 ? (r > 21 ? 2 : (r < 5 ? 3 : 1)) : (r > 35 ? 1 : 0); }
      case 'ram': return (u > 12 && u < 60 && v > 6 && v < 26) ? 2 : (Math.abs((u - 80) - (v - 17) * 0.8) < 3 ? 1 : 0);
      case 'ssd': return (u > 4 && u < 48) ? 2 : (Math.floor(u) % 9 < 3 ? 1 : 0);
      case 'gpuedge': return (u > 190 && u < 270 && v > 18 && v < 30) ? 2 : (u < 30 && v > 14 && v < 34 ? 1 : 0);
      case 'gpufans': { for (const c of [50, 151, 252]) { const r = Math.hypot(v - c, u - 58); if (r < 46) return r > 42 || r < 12 ? 1 : (((Math.atan2(v - c, u - 58) + r * 0.03) * 9 / 6.283) % 1 + 1) % 1 < 0.25 ? 1 : 2; } return 0; }
      case 'plate': return 0;
      case 'screen': return this.screenTex(u, v, w, h);
      case 'lapscreen': {
        if (u < 10 || u > w - 10 || v < 14 || v > h - 8) return 0;
        const row = Math.floor((h - 8 - v) / 13), r = (this._lap || (this._lap = Array.from({ length: 40 }, (_, k) => this.rng('lap' + k)())))[row % 40], len = 30 + r * 220, ind = (row % 4 === 0 ? 0 : 1 + (row % 3)) * 14;
        if ((h - 8 - v) % 13 > 6) return 10;
        return (u > 18 + ind && u < 18 + ind + len) ? (row % 5 === 0 ? 13 : 14) : 10;
      }
      case 'keys': {
        if (Math.hypot(u - 164, v - 104) < 6) return 3;
        if (v > 140 && v < 214 && u > 112 && u < 216) return (v < 143 || v > 211 || u < 115 || u > 213) ? 1 : 0;
        if (v > 129 && v < 137 && u > 112 && u < 216) return ((u > 131 && u < 134) || (u > 194 && u < 197)) ? 1 : 3;
        if (v < 18 || v > 126 || u < 20 || u > 308) return 0;
        const ku = (u - 20 + Math.floor((v - 18) / 18) * 6) % 18, kv = (v - 18) % 18;
        return (ku > 3 && ku < 15 && kv > 3 && kv < 15) ? 2 : 1;
      }
    }
    return 0;
  }

  // The monitor shows this site: sand, the nav, a title, lines of text and a flower.
  screenTex(u, v, w, h) {
    const m = 9;
    if (u < m || u > w - m || v < m + 6 || v > h - m) return 1;
    const x = u - m, y = h - m - v, W = w - 2 * m;
    if (y < 20) { if (y > 7 && y < 14) { if (x > 40 && x < 150) return 10; for (let k = 0; k < 6; k++) { const a = W - 330 + k * 52; if (x > a && x < a + 38) return 12; } } return 11; }
    if (y > 46 && y < 66 && x > 40 && x < 330) return 12;
    for (let k = 0; k < 7; k++) {
      const top = 90 + k * 26;
      if (y > top && y < top + 9) { const len = [520, 470, 500, 300, 510, 480, 260][k]; return (x > 40 && x < 40 + len) ? 15 : 11; }
    }
    const fx = W - 150, fy = 160, r = Math.hypot(x - fx, y - fy);
    if (r < 12) return 16;
    if (r < 48) { const a = Math.atan2(y - fy, x - fx), k = ((a / 6.283 * 7) % 1 + 1) % 1; if (Math.abs(k - 0.5) < 0.32 * (1 - r / 60)) return 13; }
    if (Math.abs(x - fx) < 3 && y > fy + 46 && y < fy + 120) return 14;
    return 11;
  }

  // ================================================================ the renderer
  dims() { return { W: ''' + str(PW // CELL) + r''', H: ''' + str(PH // CELL) + r''' }; }
  rgb(hex) { return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]; }
  mix(a, b, t) { return [0, 1, 2].map((i) => Math.round(a[i] * (1 - t) + b[i] * t)); }
  ease(t) { t = Math.max(0, Math.min(1, t)); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  // Part world matrices for a state: parents first, each part offset along its slide and ex.
  frames(st) {
    const M = this.model(), out = {};
    const mul = (A, B) => {
      const r = [];
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) r.push(A.r[i * 3] * B.r[j] + A.r[i * 3 + 1] * B.r[3 + j] + A.r[i * 3 + 2] * B.r[6 + j]);
      return { r, t: [0, 1, 2].map((i) => A.r[i * 3] * B.t[0] + A.r[i * 3 + 1] * B.t[1] + A.r[i * 3 + 2] * B.t[2] + A.t[i]) };
    };
    const I = { r: [1, 0, 0, 0, 1, 0, 0, 0, 1], t: [0, 0, 0] };
    const outs = st.outs || {}, exp = this.ease(st.exp || 0);
    const turn = -0.62 + 1.2 * this.ease(st.turn || 0);
    for (const p of M.parts) {
      const P = p.parent ? out[p.parent] : I;
      const o = this.ease(outs[p.key] || 0);
      const off = [0, 1, 2].map((i) => p.origin[i] + p.slide[i] * o + p.ex[i] * exp);
      if (p.key === 'panel') {
        const L = st.lift || 0, a = this.ease(Math.min(1, L * 2.2)), b = this.ease((L - 0.3) / 0.7);
        off[0] -= 80 * a; off[1] += 260 * b;
      }
      const a = p.key === 'tower' ? turn : p.rot, c = Math.cos(a), s = Math.sin(a);
      out[p.key] = mul(P, { r: [c, 0, s, 0, 1, 0, -s, 0, c], t: off });
    }
    return out;
  }

  camera(st) {
    const D = this.dims(), yaw = -0.58 + (st.dyaw || 0), el = 0.34 + (st.dpitch || 0);
    const T = [-60, 200, -10], dist = 4300;
    const C = [T[0] + dist * Math.sin(yaw) * Math.cos(el), T[1] + dist * Math.sin(el), T[2] + dist * Math.cos(yaw) * Math.cos(el)];
    const nz = (v) => { const l = Math.hypot(v[0], v[1], v[2]); return v.map((x) => x / l); };
    const F = nz([T[0] - C[0], T[1] - C[1], T[2] - C[2]]);
    const R = nz([-F[2], 0, F[0]]);
    const U = [R[1] * F[2] - R[2] * F[1], R[2] * F[0] - R[0] * F[2], R[0] * F[1] - R[1] * F[0]];
    return { C, F, R, U, f: 880, cx: D.W / 2, cy: D.H / 2 - 2 };
  }

  render(st) {
    const M = this.model(), D = this.dims(), W = D.W, H = D.H, N = W * H;
    const B = this._B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    const zb = new Float32Array(N).fill(1e9), pid = new Int16Array(N).fill(-1), gid = new Int32Array(N).fill(-1);
    const sh = new Float32Array(N), mk = new Uint8Array(N), ori = new Uint8Array(N), pol = new Int32Array(N).fill(-1), uu = new Float32Array(N), vv = new Float32Array(N);
    const plist = [];
    const fr = this.frames(st), cam = this.camera(st);
    const Ls = [-0.42, 0.74, 0.56], Ll = Math.hypot(...Ls), L = Ls.map((x) => x / Ll);
    const IN = 9;   // keep the drawing inside the plate's rules
    const tw = (Mx, q) => [0, 1, 2].map((i) => Mx.r[i * 3] * q[0] + Mx.r[i * 3 + 1] * q[1] + Mx.r[i * 3 + 2] * q[2] + Mx.t[i]);
    const tn = (Mx, n) => [0, 1, 2].map((i) => Mx.r[i * 3] * n[0] + Mx.r[i * 3 + 1] * n[1] + Mx.r[i * 3 + 2] * n[2]);
    const proj = (p) => {
      const d = [p[0] - cam.C[0], p[1] - cam.C[1], p[2] - cam.C[2]];
      const z = d[0] * cam.F[0] + d[1] * cam.F[1] + d[2] * cam.F[2];
      const x = d[0] * cam.R[0] + d[1] * cam.R[1] + d[2] * cam.R[2], y = d[0] * cam.U[0] + d[1] * cam.U[1] + d[2] * cam.U[2];
      return { x: cam.cx + cam.f * x / z, y: cam.cy - cam.f * y / z, z };
    };
    this._proj = proj; this._fr = fr;
    const exp = this.ease(st.exp || 0);
    const hide = { panel: (st.lift || 0) >= 0.999 };
    // The panel dissolves into the paper as it lifts: more of its cells fall away.
    const glassThr = 9 + Math.round(7 * this.ease(((st.lift || 0) - 0.3) / 0.7));

    // Shadow casters on the desk: each a box in its part's frame, with the sun turned into that frame.
    const casters = [['case', [0, 0, -447], [215, 469, 0]], ['monitor', [-180, 112, -60], [180, 472, 30]], ['monitor', [-32, 10, -128], [32, 300, -100]], ['laptop', [-164, 0, -113], [164, 18, 113]]]
      .map(([k, a, b]) => { const r = fr[k].r; return { r, t: fr[k].t, a, b, dl: [r[0] * L[0] + r[3] * L[1] + r[6] * L[2], r[1] * L[0] + r[4] * L[1] + r[7] * L[2], r[2] * L[0] + r[5] * L[1] + r[8] * L[2]] }; });
    const shadowed = (wx, wy, wz) => {
      for (const c of casters) {
        const r = c.r, dx = wx - c.t[0], dy = wy - c.t[1], dz = wz - c.t[2];
        const o0 = r[0] * dx + r[3] * dy + r[6] * dz, o1 = r[1] * dx + r[4] * dy + r[7] * dz, o2 = r[2] * dx + r[5] * dy + r[8] * dz;
        let t0 = 0, t1 = 1e9;
        for (let k = 0; k < 3; k++) {
          const o = k === 0 ? o0 : k === 1 ? o1 : o2, dl = c.dl[k];
          if (Math.abs(dl) < 1e-9) { if (o < c.a[k] || o > c.b[k]) { t0 = 2e9; break; } continue; }
          let ta = (c.a[k] - o) / dl, tb = (c.b[k] - o) / dl;
          if (ta > tb) { const q = ta; ta = tb; tb = q; }
          if (ta > t0) t0 = ta; if (tb < t1) t1 = tb;
          if (t0 > t1) break;
        }
        if (t0 <= t1) return true;
      }
      return false;
    };

    const tri = (A, Bv, Cv, poly, pk, o, shade, part) => {
      const area = (Bv.x - A.x) * (Cv.y - A.y) - (Bv.y - A.y) * (Cv.x - A.x);
      if (Math.abs(area) < 1e-6) return;
      const x0 = Math.max(IN, Math.floor(Math.min(A.x, Bv.x, Cv.x))), x1 = Math.min(W - 1 - IN, Math.ceil(Math.max(A.x, Bv.x, Cv.x)));
      const y0 = Math.max(IN, Math.floor(Math.min(A.y, Bv.y, Cv.y))), y1 = Math.min(H - 1 - IN, Math.ceil(Math.max(A.y, Bv.y, Cv.y)));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const px = x + 0.5, py = y + 0.5;
        const w0 = ((Bv.x - px) * (Cv.y - py) - (Bv.y - py) * (Cv.x - px)) / area;
        const w1 = ((Cv.x - px) * (A.y - py) - (Cv.y - py) * (A.x - px)) / area;
        const w2 = 1 - w0 - w1;
        if (w0 < -1e-4 || w1 < -1e-4 || w2 < -1e-4) continue;
        const iz = w0 * A.iz + w1 * Bv.iz + w2 * Cv.iz, z = 1 / iz, i = y * W + x;
        if (z >= zb[i]) continue;
        if (poly.glass && B[(y & 3) * 4 + (x & 3)] < glassThr) continue;
        if (poly.tag) { uu[i] = (w0 * A.uz + w1 * Bv.uz + w2 * Cv.uz) * z; vv[i] = (w0 * A.vz + w1 * Bv.vz + w2 * Cv.vz) * z; }
        pol[i] = pk;
        zb[i] = z; pid[i] = part; gid[i] = poly.g; sh[i] = shade; ori[i] = o;
      }
    };

    for (const p of M.parts) {
      if (!p.polys.length || hide[p.key]) continue;
      const Mx = fr[p.key];
      for (const poly of p.polys) {
        const ex = poly.ex, e = exp;
        const wpts = poly.p.map((q) => tw(Mx, [q[0] + ex[0] * e, q[1] + ex[1] * e, q[2] + ex[2] * e]));
        const n = tn(Mx, poly.n);
        const toCam = [cam.C[0] - wpts[0][0], cam.C[1] - wpts[0][1], cam.C[2] - wpts[0][2]];
        if (n[0] * toCam[0] + n[1] * toCam[1] + n[2] * toCam[2] <= 0) continue;
        const shade = 0.36 + 0.64 * Math.max(0, n[0] * L[0] + n[1] * L[1] + n[2] * L[2]);
        const vs = wpts.map((w, k) => { const q = proj(w); return { x: q.x, y: q.y, iz: 1 / q.z, uz: poly.uv[k][0] / q.z, vz: poly.uv[k][1] / q.z, w }; });
        if (vs.some((v) => v.iz <= 0)) continue;
        // Which way this face's hatching runs: level on tops, slanting with the face on the sides.
        const nu = n[0] * cam.U[0] + n[1] * cam.U[1] + n[2] * cam.U[2], nr = n[0] * cam.R[0] + n[1] * cam.R[1] + n[2] * cam.R[2];
        const o = Math.abs(nu) > 0.75 ? 0 : nr < 0 ? 1 : 2;
        poly.glass = poly.tag === 'glass'; plist.push(poly);
        for (let k = 1; k + 1 < vs.length; k++) tri(vs[0], vs[k], vs[k + 1], poly, plist.length - 1, o, shade, p.i);
      }
    }

    // The cooler's two hoses, from the pump to the radiator's top tank, as depth-tested strokes.
    const hose = (a, b, lift, off) => {
      const pa = tw(fr.pump, [150, 364 + off, -310 + off * 0.6]), pb = tw(fr.radiator, [110 + off, 427, -70]);
      const pc = [(pa[0] + pb[0]) / 2, Math.max(pa[1], pb[1]) + lift, (pa[2] + pb[2]) / 2];
      let last = null;
      for (let s = 0; s <= 160; s++) {
        const t = s / 160, q = [0, 1, 2].map((k) => (1 - t) * (1 - t) * pa[k] + 2 * (1 - t) * t * pc[k] + t * t * pb[k]);
        const P = proj(q), x = Math.round(P.x), y = Math.round(P.y);
        if (last === x + ',' + y) continue;
        last = x + ',' + y;
        for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
          const X = x + dx, Y = y + dy, i = Y * W + X;
          if (X < IN || Y < IN || X >= W - IN || Y >= H - IN || P.z >= zb[i] + 2) continue;
          zb[i] = P.z; pid[i] = M.by.pump.i; gid[i] = 900000; sh[i] = 0.5; mk[i] = (dx + dy) % 2 ? 0 : 1;
        }
      }
    };
    hose(0, 0, 40, 0); hose(0, 0, 55, 18);

    // Marks, now that only the visible face of each cell is left; the desk's shadows with them.
    const deskA = M.by.desk.prims[0].a;
    for (let i = 0; i < N; i++) {
      const k = pol[i];
      if (k < 0 || !plist[k].tag) continue;
      const poly = plist[k], x = i % W, y = (i / W) | 0;
      let m = this.tex(poly.tag, uu[i], vv[i], poly.w, poly.h, x, y);
      if (poly.tag === 'wood' && shadowed(uu[i] + deskA[0], 0, vv[i] + deskA[2])) m = m === 1 ? 1 : 5;
      mk[i] = m;
    }

    // Compose: tone from shade, ordered-dithered across four inks of the part's colour, cross-hatched
    // where it is darkest; marks on top; then outlines where faces meet.
    const sand = this.rgb('#F1ECDF'), ink = this.rgb('#1F2B23'), paper = this.rgb('#E6DECB');
    const FIX = ['#1F2B23', '#EFE8D6', '#2B7349', '#C24E39', '#3F8A52', '#A99D84', '#A87400', '#5E8E4A'].map((c) => this.rgb(c));
    const hot = st.hover || st.sel || null;
    const pals = M.parts.map((p) => {
      const on = p.key === hot, c = this.rgb(on || !p.body ? p.col : p.body);
      const dark = c[0] + c[1] + c[2] < 180, mid = dark ? this.mix(c, sand, 0.42) : c;
      const lt = this.mix(c, sand, on ? 0.45 : 0.68), tint = this.mix(c, sand, on ? 0.72 : 0.9), dk = dark ? c : this.mix(c, ink, on ? 0.3 : 0.55);
      return { ramp: [tint, lt, on || dark ? mid : this.mix(c, sand, 0.22), dk], line: on ? dk : this.mix(c, ink, 0.7), accent: p.key === 'laptop' ? this.rgb('#C24E39') : p.key === 'pump' ? this.rgb('#3F8A52') : c, on };
    });
    const img = new Uint8ClampedArray(N * 4);
    const put = (i, c) => { img[i * 4] = c[0]; img[i * 4 + 1] = c[1]; img[i * 4 + 2] = c[2]; img[i * 4 + 3] = 255; };
    const grain = this.rng('desk-paper');
    for (let i = 0; i < N; i++) put(i, sand);
    for (let k = 0; k < N * 0.012; k++) put(Math.floor(grain() * N), paper);
    const bbox = {};
    for (let i = 0; i < N; i++) {
      const p = pid[i];
      if (p < 0) continue;
      const x = i % W, y = (i / W) | 0, b = B[(y & 3) * 4 + (x & 3)], part = M.parts[p], P = pals[p];
      let t = part.tone + (1 - sh[i]) * 0.66;
      if (mk[i] === 5) t += 0.42;
      if (P.on) t = 0.12 + t * 0.62;
      t = Math.max(0, Math.min(0.999, t));
      const v = t * 3, base = Math.floor(v);
      let idx = Math.min(3, base + ((v - base) * 16 > b + 0.5 ? 1 : 0));
      // Cross-hatched shade: lines that run with the face (level on tops), crossed where darkest.
      const o = ori[i], ha = o === 0 ? y * 2 : o === 1 ? x + y : x - y + 4096, hc = o === 0 ? x + y : o === 1 ? x - y + 4096 : x + y;
      if (t > 0.56 && ha % 4 === 0) idx = 3;
      if (t > 0.76 && hc % 4 === 0) idx = 3;
      let c = P.ramp[idx];
      const m = mk[i];
      if (m === 1) c = P.ramp[3];
      else if (m === 2) c = P.on ? sand : P.ramp[0];
      else if (m === 3) c = P.accent;
      else if (m >= 10) c = FIX[m - 10];
      if (part.key === 'desk' && sh[i] > 0.8) c = m === 5 ? ((x + y) % 3 === 0 ? P.ramp[2] : (x - y + 4096) % 6 === 0 ? P.ramp[1] : sand) : m === 1 ? P.ramp[1] : sand;
      put(i, c);
      if (part.pick) {
        const bb = bbox[part.key] || (bbox[part.key] = [x, y, x, y]);
        if (x < bb[0]) bb[0] = x; if (y < bb[1]) bb[1] = y; if (x > bb[2]) bb[2] = x; if (y > bb[3]) bb[3] = y;
      }
    }
    const NB = [1, W, -1, -W];
    // Outlines: a cell is inked when a neighbour belongs to another face and lies behind it (or on the
    // same part, to its right or below), so each edge is one cell wide.
    for (let y = IN; y < H - IN; y++) for (let x = IN; x < W - IN; x++) {
      const i = y * W + x, p = pid[i];
      if (p < 0) continue;
      let edge = false;
      for (let n = 0; n < 4; n++) {
        const own = n < 2, j = i + NB[n], q = pid[j];
        if (gid[j] === gid[i]) continue;
        if (q !== p) { if (q < 0 || zb[i] <= zb[j]) { edge = true; break; } }
        else if (own && !M.parts[p].soft && (zb[i] <= zb[j] + 6)) { edge = true; break; }
      }
      if (!edge) continue;
      const part = M.parts[p];
      if (part.key === 'desk') { put(i, this.rgb('#8C7C66')); continue; }
      put(i, pals[p].line);
    }
    // The hovered part glows: a stippled ring of its light ink round its outline.
    if (hot && M.by[hot]) {
      const hp = M.by[hot].i, lt = pals[hp].ramp[1];
      for (let y = IN; y < H - IN; y++) for (let x = IN; x < W - IN; x++) {
        const i = y * W + x;
        if (pid[i] === hp) continue;
        let near = false;
        for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) { const j = i + dy * W + dx; if (pid[j] === hp && zb[j] < zb[i]) { near = true; break; } }
        if (near && (x + y) % 2 === 0) put(i, lt);
      }
    }
    // Assembly lines while exploded: a dotted rule from where each part sits to where it has gone.
    if (exp > 0.02) {
      const RULE = this.rgb('#8C7C66');
      const st0 = Object.assign({}, st, { exp: 0 }), home = this.frames(st0);
      for (const p of M.parts) {
        if (!p.pick || p.ex.every((v) => v === 0) || !p.polys.length || hide[p.key]) continue;
        let c = [0, 0, 0];
        for (const q of p.polys[0].p) for (let k = 0; k < 3; k++) c[k] += q[k] / p.polys[0].p.length;
        const a = proj(tw(home[p.key], c)), b2 = proj(tw(fr[p.key], c));
        const n = Math.ceil(Math.hypot(b2.x - a.x, b2.y - a.y));
        for (let s = 0; s <= n; s += 2) {
          const x = Math.round(a.x + (b2.x - a.x) * s / n), y = Math.round(a.y + (b2.y - a.y) * s / n), z = a.z + (b2.z - a.z) * s / n;
          if (x < IN || y < IN || x >= W - IN || y >= H - IN) continue;
          const i = y * W + x;
          if (pid[i] < 0 || zb[i] > z - 4 || M.parts[pid[i]].key === 'desk') put(i, RULE);
        }
      }
    }
    // The plate mark: paper grain, a double rule, a small bloom in each corner.
    const RULE = this.rgb('#A99D84'), m1 = 3, m2 = 6;
    const set = (x, y, c) => put(y * W + x, c);
    for (let x = m1; x < W - m1; x++) { set(x, m1, RULE); set(x, H - 1 - m1, RULE); }
    for (let y = m1; y < H - m1; y++) { set(m1, y, RULE); set(W - 1 - m1, y, RULE); }
    for (let x = m2; x < W - m2; x++) if (x % 2 === 0) { set(x, m2, RULE); set(x, H - 1 - m2, RULE); }
    for (let y = m2; y < H - m2; y++) if (y % 2 === 0) { set(m2, y, RULE); set(W - 1 - m2, y, RULE); }
    for (const [cx, cy] of [[m1, m1], [W - 1 - m1, m1], [m1, H - 1 - m1], [W - 1 - m1, H - 1 - m1]])
      for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) set(cx + dx, cy + dy, this.rgb(dx || dy ? '#C24E39' : '#A87400'));

    this._pid = pid; this._bbox = bbox;
    return img;
  }

  plate() {
    const st = this.state, key = JSON.stringify([st.turn, st.lift, st.exp, st.outs, st.hover, st.sel, st.dyaw, st.dpitch]);
    if (this._plateKey === key && this._plate) return this._plate;
    const D = this.dims(), img = this.render(st);
    if (typeof document === 'undefined') return '';
    const cv = this._cv || (this._cv = document.createElement('canvas'));
    cv.width = D.W; cv.height = D.H;
    const ctx = cv.getContext('2d'), id = ctx.createImageData(D.W, D.H);
    id.data.set(img);
    ctx.putImageData(id, 0, 0);
    this._plateKey = key;
    this._plate = cv.toDataURL();
    return this._plate;
  }

  // ================================================================ motion
  // A small timeline of tweens. A 50 ms timer runs only while one is moving, and stops at rest.
  tween(name, to, dur, delay) {
    const st = this.state, cur = name.startsWith('out:') ? ((st.outs || {})[name.slice(4)] || 0) : (st[name] || 0);
    if (this.reduce) { this.apply(name, to); return; }
    this._tw = this._tw || {};
    this._tw[name] = { from: cur, to, t0: Date.now() + (delay || 0), dur };
    this.kick();
  }

  apply(name, v) {
    if (name.startsWith('out:')) { const outs = Object.assign({}, this.state.outs); outs[name.slice(4)] = v; this.setState({ outs }); }
    else this.setState({ [name]: v });
  }

  kick() {
    if (this._timer || typeof setInterval === 'undefined') return;
    this._timer = setInterval(() => {
      const now = Date.now(), tw = this._tw || {}, next = {}, outs = Object.assign({}, this.state.outs);
      let live = false;
      for (const [k, t] of Object.entries(tw)) {
        const p = Math.max(0, Math.min(1, (now - t.t0) / t.dur)), v = t.from + (t.to - t.from) * p;
        if (k.startsWith('out:')) outs[k.slice(4)] = v; else next[k] = v;
        if (p >= 1) delete tw[k]; else live = true;
      }
      next.outs = outs;
      this.setState(next);
      if (!live) { clearInterval(this._timer); this._timer = null; }
    }, 50);
  }

  toggleExplode() {
    const on = !this.state.exploded;
    this.setState({ exploded: on });
    if (on && (this.state.lift || 0) < 1) this.tween('lift', 1, 900);
    this.tween('exp', on ? 1 : 0, 1600);
  }

  pick(key) {
    if (!key) return;
    if (key === 'panel') { this.tween('lift', 1, 1400); return; }
    const sel = this.state.sel;
    if (sel) this.tween('out:' + sel, 0, 900);
    if (sel === key) { this.setState({ sel: null }); return; }
    this.setState({ sel: key });
    this.tween('out:' + key, 1, 1100);
  }

  partAt(e, el) {
    const D = this.dims(), r = el.getBoundingClientRect();
    const x = Math.floor((e.clientX - r.left) / r.width * D.W), y = Math.floor((e.clientY - r.top) / r.height * D.H);
    if (!this._pid || x < 0 || y < 0 || x >= D.W || y >= D.H) return null;
    const p = this._pid[y * D.W + x];
    if (p < 0) return null;
    const part = this.model().parts[p];
    return part.pick ? part.key : null;
  }

  // Pointer handling is delegated from the document, so it survives re-renders of the plate.
  bindPointer() {
    if (this._bound || typeof document === 'undefined') return;
    this._bound = true;
    const stage = (e) => e.target && e.target.closest ? e.target.closest('[data-boxes-stage]') : null;
    document.addEventListener('pointerdown', (e) => {
      const s = stage(e);
      if (!s) return;
      this._drag = { x: e.clientX, y: e.clientY, yaw: this.state.dyaw || 0, pitch: this.state.dpitch || 0, moved: false, el: s };
    });
    document.addEventListener('pointermove', (e) => {
      const d = this._drag;
      if (d) {
        const dx = e.clientX - d.x, dy = e.clientY - d.y;
        if (Math.abs(dx) + Math.abs(dy) > 5) d.moved = true;
        if (d.moved) {
          const c = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
          this.setState({ dyaw: c(d.yaw - dx * 0.0016, -0.32, 0.32), dpitch: c(d.pitch + dy * 0.001, -0.12, 0.14) });
          return;
        }
      }
      const s = stage(e);
      if (s) { const k = this.partAt(e, s); this._src = 'stage'; if (k !== this.state.hover) this.setState({ hover: k }); }
      else if (this._src === 'stage' && this.state.hover) { this._src = null; this.setState({ hover: null }); }
    });
    document.addEventListener('pointerup', (e) => {
      const d = this._drag;
      this._drag = null;
      if (d && !d.moved) this.pick(this.partAt(e, d.el));
    });
  }

  // ================================================================ text over the plate
  info() {
    return {
      case: ['Case', 'Fractal Design North, Charcoal Black', 'mid-tower · 469 × 215 × 447 mm'],
      panel: ['Side panel', 'Fractal Design North', 'tinted glass · click to lift it away'],
      front: ['Walnut front', 'Fractal Design North', 'walnut slats over a mesh'],
      radiator: ['Radiator & fans', 'NZXT Kraken Plus 280', '280 mm radiator · 2 × 140 mm fans, front'],
      pump: ['Pump head', 'NZXT Kraken Plus 280', 'on the CPU'],
      cpu: ['CPU', 'AMD Ryzen 7 9800X3D', 'under the pump'],
      mobo: ['Motherboard', 'ASUS B650E MAX GAMING WIFI', 'ATX'],
      ram: ['Memory', 'Kingston FURY Beast Black', '2 × 16 GB · DDR5-6000 CL30'],
      ssd: ['SSD', 'Samsung 990 EVO Plus', '2 TB · M.2'],
      gpu: ['Graphics card', 'MSI GeForce RTX 5070 Ti 16G Ventus 3X OC', '303 mm · three fans'],
      psu: ['Power supply', 'Corsair RM850x', 'ATX 3.1 · 850 W'],
      monitor: ['Monitor', 'GIGABYTE G34WQC2', '34" ultrawide · curved'],
      laptop: ['Laptop', 'Lenovo ThinkPad P14s Gen 2a', '14" · the red TrackPoint'],
    };
  }

  order() { return ['case', 'front', 'radiator', 'pump', 'cpu', 'mobo', 'ram', 'ssd', 'gpu', 'psu', 'monitor', 'laptop']; }

  caption() {
    const k = this.state.hover || this.state.sel, bb = this._bbox && this._bbox[k], D = this.dims();
    if (!k || !bb) return { show: false };
    const part = this.model().by[k], cx = (bb[0] + bb[2]) / 2 / D.W * 100, top = bb[1] / D.H * 100;
    const below = top < 14;
    return { show: true, name: this.info()[k][0], color: part.col,
      style: 'left: ' + Math.max(8, Math.min(92, cx)).toFixed(2) + '%; top: ' + (below ? (bb[3] + 2) / D.H * 100 : top).toFixed(2) + '%; transform: translate(-50%, ' + (below ? '4px' : 'calc(-100% - 4px)') + ');' };
  }

  card() {
    const k = this.state.sel;
    if (!k) return { show: false };
    const [name, model, spec] = this.info()[k], no = this.order().indexOf(k) + 1;
    return { show: true, fig: 'Fig. ' + no, name, model, spec, color: this.model().by[k].col, close: () => this.pick(k) };
  }

  legend() {
    const st = this.state;
    return this.order().map((k, n) => {
      const [name] = this.info()[k], on = st.hover === k || st.sel === k;
      return { no: (n + 1 < 10 ? '0' : '') + (n + 1), name, swatch: this.model().by[k].col,
        style: on ? 'background: #E6DECB; color: #1F2B23;' : '',
        enter: () => { this._src = 'list'; this.setState({ hover: k }); }, leave: () => this.setState({ hover: null }), click: () => this.pick(k) };
    });
  }

  // Small woodcut icons for the contact block, one character per 3-px cell.
  icon(name) {
    this._icons = this._icons || {};
    if (this._icons[name]) return this._icons[name];
    const S = {
      mail: ['ppppppppppp', 'pp.......pp', 'p.p.....p.p', 'p..p...p..p', 'p...p.p...p', 'p....p....p', 'p.........p', 'ppppppppppp'],
      github: ['.p.......p.', '.pp.....pp.', '.ppppppppp.', 'ppppppppppp', 'ppp.ppp.ppp', 'ppp.ppp.ppp', 'ppppppppppp', '.ppppppppp.', '..ppppppp..', 'p..p...p...', '.pp.....p..'],
      linkedin: ['ppppppppppp', 'p.ppppppppp', 'ppppppppppp', 'p.pp.p..ppp', 'p.pp..pp.pp', 'p.pp.ppp.pp', 'p.pp.ppp.pp', 'p.pp.ppp.pp', 'ppppppppppp'],
    }[name];
    if (typeof document === 'undefined') return '';
    const cv = document.createElement('canvas'), h = S.length, w = S[0].length;
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = { mail: '#C24E39', github: '#1F2B23', linkedin: '#1D5A8F' }[name];
    S.forEach((row, y) => { for (let x = 0; x < w; x++) if (row[x] === 'p') ctx.fillRect(x, y, 1, 1); });
    return (this._icons[name] = cv.toDataURL());
  }
'''

CLASS = r'''class Component extends DCLogic {
  state = { turn: 0, lift: 0, exp: 0, outs: {}, hover: null, sel: null, dyaw: 0, dpitch: 0, exploded: false };

  componentDidMount() {
    this.reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (this.props.motion === false) this.reduce = true;
    this.bindPointer();
    // On load: the tower turns into a three-quarter view, then the side panel lifts away.
    this.tween('turn', 1, 2400, 300);
    this.tween('lift', 1, 1600, 2900);
  }

  componentWillUnmount() { clearInterval(this._timer); this._timer = null; }
''' + JS_BASE + JS + r'''
  renderVals() {
    const plate = this.plate();
    return { plate, cap: this.caption(), card: this.card(), legend: this.legend(),
      explodeLabel: this.state.exploded ? 'assemble' : 'explode', explode: () => this.toggleExplode(),
      mail: this.icon('mail'), github: this.icon('github'), linkedin: this.icon('linkedin'), roots: this.roots() };
  }
}'''

CSS = PAGE_CSS + (
    '.bx-card{position:absolute;right:3.2%;bottom:5.5%;width:300px}\n'
    '.bx-leg button:hover,.bx-leg button:focus-visible{background:#E6DECB}\n'
    '.bx-btn:hover,.bx-btn:focus-visible{background:#E6DECB}\n'
    '.bx-hint{display:inline}\n'
    '@media (max-width: 640px){.bx-card{position:static;width:auto;margin-top:12px}.bx-cap{display:none}.bx-hint{display:none}.bx-leg{grid-template-columns:1fr 1fr !important}}\n')

LBL = f"font-family: {MONO}; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: {MUTED};"
icon = lambda var, label, href, text: (f'<div style="display: flex; gap: 12px; align-items: center;"><img alt="" aria-hidden="true" src="{{{{{var}}}}}" style="width: 33px; height: auto; image-rendering: pixelated;">'
                                       f'<div><div style="{LBL}">{label}</div><a href="{href}" style="font-family: {MONO}; font-size: 14px;">{text}</a></div></div>')

body = f'''{nav('about')}
<main style="max-width: 1080px; margin: 0 auto; padding: 48px 24px 40px;">
<h1 style="margin: 0 0 22px; font-family: {SERIF}; font-style: italic; font-size: 38px; font-weight: 600;">About</h1>
<figure style="margin: 0;">
<div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 6px 16px; padding: 0 2px 8px; {LBL}"><span>Tab. I · the desk</span><span class="bx-hint">drag to turn · hover to name · click to slide out</span><button type="button" class="bx-btn" onClick="{{{{explode}}}}" style="font-family: {MONO}; font-size: 13px; letter-spacing: 0; text-transform: none; color: {CANOPY}; background: transparent; border: 0; padding: 2px 6px; cursor: pointer;">[{{{{explodeLabel}}}}]</button></div>
<div style="position: relative; max-width: {PW}px;">
<div data-boxes-stage="1" style="position: relative; width: 100%; aspect-ratio: {PW} / {PH}; touch-action: pan-y; cursor: pointer; user-select: none;">
<img alt="A pixel woodcut of my desk: a wooden-fronted PC tower with its side open, an ultrawide monitor and a ThinkPad." src="{{{{plate}}}}" draggable="false" style="position: absolute; inset: 0; width: 100%; height: 100%; image-rendering: pixelated;">
<sc-if value="{{{{cap.show}}}}" hint-placeholder-val="{{{{false}}}}"><span class="bx-cap" aria-hidden="true" style="position: absolute; {{{{cap.style}}}} white-space: nowrap; pointer-events: none; font-family: {MONO}; font-size: 12px; font-weight: 600; line-height: 16px; padding: 1px 5px; background: rgba(241,236,223,0.92); border: 1px solid {{{{cap.color}}}}; color: {{{{cap.color}}}};">{{{{cap.name}}}}</span></sc-if>
</div>
<sc-if value="{{{{card.show}}}}" hint-placeholder-val="{{{{false}}}}"><div class="bx-card" aria-live="polite" style="padding: 14px 16px 14px; background: rgba(247,242,228,0.96); border: 1px solid #D8CFBA; border-left: 4px solid {{{{card.color}}}}; cursor: default;">
<div style="display: flex; justify-content: space-between; {LBL}"><span>{{{{card.fig}}}} · {{{{card.name}}}}</span><button type="button" onClick="{{{{card.close}}}}" aria-label="Put it back" style="font-family: {MONO}; font-size: 12px; color: {MUTED}; background: transparent; border: 0; padding: 0; cursor: pointer;">[put back]</button></div>
<div style="margin-top: 4px; font-family: {MONO}; font-size: 15px; font-weight: 600; line-height: 1.35; color: {INK};">{{{{card.model}}}}</div>
<div style="font-family: {MONO}; font-size: 12px; color: {MUTED};">{{{{card.spec}}}}</div>
<div style="margin-top: 8px; font-family: {SERIF}; font-style: italic; font-size: 15px; line-height: 1.5; color: {INK};">[a line about it, written by me]</div>
</div></sc-if>
</div>
<div class="bx-leg" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 2px 12px; margin-top: 12px; max-width: {PW}px;">
<sc-for list="{{{{legend}}}}" as="l" hint-placeholder-count="12"><button type="button" onMouseEnter="{{{{l.enter}}}}" onMouseLeave="{{{{l.leave}}}}" onFocus="{{{{l.enter}}}}" onBlur="{{{{l.leave}}}}" onClick="{{{{l.click}}}}" style="display: flex; gap: 8px; align-items: center; text-align: left; font-family: {MONO}; font-size: 12px; color: {MUTED}; background: transparent; border: 0; padding: 3px 6px; cursor: pointer; {{{{l.style}}}}"><span style="color: {MUTED}; opacity: 0.8;">{{{{l.no}}}}</span><span aria-hidden="true" style="width: 9px; height: 9px; flex: 0 0 9px; background: {{{{l.swatch}}}};"></span><span>{{{{l.name}}}}</span></button></sc-for>
</div>
</figure>

<section style="margin-top: 56px; max-width: 680px;">
<p style="margin: 0; padding: 22px 26px; border: 1px dashed #C9BFA8; color: {MUTED};">[About text — written by me]</p>
</section>

<section aria-label="Contact" style="margin-top: 48px; max-width: 680px;">
<div style="{LBL} margin-bottom: 14px;">Write to me</div>
<div style="display: flex; flex-wrap: wrap; gap: 18px 40px; padding: 20px 24px; background: #F7F2E4; border: 1px solid #D8CFBA;">
{icon('mail', 'email', 'mailto:matej.schrodl@gmail.com', 'matej.schrodl@gmail.com')}
{icon('github', 'GitHub', 'https://github.com/schrodlm', 'github.com/schrodlm')}
{icon('linkedin', 'LinkedIn', 'https://www.linkedin.com/in/matej-schrodl354', 'linkedin.com/in/matej-schrodl354')}
</div>
</section>
</main>
{FOOTER}'''

page_src = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>About</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&amp;family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;1,7..72,400;1,7..72,600&amp;display=swap">
<style>
body{{margin:0;background:#F1ECDF}}
a{{color:{RIVER}}}a:hover{{color:#15466F}}
{CSS}</style>
</helmet>
<div style="background: #F1ECDF; color: {INK}; font-family: {SERIF}; font-size: 17px; line-height: 1.65; position: relative; overflow: hidden;">
{body}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"motion":{{"editor":"boolean","default":true,"section":"Desk"}},"$preview":{{"width":1280,"height":1500}}}}'>
{CLASS}
</script>
</body>
</html>
'''
open('jungle/project/AboutDeskBoxes.dc.html', 'w', encoding='utf-8').write(page_src)
print('AboutDeskBoxes', len(page_src))
