"""Community detection for the meadows: a small deterministic Louvain (modularity) on the undirected link graph."""
import collections


def louvain(n_ids, edges, resolution=1.0):
    # graph as weighted adjacency over current super-nodes
    nodes = list(n_ids)
    member = {i: [i] for i in nodes}
    adj = collections.defaultdict(lambda: collections.defaultdict(float))
    for a, b in edges:
        if a in member and b in member:
            adj[a][b] += 1; adj[b][a] += 1
    while True:
        m2 = sum(sum(v.values()) for v in adj.values())
        if m2 == 0:
            break
        k = {u: sum(adj[u].values()) for u in nodes}
        com = {u: u for u in nodes}
        tot = dict(k)
        moved_any = False
        for _ in range(20):
            moved = False
            for u in sorted(nodes):
                cu = com[u]
                w2c = collections.defaultdict(float)
                for v, w in adj[u].items():
                    if v != u:
                        w2c[com[v]] += w
                tot[cu] -= k[u]
                best, bestgain = cu, w2c.get(cu, 0) - resolution * tot[cu] * k[u] / m2
                for c in sorted(w2c):
                    g = w2c[c] - resolution * tot[c] * k[u] / m2
                    if g > bestgain + 1e-12:
                        best, bestgain = c, g
                com[u] = best
                tot[best] += k[u]
                if best != cu:
                    moved = moved_any = True
            if not moved:
                break
        if not moved_any:
            break
        new_member = collections.defaultdict(list)
        for u in nodes:
            new_member[com[u]].extend(member[u])
        nadj = collections.defaultdict(lambda: collections.defaultdict(float))
        for u in nodes:
            for v, w in adj[u].items():
                nadj[com[u]][com[v]] += w
        nodes = sorted(new_member)
        member = dict(new_member)
        adj = nadj
    return sorted((sorted(m) for m in member.values()), key=lambda g: (-len(g), g[0]))
