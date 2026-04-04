from __future__ import annotations

import math
import random

from app.algorithms.greedy import greedy_coloring
from app.models import Graph


def _count_conflicts(graph: Graph, coloring: list[int]) -> int:
    conflicts = 0
    for u, v in graph.edges:
        if coloring[u] == coloring[v]:
            conflicts += 1
    return conflicts


def _delta_conflicts_for_move(graph: Graph, coloring: list[int], u: int, new_color: int) -> int:
    old_color = coloring[u]
    if old_color == new_color:
        return 0

    delta = 0
    for v in graph.adj[u]:
        if coloring[v] == old_color:
            delta -= 1
        if coloring[v] == new_color:
            delta += 1
    return delta


def _anneal_for_k(
    graph: Graph,
    k: int,
    iterations: int,
    initial_temperature: float,
    cooling_rate: float,
    rng: random.Random,
) -> tuple[list[int], int]:
    n = graph.num_vertices
    coloring = [rng.randrange(k) for _ in range(n)]
    current_conflicts = _count_conflicts(graph, coloring)
    best_coloring = coloring[:]
    best_conflicts = current_conflicts
    temperature = initial_temperature

    for _ in range(iterations):
        if best_conflicts == 0:
            break

        u = rng.randrange(n)
        new_color = rng.randrange(k)
        delta = _delta_conflicts_for_move(graph, coloring, u, new_color)

        if delta <= 0:
            accept = True
        else:
            prob = math.exp(-delta / max(temperature, 1e-9))
            accept = rng.random() < prob

        if accept:
            coloring[u] = new_color
            current_conflicts += delta
            if current_conflicts < best_conflicts:
                best_conflicts = current_conflicts
                best_coloring = coloring[:]

        temperature *= cooling_rate

    return best_coloring, best_conflicts


def simulated_annealing_coloring(
    graph: Graph,
    iterations: int = 40000,
    initial_temperature: float = 10.0,
    cooling_rate: float = 0.97,
    seed: int = 42,
) -> dict:
    rng = random.Random(seed)

    greedy_result = greedy_coloring(graph)
    start_k = max(1, greedy_result["num_colors"])

    best_coloring = greedy_result["coloring"][:]
    best_k = start_k
    best_conflicts = 0

    for k in range(start_k - 1, 0, -1):
        candidate_coloring, candidate_conflicts = _anneal_for_k(
            graph=graph,
            k=k,
            iterations=iterations,
            initial_temperature=initial_temperature,
            cooling_rate=cooling_rate,
            rng=rng,
        )

        if candidate_conflicts == 0:
            best_coloring = candidate_coloring
            best_k = k
            best_conflicts = 0
        else:
            break

    return {
        "algorithm": "Simulated Annealing",
        "coloring": best_coloring,
        "num_colors": best_k,
        "conflicts": best_conflicts,
        "is_optimal": False,
    }
