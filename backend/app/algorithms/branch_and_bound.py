from __future__ import annotations

import sys
import time
from dataclasses import dataclass

from app.algorithms.greedy import greedy_coloring
from app.models import Graph


@dataclass(slots=True)
class BnBState:
    best_k: int
    best_coloring: list[int]
    timed_out: bool


def branch_and_bound_coloring(graph: Graph, timeout_seconds: float = 20.0) -> dict:
    # Depth of this DFS can reach number of vertices; raise limit for large DIMACS instances.
    required_limit = graph.num_vertices + 100
    if sys.getrecursionlimit() < required_limit:
        sys.setrecursionlimit(required_limit)

    start = time.perf_counter()
    greedy_result = greedy_coloring(graph)
    upper_bound = max(1, greedy_result["num_colors"])

    state = BnBState(
        best_k=upper_bound,
        best_coloring=greedy_result["coloring"][:],
        timed_out=False,
    )

    n = graph.num_vertices
    coloring = [-1] * n
    saturation: list[set[int]] = [set() for _ in range(n)]
    degrees = graph.degrees

    def select_vertex() -> int | None:
        uncolored = [u for u in range(n) if coloring[u] == -1]
        if not uncolored:
            return None
        return max(uncolored, key=lambda u: (len(saturation[u]), degrees[u]))

    def backtrack(used_colors: int) -> None:
        if time.perf_counter() - start > timeout_seconds:
            state.timed_out = True
            return

        if used_colors >= state.best_k:
            return

        u = select_vertex()
        if u is None:
            state.best_k = used_colors
            state.best_coloring = coloring[:]
            return

        forbidden = {coloring[v] for v in graph.adj[u] if coloring[v] != -1}
        candidate_colors = list(range(min(used_colors + 1, state.best_k - 1)))

        for color in candidate_colors:
            if color in forbidden:
                continue

            coloring[u] = color
            changed_neighbors: list[int] = []
            for v in graph.adj[u]:
                if coloring[v] == -1 and color not in saturation[v]:
                    saturation[v].add(color)
                    changed_neighbors.append(v)

            new_used = max(used_colors, color + 1)
            backtrack(new_used)

            for v in changed_neighbors:
                saturation[v].remove(color)
            coloring[u] = -1

            if state.timed_out:
                return

    backtrack(0)

    return {
        "algorithm": "Branch and Bound",
        "coloring": state.best_coloring,
        "num_colors": state.best_k,
        "conflicts": 0,
        "is_optimal": not state.timed_out,
        "timed_out": state.timed_out,
    }
