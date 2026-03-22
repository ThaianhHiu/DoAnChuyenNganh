import { AlgoResult } from "../api/client";

type Props = {
  results: AlgoResult[];
};

export default function ResultTable({ results }: Props) {
  return (
    <div className="panel">
      <h2>Kết quả so sánh</h2>
      <table className="result-table">
        <thead>
          <tr>
            <th>Thuật toán</th>
            <th>Số màu</th>
            <th>Xung đột</th>
            <th>Thời gian (ms)</th>
            <th>Hợp lệ</th>
            <th>Tối ưu</th>
          </tr>
        </thead>
        <tbody>
          {results.map((row) => (
            <tr key={row.algorithm}>
              <td>{row.algorithm}</td>
              <td>{row.num_colors}</td>
              <td>{row.conflicts}</td>
              <td>{row.runtime_ms.toFixed(3)}</td>
              <td>
                <span className={`pill ${row.is_valid ? "pill-success" : "pill-danger"}`}>
                  {row.is_valid ? "Có" : "Không"}
                </span>
              </td>
              <td>
                <span
                  className={`pill ${
                    row.is_optimal ? "pill-success" : row.timed_out ? "pill-warn" : "pill-neutral"
                  }`}
                >
                  {row.is_optimal ? "Có" : row.timed_out ? "Hết thời gian" : "Không"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
