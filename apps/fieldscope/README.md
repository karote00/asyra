# 田巡 FieldScope

採收機器人的田區建模、離線模擬與實機監控工作站。
第一版為 Asyra + Three.js 四連棟溫室，含鋼架、覆膜、土壤、水溝及邊界走道。

從 repository 根目錄執行 `yarn workspace @asyra/fieldscope dev`。
首次啟動先將本目錄 `.env.example` 複製為 `.env`；開發服務與 E2E 共用 `APP_URL`。

[完整尺寸契約、建模假設、架構與後續實作規劃](../../docs/ai/apps/fieldscope/README.md)

已確認每棟配置為 6.3m 畦溝加左右各 0.35m，合計 7m。
內部相連留白合併為 0.7m；柱位會影響通行淨寬。
本階段尚無植株、機器人、碰撞／損傷模擬或實機連線。
