import { useEffect, useMemo, useState } from "react";
import {
  AlgoResult,
  Dataset,
  getDatasets,
  runComparison,
  uploadDimacs,
} from "./api/client";
import ResultTable from "./components/ResultTable";

const GRAPH_COLOR_PALETTE = [
  "#2a9d8f",
  "#f4a261",
  "#e76f51",
  "#457b9d",
  "#8ab17d",
  "#6d597a",
  "#ffb703",
  "#3a86ff",
  "#ef476f",
  "#118ab2",
];

function RuntimeChart({ results }: { results: AlgoResult[] }) {
  const maxRuntime = useMemo(() => {
    if (results.length === 0) {
      return 1;
    }
    return Math.max(...results.map((r) => r.runtime_ms), 1);
  }, [results]);

  return (
    <div className="panel runtime-panel reveal" style={{ ["--delay" as string]: "220ms" }}>
      <div className="panel-headline">
        <h2>Biểu đồ thời gian chạy</h2>
        <p>So sánh trực quan tốc độ giữa các thuật toán trên cùng một đồ thị.</p>
      </div>
      <div className="chart-grid">
        {results.map((item, index) => {
          const widthPercent = (item.runtime_ms / maxRuntime) * 100;
          return (
            <div key={item.algorithm} className="chart-row">
              <div className="chart-label">{item.algorithm}</div>
              <div className="chart-bar-wrap">
                <div
                  className="chart-bar"
                  style={{
                    width: `${Math.max(widthPercent, 2)}%`,
                    animationDelay: `${index * 120}ms`,
                  }}
                />
              </div>
              <div className="chart-value">{item.runtime_ms.toFixed(2)} ms</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SmallGraphPreview({
  graph,
  results,
}: {
  graph: {
    num_vertices: number;
    num_edges: number;
    edges?: Array<[number, number]> | null;
    preview_max_vertices?: number;
  };
  results: AlgoResult[];
}) {
  const [activeAlgorithm, setActiveAlgorithm] = useState<string>(results[0]?.algorithm ?? "");

  useEffect(() => {
    if (!results.some((result) => result.algorithm === activeAlgorithm)) {
      setActiveAlgorithm(results[0]?.algorithm ?? "");
    }
  }, [results, activeAlgorithm]);

  const activeResult = useMemo(
    () => results.find((item) => item.algorithm === activeAlgorithm),
    [results, activeAlgorithm]
  );

  const positions = useMemo(() => {
    const total = graph.num_vertices;
    if (total === 0) {
      return [] as Array<{ x: number; y: number }>;
    }

    const center = 175;
    const radius = 120;
    return Array.from({ length: total }, (_, i) => {
      const angle = (2 * Math.PI * i) / total - Math.PI / 2;
      return {
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle),
      };
    });
  }, [graph.num_vertices]);

  if (!graph.edges) {
    return null;
  }

  return (
    <section className="panel graph-preview reveal" style={{ ["--delay" as string]: "180ms" }}>
      <div className="panel-headline">
        <h2>Mô phỏng tô màu đồ thị tự động</h2>
        <p>
          Tự hiển thị khi số đỉnh nhỏ hơn hoặc bằng ngưỡng đã chọn. Bạn có thể đổi thuật toán để xem cách phân màu
          khác nhau.
        </p>
      </div>

      <div className="algorithm-tabs" role="tablist" aria-label="Chọn thuật toán xem đồ thị">
        {results.map((item) => (
          <button
            key={item.algorithm}
            type="button"
            className={`algo-tab ${activeAlgorithm === item.algorithm ? "is-active" : ""}`}
            onClick={() => setActiveAlgorithm(item.algorithm)}
          >
            {item.algorithm}
          </button>
        ))}
      </div>

      {activeResult?.coloring && activeResult.coloring.length === graph.num_vertices ? (
        <div className="graph-preview-layout">
          <svg className="graph-canvas" viewBox="0 0 350 350" role="img" aria-label="Đồ thị đã tô màu">
            {graph.edges.map(([u, v], idx) => {
              const from = positions[u];
              const to = positions[v];
              if (!from || !to) {
                return null;
              }

              return (
                <line
                  key={`${u}-${v}-${idx}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  className="graph-edge"
                />
              );
            })}

            {positions.map((point, idx) => {
              const colorIndex = activeResult.coloring?.[idx] ?? 0;
              return (
                <g key={`node-${idx}`}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={18}
                    fill={GRAPH_COLOR_PALETTE[colorIndex % GRAPH_COLOR_PALETTE.length]}
                    className="graph-node"
                  />
                  <text x={point.x} y={point.y} textAnchor="middle" dominantBaseline="middle" className="graph-label">
                    {idx + 1}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="graph-meta">
            <div>
              <span>Thuật toán đang xem</span>
              <strong>{activeResult.algorithm}</strong>
            </div>
            <div>
              <span>Số màu sử dụng</span>
              <strong>{activeResult.num_colors}</strong>
            </div>
            <div>
              <span>Ngưỡng hiển thị</span>
              <strong>{graph.preview_max_vertices ?? 10}</strong>
            </div>
            <div>
              <span>Đỉnh / Cạnh</span>
              <strong>
                {graph.num_vertices} / {graph.num_edges}
              </strong>
            </div>
          </div>
        </div>
      ) : (
        <p className="subtle-note">Không có dữ liệu tô màu để vẽ cho thuật toán đang chọn.</p>
      )}
    </section>
  );
}

export default function App() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>("");
  const [inlineInput, setInlineInput] = useState<string>("");

  const [saIterations, setSaIterations] = useState<number>(20000);
  const [saInitialTemp, setSaInitialTemp] = useState<number>(4.0);
  const [saCoolingRate, setSaCoolingRate] = useState<number>(0.9995);
  const [bbTimeout, setBbTimeout] = useState<number>(20);
  const [seed, setSeed] = useState<number>(42);
  const [graphPreviewThreshold, setGraphPreviewThreshold] = useState<number>(10);

  const [results, setResults] = useState<AlgoResult[]>([]);
  const [graphInfo, setGraphInfo] = useState<{
    num_vertices: number;
    num_edges: number;
    edges?: Array<[number, number]> | null;
  } | null>(null);
  const [currentDatasetName, setCurrentDatasetName] = useState<string>("-");

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const insights = useMemo(() => {
    if (results.length === 0) {
      return null;
    }

    const fastest = results.reduce((best, row) => (row.runtime_ms < best.runtime_ms ? row : best));
    const mostCompact = results.reduce((best, row) => (row.num_colors < best.num_colors ? row : best));
    const validCount = results.filter((row) => row.is_valid).length;

    return {
      fastest,
      mostCompact,
      validCount,
    };
  }, [results]);

  async function refreshDatasets() {
    try {
      const data = await getDatasets();
      setDatasets(data);
      if (!selectedDataset && data.length > 0) {
        setSelectedDataset(data[0].name);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    refreshDatasets();
  }, []);

  async function handleUpload(file: File | null) {
    if (!file) {
      return;
    }

    setError("");
    try {
      await uploadDimacs(file);
      await refreshDatasets();
      setSelectedDataset(file.name);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleRun() {
    setLoading(true);
    setError("");

    try {
      const response = await runComparison({
        dataset_name: selectedDataset || undefined,
        dimacs_content: inlineInput.trim() ? inlineInput : undefined,
        sa_iterations: saIterations,
        sa_initial_temperature: saInitialTemp,
        sa_cooling_rate: saCoolingRate,
        bb_timeout_seconds: bbTimeout,
        seed,
        graph_preview_max_vertices: graphPreviewThreshold,
      });

      setResults(response.results);
      setGraphInfo(response.graph);
      setCurrentDatasetName(response.dataset_name);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="bg-orb orb-a" aria-hidden="true" />
      <div className="bg-orb orb-b" aria-hidden="true" />

      <header className="hero reveal" style={{ ["--delay" as string]: "0ms" }}>
        <div className="hero-copy">
          <p className="hero-eyebrow">ĐỒ ÁN CHUYÊN NGÀNH _ LÊ SINH THÁI _ 3122410379 </p>
          <h1>So sánh Nhánh Cận, Tham Lam, Simulated Annealing</h1>
          <p>
            Benchmark trên DIMACS Graph Coloring: đo số màu, thời gian chạy và mức độ hợp lệ của
            nghiệm.
          </p>
        </div>
        <div className="hero-badges">
          <div className="hero-badge">
            <span>Bộ dữ liệu khả dụng</span>
            <strong>{datasets.length}</strong>
          </div>
          <div className="hero-badge">
            <span>Thuật toán</span>
            <strong>3</strong>
          </div>
          <div className="hero-badge">
            <span>Định dạng</span>
            <strong>DIMACS .col</strong>
          </div>
        </div>
      </header>

      <section className="panel controls reveal" style={{ ["--delay" as string]: "90ms" }}>
        <div className="panel-headline">
          <h2>Dữ liệu DIMACS</h2>
          <p>Tùy chỉnh tham số ngay trên giao diện và chạy benchmark chỉ với một lần bấm.</p>
        </div>
        <div className="control-grid">
          <label className="input-field">
            Chọn dataset:
            <select value={selectedDataset} onChange={(e) => setSelectedDataset(e.target.value)}>
              <option value="">-- Chọn file --</option>
              {datasets.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name} ({d.num_vertices} đỉnh, {d.num_edges} cạnh)
                </option>
              ))}
            </select>
          </label>

          <label className="input-field">
            Upload file .col:
            <input
              type="file"
              accept=".col"
              onChange={async (e) => {
                const file = e.target.files?.[0] ?? null;
                await handleUpload(file);
                e.target.value = "";
              }}
            />
          </label>

          <label className="input-field">
            SA iterations:
            <input
              type="number"
              min={500}
              step={500}
              value={saIterations}
              onChange={(e) => setSaIterations(Number(e.target.value))}
            />
          </label>

          <label className="input-field">
            SA nhiệt độ ban đầu:
            <input
              type="number"
              min={0.1}
              step={0.1}
              value={saInitialTemp}
              onChange={(e) => setSaInitialTemp(Number(e.target.value))}
            />
          </label>

          <label className="input-field">
            SA hệ số làm nguội:
            <input
              type="number"
              min={0.9}
              max={0.99999}
              step={0.0001}
              value={saCoolingRate}
              onChange={(e) => setSaCoolingRate(Number(e.target.value))}
            />
          </label>

          <label className="input-field">
            BnB timeout (giây):
            <input
              type="number"
              min={1}
              max={300}
              step={1}
              value={bbTimeout}
              onChange={(e) => setBbTimeout(Number(e.target.value))}
            />
          </label>

          <label className="input-field">
            Seed:
            <input type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value))} />
          </label>

          <label className="input-field">
            Ngưỡng hiển thị đồ thị (đỉnh):
            <input
              type="number"
              min={1}
              max={200}
              step={1}
              value={graphPreviewThreshold}
              onChange={(e) => setGraphPreviewThreshold(Number(e.target.value))}
            />
          </label>
        </div>

        <label className="input-field">
          Hoặc nhập DIMACS trực tiếp:
          <textarea
            rows={8}
            placeholder="p edge 3 3&#10;e 1 2&#10;e 2 3&#10;e 1 3"
            value={inlineInput}
            onChange={(e) => setInlineInput(e.target.value)}
          />
        </label>

        <div className="actions-row">
          <button onClick={handleRun} disabled={loading}>
            {loading ? "Đang chạy benchmark..." : "Chạy so sánh"}
          </button>
          <p className="subtle-note">Mẹo: đồ thị lớn nên đặt timeout BnB cao hơn để tăng cơ hội tìm nghiệm tốt.</p>
        </div>

        {error && <p className="error">{error}</p>}
      </section>

      {(graphInfo || insights) && (
        <section className="panel stats reveal" style={{ ["--delay" as string]: "150ms" }}>
          <div className="panel-headline">
            <h2>Thông tin test hiện tại</h2>
            <p>Tổng quan nhanh để nhận biết thuật toán nổi trội cho dataset hiện tại.</p>
          </div>
          <div className="stat-grid">
            {graphInfo && (
              <>
                <div>
                  <span>Dataset</span>
                  <strong>{currentDatasetName}</strong>
                </div>
                <div>
                  <span>Số đỉnh</span>
                  <strong>{graphInfo.num_vertices}</strong>
                </div>
                <div>
                  <span>Số cạnh</span>
                  <strong>{graphInfo.num_edges}</strong>
                </div>
              </>
            )}
            {insights && (
              <>
                <div>
                  <span>Nhanh nhất</span>
                  <strong>{insights.fastest.algorithm}</strong>
                </div>
                <div>
                  <span>Ít màu nhất</span>
                  <strong>{insights.mostCompact.algorithm}</strong>
                </div>
                <div>
                  <span>Nghiệm hợp lệ</span>
                  <strong>
                    {insights.validCount}/{results.length}
                  </strong>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {results.length > 0 && (
        <>
          {graphInfo && <SmallGraphPreview graph={graphInfo} results={results} />}
          <ResultTable results={results} />
          <RuntimeChart results={results} />
        </>
      )}
    </div>
  );
}
