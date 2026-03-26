# Đồ án so sánh 3 thuật toán tô màu đồ thị trên DIMACS

Đồ án full-stack gồm:

- Backend: FastAPI + Python
- Frontend: React + Vite + TypeScript

## Mục tiêu

So sánh 3 thuật toán tô màu đồ thị trên cùng một dữ liệu DIMACS Graph Coloring:

- Tham lam (Greedy)
- Nhánh cận (Branch and Bound)
- Simulated Annealing (SA)

Chỉ số so sánh:

- Số màu sử dụng
- Thời gian chạy (ms)
- Số xung đột (conflicts)
- Tính hợp lệ nghiệm (is_valid)
- Có tối ưu hay không (is_optimal)

## Cấu trúc dự án

```text
Code/
  backend/
    app/
      algorithms/
        branch_and_bound.py
        greedy.py
        simulated_annealing.py
      benchmark.py
      dimacs_parser.py
      main.py
      models.py
    data/dimacs/
      sample_triangle.col
      sample_cycle5.col
      sample_bipartite.col
    requirements.txt
  frontend/
    src/
      api/client.ts
      components/ResultTable.tsx
      App.tsx
      styles.css
    package.json
  README.md
```

## Chạy backend

```powershell
cd backend
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API chính:

- `GET /datasets`: danh sách file DIMACS có sẵn trong `backend/data/dimacs`
- `POST /upload-dimacs`: upload file `.col`
- `POST /run-comparison`: chạy benchmark cho 3 thuật toán

## Chạy frontend

```powershell
cd frontend
npm install
npm run dev
```

Mở trình duyệt tại:

- <http://127.0.0.1:5173>

## Cấu hình API khi deploy web

Frontend đọc URL backend từ biến môi trường Vite:

- `VITE_API_BASE_URL`

Ví dụ:

- Local: `VITE_API_BASE_URL=http://127.0.0.1:8000`
- Production: `VITE_API_BASE_URL=https://your-backend.onrender.com`

Với Vercel, thêm biến này trong Project Settings -> Environment Variables rồi redeploy.

## Lưu ý deploy Backend trên Render

Render có thể tự chọn Python rất mới (ví dụ 3.14), trong khi một số dependency như `pydantic-core==2.27.1` chưa có wheel tương thích. Khi đó build sẽ thất bại do cố compile Rust.

Project đã thêm sẵn file `backend/runtime.txt` với nội dung `python-3.12.8` để cố định phiên bản Python ổn định cho Render.

Nếu service đã tạo trước đó, chỉ cần push commit mới rồi redeploy là Render sẽ dùng phiên bản trong runtime.txt.

## Input DIMACS

Định dạng `.col`:

```text
c comment line
p edge <so_dinh> <so_canh>
e <u> <v>
e <u> <v>
...
```

## Bộ dữ liệu benchmark DIMACS thực tế

Bạn có thể tải các file benchmark từ:

- <https://mat.tepper.cmu.edu/COLOR/instances.html>

Sau đó upload file `.col` trên giao diện, hoặc copy vào `backend/data/dimacs`.

## Gợi ý để làm báo cáo đồ án

1. Mô tả mô hình bài toán Graph Coloring và giá trị ứng dụng.
2. Phân tích nguyên lý của 3 thuật toán.
3. Trình bày thiết kế hệ thống FE/BE.
4. Chọn 5-10 bộ dữ liệu DIMACS để benchmark.
5. So sánh kết quả theo bảng và biểu đồ.
6. Đánh giá trade-off giữa chất lượng nghiệm và tốc độ.

## Kiểm tra nhanh đã thành công

- Frontend build thành công (`npm run build`)
- Backend compile thành công (`python -m compileall app`)
