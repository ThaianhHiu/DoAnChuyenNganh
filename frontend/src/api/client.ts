const API_BASE = "http://127.0.0.1:8000";

export type Dataset = {
  name: string;
  num_vertices: number;
  num_edges: number;
};

export type AlgoResult = {
  algorithm: string;
  num_colors: number;
  conflicts: number;
  runtime_ms: number;
  is_valid: boolean;
  is_optimal: boolean;
  timed_out?: boolean;
  coloring?: number[];
};

export type ComparisonResponse = {
  dataset_name: string;
  graph: {
    num_vertices: number;
    num_edges: number;
    edges?: Array<[number, number]> | null;
  };
  results: AlgoResult[];
};

export type RunPayload = {
  dataset_name?: string;
  dimacs_content?: string;
  sa_iterations: number;
  sa_initial_temperature: number;
  sa_cooling_rate: number;
  bb_timeout_seconds: number;
  seed: number;
};

export async function getDatasets(): Promise<Dataset[]> {
  const res = await fetch(`${API_BASE}/datasets`);
  if (!res.ok) {
    throw new Error("Failed to load datasets");
  }
  const data = (await res.json()) as { datasets: Dataset[] };
  return data.datasets;
}

export async function uploadDimacs(file: File): Promise<void> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE}/upload-dimacs`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail ?? "Upload failed");
  }
}

export async function runComparison(payload: RunPayload): Promise<ComparisonResponse> {
  const res = await fetch(`${API_BASE}/run-comparison`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail ?? "Run failed");
  }

  return (await res.json()) as ComparisonResponse;
}
