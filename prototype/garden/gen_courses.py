"""The course review page in four variants, plainest to most garden (CourseA..CourseD).

Reads two real reviews from the vault (read only) and bakes them into each board; a Tweak prop
switches between them, another bumps every rating by half a step to test 4.5-style values.
"""
import json
import math
import os
import re

import yaml

from gen_garden2 import (OUT, INK, MUTED, CANOPY, RIVER, FERN, MOSS, MANGO, HIBISCUS, EARTH, BARK, MONO, SERIF,
                         FOOTER, JS_VINE, VINE_MARKUP, PAGE_CSS, nav, rows_loop, component)

VAULT = '/home/schrodlm/dev/second-brain/uni/courses/'
FILES = {'NSWI035': 'NSWI035 - Principy distribuovaných systémů.md', 'NSWI200': 'NSWI200 - Operační systémy.md'}
LINE, CARD, PAPER = '#D8CFBA', '#F7F2E4', '#E5DDCA'


def load(code):
    src = open(os.path.join(VAULT, FILES[code]), encoding='utf-8').read()
    _, fm, body = src.split('---', 2)
    m = yaml.safe_load(fm)
    blocks, para = [], []

    def flush():
        if para:
            blocks.append({'p': True, 'h': False, 'text': ' '.join(para)})
            para.clear()
    for line in body.strip().splitlines():
        line = line.strip()
        if line.startswith('#'):
            flush()
            text = line.lstrip('#').strip()
            blocks.append({'h': True, 'p': False, 'text': text, 'seed': code + ':' + text})
        elif not line:
            flush()
        else:
            para.append(line)
    flush()
    words = sum(len(b['text'].split()) for b in blocks)
    d, mth, y = str(m['written']).split('-')
    title = m['title']
    name = title[len(m['course_code']):].lstrip(' -–') if title.startswith(m['course_code']) else title
    return {
        'code': m['course_code'], 'name': name, 'university': m['university'],
        'semester': m['semester'], 'year': m['year'], 'written': f'{y}-{mth}-{d}',
        'ratings': {'difficulty': m['difficulty'], 'usefulness': m['usefulness'], 'teaching': m['teaching_quality']},
        'worth': bool(m['worth_it']), 'url': m['course_page'],
        'urlText': re.sub(r'^https?://', '', m['course_page']).rstrip('/'),
        'tags': ['#' + t for t in (m.get('tags') or [])], 'minutes': max(1, math.ceil(words / 200)), 'body': blocks,
    }


COURSES = {k: load(k) for k in FILES}
for c in COURSES.values():
    d = c['written']
    assert re.match(r'^\d{4}-\d\d-\d\d$', d), d

T_SUBS = {'$MONO': MONO, '$SERIF': SERIF, '$INK': INK, '$MUTED': MUTED, '$CANOPY': CANOPY, '$RIVER': RIVER,
          '$LINE': LINE, '$CARD': CARD, '$FERN': FERN, '$HIB': HIBISCUS}


def T(s):
    for k, v in T_SUBS.items():
        s = s.replace(k, v)
    return s


def runs_inline(var):
    return f'<sc-for list="{{{{{var}}}}}" as="q" hint-placeholder-count="3"><span style="color: {{{{q.c}}}}">{{{{q.t}}}}</span></sc-for>'


def trail(var):
    return (f'<div aria-hidden="true" style="flex: 1; min-width: 0; overflow: hidden; white-space: pre; font-family: {MONO}; font-size: 14px;">'
            f'{runs_inline(var)}</div>')


def heading(text_hole, trail_var=None, top=56):
    h2 = f'font-family: {MONO}; font-size: 20px; font-weight: 600; color: {CANOPY};'
    if trail_var:
        return (f'<div style="display: flex; align-items: baseline; gap: 14px; margin: {top}px 0 16px;">'
                f'<h2 style="margin: 0; white-space: nowrap; {h2}">{text_hole}</h2>{trail(trail_var)}</div>')
    return f'<h2 style="margin: {top}px 0 14px; {h2}">{text_hole}</h2>'


# ---------------------------------------------------------------- shared page parts

def head_block(meta_top=32):
    return T(f'''<div style="font-family: $MONO; font-size: 13px; color: $MUTED;"><a href="#" style="color: $MUTED;">courses</a> / <a href="#" style="color: $MUTED;">{{{{c.university}}}}</a> / {{{{c.code}}}}</div>
<h1 lang="cs" style="margin: 10px 0 8px; font-family: $MONO; font-size: 34px; line-height: 1.2; font-weight: 600; color: $INK;">{{{{c.name}}}}</h1>
<div style="font-family: $MONO; font-size: 13px; color: $MUTED; margin-bottom: {meta_top}px;">{{{{c.code}}}} · {{{{c.university}}}} · semester {{{{c.semester}}}}, {{{{c.year}}}} · česky · {{{{c.minutes}}}} min</div>''')


def body_block(trails=True, first_top=56):
    h = heading('{{b.text}}', 'b.trail' if trails else None)
    return T(f'''<article lang="cs">
<sc-for list="{{{{c.body}}}}" as="b" hint-placeholder-count="6"><sc-if value="{{{{b.h}}}}" hint-placeholder-val="{{{{false}}}}">{h}</sc-if><sc-if value="{{{{b.p}}}}" hint-placeholder-val="{{{{true}}}}"><p style="margin: 0 0 16px;">{{{{b.text}}}}</p></sc-if></sc-for>
</article>''')


def notes_block(trails=True, marks=True):
    mark = (f'<span aria-hidden="true" style="font-family: {MONO}; font-size: 13px; width: 32px; flex: none; white-space: pre;">{runs_inline("n.mark")}</span>' if marks else
            f'<span aria-hidden="true" style="font-family: {MONO}; font-size: 13px; color: {MUTED}; width: 20px; flex: none;">→</span>')
    return T(f'''{heading('My notes for this course', 'trailNotes' if trails else None, 64)}
<ul style="list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px;">
<sc-for list="{{{{notes}}}}" as="n" hint-placeholder-count="3"><li style="display: flex; align-items: baseline; gap: 10px;">{mark}<a href="#" style="font-size: 17px;">{{{{n.title}}}}</a></li></sc-for>
</ul>''')


def verdict_word(cls_yes, cls_no):
    return (f'<sc-if value="{{{{c.worth}}}}" hint-placeholder-val="{{{{false}}}}">{cls_yes}</sc-if>'
            f'<sc-if value="{{{{c.notWorth}}}}" hint-placeholder-val="{{{{true}}}}">{cls_no}</sc-if>')


EXT = '<span aria-hidden="true"> ↗</span>'

# ---------------------------------------------------------------- A · plain: a small reference table

A_RATINGS = T(f'''<section aria-label="Ratings" style="margin: 0 0 8px; font-family: $MONO; font-size: 14px; line-height: 1.5;">
<dl class="facts" style="margin: 0; display: grid; grid-template-columns: max-content minmax(0, 1fr); border-top: 1px solid $LINE;">
<dt style="padding: 12px 28px 8px 0; color: $MUTED; border-bottom: 1px solid $LINE;">worth it</dt>
<dd style="margin: 0; padding: 8px 0; border-bottom: 1px solid $LINE; font-size: 18px; font-weight: 600; color: $INK;">{verdict_word('<span style="color: $CANOPY;">Yes</span>', 'No')}</dd>
<sc-for list="{{{{rat}}}}" as="r" hint-placeholder-count="3"><dt style="padding: 8px 28px 8px 0; color: $MUTED; border-bottom: 1px solid $LINE;">{{{{r.k}}}}</dt><dd style="margin: 0; padding: 8px 0; border-bottom: 1px solid $LINE; color: $INK;"><span style="font-weight: 600;">{{{{r.txt}}}}</span><span style="color: $MUTED;"> / 5 · {{{{r.hint}}}}</span></dd></sc-for>
<dt style="padding: 8px 28px 8px 0; color: $MUTED; border-bottom: 1px solid $LINE;">course page</dt>
<dd style="margin: 0; padding: 8px 0; border-bottom: 1px solid $LINE; overflow-wrap: anywhere;"><a href="{{{{c.url}}}}">{{{{c.urlText}}}}</a>{EXT}</dd>
<dt style="padding: 8px 28px 8px 0; color: $MUTED; border-bottom: 1px solid $LINE;">reviewed</dt>
<dd style="margin: 0; padding: 8px 0; border-bottom: 1px solid $LINE; color: $INK;">{{{{c.written}}}}</dd>
<dt style="padding: 8px 28px 8px 0; color: $MUTED; border-bottom: 1px solid $LINE;">tags</dt>
<dd style="margin: 0; padding: 8px 0; border-bottom: 1px solid $LINE; color: $MUTED; display: flex; flex-wrap: wrap; gap: 2px 12px;"><sc-for list="{{{{c.tags}}}}" as="t" hint-placeholder-count="2"><a href="#" style="color: $MUTED;">{{{{t}}}}</a></sc-for></dd>
</dl>
</section>''')

# ---------------------------------------------------------------- B · meters: five monospace cells per rating

B_RATINGS = T(f'''<section aria-label="Ratings" class="bwrap" style="display: flex; flex-wrap: wrap; gap: 20px 40px; align-items: flex-start; padding: 20px 0; border-top: 1px solid $LINE; border-bottom: 1px solid $LINE; font-family: $MONO; font-size: 14px; line-height: 1.5;">
<div style="flex: 1 1 300px; min-width: 0; display: flex; flex-direction: column; gap: 6px;">
<sc-for list="{{{{rat}}}}" as="r" hint-placeholder-count="3"><div style="display: flex; align-items: baseline; gap: 14px;" aria-label="{{{{r.aria}}}}"><span style="width: 11ch; flex: none; color: $MUTED;">{{{{r.k}}}}</span><span aria-hidden="true" style="white-space: pre; letter-spacing: 0;">{runs_inline("r.meter")}</span><span style="font-weight: 600; color: $INK;">{{{{r.txt}}}}</span></div></sc-for>
<div style="margin-top: 12px; color: $MUTED; font-size: 13px; display: flex; flex-wrap: wrap; gap: 2px 14px;"><a href="{{{{c.url}}}}" style="overflow-wrap: anywhere;">{{{{c.urlText}}}}</a><span>reviewed {{{{c.written}}}}</span></div>
<div style="display: flex; flex-wrap: wrap; gap: 2px 12px; font-size: 13px;"><sc-for list="{{{{c.tags}}}}" as="t" hint-placeholder-count="2"><a href="#" style="color: $MUTED;">{{{{t}}}}</a></sc-for></div>
</div>
<div class="bverdict" style="flex: 0 1 auto;">
<div style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: $MUTED; margin-bottom: 4px;">verdict</div>
{verdict_word('<div style="font-size: 22px; font-weight: 600; color: $CANOPY; white-space: nowrap;"><span aria-hidden="true" style="color: $FERN;">[+]</span> worth it</div>',
              '<div style="font-size: 22px; font-weight: 600; color: $INK; white-space: nowrap;"><span aria-hidden="true" style="color: $HIB;">[-]</span> not worth it</div>')}
</div>
</section>''')

# ---------------------------------------------------------------- C · label: the specimen card's sibling

C_RATINGS = T(f'''<section aria-label="Ratings" class="cwrap" style="width: fit-content; max-width: 100%; box-sizing: border-box; padding: 22px 32px 24px 28px; background: $CARD; border: 1px solid $LINE; font-family: $MONO; font-size: 13px; line-height: 1.65;">
<div style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: $MUTED;">Course review · {{{{c.code}}}} · {{{{c.university}}}}</div>
{verdict_word('<div style="font-family: $SERIF; font-style: italic; font-size: 26px; line-height: 1.3; color: $CANOPY; margin: 4px 0 2px;">Worth taking</div>',
              '<div style="font-family: $SERIF; font-style: italic; font-size: 26px; line-height: 1.3; color: $INK; margin: 4px 0 2px;">Not worth taking</div>')}
<div style="color: $MUTED; margin-bottom: 14px; display: flex; flex-wrap: wrap; gap: 0 8px;"><span style="white-space: nowrap;">semester {{{{c.semester}}}}, {{{{c.year}}}} ·</span><span style="white-space: nowrap;">reviewed {{{{c.written}}}}</span></div>
<sc-for list="{{{{rat}}}}" as="r" hint-placeholder-count="3"><div style="display: flex; gap: 10px;"><span style="color: $MUTED; white-space: pre;">{{{{r.key}}}}</span><span style="color: $INK; white-space: pre;"><span style="font-weight: 600;">{{{{r.pad}}}}</span> of 5  </span><span aria-hidden="true" style="white-space: pre;">{runs_inline("r.pips")}</span></div></sc-for>
<div style="display: flex; flex-wrap: wrap; gap: 0 10px;"><span style="color: $MUTED; white-space: pre;">{{{{lk.page}}}}</span><a href="{{{{c.url}}}}" style="overflow-wrap: anywhere;">{{{{c.urlText}}}}</a></div>
<div style="display: flex; flex-wrap: wrap; gap: 0 10px;"><span style="color: $MUTED; white-space: pre;">{{{{lk.tags}}}}</span><span style="display: flex; flex-wrap: wrap; gap: 0 12px;"><sc-for list="{{{{c.tags}}}}" as="t" hint-placeholder-count="2"><a href="#" style="color: $INK; white-space: nowrap;">{{{{t}}}}</a></sc-for></span></div>
</section>''')

# ---------------------------------------------------------------- D · garden: sky, branch and bramble, plus a stamp

D_ROW = T(f'''<div class="drow" style="display: flex; align-items: center; gap: 6px 18px;" aria-label="{{{{g.aria}}}}">
<div class="dl" style="width: 13ch; flex: none;"><div style="color: $MUTED; white-space: nowrap;">{{{{g.k}}}}</div><div style="color: $INK; white-space: nowrap;"><span style="font-weight: 600; font-size: 16px;">{{{{g.txt}}}}</span> <span style="color: $MUTED;">/ 5</span></div></div>
<div aria-hidden="true" style="font-size: 13px; line-height: 15px;">{rows_loop("g.art", 3)}</div>
</div>''')

D_RATINGS = T(f'''<section aria-label="Ratings" class="dwrap" style="position: relative; display: flex; flex-wrap: wrap; gap: 24px 40px; align-items: center; padding: 22px 28px; background: $CARD; border: 1px solid $LINE; font-family: $MONO; font-size: 13px; line-height: 1.5;">
<div style="flex: 1 1 320px; min-width: 0; display: flex; flex-direction: column; gap: 14px;">
<sc-for list="{{{{garden}}}}" as="g" hint-placeholder-count="3">{D_ROW}</sc-for>
</div>
<div class="stampcol" style="flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; gap: 18px; padding: 4px 8px;">
{verdict_word('<div class="stamp" style="white-space: nowrap; border: 3px double $CANOPY; color: $CANOPY; padding: 8px 14px 6px; transform: rotate(-4deg); text-align: center;"><div style="font-size: 20px; font-weight: 600; letter-spacing: 0.08em;">WORTH IT</div><div style="font-size: 11px; letter-spacing: 0.1em;">reviewed {{c.written}}</div></div>',
              '<div class="stamp" style="white-space: nowrap; border: 3px double $HIB; color: $INK; padding: 8px 14px 6px; transform: rotate(-4deg); text-align: center;"><div style="font-size: 20px; font-weight: 600; letter-spacing: 0.08em;">NOT WORTH IT</div><div style="font-size: 11px; letter-spacing: 0.1em; color: $MUTED;">reviewed {{c.written}}</div></div>')}
<div style="text-align: center; font-size: 13px; white-space: nowrap;"><a href="{{{{c.url}}}}">course page</a>{EXT}</div>
</div>
</section>
<div style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 2px 12px; font-family: $MONO; font-size: 13px;"><sc-for list="{{{{c.tags}}}}" as="t" hint-placeholder-count="2"><a href="#" style="color: $MUTED;">{{{{t}}}}</a></sc-for></div>''')

# ---------------------------------------------------------------- the component's logic

JS_COURSE = '''
  courses() { return __DATA__; }

  course() {
    const all = this.courses(), key = String(this.props.course || 'NSWI035').slice(0, 7);
    const c = Object.assign({}, all[key] || all.NSWI035);
    const r = Object.assign({}, c.ratings);
    // The half-step test: every rating moves up by half a point (a 5 drops to 4.5), to check 4.5 renders well.
    if (this.props.testHalfSteps) for (const k in r) r[k] = r[k] < 5 ? r[k] + 0.5 : 4.5;
    c.r = r; c.notWorth = !c.worth;
    c.body = c.body.map((b) => b.h ? Object.assign({}, b, { trail: this.trail('course:' + b.seed) }) : b);
    return c;
  }

  key(k) { return k + ' ' + '.'.repeat(Math.max(2, 14 - k.length)); }

  fmt(v) { return Number.isInteger(v) ? String(v) : v.toFixed(1); }

  // The plain list of ratings every variant shares.
  rat(c) {
    const hint = { difficulty: '5 is hardest', usefulness: '5 is most useful', teaching: '5 is best taught' };
    return ['difficulty', 'usefulness', 'teaching'].map((k) => {
      const v = c.r[k], txt = this.fmt(v);
      return { k, v, txt, hint: hint[k], aria: k + ' ' + txt + ' out of 5', meter: this.meter(v), pips: this.pips(v),
        key: this.key(k), pad: txt.padStart(3, ' ') };
    });
  }

  // Five two-character cells: a full point is a solid cell, a half point a half-filled one.
  meter(v) {
    const out = [];
    for (let i = 1; i <= 5; i++) {
      if (i > 1) out.push({ t: ' ', c: 'transparent' });
      if (v >= i) out.push({ t: '\\u2588\\u2588', c: '#2B7349' });
      else if (v >= i - 0.5) { out.push({ t: '\\u2588', c: '#2B7349' }); out.push({ t: '\\u2591', c: '#9C9481' }); }
      else out.push({ t: '\\u2591\\u2591', c: '#9C9481' });
    }
    return out;
  }

  // The label's quieter scale: small marks like a ruler.
  pips(v) {
    const out = [];
    for (let i = 1; i <= 5; i++) out.push(v >= i ? { t: '\\u25A0', c: '#5C4636' } : v >= i - 0.5 ? { t: '\\u25E7', c: '#5C4636' } : { t: '\\u25A1', c: '#B9B09A' });
    return out.map((r, i) => i ? [{ t: ' ', c: 'transparent' }, r] : [r]).flat();
  }

  // ---- D: each rating drawn as a strip of the garden: sun in the sky, fruit on a branch, thorns on a bramble.
  strip(rows, slots, v, draw) {
    const W = slots * 5 + 1, g = this.grid(W, rows);
    for (let i = 0; i < slots; i++) draw(g, 1 + i * 5, v >= i + 1 ? 2 : v >= i + 0.5 ? 1 : 0, i);
    return g;
  }

  sunArt(v) {
    const SUN = '#A87400', DIM = '#C29A4A', CLOUD = '#9A9483';
    const g = this.strip(2, 5, v, (g, x, f) => {
      const put = (s, y, c) => { for (let j = 0; j < s.length; j++) g.put(x + j, y, s[j], c); };
      if (f === 2) { put('\\\\|/', 0, SUN); put('-O-', 1, SUN); }
      else if (f === 1) { put('.|.', 0, DIM); put('-o-', 1, DIM); }
      else { put('.-.', 0, CLOUD); g.put(x - 1, 1, '(', CLOUD); put('___', 1, CLOUD); g.put(x + 3, 1, ')', CLOUD); }
    });
    return this.toRows(g);
  }

  fruitArt(v, seed) {
    const r = this.rng('fruit:' + seed), W = 26, g = this.grid(W, 3);
    for (let x = 0; x < W; x++) g.put(x, 0, x % 6 === 4 ? '&' : '~', x % 6 === 4 ? '#3F8A52' : '#5C4636');
    for (let i = 0; i < 5; i++) {
      const x = 2 + i * 5, f = v >= i + 1 ? 2 : v >= i + 0.5 ? 1 : 0;
      if (f === 2) { g.put(x, 1, '|', '#5E8E4A'); g.put(x - 1, 2, '(', '#C24E39'); g.put(x, 2, '@', r() < 0.5 ? '#C24E39' : '#A87400'); g.put(x + 1, 2, ')', '#C24E39'); }
      else if (f === 1) { g.put(x, 1, '|', '#5E8E4A'); g.put(x, 2, 'o', '#5E8E4A'); }
      else g.put(x, 1, ',', '#9A9483');
    }
    return this.toRows(g);
  }

  thornArt(v) {
    const W = 26, g = this.grid(W, 3);
    for (let x = 0; x < W; x++) g.put(x, 1, x % 2 ? '~' : '-', '#5C4636');
    for (let i = 0; i < 5; i++) {
      const x = 2 + i * 5, f = v >= i + 1 ? 2 : v >= i + 0.5 ? 1 : 0;
      if (f >= 1) { g.put(x, 0, '^', '#7A5C42'); g.put(x, 1, '+', '#5C4636'); }
      if (f === 2) g.put(x, 2, 'v', '#7A5C42');
    }
    return this.toRows(g);
  }

  garden(c) {
    const one = (k, what, art) => ({ k, what, txt: this.fmt(c.r[k]), aria: k + ' ' + this.fmt(c.r[k]) + ' out of 5', art });
    return [
      one('teaching', 'sun', this.sunArt(c.r.teaching)),
      one('usefulness', 'fruit', this.fruitArt(c.r.usefulness, c.code)),
      one('difficulty', 'thorns', this.thornArt(c.r.difficulty))
    ];
  }

  notes(c) {
    return [1, 2, 3].map((i) => ({ title: '[a note I wrote for this course]', mark: this.mark('notes/' + c.code.toLowerCase() + '-placeholder-' + i) }));
  }
'''

VALS = '''    const c = this.course(), rat = this.rat(c);
    const key = (k) => this.key(k);
    return { c, rat, garden: this.garden(c), notes: this.notes(c), lk: { page: key('course page'), tags: key('tags') },
             trailNotes: this.trail('course-notes:' + c.code), roots: this.roots(), vine: this.vine(), bugs: this.bugs() };'''

CSS = PAGE_CSS + '''@media (max-width: 560px){
  h1{font-size: 28px !important}
  .facts dt{padding-right: 16px !important}
  .bverdict{order: -1}
  .cwrap{padding: 18px 16px 20px !important}
  .dwrap{padding: 18px 14px !important}
  .drow{gap: 12px !important}
  .drow .dl{width: 11ch !important}
  .stampcol{flex-direction: row !important; width: 100%; justify-content: space-between; padding: 0 !important}
}
'''


def board(title, ratings, height, trails=True, marks=True, vine=False, rating_gap=40):
    props = {'course': {'editor': 'enum', 'default': 'NSWI035 · not worth it', 'options': ['NSWI035 · not worth it', 'NSWI200 · worth it'], 'section': 'Content'},
             'testHalfSteps': {'editor': 'boolean', 'default': False, 'section': 'Content'},
             'motion': {'editor': 'boolean', 'default': True, 'section': 'Flora'},
             '$preview': {'width': 1280, 'height': height}}
    body = (f'{VINE_MARKUP if vine else ""}\n{nav("courses")}\n'
            f'<main style="max-width: 760px; margin: 0 auto; padding: 80px 24px 80px; position: relative;">\n'
            f'{head_block()}\n{ratings}\n<div style="height: {rating_gap - 56}px;"></div>\n{body_block(trails)}\n{notes_block(trails, marks)}\n</main>\n{FOOTER}')
    data = json.dumps(COURSES, ensure_ascii=False, separators=(',', ':'))
    js = component(JS_VINE + JS_COURSE.replace('__DATA__', data), VALS)
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{title}</title>
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
<script type="text/x-dc" data-dc-script data-props='{json.dumps(props, ensure_ascii=False)}'>
{js}
</script>
</body>
</html>
'''


BOARDS = {
    'CourseA.dc.html': board('Course page A', A_RATINGS, 1900, trails=False, marks=False),
    'CourseB.dc.html': board('Course page B', B_RATINGS, 1900),
    'CourseC.dc.html': board('Course page C', C_RATINGS, 2000),
    'CourseD.dc.html': board('Course page D', D_RATINGS, 2000),
}

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for name, html in BOARDS.items():
        open(OUT + name, 'w', encoding='utf-8').write(html)
        print('wrote', OUT + name, len(html))
