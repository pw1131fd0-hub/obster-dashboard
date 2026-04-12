# OpenClaw Dashboard - 系統架構 (SA)

## 1. 系統架構圖

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                         │
│                     React 18 + Vite + Tailwind                   │
│                      http://localhost:3000                       │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP/REST
┌──────────────────────────────▼──────────────────────────────────┐
│                      Docker Container (Port 3000→80)            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Nginx (Reverse Proxy)                    │ │
│  │                      localhost:80                           │ │
│  └──────────────────────────────┬─────────────────────────────┘ │
│                                 │ proxy_pass                   │
│                    ┌───────────▼──────────────┐                │
│                    │    FastAPI Backend        │                │
│                    │     (Python 3.11)         │                │
│                    │     Port 8000             │                │
│                    └───────────┬────────────────┘                │
└───────────────────────────────┼─────────────────────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
    ┌─────▼─────┐        ┌─────▼─────┐        ┌─────▼─────┐
    │  File     │        │  Systemd  │        │ Telegram   │
    │  System   │        │  Journal  │        │ Bot API    │
    │  Read    │        │  Read     │        │  Read      │
    └───────────┘        └───────────┘        └───────────┘
```

## 2. 元件職責

### Frontend (React + Vite)
- **職責**：渲染 UI 面板、每 30 秒輪詢 API、顯示即時狀態
- **職責邊界**：只負責展示，不做資料處理
- **環境變數**：`VITE_API_URL` 指向後端位址

### Backend (FastAPI)
- **職責**：
  - 讀取本地檔案系統（`.dev_status.json`、`/home/crawd_user/.openclaw/workspace/logs/executions/`）
  - 執行 systemctl 和 journalctl 命令
  - 向 Telegram Bot API 發送請求取得最後訊息時間
- **API 端點**：
  - `GET /api/projects` - 專案狀態
  - `GET /api/cronjobs` - Cron Job 狀態
  - `GET /api/agents` - Agent 健康度
  - `GET /api/logs` - 執行日誌
  - `GET /api/health` - 系統健康檢查

### Nginx (Reverse Proxy)
- **職責**：將 80 port 流量導向 FastAPI (localhost:8000)
- **配置**：簡單反向代理，無快取

## 3. 資料流

### 專案狀態資料流
```
docs/.dev_status.json (每個專案)
    → FastAPI /api/projects 讀取
    → JSON 格式化
    → React Panel 渲染
```

### Agent 健康度資料流
```
Telegram Bot API (getUpdates)
    → FastAPI 快取最後訊息時間
    → 計算距今時間差
    → 超過 30 分鐘標記為異常
    → React Panel 顯示狀態指示燈
```

### Cron Job 資料流
```
systemctl show <service>
journalctl --since "30 minutes ago" -u <service>
    → FastAPI subprocess 執行
    → 解析輸出
    → JSON 回傳
    → React Panel 顯示
```

## 4. 部署方式

### Docker Compose 結構
```yaml
services:
  dashboard:
    build: .
    ports:
      - "3000:80"
    volumes:
      - /home/crawd_user/.openclaw/workspace/logs:/app/logs:ro
      - /home/crawd_user/project:/app/projects:ro
    environment:
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
    restart: unless-stopped
    network_mode: host
```

### 環境需求
- Docker & docker-compose 已安裝
- Telegram Bot Token（可選，未設定則 Agent 面板顯示 N/A）
- 讀取許可權：
  - `/home/crawd_user/project/*/docs/.dev_status.json`
  - `/home/crawd_user/.openclaw/workspace/logs/executions/*`
  - systemctl 權限

## 5. 容器網路

使用 `network_mode: host`，讓容器直接使用主機網路，簡化服務發現。

## 6. 資料持久化

所有資料來自即時讀取（無 DB），日誌和分析結果不保存。Volume mount 為唯讀（`:ro`），防止容器修改主機檔案。