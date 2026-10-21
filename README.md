# ATLab 2026 招募

國立中央大學 ATLab（Aeronautic Transportation Lab）招募官網。

- 網站：https://atlabrocket.org
- 純靜態網站，保留 GitHub Pages 從根目錄部署的方式。
- 內容使用 JSON 維護，以 Python 3.9 以上的標準函式庫產生完整 HTML，不需要安裝套件。

## 修改內容

1. 編輯對應的 `data/*.json`，或將圖片放入 `img/` 再修改 JSON 中的圖片路徑。
2. 執行 `python3 scripts/build.py`，重新產生首頁。
3. 執行下方檢查並預覽，將 JSON 和產生的 `index.html` 一起提交。

**不要直接修改根目錄的 `index.html`**，重新產生時會被覆寫。瀏覽器直接讀取產生的靜態頁面，無須等待 JavaScript 載入資料；停用 JavaScript 時仍有完整內容，社群分享標籤也包含在 HTML 中。

| 資料檔案 | 維護內容 |
| --- | --- |
| `data/site.json` | 網站名稱、SEO／分享資訊、導航、招募表單與 Instagram 網址、開場倒數 |
| `data/hero.json` | 首頁標題、標語、主圖與裝飾圖片 |
| `data/mission.json` | 團隊介紹 |
| `data/flight.json` | AT1ax 飛行紀錄、最高高度、飛行階段、規格 |
| `data/parts.json` | 子系統介紹與圖片 |
| `data/at2.json` | AT2 進度、規格、章節圖片／圖說、合作單位、路線圖 |
| `data/join.json` | 招募說明、職類、參與步驟 |
| `data/closing.json` | 結尾文案、組織資訊與頁尾 |

JSON 是純文字資料，不接受 HTML。引號以 `\"` 跳脫、換行以 `\n` 表示；輸出會自動跳脫 HTML 特殊字元。圖片路徑相對於網站根目錄，例如 `img/team.jpg`，圖片說明放在 `alt` 或 `image_alt`。

### 新增／刪除項目

在對應的陣列中增刪物件，順序就是顯示順序，例如 `data/parts.json` 的 `systems`：

```json
{
  "src": "img/avionics-bay.jpg",
  "alt": "航電電路板與線束",
  "category": "Avionics",
  "title": "航電 Flint MK1",
  "description": "系統介紹文字。"
}
```

其他清單：`site.navigation`、`flight.phases`、`flight.specs`、`at2.statuses`、`at2.specs`、`at2.roadmap`、`join.fields`（每組有 `roles`）、`join.steps`。

- `site.apply_url` 與 `site.instagram_url` 各維護一次，所有對應按鈕共用。
- `flight.peak_altitude` 使用數字（例如 `2713`），高度顯示、圖表頂端刻度、無障礙說明與動畫共用；文案中的 `{peak}` 會換成帶千分位的高度。其他歷史敘述／SEO 文案是獨立文字，需要一併確認。
- `flight.phases[].progress` 是 0 到 1 的動畫進度，必須遞增排列；`detail_class` 沿用 `mono up`（大寫）或 `mono`。
- `at2.statuses[].status_class` 沿用 `ok`（綠色）或 `wait`（橘色）。
- `at2.roadmap[].current_class` 使用 `now` 標記目前階段，其餘填空字串。
- `site.boot_sequence` 保留四個倒數標籤，最後一個會以重點樣式顯示。
- 標題的 `_1`、`_2` 等欄位對應既有斷行，以保留手機版排版。

## 程式結構

```text
data/                 依區塊分類的 JSON 內容
templates/index.html  網頁外框、導覽和共用資源
templates/*.html      各區塊的 HTML 結構
templates/items/      清單項目的共用模板
assets/css/site.css   樣式與響應式排版
assets/js/boot.js     開場初始化
assets/js/site.js     既有 GSAP 動畫與互動
scripts/build.py      靜態頁面產生與資料／路徑檢查
tests/test_build.py   產生流程的回歸測試
index.html            產生後提交給 GitHub Pages 的首頁
img/                  圖片
```

模板使用 Python `string.Template` 的 `${欄位}`。區塊模板帶區塊前綴，例如 `${hero_title}`；清單模板使用項目本身的 `${title}`。JSON 陣列的項目模板位於 `templates/items/區塊_欄位.html`，例如 `parts_systems.html`，巢狀清單則是 `join_fields_roles.html`。修改版型時編輯模板；修改樣式或互動時編輯對應資源，再重新產生首頁。

## 檢查與預覽

```bash
python3 scripts/build.py
python3 -m unittest discover -s tests -v
python3 scripts/build.py --check
node --check assets/js/boot.js
node --check assets/js/site.js
python3 -m http.server 4317
```

開啟 http://localhost:4317 。Node.js 僅用於 JavaScript 語法檢查，不是建置或部署的必要條件。

建置會檢查必要模板欄位、圖片／本機資源路徑、導航錨點、URL 協定和飛行數據；失敗時不會覆寫原有首頁。`--check` 也會確認提交的首頁與 JSON、模板一致，GitHub Actions 在推送或 PR 時執行相同檢查。

GitHub Pages 沿用原有部署設定。它不會替你執行 Python；只修改 JSON 而沒有重新產生並提交首頁，線上內容不會更新。
