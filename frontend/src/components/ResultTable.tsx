import { AlgoResult } from "../api/client";

type Props = {
  results: AlgoResult[];
};

export default function ResultTable({ results }: Props) {
  return (
    <div className="panel">
      <h2>Kết quả so sánh</h2>
      <div className="result-table-wrap" role="region" aria-label="Bảng kết quả" tabIndex={0}>
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
                <td data-label="Thuật toán">{row.algorithm}</td>
                <td data-label="Số màu">{row.num_colors}</td>
                <td data-label="Xung đột">{row.conflicts}</td>
                <td data-label="Thời gian (ms)">{row.runtime_ms.toFixed(3)}</td>
                <td data-label="Hợp lệ">
                  <span className={`pill ${row.is_valid ? "pill-success" : "pill-danger"}`}>
                    {row.is_valid ? "Có" : "Không"}
                  </span>
                </td>
                <td data-label="Tối ưu">
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
    </div>
  );
}
