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

## Kiểm tra nhanh đã thành công

- Frontend build thành công (`npm run build`)
- Backend compile thành công (`python -m compileall app`)

## PHỤ LỤC

### Phụ lục A - Mã nguồn

Mã nguồn của đề tài được lưu trữ tại:

- <https://github.com/ThaianhHiu/DoAnChuyenNganh>

Dự án bao gồm hai phần chính:

- Backend: xây dựng bằng Python (FastAPI)
- Frontend: xây dựng bằng React

### Phụ lục B - Dữ liệu DIMACS

Ví dụ file dữ liệu:

```text
c Sample graph
p edge 5 4
e 1 2
e 1 3
e 2 3
e 3 4
```

### Phụ lục C - Kết quả thực nghiệm

Ví dụ kết quả:

- Greedy: num_colors = 4, runtime = 1.2 ms
- Branch and Bound: num_colors = 3, runtime = 150 ms
- Simulated Annealing: num_colors = 3, runtime = 80 ms

### Phụ lục D - Hướng dẫn sử dụng

```powershell
cd backend
python -m pip install -r requirements.txt
uvicorn app.main:app --reload
```
