# PRD - OpenClaw 監控儀表板 (Obster Dashboard)

## 1. 產品願景

Obster Dashboard 是一個本地 Web UI 儀表板，專為在 VPS (srv1318420) 上監控小龍蝦（OpenClaw）系統的整體運行狀態而設計。系統管理者透過瀏覽器即可快速掌握所有專案開發進度、排程任務執行狀況、Agent 健康度與執行日誌，無需登入伺服器即可獲得完整的系統洞察。

## 2. User Story

### US-1：系統管理員查看專案狀態
**角色**：身為系統管理員
**我希望**：能在一個頁面上看到所有 OpenClaw 專案的開發狀態（stage、quality_score、blocking_errors）
**以便**：快速識別哪些專案需要關注或干預

### US-2：運維人員監控 Cron Job
**角色**：身為運維人員
**我希望**：能即時看到每個排程任務的最後執行時間、運行狀態與日誌摘要
**以便**：在任務失敗時立即發現並處理，避免問題累積

### US-3：運維人員檢查 Agent 健康度
**角色**：身為運維人員
**我希望**：能看到每個 Telegram Agent（Argus/Hephaestus/Atlas/Hestia/Hermes/Main）的最後回應時間
**以便**：超過 30 分鐘未回應的 Agent 能被自動標記為異常

### US-4：開發人員查詢執行日誌
**角色**：身為開發人員
**我希望**：能快速瀏覽最近 20 筆執行紀錄，包含時間、狀態、錯誤訊息
**以便**：排查問題或追蹤特定操作的執行軌跡

## 3. P0/P1/P2 功能分級

### P0（必須上線）
- 開發任務狀態面板：讀取 docs/.dev_status.json，顯示專案名稱、stage、quality_score、blocking_errors
- Cron Job 監控面板：使用 systemctl status 和 journalctl --since 讀取 systemd service 狀態
- Agent 健康度面板：讀取 Telegram Bot API 的最後 message 時間，超 30 分鐘標記異常
- 執行 Log 面板：讀取 /home/crawd_user/.openclaw/workspace/logs/executions/ 下的 log 檔案
- 每 30 秒自動刷新機制
- 暗色主題 UI

### P1（第一版完成後）
- Cron Job 異常自動報警（Email/Telegram 通知）
- Agent 健康度歷史趨勢圖
- 執行日誌全文檢索

### P2（優化體驗）
- 自訂面板排序與可見度
- 匯出報表功能
- 移動裝置響應式介面

## 4. 非功能需求

### 效能
- 頁面首次載入時間 < 3 秒
- 面板資料刷新不影響使用者操作

### 可用性
- 24/7 運行，預計可用性 99%
- 單一登入無需驗證（本地網路）

### 擴展性
- 支援新增更多 OpenClaw 專案，無需修改程式碼
- Agent 類型可擴展

### 安全性
- 仅限本地网络访问
- 不暴露敏感日志内容

## 5. 技術選型

### 前端
- **Framework**：React 18 + TypeScript
- **原因**：元件化架構利於面板拆分，TypeScript 提供型別安全

### 後端
- **Framework**：FastAPI (Python 3.11+)
- **原因**：非同步效能優異，自動 OpenAPI 文件，與系統整合方便

### 資料庫
- **Solution**：SQLite (本地檔案)
- **原因**：無需獨立資料庫服務，輕量且足夠儲存配置

### 部署工具
- **Solution**：Docker + Docker Compose
- **原因**：環境一致性佳，一鍵部署

## 6. UI/UX 色彩計劃

### 主色
- **背景**：#0f1419（深黑灰）
- **面板背景**：#1a2332（深藍灰）
- **卡片背景**：#242d3d（灰藍）

### 副色
- **主要文字**：#e6edf3（亮白灰）
- **次要文字**：#8b949e（灰）
- **邊框**：#30363d（暗灰）

### 強調色
- **成功/正常**：#3fb950（綠）
- **警告/注意**：#d29922（橙黃）
- **錯誤/異常**：#f85149（紅）
- **資訊/進行中**：#58a6ff（藍）

### 字體
- **主字體**：Inter, -apple-system, sans-serif
- **等寬字體**：JetBrains Mono, monospace

### 佈局原則
- 柵格系統：12 欄佈局
- 面板間距：16px
- 面板內距：20px
- 卡片圓角：8px

## 7. 成功指標

### KPI-1：系統可用性
- 儀表板可訪問率 > 99%（每月正常運行時間 / 總時間）

### KPI-2：資料更新不及時檢出率
- Agent 超過 30 分鐘未回應時，90% 的情況能在 5 分鐘內出現在儀表板的異常清單中

### KPI-3：頁面效能
- Lighthouse Performance Score > 80

---

*最後更新：2026-04-12*