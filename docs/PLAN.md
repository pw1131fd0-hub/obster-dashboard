# Obster Dashboard - 系統建構計畫書

> **文件版本**: 1.0.0
> **更新日期**: 2026-04-13
> **目標系統**: VPS srv1318420 (小龍蝦 OpenClaw 系統監控)

---

## 1. Vision

打造一個即時、資訊視覺化、高可用性的本地 Web 儀表板，用於監控小龍蝦（OpenClaw）分散式系統的整體運行狀態。系統管理員透過瀏覽器即可一目了然地掌握所有專案開發進度、排程任務健康度、AI Agent 存活狀態，以及過往執行紀錄。

核心價值主張：
- **單一視圖**：所有監控資訊集中於一個頁面，無需切換多個終端或工具
- **主動警示**：Cron Job 失敗、Agent 超時無回應、Blocking Errors 出現時立即可見
- **免操作維運**：每 30 秒自動刷新，管理員無需手動點擊
- **暗色專業**：深色主題減少長時間監控的眼睛疲勞

---

## 2. User Experience

### 2.1 頁面佈局

```
┌─────────────────────────────────────────────────────────────┐
│  🦞 OpenClaw Dashboard                    [重新整理] 按鈕   │
│  小龍蝦系統監控儀表板 | VPS: srv1318420                     │
│  ● 每 30 秒自動刷新                          Last: 12:00:00 │
├───────────────────────────┬─────────────────────────────────┤
│                           │                                 │
│   📋 開發任務狀態          │   ⏰ Cron Job 監控              │
│   (ProjectStatusPanel)    │   (CronJobPanel)                │
│                           │                                 │
│   - 專案名稱               │   - Service Name               │
│   - Stage (prd/dev/test)  │   - Status (active/inactive)   │
│   - Quality Score         │   - Last Run Timestamp          │
│   - Blocking Errors       │   - Exit Code                   │
│                           │   - Recent Logs (折疊)          │
│                           │                                 │
├───────────────────────────┼─────────────────────────────────┤
│                           │                                 │
│   🤖 Agent 健康度          │   📜 執行 Log                  │
│   (AgentHealthPanel)      │   (ExecutionLogPanel)           │
│                           │                                 │
│   - Agent 名稱             │   - Filename                    │
│   - 狀態 (綠/紅/灰)        │   - Timestamp                   │
│   - Last Response Time    │   - Content (可展開 JSON)       │
│   - Minutes Ago           │   - 最近 20 筆                  │
│                           │                                 │
└───────────────────────────┴─────────────────────────────────┘
│              OpenClaw Dashboard v1.0.0 | Docker Container   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 四面板說明

**開發任務狀態面板 (ProjectStatusPanel)**
- 讀取各專案 `docs/.dev_status.json`
- 顯示欄位：專案名稱、當前 Stage（prd/dev/test/security）、迭代次數、Quality Score、Blocking Errors 列表
- Stage 以顏色標籤區分：prd=藍、dev=黃、test=橙、security=紅
- Quality Score < 85 顯示紅色警告

**Cron Job 監控面板 (CronJobPanel)**
- 使用 `systemctl show` 讀取 systemd service 狀態
- 使用 `journalctl --since "1 hour ago" -u <service>` 讀取最近日誌
- 顯示 Service Name、ActiveState、Last Run Time、Exit Code
- Exit Code 0=綠色正常、非零=紅色錯誤
- Recent Logs 預設折疊，最多顯示 5 行

**Agent 健康度面板 (AgentHealthPanel)**
- 讀取 Telegram Bot API `getUpdates` 推算最後回應時間
- Agent 清單：Argus, Hephaestus, Atlas, Hestia, Hermes, Main
- 超過 30 分鐘未回應標記為 `unhealthy`（紅色）
- 30 分鐘內回應標記為 `healthy`（綠色）
- 無法取得資料顯示為 `unknown`（灰色）

**執行 Log 面板 (ExecutionLogPanel)**
- 讀取 `/home/crawd_user/.openclaw/workspace/logs/executions/` 下 `.json` 檔案
- 按修改時間倒序排列，僅取最新 20 筆
- 預設顯示 Filename 和 Timestamp，點擊展開顯示完整 JSON Content
- JSON Content 使用等寬字體，支援橫向滾動

### 2.3 互動行為

| 互動 | 行為 |
|------|------|
| 頁面載入 | 立即發送 API 請求，30 秒後開始自動刷新 |
| 點擊「重新整理」 | 立即發送 API 請求，重置計時器 |
| 點擊 Log 卡片 | 展開/折疊 JSON Content |
| Error Banner | 紅色框顯示錯誤訊息，可點擊「重新整理」嘗試恢復 |

---

## 3. Architecture Overview

### 3.1 系統元件

```
                    ┌──────────────────────────────────────┐
                    │          Browser (Client)             │
                    │         React SPA + Tailwind         │
                    └─────────────────┬────────────────────┘
                                      │ HTTP :80
                                      ▼
┌─────────────────────────────────────────────────────────────┐
│                      Docker Container                        │
│  ┌────────────────┐              ┌────────────────────┐    │
│  │   nginx:alpine │              │  FastAPI (uvicorn) │    │
│  │   Port 80      │  ───────►    │    Port 8000       │    │
│  │   (Reverse     │              │                    │    │
│  │    Proxy)      │              │                    │    │
│  └────────────────┘              └────────┬─────────────┘    │
│                                          │                   │
│                          ┌───────────────┼───────────────┐   │
│                          │               │               │   │
│                          ▼               ▼               ▼   │
│                   ┌────────────┐  ┌────────────┐  ┌────────┐│
│                   │ Projects   │  │ Systemd /  │  │ Telegram││
│                   │ Path       │  │ journalctl │  │ Bot API ││
│                   └────────────┘  └────────────┘  └────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 3.2 技術棧

| 層次 | 技術 | 版本 |
|------|------|------|
| Frontend | React + TypeScript + Vite | React 18.x, Vite 5.x |
| Styling | Tailwind CSS | 3.x |
| State | React Context + useReducer | - |
| Backend | FastAPI + Pydantic | 0.109.x |
| HTTP Client | requests (Python) | 2.31.x |
| Server | uvicorn (ASGI) | 0.27.x |
| Proxy | nginx | alpine |
| Container | Docker | - |

---

## 4. Technical Decisions

### 4.1 為何選擇 FastAPI 而非 Flask

- **自動 OpenAPI 文件**：訪問 `/docs` 即可獲得互動式 API 文件
- **Pydantic 原生整合**：請求/回應模型自動驗證，減少膠水代碼
- **非同步支援**：未來可輕易改為 async 資料讀取，提升效能
- **型別安全**：與 TypeScript 前端共享 Pydantic Model 概念

### 4.2 為何選擇 React Context 而非 Redux/Zustand

- **儀表板狀態簡單**：僅四個資料集合，無需全域狀態管理庫
- **避免过度抽象**：Context + useReducer 足以應付 30 秒刷新邏輯
- **零依賴**：無需安裝額外 npm 套件

### 4.3 為何選擇 nginx 而非 FastAPI 直接服務靜態檔案

- **職責分離**：API 服務和靜態檔案服務解耦，各自優化
- **生產驗證**：nginx 處理靜態檔案的快取、壓縮、Range Request 更成熟
- **靈活性**：未來可輕易新增 WebSocket 或其他服務到 nginx

### 4.4 為何 Tailwind 而非 CSS Modules

- **一致性**：預先定義的顏色系統（primary/secondary/accent）確保全站視覺統一
- **開發速度**：無需切換檔案，內聯樣式直接看到效果
- **響應式設計**：`lg:grid-cols-2` 一行達成跨斷點佈局

### 4.5 Cron Job 監控的局限性與對策

- **局限性**：systemctl 和 journalctl 需要主機 root 權限
- **對策**：Docker container 以 `privileged: true` 或掛載 `/var/run/dbus` 和 `/run/systemd` socket
- **備用方案**：若無法取得 systemd 資料，則显示「需要更高權限」提示

### 4.6 Agent 健康度檢測的局限性與對策

- **局限性**：Telegram Bot API 無法直接查詢「最後收到特定使用者訊息的時間」
- **對策**：輪詢 `getUpdates` 並比對訊息內容中的 agent 名稱作為 proxy
- **已知問題**：此方法在多個 agent 共享同一個 Bot Token 時準確度較低
- **未來優化**：每個 agent 獨立 Bot Token 或使用 Redis 追蹤最後活動時間

---

## 5. Directory Structure

```
obster-dashboard/
├── backend/
│   ├── main.py              # FastAPI 應用程式（路由、模型、商業邏輯）
│   ├── requirements.txt     # Python 依賴
│   ├── Dockerfile           # Python 3.11 slim 容器
│   └── tests/
│       └── test_api.py      # Pytest 單元測試
│
├── frontend/
│   ├── index.html           # 入口 HTML
│   ├── package.json         # Node 依賴定義
│   ├── vite.config.ts       # Vite 建構設定
│   ├── tailwind.config.js   # Tailwind 黑暗主題顏色定義
│   ├── postcss.config.js    # PostCSS 設定
│   ├── tsconfig.json        # TypeScript 設定
│   ├── src/
│   │   ├── main.tsx         # React 入口
│   │   ├── App.tsx          # 主應用元件
│   │   ├── index.css        # Tailwind 入口 + 自訂滾動條樣式
│   │   ├── types.ts         # TypeScript 介面定義
│   │   ├── context/
│   │   │   └── DashboardContext.tsx  # 全域狀態管理
│   │   ├── components/
│   │   │   ├── ProjectStatusPanel.tsx  # 專案狀態面板
│   │   │   ├── CronJobPanel.tsx         # Cron Job 面板
│   │   │   ├── AgentHealthPanel.tsx     # Agent 健康度面板
│   │   │   └── ExecutionLogPanel.tsx    # 執行 Log 面板
│   │   └── __tests__/
│   │       └── setup.ts     # 測試設定（Vitest 全域配置）
│   └── public/
│       └── vite.svg         # 靜態資源
│
├── nginx.conf               # nginx 反向代理設定
├── Dockerfile               # 雙階段建置：React build → nginx 部署
├── Dockerfile.frontend      # 僅建置前端（可選）
├── start.sh                 # 開發模式啟動腳本
└── docs/
    └── PLAN.md              # 本文件
```

---

## 6. Environment Variables

### 6.1 後端環境變數

| 變數名 | 預設值 | 說明 |
|--------|--------|------|
| `PROJECTS_PATH` | `/home/crawd_user/project` | 掃描 `.dev_status.json` 的根目錄 |
| `LOGS_PATH` | `/home/crawd_user/.openclaw/workspace/logs/executions` | 執行日誌檔案目錄 |
| `TELEGRAM_BOT_TOKEN` | `""` | Telegram Bot Token，用於查詢 Agent 最後回應時間 |
| `TIMEOUT_MINUTES` | `30` | Agent 健康度閾值（分鐘），超過此時間未回應視為異常 |
| `REFRESH_INTERVAL` | `30000` | 前端自動刷新間隔（毫秒） |

### 6.2 前端環境變數

| 變數名 | 預設值 | 說明 |
|--------|--------|------|
| `VITE_API_BASE_URL` | `/api` | API 基礎 URL，開發環境指向 localhost:8000 |

### 6.3 Docker 環境變數

```yaml
# docker-compose.yml (待創建)
environment:
  - PROJECTS_PATH=/home/crawd_user/project
  - LOGS_PATH=/home/crawd_user/.openclaw/workspace/logs/executions
  - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
  - TIMEOUT_MINUTES=30
  - REFRESH_INTERVAL=30000
```

---

## 7. Data Layer

### 7.1 資料來源對應

| Panel | 資料來源 | 檔案格式 |
|-------|----------|----------|
| ProjectStatusPanel | `{PROJECTS_PATH}/*/docs/.dev_status.json` | JSON |
| CronJobPanel | `systemctl show`, `journalctl` | 文字剖析 |
| AgentHealthPanel | `https://api.telegram.org/bot{token}/getUpdates` | JSON |
| ExecutionLogPanel | `{LOGS_PATH}/*.json` | JSON |

### 7.2 專案 .dev_status.json 格式

```json
{
  "stage": "dev",
  "iteration": 3,
  "quality_score": 92,
  "completeness": 80,
  "summary": "完成用戶認證模組重構",
  "next_action": "整合測試通過後進入 UAT",
  "updated_at": "2026-04-13T08:30:00.000Z"
}
```

### 7.3 執行日誌格式（預期）

```json
{
  "execution_id": "exec-20260413-001",
  "project": "obster-worker",
  "status": "success",
  "duration_ms": 45230,
  "started_at": "2026-04-13T08:00:00.000Z",
  "completed_at": "2026-04-13T08:00:45.230Z",
  "steps": [
    {"name": "fetch", "status": "success", "duration_ms": 1200},
    {"name": "process", "status": "success", "duration_ms": 40000},
    {"name": "save", "status": "success", "duration_ms": 2030}
  ]
}
```

### 7.4 資料生命週期

| 資料類型 | 刷新頻率 | 用戶端快取策略 |
|----------|----------|----------------|
| 專案狀態 | 30 秒 | `stale-while-revalidate` |
| Cron Job | 30 秒 | 不快取 |
| Agent 健康度 | 30 秒 | 不快取 |
| 執行日誌 | 30 秒 | 不快取 |

---

## 8. API Contract

### 8.1 API Endpoints 總覽

| Method | Path | 說明 | Response |
|--------|------|------|----------|
| GET | `/api/health` | 健康檢查 | `HealthResponse` |
| GET | `/api/projects` | 取得所有專案狀態 | `ProjectResponse` |
| GET | `/api/cronjobs` | 取得 Cron Job 監控資料 | `CronJobResponse` |
| GET | `/api/agents` | 取得 Agent 健康度 | `AgentResponse` |
| GET | `/api/logs` | 取得執行日誌 | `LogResponse` |
| GET | `/api/config` | 取得系統設定 | `object` |

### 8.2 Response Models

```typescript
// ProjectResponse
{
  "projects": [
    {
      "name": "string",
      "path": "string",
      "stage": "string",           // prd | dev | test | security
      "iteration": "number",
      "quality_score": "number",   // 0-100
      "blocking_errors": "string[]",
      "updated_at": "string"       // ISO8601
    }
  ],
  "timestamp": "string"
}

// CronJobResponse
{
  "cronjobs": [
    {
      "name": "string",
      "status": "string",         // active | inactive | failed | error
      "last_run": "string | null",
      "exit_code": "number | null",
      "recent_logs": "string[]"
    }
  ],
  "timestamp": "string"
}

// AgentResponse
{
  "agents": [
    {
      "name": "string",
      "status": "string",         // healthy | unhealthy | unknown | error
      "last_response": "string | null",
      "minutes_ago": "number | null"
    }
  ],
  "timestamp": "string"
}

// LogResponse
{
  "logs": [
    {
      "filename": "string",
      "path": "string",
      "timestamp": "string",
      "content": "object"
    }
  ],
  "count": "number",
  "timestamp": "string"
}

// HealthResponse
{
  "status": "string",             // healthy
  "uptime_seconds": "number",
  "version": "string"
}
```

### 8.3 Error Handling

所有端點遵循以下錯誤格式：

```json
{
  "detail": "Error message description",
  "code": "ERROR_CODE"
}
```

| HTTP Status | 情境 |
|-------------|------|
| 200 | 成功 |
| 500 | 伺服器內部錯誤（如 systemctl 超時、檔案讀取失敗） |

---

## 9. Core Subsystems

### 9.1 專案狀態掃描器 (`/api/projects`)

**職責**：遍历 `{PROJECTS_PATH}` 下的每個目錄，尋找 `docs/.dev_status.json`

**邏輯流程**：
1. 接收 `GET /api/projects`
2. 檢查 `PROJECTS_PATH` 是否存在，不存在回傳空陣列
3. 使用 `Path.iterdir()` 列舉子目錄
4. 對每個子目錄執行 `docs/.dev_status.json` 存在性檢查
5. 以 JSON 解析內容，Pydantic 模型驗證欄位
6. 錯誤時記錄 logger 並跳過該專案
7. 回傳 `ProjectResponse`

**錯誤處理**：
- 目錄無 `docs/` 子目錄 → 跳過
- JSON 解析失敗 → 跳過，log error
- 檔案讀取 IO 錯誤 → 跳過，log error

### 9.2 Systemd 狀態讀取器 (`/api/cronjobs`)

**職責**：查詢 systemd services 並解析狀態和日誌

**預設檢查的 Services**：
- `obster-monitor`
- `obster-cron`
- `openclaw-scheduler`

**邏輯流程**：
1. 接收 `GET /api/cronjobs?limit=10`
2. 對每個 service name 執行：
   a. `systemctl show <name>` → 剖析 `ActiveState=` 和 `ExecMainStatus=`
   b. `journalctl --since "1 hour ago" -u <name> --no-pager -n <limit>`
3. 回傳 `CronJobResponse`

**Timeout 保護**：subprocess 設定 `timeout=5` 秒

**錯誤處理**：
- `subprocess.TimeoutExpired` → status="timeout"
- 其他 Exception → status="error"，logs=[str(e)]

### 9.3 Telegram Agent 健康度追蹤器 (`/api/agents`)

**職責**：查詢 Telegram Bot API 推算各 Agent 最後回應時間

**邏輯流程**：
1. 接收 `GET /api/agents?timeout_minutes=30`
2. 檢查 `TELEGRAM_BOT_TOKEN` 是否設定，未設定回傳 all unknown
3. 呼叫 `GET https://api.telegram.org/bot{token}/getUpdates?limit=100`
4. 遍歷所有 update，根據 `message.chat.username` 或 `message.text` 比對 agent 名稱
5. 記錄每個 agent 的最新訊息 timestamp
6. 計算 `minutes_ago = (now - last_timestamp) / 60`
7. `minutes_ago >= TIMEOUT_MINUTES` → status="unhealthy"

**Agent 清單**（由環境變數 `AGENTS` 控制）：
```python
AGENTS = ["Argus", "Hephaestus", "Atlas", "Hestia", "Hermes", "Main"]
```

### 9.4 執行日誌收集器 (`/api/logs`)

**職責**：讀取並解析執行日誌目錄下的 JSON 檔案

**邏輯流程**：
1. 接收 `GET /api/logs?limit=20`
2. 檢查 `LOGS_PATH` 是否存在，不存在回傳空陣列
3. 使用 `Path.glob("*.json")` 取得所有 JSON 檔案
4. 按 `stat().st_mtime` 倒序排序
5. 取前 `limit` 個檔案讀取內容
6. 回傳 `LogResponse`

**錯誤處理**：
- 個別檔案讀取失敗 → 跳過該檔，log error
- 目錄不存在 → 回傳空陣列，log warning

---

## 10. Frontend Specification

### 10.1 技術棧

| 項目 | 技術 |
|------|------|
| Framework | React 18 |
| Language | TypeScript (strict mode) |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| State Management | React Context + useReducer |
| Testing | Vitest + React Testing Library |

### 10.2 顏色系統（Dark Theme）

```javascript
// tailwind.config.js
colors: {
  primary: '#0F172A',      // 頁面背景
  secondary: '#1E293B',    // 卡片/面板背景
  accent: '#3B82F6',       // 主要按鈕、連結
  text: '#F8FAFC',         // 主文字
  'text-muted': '#94A3B8', // 次要文字
  success: '#22C55E',     // 正常/健康
  warning: '#F59E0B',      // 警告
  error: '#EF4444',        // 錯誤/異常
}
```

### 10.3 響應式斷點

| 斷點 | 螢幕寬度 | 面板佈局 |
|------|----------|----------|
| Default | < 1024px | 單欄（所有面板垂直堆疊） |
| lg | >= 1024px | 雙欄（2x2 網格） |

### 10.4 組件層級

```
App
└── DashboardProvider (Context)
    └── DashboardContent
        ├── Header (重新整理按鈕 + Last Updated)
        ├── Error Banner (錯誤提示)
        ├── Auto-refresh indicator
        ├── Four Panels Grid (lg:grid-cols-2)
        │   ├── ProjectStatusPanel
        │   ├── CronJobPanel
        │   ├── AgentHealthPanel
        │   └── ExecutionLogPanel
        └── Footer
```

### 10.5 自動刷新機制

```typescript
// DashboardContext.tsx
useEffect(() => {
  fetchData(); // 初始載入
  const interval = setInterval(fetchData, 30000); // 30 秒輪詢
  return () => clearInterval(interval);
}, [fetchData]);
```

### 10.6 無障礙考量

- 所有面板使用 `<h2>` 標題標籤
- 按鈕有 `:focus-visible` 樣式
- 顏色對比度符合 WCAG AA 標準
- Error Banner 使用 `role="alert"` 語義

---

## 11. DevOps & Deployment

### 11.1 Docker 建構

**雙階段建構流程**：

```
Stage 1: frontend-builder
  ├── node:20-alpine
  ├── npm install
  ├── npm run build (Vite production build)
  └── 產出: /app/frontend/dist/

Stage 2: nginx (最終映像)
  ├── nginx:alpine
  ├── COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html
  └── COPY nginx.conf /etc/nginx/conf.d/default.conf
```

**FastAPI 容器**（獨立的 `backend/Dockerfile`）：
```
python:3.11-slim
├── pip install -r requirements.txt
├── COPY backend/ .
└── uvicorn main:app --host 0.0.0.0 --port 8000
```

### 11.2 Docker Compose 部署架構（待實現）

```yaml
version: '3.8'
services:
  nginx:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "80:80"
    volumes:
      - /var/run/dbus:/var/run/dbus:ro
      - /run/systemd:/run/systemd:ro
    environment:
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
    restart: unless-stopped

  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - /home/crawd_user/project:/home/crawd_user/project:ro
      - /home/crawd_user/.openclaw/workspace/logs:/home/crawd_user/.openclaw/workspace/logs:ro
      - /var/run/dbus:/var/run/dbus:ro
      - /run/systemd:/run/systemd:ro
    environment:
      - PROJECTS_PATH=/home/crawd_user/project
      - LOGS_PATH=/home/crawd_user/.openclaw/workspace/logs/executions
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
      - TIMEOUT_MINUTES=30
    restart: unless-stopped
    privileged: true
```

### 11.3 部署步驟

1. **SSH 登入 VPS**：`ssh root@srv1318420`
2. **進入工作目錄**：`cd /opt/obster-dashboard`
3. **拉取最新程式碼**：`git pull origin master`
4. **設定環境變數**：
   ```bash
   export TELEGRAM_BOT_TOKEN="your_token_here"
   ```
5. **重建並啟動**：
   ```bash
   docker-compose build --no-cache
   docker-compose up -d
   ```
6. **驗證部署**：
   ```bash
   curl http://localhost/api/health
   ```

### 11.4 健康監控

- **外部檢查**：`curl http://localhost/api/health` 預期 `{"status":"healthy"}`
- **容器狀態**：`docker-compose ps` 所有容器應為 `Up`
- **日誌檢查**：`docker-compose logs -f backend`

### 11.5 備份與災難復原

- **日誌持久化**：確保 `{LOGS_PATH}` 目錄有定期備份
- **配置持久化**：環境變數寫入 `.env` 檔案，纳入版本控制忽略清單
- **復原演練**：每季執行一次從備份還原的演練

---

## 12. Testing Strategy

### 12.1 測試金字塔

```
        ┌─────────┐
        │   E2E   │  (Playwright - 可選，未來擴展)
        │   2-4   │
        ├─────────┤
        │  Integr │  (Pytest - API 端點)
        │   10+   │
        ├─────────┤
        │  Unit   │  (Vitest - React Components)
        │   20+   │
        └─────────┘
```

### 12.2 後端測試（Pytest）

**位置**：`backend/tests/test_api.py`

**覆蓋的端點**：
- `GET /api/health` - 3 個測試
- `GET /api/projects` - 3 個測試
- `GET /api/cronjobs` - 3 個測試
- `GET /api/agents` - 3 個測試
- `GET /api/logs` - 4 個測試
- `GET /api/config` - 2 個測試

**執行方式**：
```bash
cd backend
pytest -v
```

**Mock 策略**：
- 檔案系統操作：使用 `pytest-mock` 或 monkeypatch 隔離
- subprocess 呼叫：使用 `unittest.mock.patch`
- Telegram API：使用 `requests_mock` 模擬 HTTP 回應

### 12.3 前端測試（Vitest + RTL）

**位置**：`frontend/src/__tests__/`

**測試範例**：

```typescript
// ProjectStatusPanel.test.tsx
import { render, screen } from '@testing-library/react';
import { ProjectStatusPanel } from '../components/ProjectStatusPanel';

test('displays project name when projects exist', () => {
  // Arrange: Mock DashboardContext with sample data
  // Act: render(<ProjectStatusPanel />)
  // Assert: screen.getByText('obster-dashboard')
});
```

**執行方式**：
```bash
cd frontend
npm test
```

### 12.4 測試覆蓋率目標

| 類型 | 目標覆蓋率 |
|------|------------|
| Backend API | > 80% 行覆蓋 |
| Frontend Components | > 70% 行覆蓋 |

### 12.5 CI/CD 整合（未來擴展）

```yaml
# .github/workflows/test.yml (待創建)
name: Test
on: [push, pull_request]
jobs:
  backend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cd backend && pip install -r requirements.txt
      - run: pytest --cov=.

  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cd frontend && npm install && npm test
```

---

## 13. Agent Team Prompt

```
你是一個專精於 DevOps 與系統監控的 AI Agent。你的任務是確保 obster-dashboard 系統的穩定運行，並持續優化其效能和可靠性。

## 你的核心職責

1. **系統監控**
   - 定期檢查 API 端點是否正常回應
   - 監控 Docker 容器 CPU/記憶體使用量
   - 追蹤 error log 的頻率和類型

2. **部署自動化**
   - 確保 `git pull` + `docker-compose up -d` 流程無痛執行
   - 監控部署後的系統可用性

3. **效能優化**
   - 識別 API 回應時間瓶頸
   - 建議前端載入優化（程式碼分割、懒加載）
   - 評估是否需要加入 Redis 快取層

4. **故障排除**
   - 當 Dashboard 顯示 error/banner 時，主動分析原因
   - 區分「一次性錯誤」（網路瞬斷）和「系統性錯誤」（代碼 bug）
   - 對於系統性錯誤，產生 Issue 記錄到 Notion

## 緊急事故處理流程

當發現系統異常時，依序執行：

1. **評估影響範圍**：是單一 panel 異常還是全站不可用？
2. **檢查日誌**：`docker-compose logs -f backend`
3. **驗證依賴服務**：systemctl status、journalctl
4. **決定響應**：
   - 服務瞬斷 → 記錄後持續監控
   - 代碼問題 → 建立 Issue，通知負責人
   - 基礎設施問題 → 立即通知 DevOps Lead

## 與其他 Agent 的協作

- **Argus**：負責安全監控，若發現 security stage 的專案有新增 blocking_error，主動通知
- **Hephaestus**：負責部署自動化，協調版本發布時的 Dashboard 更新
- **Atlas**：負責基礎設施，若需要變更 VPS 網路設定，提前溝通
- **Hestia**：負責配置管理，.dev_status.json 的 schema 變更需通知
- **Hermes**：負責對外溝通，若用戶回報 Dashboard 問題，作為第一線接洽
- **Main**：統籌協調，所有跨 Agent 的變更需通報

## 記錄與報告

每週一向 Main 發送週報，格式：

```
## Obster Dashboard 週報 [日期區間]

### 系統可用性
- API 平均回應時間: XXXms
- 錯誤率: X.XX%
- 總刷新次數: XXX

### 事件摘要
- [事件1] 描述、影響、處置
- [事件2] ...

### 優化建議
1. ...
2. ...

### 下週規劃
- [ ] ...
- [ ] ...
```
