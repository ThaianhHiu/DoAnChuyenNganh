from __future__ import annotations

from app.models import Graph


class DimacsParseError(ValueError):
    pass


def parse_dimacs_col(content: str) -> Graph:
    num_vertices: int | None = None
    edges: list[tuple[int, int]] = []

    for raw_line in content.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("c"):
            continue

        parts = line.split()
        if parts[0] == "p":
            if len(parts) != 4 or parts[1] != "edge":
                raise DimacsParseError(f"Invalid p-line: {line}")
            try:
                num_vertices = int(parts[2])
            except ValueError as exc:
                raise DimacsParseError(f"Invalid vertex count in line: {line}") from exc
            continue

        if parts[0] == "e":
            if len(parts) != 3:
                raise DimacsParseError(f"Invalid e-line: {line}")
            if num_vertices is None:
                raise DimacsParseError("Missing p edge line before edge definitions")
            try:
                u = int(parts[1]) - 1
                v = int(parts[2]) - 1
            except ValueError as exc:
                raise DimacsParseError(f"Invalid edge vertices in line: {line}") from exc
            if u < 0 or v < 0 or u >= num_vertices or v >= num_vertices:
                raise DimacsParseError(f"Edge out of range in line: {line}")
            if u != v:
                edges.append((u, v))
            continue

        raise DimacsParseError(f"Unsupported line: {line}")

    if num_vertices is None:
        raise DimacsParseError("DIMACS data does not contain a valid 'p edge n m' line")

    return Graph(num_vertices=num_vertices, edges=edges)
