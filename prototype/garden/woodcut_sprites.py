"""The woodcut flowers shared by the garden map and the note plate: hand-cut sprites for small
flowers, a drawn flower for large ones."""

BLOOM_JS = r'''
  // Hand-cut sprites for the small flowers, one character per 3-px cell: p petal, c centre, t the
  // petal colour showing at a bud's tip, g stem and calyx, d seed, e the seed-head's eye.
  sprites() {
    return {
      cross3: ['.p.', 'pcp', '.p.'],
      saltire3: ['p.p', '.c.', 'p.p'],
      four5: ['.p.p.', 'pp.pp', '..c..', 'pp.pp', '.p.p.'],
      daisy5: ['p.p.p', '.ppp.', 'ppcpp', '.ppp.', 'p.p.p'],
      sun7: ['...p...', '.p.p.p.', '..ppp..', 'pppcppp', '..ppp..', '.p.p.p.', '...p...'],
      four7: ['.pp.pp.', 'ppp.ppp', 'pp...pp', '...c...', 'pp...pp', 'ppp.ppp', '.pp.pp.'],
      bud: ['.t.', 'ttt', 'ggg', '.g.', '.g.'],
      budOpen: ['t.t', 'ttt', 'ttt', 'ggg', '.g.', '.g.'],
      seedhead: ['.d.d.', 'd...d', '..e..', 'd...d', '.d.d.', '..g..', '..gg.', '..g..', '..g..'],
      tulip: ['p.p.p', 'ppppp', '.ppp.', '..g..', '.gg..', '..g..', '..g..'],
      daisyStem: ['.p.p.', 'ppcpp', '.p.p.', '..g..', '..gg.', '..g..', '..g..']
    };
  }

  // Which tier a note's flower is drawn at: 0 tiny (3 cells), 1 small (5), 2 medium (7), 3 drawn.
  tier(n) { return n.deg <= 1 ? 0 : n.deg <= 3 ? 1 : n.deg <= 5 ? 2 : 3; }

  // A flower's reach in css px, used to keep vines and captions clear of it.
  reach(n) {
    if (n.wild || n.stub) return 8;
    return [5, 8, 11, (3.2 + Math.min(12, Math.sqrt(n.deg) * 3.3)) * 1.3][this.tier(n)];
  }

  // The cells of one flower, as [x, y, rgb], centred on plate cell (cx, cy).
  bloom(n, mode, cx, cy) {
    const C = this.cfg().cell, S = this.sprites(), sp = this.specimen('notes/' + n.slug), r = this.rng('bloom:' + n.slug);
    const dim = mode === 'dim', up = mode === 'open' || mode === 'focus';
    const PALE = this.rgb('#D6CDB7'), col = {
      p: this.rgb(sp.petal[1]), t: this.rgb(sp.petal[1]), c: this.rgb(sp.center ? sp.center[1] : '#1F2B23'),
      g: this.rgb('#5E8E4A'), d: this.rgb('#8C7C66'), e: this.rgb('#7A5C42') };
    const out = [];
    const stamp = (rows, ay, k) => {
      k = k || 1;
      const hw = Math.floor(rows[0].length / 2);
      rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === '.') continue;
        for (let a = 0; a < k; a++) for (let b = 0; b < k; b++)
          out.push([cx + (x - hw) * k + a - (k > 1 ? 1 : 0), cy + (y - ay) * k + b - (k > 1 ? 1 : 0), dim ? PALE : col[ch]]);
      } });
      return out;
    };
    const k = mode === 'focus' ? 2 : 1;
    if (n.wild) {
      const rows = n.stub ? S.seedhead : (/Tulipa|Nutans|Pollinaria/.test(sp.latin) ? S.tulip : S.daisyStem);
      return stamp(rows, n.stub ? 2 : 1, k);
    }
    if (n.stub) return stamp(up ? S.budOpen : S.bud, 2, k);
    const t = Math.min(3, this.tier(n) + (up ? 1 : 0)), pick = r() < 0.5;
    if (t === 0) return stamp(pick ? S.cross3 : S.saltire3, 1);
    if (t === 1) return stamp(pick ? S.four5 : S.daisy5, 2);
    if (t === 2) return stamp(pick ? S.sun7 : S.four7, 3);
    // Larger flowers are drawn: petals outlined and stippled inside, an ink dot at the heart.
    const B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    const P = Math.min(8, 4 + Math.floor(n.deg / 2));
    const L = Math.max(4, (this.reach(n) * (mode === 'rest' ? 0.85 : dim ? 0.75 : 1.15) + (mode === 'focus' ? 4 : 0)) / C);
    const W = Math.max(0.9, Math.min(L * 0.3, L * Math.sin(Math.PI / P) * 0.8));
    const rot = r() * Math.PI * 2, seg = Math.PI * 2 / P, cr = Math.max(0.8, (1.2 + Math.min(2.4, n.deg / 4)) / C);
    const R = Math.ceil(L + 1);
    for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
      const rr = Math.hypot(x, y);
      if (rr > L + 0.5) continue;
      let a = Math.atan2(y, x) - rot;
      a = ((a % seg) + seg) % seg - seg / 2;
      const u = rr * Math.cos(a), v = rr * Math.sin(a), e = ((u - L * 0.58) / (L * 0.46)) ** 2 + (v / W) ** 2;
      const X = cx + x, Y = cy + y, th = B[(Y & 3) * 4 + (X & 3)];
      if (rr <= cr) { out.push([X, Y, dim ? PALE : (x === 0 && y === 0 ? this.rgb('#1F2B23') : col.c)]); continue; }
      if (e > 1) continue;
      if (dim) { if (e > 0.5 && th < 8) out.push([X, Y, PALE]); continue; }
      if (e > 0.3 || th < (mode === 'rest' ? 4 : 7) + (u / L) * 6) out.push([X, Y, col.p]);
    }
    return out;
  }

'''
