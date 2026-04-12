# SA - System Architecture

## 1. 系統架構總覽

```
┌─────────────────────────────────────────────────────────────────┐
│                     Obster Dashboard                             │
│                   (Docker Container)                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │   React SPA     │    │   FastAPI       │                    │
│  │   (Frontend)    │◄──►│   (Backend)     │                    │
│  │   Port 3000     │    │   Port 8000     │                    │
│  └─────────────────┘    └────────┬────────┘                    │
│                                 │                               │
│                    ┌────────────┴────────────┐                 │
│                    ▼                         ▼                  │
│          ┌─────────────────┐      ┌─────────────────┐         │
│          │  System APIs   │      │   File System   │         │
│          │  (systemctl,    │      │   (logs,       │         │
│          │   journalctl)   │      │    configs)    │         │
│          └─────────────────┘      └─────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

## 2. 元件職責

### Frontend (React + TypeScript)
- 職責：UI 渲染、資料呈現、使用者互動
- 職責邊界：僅負責呈現從 API 取得的資料，不直接存取系統資源
- 更新頻率：每 30 秒自動刷新所有面板

### Backend (FastAPI)
- 職責：API 路由、資料聚合、遠端系統整合
- 職責邊界：作為中介層，收集系統資料並提供 REST API
- 非同步處理：使用 asyncio 執行 systemctl/journalctl 命令

### Nginx (Reverse Proxy)
- 職責：負載平衡、静态资源缓存、SSL termination（本机无 SSL）
- 路由规则：
  - `/` → Frontend (port 3000)
  - `/api` → Backend (port 8000)

## 3. 資料流

### 開發任務狀態面板
```
docs/.dev_status.json → Backend Read → API Response → Frontend Display
                     (每 30 秒刷新)
```

### Cron Job 監控面板
```
systemctl status → journalctl --since → Backend Parse → API Response → Frontend Display
                                     (每 30 秒刷新)
```

### Agent 健康度面板
```
Telegram Bot API (getUpdates) → Last Message Time → Backend Calculate → API Response → Frontend Display
                                                                        (超 30 分鐘標記異常)
```

### 執行日誌面板
```
/home/crawd_user/.openclaw/workspace/logs/executions/*.log → Backend Read → API Response → Frontend Display
                                                        (每 30 秒刷新)
```

## 4. 部署方式

### Docker Compose 架構
```yaml
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"

  backend:
    build: ./backend
    ports:
      - "8000:8000"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - frontend
      - backend
```

### 主機環境
- VPS: srv1318420
- 運行目錄: /home/crawd_user/project/obster-dashboard
- 存取 URL: http://localhost:80

## 5. 模組介面

### Backend API Endpoints

#### GET /api/status/projects
取得所有 OpenClaw 專案的開發狀態
```json
Response: {
  "projects": [
    {
      "name": "string",
      "stage": "prd|dev|test|security|done",
      "quality_score": 0-100,
      "blocking_errors": ["string"]
    }
  ]
}
```

#### GET /api/status/cronjobs
取得 Cron Job 狀態
```json
Response: {
  "cronjobs": [
    {
      "name": "string",
      "status": "active|inactive|failed",
      "last_run": "ISO timestamp",
      "is_healthy": boolean
    }
  ]
}
```

#### GET /api/status/agents
取得 Agent 健康度
```json
Response: {
  "agents": [
    {
      "name": "string",
      "last_response": "ISO timestamp",
      "is_healthy": boolean
    }
  ]
}
```

#### GET /api/status/logs
取得執行日誌
```json
Response: {
  "logs": [
    {
      "filename": "string",
      "timestamp": "ISO timestamp",
      "content": "string",
      "status": "success|failure"
    }
  ]
}
```

---

*最後更新：2026-04-12*