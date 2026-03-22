from __future__ import annotations

from app.models import Graph


# Largest-degree-first greedy coloring.
def greedy_coloring(graph: Graph) -> dict:
    order = sorted(range(graph.num_vertices), key=lambda x: len(graph.adj[x]), reverse=True)
    coloring = [-1] * graph.num_vertices

    for u in order:
        used = {coloring[v] for v in graph.adj[u] if coloring[v] != -1}
        color = 0
        while color in used:
            color += 1
        coloring[u] = color

    num_colors = (max(coloring) + 1) if coloring else 0
    return {
        "algorithm": "Greedy",
        "coloring": coloring,
        "num_colors": num_colors,
        "conflicts": 0,
        "is_optimal": False,
    }
