# OpenClaw Dashboard PRD

## 1. 產品願景

OpenClaw Dashboard 是一個本地 Web UI 儀表板，專為監控小龍蝦（OpenClaw）系統的整體運行狀態而設計。部署於 VPS (srv1318420)，供運維人員透過瀏覽器即時掌握系統健康度。儀表板整合專案開發狀態、排程任務、Agent 健康度與執行日誌，實現單一介面掌握全域。

---

## 2. User Story

- **身為運維人員，我希望**在單一介面看到所有系統元件的狀態，**以便**快速定位問題而非逐一登入檢查
- **身為開發人員，我希望**即時了解 Cron Job 的執行結果與歷史，**以便**掌握排程任務是否正常運行
- **身為系統管理者，我希望**監控所有 Telegram Agent 的回應狀態，**以便**在 Agent 無回應超過 30 分鐘時立即獲知
- **身為開發團隊，我希望**查看最近 20 筆執行日誌，**以便**追蹤系統行為與偵錯

---

## 3. 功能分級

### P0 (核心功能)
- 四大面板顯示：專案狀態、Cron Job、Agent 健康度、執行日誌
- 每 30 秒自動刷新資料
- 支援手動重新整理按鈕

### P1 (重要功能)
- Cron Job 狀態以顏色區分正常/異常
- Agent 健康度以紅/綠燈標記超過 30 分鐘未回應的 Agent
- 日誌內容可展開/收合

### P2 (增強功能)
- 最後更新時間戳記顯示
- 错误状态主動提示
- 支援 Docker Container 部署

---

## 4. 非功能需求

- **效能**：API 響應時間 < 500ms，前端頁面載入 < 2s
- **可用性**：Dashboard 可用率達 99%（systemd service 需設定 auto-restart）
- **擴展性**：可新增更多 Agent 監控，架構支援水平擴展
- **安全性**：所有 API 僅供內網訪問，不對外暴露；敏感資料（TELEGRAM_BOT_TOKEN）透過環境變數注入

---

## 5. 技術選型

| 層面 | 技術 | 選擇理由 |
|------|------|----------|
| 前端框架 | React + TypeScript | 型別安全元件化，利于維護 |
| 後端框架 | FastAPI | 非同步、高效能，自動 OpenAPI 文件 |
| 樣式 | Tailwind CSS | 暗色主題快速實作 |
| 部署 | Docker + Nginx | 容器化部署，統一通訊端口 |
| 容器編排 | docker-compose | 單一 YAML 管理多容器 |

---

## 6. UI/UX 色彩計劃

- **主色 (Primary)**：#1a1a2e（深藍黑）- 頁面背景
- **次色 (Secondary)**：#16213e（深藍）- 面板背景
- **強調色 (Accent)**：#0f3460（深藍紫）- 按鈕、標題
- **成功色 (Success)**：#00ff88（亮綠）- 健康狀態燈
- **錯誤色 (Error)**：#ff4757（紅色）- 異常、錯誤
- **警告色 (Warning)**：#ffa502（橙黃）- 警示狀態
- **文字色 (Text)**：#eaeaea（淺灰白）- 主要文字
- **字體**：Inter, system-ui, sans-serif

---

## 7. 成功指標

1. **系統可用性**：Dashboard 正常運行時間 > 99%（每月停機時間 < 7 小時）
2. **資料刷新率**：自動刷新間隔 30 秒，確保資料延遲 < 1 分鐘
3. **Agent 異常檢測**：當 Agent 超過 30 分鐘未回應時，系統可正確標記並顯示
4. **Cron Job 監控完整性**：可正確顯示所有 systemd service 的狀態與最近日誌

---

## 8. 面板規格

### 8.1 開發任務狀態面板
- 資料來源：`/home/crawd_user/project/*/docs/.dev_status.json`
- 顯示欄位：專案名稱、當前 stage、quality_score、blocking_errors
- 面板標題：📋 開發任務狀態

### 8.2 Cron Job 監控面板
- 資料來源：`systemctl status` + `journalctl --since "1 hour ago"`
- 顯示內容：service 名稱、狀態、最後執行時間、exit code、最近日誌
- 面板標題：⏰ Cron Job 監控

### 8.3 Agent 健康度面板
- 資料來源：Telegram Bot API getUpdates
- 顯示內容：Agent 名稱（Argus/Hephaestus/Atlas/Hestia/Hermes/Main）、狀態、最後回應時間
- 異常閾值：30 分鐘未回應標記為 unhealthy
- 面板標題：🤖 Agent 健康度

### 8.4 執行 Log 面板
- 資料來源：`/home/crawd_user/.openclaw/workspace/logs/executions/*.json`
- 顯示內容：最近 20 筆 log 檔案，含時間戳與內容
- 面板標題：📜 執行 Log