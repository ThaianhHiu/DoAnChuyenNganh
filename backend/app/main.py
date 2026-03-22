from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, model_validator

from app.benchmark import run_benchmark
from app.dimacs_parser import DimacsParseError, parse_dimacs_col

BASE_DIR = Path(__file__).resolve().parent.parent
DATASETS_DIR = BASE_DIR / "data" / "dimacs"
DATASETS_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Graph Coloring Benchmark API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RunComparisonRequest(BaseModel):
    dataset_name: str | None = None
    dimacs_content: str | None = None
    sa_iterations: int = Field(default=20000, ge=500, le=500000)
    sa_initial_temperature: float = Field(default=4.0, gt=0)
    sa_cooling_rate: float = Field(default=0.9995, gt=0.9, lt=1.0)
    bb_timeout_seconds: float = Field(default=20.0, gt=0.5, le=300)
    seed: int = Field(default=42, ge=0)
    graph_preview_max_vertices: int = Field(default=10, ge=1, le=200)

    @model_validator(mode="after")
    def check_data_source(self) -> "RunComparisonRequest":
        if not self.dataset_name and not self.dimacs_content:
            raise ValueError("Either dataset_name or dimacs_content must be provided")
        return self


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/datasets")
def list_datasets() -> dict:
    datasets = []
    for path in sorted(DATASETS_DIR.glob("*.col")):
        try:
            graph = parse_dimacs_col(path.read_text(encoding="utf-8"))
            datasets.append(
                {
                    "name": path.name,
                    "num_vertices": graph.num_vertices,
                    "num_edges": graph.num_edges,
                }
            )
        except DimacsParseError:
            continue
    return {"datasets": datasets}


@app.post("/upload-dimacs")
async def upload_dimacs(file: UploadFile = File(...)) -> dict:
    if not file.filename or not file.filename.endswith(".col"):
        raise HTTPException(status_code=400, detail="Only .col files are supported")

    content = (await file.read()).decode("utf-8", errors="ignore")
    try:
        graph = parse_dimacs_col(content)
    except DimacsParseError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    file_path = DATASETS_DIR / file.filename
    file_path.write_text(content, encoding="utf-8")

    return {
        "message": "Uploaded successfully",
        "dataset": {
            "name": file.filename,
            "num_vertices": graph.num_vertices,
            "num_edges": graph.num_edges,
        },
    }


@app.post("/run-comparison")
def run_comparison(payload: RunComparisonRequest) -> dict:
    if payload.dataset_name:
        file_path = DATASETS_DIR / payload.dataset_name
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Dataset not found")
        content = file_path.read_text(encoding="utf-8")
    else:
        content = payload.dimacs_content or ""

    try:
        graph = parse_dimacs_col(content)
    except DimacsParseError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    benchmark = run_benchmark(
        graph=graph,
        sa_iterations=payload.sa_iterations,
        sa_initial_temperature=payload.sa_initial_temperature,
        sa_cooling_rate=payload.sa_cooling_rate,
        bb_timeout_seconds=payload.bb_timeout_seconds,
        seed=payload.seed,
        graph_preview_max_vertices=payload.graph_preview_max_vertices,
    )

    return {
        "dataset_name": payload.dataset_name or "inline-input",
        **benchmark,
    }
