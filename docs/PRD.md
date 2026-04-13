# Obster Dashboard - 產品需求文件 (PRD)

> **文件版本**: 1.0.0
> **更新日期**: 2026-04-13
> **目標系統**: VPS srv1318420 (小龍蝦 OpenClaw 系統監控)
> **文件狀態**: 正式版

---

## 1. 產品願景

Obster Dashboard 是一個本地 Web 監控儀表板，專為管理運行在 VPS (srv1318420) 上的小龍蝦（OpenClaw）分散式系統而設計。系統管理員透過瀏覽器即可一目了然地掌握所有專案開發進度、排程任務健康度、AI Agent 存活狀態，以及過往執行紀錄。

目標用戶：DevOps 工程師和系統管理員
核心問題：需要在單一頁面即時監控多個分散式系統元件的運行狀態，避免切換多個終端或工具

---

## 2. User Story

### User Story 1
**作為** 系統管理員，**我希望** 在單一頁面看到所有監控面板，**以便** 快速掌握整體系統狀態，無需切換多個終端或 SSH 連線

### User Story 2
**作為** DevOps 工程師，**我希望** 每 30 秒自動刷新資料，**以便** 及時發現 Cron Job 失敗或 Agent 無回應等異常情況

### User Story 3
**作為** 維運人員，**我希望** 看到各專案的 Quality Score 和 Stage，**以便** 追蹤每個專案的開發進度和品質狀態

### User Story 4
**作為** 系統管理員，**我希望** 能點擊展開執行 Log 的 JSON 內容，**以便** 調查特定執行失敗的根本原因

---

## 3. P0/P1/P2 功能分級

### P0 (立即上線 - 核心功能)
- **開發任務狀態面板**: 讀取 `docs/.dev_status.json`，顯示專案名稱、Stage、Quality Score、Blocking Errors
- **Cron Job 監控面板**: 使用 `systemctl show` 和 `journalctl` 顯示排程任務狀態
- **Agent 健康度面板**: 從 Telegram Bot API 取得最後回應時間，超過 30 分鐘標記為異常
- **執行 Log 面板**: 讀取 `/home/crawd_user/.openclaw/workspace/logs/executions/`，顯示最近 20 筆
- **每 30 秒自動刷新**: 前端定時輪詢 API
- **Dark Theme**: 暗色專業主題

### P1 (第二階段 - 重要功能)
- **Error Banner**: API 請求失敗時顯示錯誤提示和重新整理按鈕
- **手動重新整理按鈕**: 讓用戶主動觸發資料更新
- **Last Updated 時間戳**: 顯示資料最後刷新時間
- **Log 展開/折疊**: 可點擊展開 JSON 內容

### P2 (第三階段 - 增強功能)
- **Cron Job Recent Logs 折疊/展開**: 預設折疊，最多顯示 5 行
- **響應式佈局**: 行動裝置單欄、桌面雙欄
- **歷史資料快取**: stale-while-revalidate 策略

---

## 4. 非功能需求

### 效能
- API 回應時間 < 500ms (排除外部依賴如 Telegram API)
- 頁面首次載入 < 3 秒
- 30 秒輪询不造成瀏覽器效能問題

### 可用性
- 99% 機率畫面正常顯示（排除外部 API 失敗）
- 單一面板失敗不影響其他面板
- 錯誤時顯示友好提示而非空白畫面

### 擴展性
- 未來可新增更多監控面板（元件化設計）
- 支援新增更多 Agent 類型（環境變數控制）
- 支援自定義檢查的 systemd services 清單

### 安全性
- Docker container 隔離運行
- 僅讀取指定目錄，不訪問系統敏感路徑
- Telegram Bot Token 透過環境變數注入，不寫入程式碼

---

## 5. 技術選型

### 前端
- **React 18 + TypeScript + Vite 5**
  - 理由：現代 SPA 框架，類型安全，快速建構
- **Tailwind CSS 3**
  - 理由：Utility-first，快速客製化暗色主題

### 後端
- **FastAPI 0.109 + Pydantic 2.5**
  - 理由：自動 OpenAPI 文件、Pydantic 原生驗證、非同步支援
- **Uvicorn 0.27**
  - 理由：ASGI 伺服器，高效能

### 資料庫
- **無需資料庫**
  - 理由：純讀取本地檔案和 API，即時資料不需持久化

### 部署工具
- **Docker + nginx**
  - 理由：雙階段建構，nginx 反向代理靜態檔案和 API

---

## 6. UI/UX 色彩計劃

### 主題
- **Dark Theme Only** - 減少長時間監控的眼睛疲勞

### 色彩系統
| 用途 | 色碼 | 說明 |
|------|------|------|
| 頁面背景 | #0F172A | primary |
| 卡片/面板背景 | #1E293B | secondary |
| 主要按鈕/連結 | #3B82F6 | accent |
| 主文字 | #F8FAFC | text |
| 次要文字 | #94A3B8 | text-muted |
| 正常/健康 | #22C55E | success |
| 警告 | #F59E0B | warning |
| 錯誤/異常 | #EF4444 | error |

### 字體
- **系統字體棧**: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
- **等寬字體** (Log/Code): 'SF Mono', Monaco, 'Cascadia Code', Consolas, monospace

### 佈局原則
- 2x2 網格（桌面），單欄（行動裝置 < 1024px）
- 面板間距 1rem (16px)
- 卡片內距 1rem (16px)
- 面板標題使用 20px (text-xl) 粗體

---

## 7. 成功指標

### KPI 1: 系統可用性
- **指標**: API `/api/health` 端點可用率
- **目標**: 每月可用率 >= 99.5%
- **測量方式**: 外部監控每分鐘請求一次，計算成功率

### KPI 2: 頁面載入效能
- **指標**: Lighthouse Performance Score
- **目標**: 分數 >= 85
- **測量方式**: Lighthouse CLI 自動化測試

### KPI 3: 異常檢測率
- **指標**: Cron Job 失敗後在下一個刷新週期內被標記為異常的比例
- **目標**: >= 95%
- **測量方式**: 模擬失敗並驗證 UI 顯示正確狀態

### KPI 4: 用戶滿意度
- **指標**: 監控儀表板無需登入即可使用
- **目標**: 任何有瀏覽器的人都能立即使用
- **測量方式**: 部署完成後無需額外配置

---

## 8. 限制與已知問題

### 限制
- Cron Job 監控需要 Docker container 以 `privileged: true` 或掛載 systemd socket 執行
- Telegram Bot API 需要有效的 Bot Token 才能取得 Agent 回應時間
- 若 `/home/crawd_user/.openclaw/workspace/logs/executions/` 目錄不存在，Log 面板顯示空狀態

### 已知問題
- Agent 健康度檢測在多個 Agent 共享同一個 Bot Token 時準確度較低
- 建議每個 Agent 未來使用獨立 Bot Token

---

## 9. 專案結構

```
obster-dashboard/
├── backend/
│   ├── main.py              # FastAPI 應用程式
│   ├── requirements.txt     # Python 依賴
│   ├── Dockerfile           # Python 3.11 slim 容器
│   └── tests/
│       └── test_api.py      # Pytest 單元測試
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── types.ts
│   │   ├── context/
│   │   │   └── DashboardContext.tsx
│   │   ├── components/
│   │   │   ├── ProjectStatusPanel.tsx
│   │   │   ├── CronJobPanel.tsx
│   │   │   ├── AgentHealthPanel.tsx
│   │   │   └── ExecutionLogPanel.tsx
│   │   └── __tests__/
│   │       └── components.test.tsx
│   └── public/
│       └── vite.svg
├── nginx.conf
├── Dockerfile
├── Dockerfile.frontend
├── start.sh
└── docs/
    ├── PRD.md               # 本文件
    └── PLAN.md              # 原始建構計畫書（保留參考）
```
