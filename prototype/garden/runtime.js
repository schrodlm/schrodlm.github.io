window.renderBoard = function (src, frozenState) {
  const x = src.match(/<x-dc>([\s\S]*)<\/x-dc>/)[1];
  const helmet = (x.match(/<helmet>([\s\S]*?)<\/helmet>/) || ['', ''])[1];
  document.head.insertAdjacentHTML('beforeend', helmet);
  const tpl = x.replace(/<helmet>[\s\S]*?<\/helmet>/, '');
  const script = src.match(/<script type="text\/x-dc"[^>]*data-props='([^']*)'[^>]*>([\s\S]*?)<\/script>/);
  const t = document.createElement('textarea'); t.innerHTML = script[1];
  const decl = JSON.parse(t.value), props = {};
  for (const [k, v] of Object.entries(decl)) if (k[0] !== '$' && v && 'default' in v) props[k] = v.default;
  class DCLogic { setState(s) { Object.assign(this.state, s); } }
  const Component = new Function('DCLogic', script[2] + '; return Component;')(DCLogic);
  const c = new Component(); c.props = props; c.state = c.state || {};
  const si = window.setInterval; window.setInterval = () => 0;
  if (c.componentDidMount) c.componentDidMount();
  window.setInterval = si;
  Object.assign(c.state, frozenState);
  const vals = c.renderVals();
  const look = (ctx, e) => { e = e.trim(); if (e === 'true') return true; if (e === 'false') return false; return e.split('.').reduce((o, k) => (o == null ? undefined : o[k]), ctx); };
  const fill = (ctx, s) => { const w = s.match(/^\s*\{\{([^}]+)\}\}\s*$/); if (w) return look(ctx, w[1]); return s.replace(/\{\{([^}]+)\}\}/g, (_, e) => { const v = look(ctx, e); return v == null ? '' : v; }); };
  const render = (node, ctx, parent) => {
    if (node.nodeType === 3) { parent.appendChild(document.createTextNode(fill(ctx, node.nodeValue))); return; }
    if (node.nodeType !== 1) return;
    const tag = node.tagName.toLowerCase();
    if (tag === 'sc-for') { const list = fill(ctx, node.getAttribute('list')) || [], as = node.getAttribute('as'); list.forEach((item, i) => { for (const ch of node.childNodes) render(ch, { ...ctx, [as]: item, $index: i }, parent); }); return; }
    if (tag === 'sc-if') { if (fill(ctx, node.getAttribute('value'))) for (const ch of node.childNodes) render(ch, ctx, parent); return; }
    const el = document.createElement(tag);
    for (const a of node.attributes) { if (/^on[a-z]/i.test(a.name) || a.name.startsWith('hint-')) continue; el.setAttribute(a.name, fill(ctx, a.value)); }
    for (const ch of node.childNodes) render(ch, ctx, el);
    parent.appendChild(el);
  };
  const holder = document.createElement('template'); holder.innerHTML = tpl;
  for (const ch of holder.content.childNodes) render(ch, vals, document.body);
};
