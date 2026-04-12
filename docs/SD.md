# SD - System Design

## 1. API 規格

### Base URL
- Development: `http://localhost:8000`
- Production: via Nginx reverse proxy at `/api`

### Content Type
All requests and responses use `application/json`

---

### GET /api/status/projects

**描述**：取得所有 OpenClaw 專案的開發狀態

**資料來源**：
- 讀取 `/home/crawd_user/project/{project}/docs/.dev_status.json`
- 若檔案不存在或解析失敗，回傳空陣列

**Response 200**:
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "name": "string",
        "path": "string",
        "stage": "prd|dev|test|security|done",
        "quality_score": 85,
        "blocking_errors": [],
        "updated_at": "2026-04-12T18:10:00Z"
      }
    ]
  },
  "fetched_at": "2026-04-12T18:10:30Z"
}
```

**Error Response 500**:
```json
{
  "success": false,
  "error": "Failed to read project status files",
  "details": "string"
}
```

---

### GET /api/status/cronjobs

**描述**：取得 Cron Job 監控狀態

**資料來源**：
1. `systemctl list-units --type=service --all` - 列出所有 systemd services
2. `journalctl -u {service_name} --since "30 minutes ago" --no-pager` - 取得最近日誌

**Response 200**:
```json
{
  "success": true,
  "data": {
    "cronjobs": [
      {
        "name": "openclaw-argus.service",
        "display_name": "Argus Agent",
        "status": "active|running|inactive|failed",
        "last_run": "2026-04-12T18:00:00Z",
        "last_exit_code": 0,
        "is_healthy": true,
        "recent_logs": ["log line 1", "log line 2"]
      }
    ]
  },
  "fetched_at": "2026-04-12T18:10:30Z"
}
```

---

### GET /api/status/agents

**描述**：取得所有 Telegram Agent 的健康度狀態

**資料來源**：
- 讀取設定檔 `/home/crawd_user/.openclaw/agents.json` 或各 agent 設定
- 每個 agent 的 Telegram Bot API getUpdates 最後 message 時間
- 異常閾值：30 分鐘未回應

**Agent 清單**：
- Argus
- Hephaestus
- Atlas
- Hestia
- Hermes
- Main

**Response 200**:
```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "name": "Argus",
        "bot_token": "placeholder",
        "last_response": "2026-04-12T18:00:00Z",
        "is_healthy": true,
        "minutes_since_response": 10
      },
      {
        "name": "Hephaestus",
        "last_response": "2026-04-12T17:30:00Z",
        "is_healthy": false,
        "minutes_since_response": 40
      }
    ]
  },
  "fetched_at": "2026-04-12T18:10:30Z"
}
```

---

### GET /api/status/logs

**描述**：取得最近 20 筆執行日誌

**資料來源**：
- `/home/crawd_user/.openclaw/workspace/logs/executions/*.log`
- 按修改時間倒序排列，取最近 20 筆

**Response 200**:
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "filename": "exec-20260412-180000.log",
        "path": "/home/crawd_user/.openclaw/workspace/logs/executions/exec-20260412-180000.log",
        "timestamp": "2026-04-12T18:00:00Z",
        "status": "success|failure|unknown",
        "summary": "Task completed successfully",
        "error_count": 0
      }
    ],
    "total_count": 20,
    "fetched_at": "2026-04-12T18:10:30Z"
  }
}
```

---

### GET /api/health

**描述**：健康檢查端點

**Response 200**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime_seconds": 3600
}
```

---

## 2. 錯誤處理

### 錯誤碼定義

| HTTP Code | 錯誤類型 | 說明 |
|-----------|---------|------|
| 400 | Bad Request | 參數格式錯誤 |
| 404 | Not Found | 資源不存在 |
| 500 | Internal Error | 伺服器錯誤 |
| 503 | Service Unavailable | 外部依賴不可用 |

### 錯誤處理策略

1. **檔案讀取失敗**：回傳空資料，不拋例外
2. **命令執行超時**：5 秒 timeout，回傳超時錯誤
3. **Agent API 失敗**：標記為未知狀態，不影響其他 agent

---

## 3. 資料庫 Schema

本系統使用 SQLite 本地資料庫，僅用於快取設定和歷史資料。

```sql
-- Agent 健康度歷史
CREATE TABLE agent_health_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_name TEXT NOT NULL,
    last_response_at TEXT,
    is_healthy BOOLEAN,
    recorded_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 專案狀態快取
CREATE TABLE project_status_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_name TEXT UNIQUE NOT NULL,
    stage TEXT,
    quality_score INTEGER,
    cached_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. 模組結構

### Backend 模組

```
backend/
├── main.py              # FastAPI 應用入口
├── routers/
│   ├── __init__.py
│   ├── projects.py      # /api/status/projects
│   ├── cronjobs.py      # /api/status/cronjobs
│   ├── agents.py        # /api/status/agents
│   └── logs.py          # /api/status/logs
├── services/
│   ├── __init__.py
│   ├── system_service.py     # systemctl/journalctl
│   ├── agent_service.py      # Telegram Bot API
│   └── log_service.py        # Log 檔案讀取
├── models/
│   ├── __init__.py
│   └── schemas.py       # Pydantic models
└── config.py            # 設定檔
```

### Frontend 模組

```
frontend/
├── src/
│   ├── App.tsx
│   ├── components/
│   │   ├── ProjectStatusPanel.tsx
│   │   ├── CronJobPanel.tsx
│   │   ├── AgentHealthPanel.tsx
│   │   └── ExecutionLogPanel.tsx
│   ├── hooks/
│   │   └── useAutoRefresh.ts
│   ├── services/
│   │   └── api.ts
│   └── styles/
│       └── theme.ts
└── package.json
```

---

## 5. 設定檔案

### 系統路徑設定
```json
{
  "openclaw_base": "/home/crawd_user/.openclaw",
  "projects_base": "/home/crawd_user/project",
  "executions_log_dir": "/home/crawd_user/.openclaw/workspace/logs/executions",
  "agents_config": "/home/crawd_user/.openclaw/agents.json"
}
```

---

*最後更新：2026-04-12*