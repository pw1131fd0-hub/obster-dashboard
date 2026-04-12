# OpenClaw Dashboard PRD

## 1. 產品願景

**OpenClaw Dashboard** 是一個本地 Web UI 儀表板，專為在小龍蝦（OpenClaw）系統中監控多專案開發狀態、排程任務、Agent 健康度與執行日誌。部署於 VPS (srv1318420)，讓開發者透過瀏覽器即可快速掌握系統全貌。

**目標用戶**：OpenClaw 系統管理員與開發者
**核心價值**：集中呈現分散的監控數據，降低排查時間，提升系統可控性。

---

## 2. User Stories

### US-1: 作為系統管理員，我希望在一個畫面看到所有專案的開發進度，以便快速識別需要關注的項目
- **接受標準**：儀表板首頁顯示所有專案的 stage、quality_score、blocking_errors，5 秒內載入完成

### US-2: 作為 DevOps 工程師，我希望監控 Cron Job 的執行狀態，以便在任務失敗時立即得知
- **接受標準**：每個 systemd service 的狀態、最後執行時間、exit code、近期日誌一目了然，30 秒自動刷新

### US-3: 作為系統管理者，我希望知道每個 Telegram Agent 的健康狀態，以便在 Agent 無回應時及時處理
- **接受標準**：Agent 健康面板顯示最後回應時間，超過 30 分鐘未回應標記為異常（紅色）

### US-4: 作為開發者，我希望查看最近 20 筆執行日誌，以便追蹤系統行為與除錯
- **接受標準**：執行日誌面板可展開查看 JSON 格式的完整內容，按時間排序

---

## 3. 功能分級

### P0 (必須有)
1. **開發任務狀態面板** - 讀取 docs/.dev_status.json，顯示專案名稱、stage、quality_score、blocking_errors
2. **Cron Job 監控面板** - 讀取 systemd service 狀態與 journalctl log
3. **Agent 健康度面板** - 讀取 Telegram Bot API 最後 message 時間
4. **執行 Log 面板** - 讀取 /home/crawd_user/.openclaw/workspace/logs/executions/ 下的 JSON log
5. **30 秒自動刷新** - 每 30 秒自動呼叫所有 API 更新資料

### P1 (應該有)
1. **手動重新整理按鈕** - 使用者可以點擊立即刷新
2. **Last updated 時間顯示** - 顯示資料最後更新時間
3. **Error Banner** - API 錯誤時顯示友好提示
4. **暗色主題** - 全域 Dark Mode 配色

### P2 (最好有)
1. **Log 展開/摺疊** - 可展開檢視完整 JSON 內容
2. **Quality Score 顏色標示** - 分數 >= 95 綠色，>= 85 黃色，< 85 紅色
3. **Agent 異常閾值顯示** - 清楚標示 30 分鐘閾值

---

## 4. 非功能需求

### 效能 (Performance)
- 頁面首次載入時間 < 3 秒（網路正常的條件下）
- API 回應時間 < 500ms（本地端點）

### 可用性 (Availability)
- Docker Container 部署，restart: unless-stopped 確保服務持續運行
- 即使外部資料來源（Telegram API、systemctl）暫時無法取得，儀表板仍可正常顯示（顯示 unknown）

### 擴展性 (Scalability)
- 前後端分離，透過 docker-compose 便于擴展
- 未来可接入更多資料來源（不影響現有架構）

### 安全性 (Security)
- 不暴露敏感資料（TELEGRAM_BOT_TOKEN 僅存在 backend 環境變數）
- 唯讀掛載專案目錄與日誌目錄
- CORS 限制在前端部署 domain

---

## 5. 技術選型

### 前端：React + TypeScript + Tailwind CSS
- **理由**：元件化開發適合儀表板面板組合，TypeScript 提供型別安全，Tailwind 加速暗色主題實作

### 後端：FastAPI (Python)
- **理由**：非同步效能佳，Pydantic 模型自動驗證，Pydantic 回應模型確保 API 回傳格式一致

### 資料庫：不使用（純讀檔案）
- **理由**：所有資料來源為本地檔案（.dev_status.json、systemd journal、log files），無持久化需求

### 部署工具：Docker + docker-compose + nginx
- **理由**：標準化部署流程，nginx 同時處理靜態檔案與 API 反向代理，network_mode: host 簡化網路設定

---

## 6. UI/UX 色彩計劃

### 主色調（暗色主題）
| 用途 | 色碼 | 說明 |
|------|------|------|
| Background (Primary) | `#0f172a` (slate-900) | 主要背景 |
| Surface (Secondary) | `#1e293b` (slate-800) | 卡片/面板背景 |
| Text | `#f1f5f9` (slate-100) | 主要文字 |
| Text Muted | `#94a3b8` (slate-400) | 次要文字 |
| Accent | `#3b82f6` (blue-500) | 按鈕/強調 |
| Success | `#22c55e` (green-500) | 正常狀態 |
| Error | `#ef4444` (red-500) | 錯誤/異常 |
| Warning | `#f59e0b` (amber-500) | 警告狀態 |

### 字體
- 系統字體：`ui-sans-serif, system-ui, -apple-system, sans-serif`
- 等寬字體（程式碼/時間戳）：`ui-monospace, monospace`

### 佈局原則
- 2 欄網格（lg 以上），單欄（mobile）
- 最大寬度無限制，高度 auto
- 面板最大高度 96 (384px)，內部滾動
- 卡片間距 16px (gap-4)

---

## 7. 成功指標

### KPI-1: 頁面可用性
- **指標**：儀表板正常運行時間 > 99%
- **測量方式**：Docker container uptime / 總時間

### KPI-2: 資料更新延遲
- **指標**：從資料變更到畫面更新的延遲 <= 35 秒（30 秒輪詢 + 5 秒處理）
- **測量方式**：時間戳比對

### KPI-3: 開發效率提升
- **指標**：系統管理者確實使用此儀表板取代 SSH + 手動查詢
- **測量方式**：使用者回饋（主觀）

---

*文件版本：1.0*
*建立時間：2026-04-12*
*作者：OpenClaw Worker*
