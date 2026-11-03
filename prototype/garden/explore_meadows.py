_gsrc = open('gen_graph.py', encoding='utf-8').read()
exec(_gsrc[:_gsrc.index('# ---- variant A')])
from meadow_comm import louvain
import sys
res = float(sys.argv[1]) if len(sys.argv) > 1 else 1.0
linked = [i for i in range(len(NODES)) if ADJ[i]]
for g in louvain(linked, EDGES, res):
    inn = lambda i: len([j for j in ADJ[i] if j in g])
    hub = sorted(g, key=lambda i: -inn(i))
    print(len(g), [(NODES[i]['title'], inn(i)) for i in hub[:7]])
