# OpenClaw Dashboard - 解決方案設計 (SD)

## 1. API 規格

### 1.1 GET /api/projects
**描述**：取得所有專案的開發狀態

**請求**：無

**回應**：
```json
{
  "projects": [
    {
      "name": "obster-dashboard",
      "path": "/home/crawd_user/project/obster-dashboard",
      "stage": "prd",
      "iteration": 1,
      "quality_score": 85,
      "blocking_errors": [],
      "updated_at": "2026-04-12T17:15:00.000Z"
    }
  ],
  "timestamp": "2026-04-12T17:15:30.000Z"
}
```

**錯誤回應**：
- `500`: 檔案讀取失敗

---

### 1.2 GET /api/cronjobs
**描述**：取得 Cron Job 監控資料

**請求 Query Parameters**：
- `limit` (可選, int): 限制每個 service 的 log 行數，預設 10

**回應**：
```json
{
  "cronjobs": [
    {
      "name": "obster-monitor",
      "status": "active",
      "last_run": "2026-04-12T17:10:00.000Z",
      "exit_code": 0,
      "recent_logs": ["Service started", "Task completed successfully"]
    }
  ],
  "timestamp": "2026-04-12T17:15:30.000Z"
}
```

**實作方式**：
```bash
systemctl show obster-monitor --property=ActiveState,ExecMainStatus,ActiveEnterTimestamp
journalctl --since "1 hour ago" -u obster-monitor --no-pager -n 10
```

---

### 1.3 GET /api/agents
**描述**：取得 Agent 健康度狀態

**請求 Query Parameters**：
- `timeout_minutes` (可選, int): 判定為異常的時間閾值，預設 30

**回應**：
```json
{
  "agents": [
    {
      "name": "Argus",
      "status": "healthy",
      "last_response": "2026-04-12T17:12:00.000Z",
      "minutes_ago": 3
    },
    {
      "name": "Hephaestus",
      "status": "unhealthy",
      "last_response": "2026-04-12T16:30:00.000Z",
      "minutes_ago": 45
    }
  ],
  "timestamp": "2026-04-12T17:15:30.000Z"
}
```

**實作方式**：
```bash
# 呼叫 Telegram Bot API 取得最後更新
curl -s "https://api.telegram.org/bot${TOKEN}/getUpdates?allowed_updates=message"
```

---

### 1.4 GET /api/logs
**描述**：取得執行日誌

**請求 Query Parameters**：
- `limit` (可選, int): 限制回傳筆數，預設 20

**回應**：
```json
{
  "logs": [
    {
      "filename": "2026-04-12_17-10-00_exec.json",
      "path": "/home/crawd_user/.openclaw/workspace/logs/executions/2026-04-12_17-10-00_exec.json",
      "timestamp": "2026-04-12T17:10:00.000Z",
      "content": { /* JSON log content */ }
    }
  ],
  "count": 20,
  "timestamp": "2026-04-12T17:15:30.000Z"
}
```

---

### 1.5 GET /api/health
**描述**：系統健康檢查

**回應**：
```json
{
  "status": "healthy",
  "uptime_seconds": 3600,
  "version": "1.0.0"
}
```

---

## 2. 資料庫 Schema

本系統不使資料庫，所有資料來自即時檔案讀取。

### 專案狀態 (從 .dev_status.json)
```
dev_status = {
    stage: str,          # "prd" | "dev" | "test" | "security"
    iteration: int,
    quality_score: int,   # 0-100
    quality_details: dict,
    completeness: int,    # 0-100
    summary: str,
    next_action: str,
    updated_at: str       # ISO 8601
}
```

### Agent 狀態 (從 Telegram API 回應快取)
```
agent = {
    name: str,
    status: str,          # "healthy" | "unhealthy" | "unknown"
    last_response: str,   # ISO 8601
    minutes_ago: int
}
```

---

## 3. 錯誤處理

### 3.1 檔案不存在
```python
if not Path(config_path).exists():
    logger.warning(f"Config file not found: {config_path}")
    return {"projects": [], "error": "No projects found"}
```

### 3.2 systemctl 執行失敗
```python
result = subprocess.run(
    ["systemctl", "show", service_name],
    capture_output=True, text=True
)
if result.returncode != 0:
    logger.error(f"systemctl failed: {result.stderr}")
    return {"status": "unknown", "error": result.stderr}
```

### 3.3 Telegram API 失敗
```python
try:
    response = requests.get(telegram_url, timeout=5)
    response.raise_for_status()
except requests.RequestException as e:
    logger.error(f"Telegram API error: {e}")
    return {"status": "unknown", "error": str(e)}
```

---

## 4. 模組介面

### 4.1 ProjectReader
```python
class ProjectReader:
    @staticmethod
    def get_all_projects(project_base_path: str) -> List[ProjectInfo]:
        """列舉所有專案的 .dev_status.json"""

    @staticmethod
    def read_dev_status(project_path: str) -> Optional[DevStatus]:
        """讀取單一專案的 dev_status"""
```

### 4.2 CronJobMonitor
```python
class CronJobMonitor:
    @staticmethod
    def get_service_status(service_name: str) -> ServiceStatus:
        """執行 systemctl show"""

    @staticmethod
    def get_recent_logs(service_name: str, lines: int = 10) -> List[str]:
        """執行 journalctl"""
```

### 4.3 AgentHealthChecker
```python
class AgentHealthChecker:
    def __init__(self, bot_token: str):
        self.bot_token = bot_token

    def get_last_message_time(self, agent_name: str) -> Optional[datetime]:
        """呼叫 Telegram getUpdates API"""

    def check_all_agents(self, timeout_minutes: int = 30) -> List[AgentStatus]:
        """檢查所有 agent 並標記狀態"""
```

### 4.4 LogReader
```python
class LogReader:
    @staticmethod
    def get_recent_executions(log_dir: str, limit: int = 20) -> List[ExecutionLog]:
        """讀取執行日誌目錄"""
```

---

## 5. 前端結構

### 5.1 路由
- `/` - 主 Dashboard 頁面（四面板）

### 5.2 元件結構
```
Dashboard
├── Header (標題、刷新時間)
├── ProjectStatusPanel
├── CronJobPanel
├── AgentHealthPanel
└── ExecutionLogPanel
```

### 5.3 狀態管理
使用 React Context + useReducer 管理全局狀態，定時輪詢 API。

### 5.4 樣式
Tailwind CSS + 自定義暗色主題配置（CSS Variables）。

---

## 6. 環境變數

| 變數 | 必要性 | 說明 |
|------|--------|------|
| TELEGRAM_BOT_TOKEN | 可選 | Telegram Bot Token，未設定則 Agent 面板顯示 N/A |
| PROJECTS_PATH | 必填 | 專案根目錄，預設 `/home/crawd_user/project` |
| LOGS_PATH | 必填 | 執行日誌目錄，預設 `/home/crawd_user/.openclaw/workspace/logs/executions` |
| REFRESH_INTERVAL | 可選 | 自動刷新間隔，預設 30000ms (30秒) |

---

## 7. Docker 設定

### Dockerfile
- 多階段建構（Build + Runtime）
- Python 3.11 slim image
- Nginx Alpine 執行 reverse proxy
- 非 root 使用者執行

### docker-compose.yml
- 單一 service
- port 3000:80
- volume mount 唯讀
- restart: unless-stopped