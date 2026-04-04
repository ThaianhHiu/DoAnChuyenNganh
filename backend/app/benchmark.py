from __future__ import annotations

import time

from app.algorithms.branch_and_bound import branch_and_bound_coloring
from app.algorithms.greedy import greedy_coloring
from app.algorithms.simulated_annealing import simulated_annealing_coloring
from app.models import Graph


def _validate_coloring(graph: Graph, coloring: list[int]) -> bool:
    for u, v in graph.edges:
        if coloring[u] == coloring[v]:
            return False
    return True


def run_benchmark(
    graph: Graph,
    sa_iterations: int,
    sa_initial_temperature: float,
    sa_cooling_rate: float,
    sa_min_temperature: float,
    bb_timeout_seconds: float,
    seed: int,
    graph_preview_max_vertices: int = 10,
) -> dict:
    results = []
    include_graph_structure = graph.num_vertices <= graph_preview_max_vertices

    start = time.perf_counter()
    greedy_result = greedy_coloring(graph)
    greedy_time = (time.perf_counter() - start) * 1000
    results.append(
        {
            **greedy_result,
            "runtime_ms": round(greedy_time, 3),
            "is_valid": _validate_coloring(graph, greedy_result["coloring"]),
        }
    )

    start = time.perf_counter()
    bnb_result = branch_and_bound_coloring(graph, timeout_seconds=bb_timeout_seconds)
    bnb_time = (time.perf_counter() - start) * 1000
    results.append(
        {
            **bnb_result,
            "runtime_ms": round(bnb_time, 3),
            "is_valid": _validate_coloring(graph, bnb_result["coloring"]),
        }
    )

    start = time.perf_counter()
    sa_result = simulated_annealing_coloring(
        graph=graph,
        iterations=sa_iterations,
        initial_temperature=sa_initial_temperature,
        cooling_rate=sa_cooling_rate,
        min_temperature=sa_min_temperature,
        seed=seed,
    )
    sa_time = (time.perf_counter() - start) * 1000
    results.append(
        {
            **sa_result,
            "runtime_ms": round(sa_time, 3),
            "is_valid": _validate_coloring(graph, sa_result["coloring"]),
        }
    )

    # If BnB proved optimality, any other valid zero-conflict result with the same
    # color count is also proven optimal for this specific input.
    bnb_row = next((row for row in results if row["algorithm"] == "Branch and Bound"), None)
    if bnb_row and bnb_row.get("is_optimal"):
        optimal_k = bnb_row["num_colors"]
        for row in results:
            if row["algorithm"] == "Branch and Bound":
                continue
            if row["is_valid"] and row["conflicts"] == 0 and row["num_colors"] == optimal_k:
                row["is_optimal"] = True

    return {
        "graph": {
            "num_vertices": graph.num_vertices,
            "num_edges": graph.num_edges,
            "edges": graph.edges if include_graph_structure else None,
            "preview_max_vertices": graph_preview_max_vertices,
        },
        "results": results,
    }
