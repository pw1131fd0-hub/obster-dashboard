# PRD - OpenClaw Dashboard 產品規格書

> **文件版本**: 1.0.0
> **更新日期**: 2026-04-13
> **目標系統**: VPS srv1318420 (小龍蝦 OpenClaw 系統監控)
> **階段**: PRD (Production Ready Definition)

---

## 1. 產品願景

打造一個即時、資訊視覺化、高可用性的本地 Web 儀表板，用於監控小龍蝦（OpenClaw）分散式系統的整體運行狀態。系統管理員透過瀏覽器即可一目了然地掌握所有專案開發進度、排程任務健康度、AI Agent 存活狀態，以及過往執行紀錄。

**給誰用**：VPS 管理員、DevOps 工程師、開發團隊
**解決什麼問題**：無需登入多個終端或工具，單一頁面掌握全系統健康狀態

---

## 2. User Story

### US-001: 系統管理員查看開發進度
**作為** 系統管理員
**我希望** 在單一頁面看到所有專案的開發階段和品質分數
**以便** 快速識別需要關注的專案

### US-002: 監控排程任務健康度
**作為** DevOps 工程師
**我希望** 看到每個 Cron Job 的運行狀態、最後執行時間、是否失敗
**以便** 在任務失敗時立即發現並處理

### US-003: 追蹤 Agent 存活狀態
**作為** 系統管理員
**我希望** 看到所有 Telegram Agent 的最後回應時間
**以便** 在 Agent 無回應超過 30 分鐘時收到警示

### US-004: 查詢執行歷史記錄
**作為** 開發團隊
**我希望** 查看最近 20 筆執行日誌的內容
**以便** 調查任務執行失敗的原因

### US-005: 自動刷新減少手動操作
**作為** 系統管理員
**我希望** 頁面每 30 秒自動刷新一次
**以便** 無需手動點擊即可持續監控系統狀態

---

## 3. 功能分級

### P0 (Must Have - 立即交付)
| 功能 | 描述 |
|------|------|
| 開發任務狀態面板 | 讀取各專案 docs/.dev_status.json，顯示名稱/Stage/Quality Score/Blocking Errors |
| Cron Job 監控面板 | 顯示 systemd service 的 ActiveState/LastRun/ExitCode |
| Agent 健康度面板 | 顯示 6 個 Agent 的最後回應時間，30 分鐘未回應標記異常 |
| 執行 Log 面板 | 讀取最近 20 筆 .json 執行日誌 |

### P1 (Should Have - 下一迭代)
| 功能 | 描述 |
|------|------|
| 單一專案詳情檢視 | 點擊專案卡片展開完整 .dev_status.json |
| Cron Job Log 展開 | 點擊展開查看完整 journalctl 輸出 |
| Log 內容格式化 | 將 JSON 內容以語法高亮顯示 |

### P2 (Nice to Have - 未來擴展)
| 功能 | 描述 |
|------|------|
| 歷史趨勢圖表 | Quality Score 隨時間變化的折線圖 |
| 告警通知 | Cron Job 失敗時發送 Telegram 通知 |
| 自定義刷新間隔 | 用戶可調整 30 秒預設值 |

---

## 4. 非功能需求

### 效能 (Performance)
- **頁面載入時間**: < 2 秒（網路正常情況下）
- **API 回應時間**: < 500ms（不含外部依賴查詢）
- **自動刷新**: 每 30 秒，間隔誤差 ±1 秒

### 可用性 (Availability)
- **服務可用性**: 99% uptime（每月允許不超過 7.2 小時維護窗口）
- **錯誤恢復**: API 失敗時顯示友好錯誤提示，不影響其他面板
- **離線處理**: 單一面板失敗不影響其他三個面板顯示

### 擴展性 (Scalability)
- **支援專案數量**: 最多 50 個專案同時監控
- **日誌保留**: 最近 100 筆執行日誌

### 安全性 (Security)
- **認證**: 部署於內網 VPS，無需公開認證
- **資料隔離**: 僅讀取指定目錄，不訪問系統其他路徑
- **依賴安全**: 定期執行 npm audit / pip audit

---

## 5. 技術選型

| 層次 | 技術 | 選擇理由 |
|------|------|----------|
| 前端框架 | React 18 + TypeScript | 型別安全、Vite 快速建構、生態成熟 |
| 後端框架 | FastAPI + Pydantic | 自動 OpenAPI 文件、原生非同步、Pydantic 模型驗證 |
| 样式框架 | Tailwind CSS | 一致性色彩系統、開發速度快、響應式支援 |
| HTTP Client | requests (Python) | 簡單直觀、足夠應付同步需求 |
| Web Server | uvicorn (ASGI) | 生產級 ASGI 伺服器 |
| 反向代理 | nginx:alpine | 輕量、成熟、職責分離 |
| 容器化 | Docker + Docker Compose | 標準化部署、一致性環境 |
| 主機 | VPS srv1318420 | 現有資源 |

---

## 6. UI/UX 色彩計劃

### 色彩系統（Dark Theme）
```
Primary Background:    #0F172A (深藍黑 - 頁面背景)
Secondary Background:  #1E293B (深灰 - 卡片/面板)
Accent Blue:           #3B82F6 (按鈕/連結)
Success Green:         #22C55E (正常狀態)
Warning Yellow:        #F59E0B (警告狀態)
Error Red:             #EF4444 (錯誤/異常)
Text Primary:          #F8FAFC (主文字)
Text Muted:            #94A3B8 (次要文字)
```

### 字體
- **主字體**: Inter (Google Fonts) - 現代、清晰
- **等寬字體**: JetBrains Mono - 程式碼/Log 顯示

### 佈局原則
- **柵格系統**: 2x2 面板佈局（lg 斷點以上）
- **間距**: 4px 基礎單位（p-4, gap-4）
- **卡片圓角**: rounded-lg (8px)
- **響應式**: 小於 1024px 單欄垂直堆疊

---

## 7. 成功指標

| KPI | 目標值 | 測量方式 |
|-----|--------|----------|
| **頁面可用性** | 99% | API /api/health 成功率 |
| **API 回應時間** | < 500ms | 後端日誌記錄 |
| **使用者滿意度** | 無阻塞錯誤 | Error Banner 出現頻率 |
| **專案覆蓋率** | 100% | 正確讀取所有含 .dev_status.json 的專案 |

---

## 8. 四面板詳細規格

### 8.1 開發任務狀態面板 (ProjectStatusPanel)
- **資料來源**: `{PROJECTS_PATH}/*/docs/.dev_status.json`
- **顯示欄位**: 專案名稱、Stage、Iteration、Quality Score、Blocking Errors、最後更新時間
- **Stage 顏色標籤**: prd=藍、dev=黃、test=橙、security=紅
- **Quality Score 警告**: < 85 顯示紅色

### 8.2 Cron Job 監控面板 (CronJobPanel)
- **資料來源**: `systemctl show`, `journalctl`
- **檢查 Service**: obster-monitor, obster-cron, openclaw-scheduler
- **顯示欄位**: Service Name、ActiveState、LastRun、ExitCode、RecentLogs
- **ExitCode 標色**: 0=綠色正常、非零=紅色錯誤

### 8.3 Agent 健康度面板 (AgentHealthPanel)
- **資料來源**: Telegram Bot API getUpdates
- **Agent 清單**: Argus, Hephaestus, Atlas, Hestia, Hermes, Main
- **狀態判定**: < 30 分鐘=健康(綠)、>= 30 分鐘=異常(紅)、無法取得=未知(灰)

### 8.4 執行 Log 面板 (ExecutionLogPanel)
- **資料來源**: `{LOGS_PATH}/*.json`
- **排序**: 按修改時間倒序
- **顯示**: 最近 20 筆，點擊展開顯示完整 JSON

---

## 9. 驗收標準

### P0 功能驗收
- [ ] 頁面載入後 2 秒內顯示四個面板
- [ ] /api/projects 正確讀取並顯示所有含 .dev_status.json 的專案
- [ ] /api/cronjobs 顯示至少 3 個 service 的狀態
- [ ] /api/agents 顯示 6 個 Agent 的健康狀態
- [ ] /api/logs 顯示最近 20 筆執行日誌
- [ ] 每 30 秒自動刷新，無需手動操作
- [ ] 暗色主題正確顯示

### 品質驗收
- [ ] 所有 API 端點返回正確的 JSON 格式
- [ ] 錯誤時顯示 Error Banner，不崩潰
- [ ] 響應式佈局（桌面/平板/手機）
- [ ] 無 console.error 或 console.warning
