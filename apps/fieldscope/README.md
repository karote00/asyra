# 田巡 FieldScope

採收機器人的田區建模、離線模擬與實機監控工作站。
第一版為 Asyra + Three.js 四連棟溫室，含鋼架、覆膜、土壤、水溝及邊界走道。

從 repository 根目錄執行 `yarn workspace @asyra/fieldscope dev`。
首次啟動先將本目錄 `.env.example` 複製為 `.env`；開發服務與 E2E 共用 `APP_URL`。

[完整尺寸契約、建模假設、架構與後續實作規劃](../../docs/ai/apps/fieldscope/README.md)

已確認每棟配置為 6.3m 畦溝加左右各 0.35m，合計 7m。
內部相連留白合併為 0.7m；柱位會影響通行淨寬。
本階段尚無植株、機器人、碰撞／損傷模擬或實機連線。

## Vercel 部署

版本為 `0.1.0`，保留 `private: true`，不發布 npm 套件。
在 Vercel 匯入此 repository，Root Directory 設為 `apps/fieldscope`，
啟用 Include source files outside of the Root Directory in the Build Step，並選 Node.js 24.x。
安裝、建置與輸出目錄由本目錄 `vercel.json` 設定；建置會透過 Turbo 先完成 Asyra 依賴。
靜態部署不需要 `APP_URL`；此變數僅供本機開發與 E2E 使用。輸出為 `dist`，沒有後端服務。
目前只有根路徑頁面，不加 catch-all rewrite，避免遺失的 JavaScript 資源被回傳為 HTML。
場景修改尚未持久化，重新載入會回到預設設定。

Vercel 設定依據：<a href="https://vercel.com/docs/monorepos/monorepo-faq" target="_blank" rel="noopener noreferrer">Monorepos FAQ</a>。
