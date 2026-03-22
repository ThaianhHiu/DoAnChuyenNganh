from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(slots=True)
class Graph:
    num_vertices: int
    edges: list[tuple[int, int]]
    adj: list[set[int]] = field(init=False)

    def __post_init__(self) -> None:
        self.adj = [set() for _ in range(self.num_vertices)]
        for u, v in self.edges:
            if u == v:
                continue
            self.adj[u].add(v)
            self.adj[v].add(u)

    @property
    def num_edges(self) -> int:
        return sum(len(nei) for nei in self.adj) // 2

    @property
    def degrees(self) -> list[int]:
        return [len(nei) for nei in self.adj]
