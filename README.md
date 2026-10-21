# ATLab

國立中央大學 ATLab（Aeronautic Transportation Lab）網站，部署於 [atlabrocket.org](https://atlabrocket.org)。

網站使用純靜態 HTML，以 Python 3.9 以上的標準函式庫建置，不需要安裝套件。保留 GitHub Pages 從 `main` 分支根目錄發布的方式。

## 目錄分工

```text
src/                       維護用來源
├── data/                  首頁內容、全站表單與社群網址（JSON）
└── templates/
    ├── home/              首頁外框與區塊
    ├── items/             首頁清單項目
    └── pages/             贊助頁與各技術組的來源模板
assets/                    網站共用資源
├── css/                   首頁、贊助與技術組樣式
├── js/                    共用導覽與各頁面互動
└── images/                全站圖片與圖示
scripts/build.py           建置五個頁面、檢查資料與連結
tests/                     建置回歸測試
.github/workflows/         自動檢查
index.html                 產生的首頁
sponsor/index.html         產生的贊助頁
teams/*/index.html         產生的技術組頁
CNAME                      GitHub Pages 自訂網域
.nojekyll                  GitHub Pages 靜態發布標記（空檔案）
```

**修改 `src/` 或 `assets/`，再執行建置。不要直接修改發布用的 HTML，建置會覆寫它們。** 五個頁面的網址維持 `/`、`/sponsor/`、`/teams/avionics/`、`/teams/structure/` 與 `/teams/propulsion/`。

首頁內容使用 `src/data/*.json`；贊助頁和技術組內文使用 `src/templates/pages/`。全站表單與社群網址共用 `src/data/site.json`。

## 修改內容

1. 編輯對應的 `src/data/*.json`，或將圖片放入 `assets/images/` 再修改 JSON 中的圖片路徑。
2. 執行 `python3 scripts/build.py`，重新產生所有頁面。
3. 執行下方檢查並預覽，將來源與所有產生的 HTML 一起提交。

**不要直接修改根目錄的 `index.html`、`sponsor/index.html` 或 `teams/*/index.html`**，重新產生時會被覆寫。瀏覽器直接讀取產生的靜態頁面，無須等待 JavaScript 載入資料；停用 JavaScript 時仍有完整內容，社群分享標籤也包含在 HTML 中。

| 資料檔案 | 維護內容 |
| --- | --- |
| `src/data/site.json` | 網站名稱、SEO／分享資訊、導航、招募表單與 Instagram 網址、開場倒數 |
| `src/data/hero.json` | 首頁標題、標語、主圖與裝飾圖片 |
| `src/data/mission.json` | 團隊介紹 |
| `src/data/flight.json` | AT1ax 飛行紀錄、最高高度、飛行階段、規格 |
| `src/data/parts.json` | 子系統介紹與圖片 |
| `src/data/at2.json` | AT2 進度、規格、章節圖片／圖說、合作單位、路線圖 |
| `src/data/join.json` | 招募說明、職類、參與步驟 |
| `src/data/closing.json` | 結尾文案、組織資訊與頁尾 |

JSON 是純文字資料，不接受 HTML。引號以 `\"` 跳脫、換行以 `\n` 表示；輸出會自動跳脫 HTML 特殊字元。圖片路徑相對於網站根目錄，例如 `assets/images/team.jpg`，圖片說明放在 `alt` 或 `image_alt`。

### 新增／刪除項目

在對應的陣列中增刪物件，順序就是顯示順序，例如 `src/data/parts.json` 的 `systems`：

```json
{
  "src": "assets/images/avionics-bay.jpg",
  "alt": "航電電路板與線束",
  "category": "Avionics",
  "title": "航電 Flint MK1",
  "description": "系統介紹文字。"
}
```

其他清單：`site.navigation`、`site.navigation_after`、`site.teams`、`flight.phases`、`flight.specs`、`at2.statuses`、`at2.specs`、`at2.roadmap`、`join.fields`（每組有 `roles`）、`join.steps`。

- `site.apply_url` 與 `site.instagram_url` 各維護一次，所有對應按鈕共用。
- `flight.peak_altitude` 使用數字（例如 `2713`），高度顯示、圖表頂端刻度、無障礙說明與動畫共用；文案中的 `{peak}` 會換成帶千分位的高度。其他歷史敘述／SEO 文案是獨立文字，需要一併確認。
- `flight.phases[].progress` 是 0 到 1 的動畫進度，必須遞增排列；`detail_class` 沿用 `mono up`（大寫）或 `mono`。
- `at2.statuses[].status_class` 沿用 `ok`（綠色）或 `wait`（橘色）。
- `at2.roadmap[].current_class` 使用 `now` 標記目前階段，其餘填空字串。
- `site.boot_sequence` 保留四個倒數標籤，最後一個會以重點樣式顯示。
- 標題的 `_1`、`_2` 等欄位對應既有斷行，以保留手機版排版。

## 模板與結構

首頁模板使用 Python `string.Template` 的 `${欄位}`。區塊模板帶區塊前綴，例如 `${hero_title}`；清單模板使用項目本身的 `${title}`。JSON 陣列的項目模板位於 `src/templates/items/區塊_欄位.html`，例如 `parts_systems.html`，巢狀清單則是 `join_fields_roles.html`。修改版型時編輯模板；修改樣式或互動時編輯對應資源，再重新產生所有頁面。

## 檢查與預覽

```bash
python3 scripts/build.py
python3 -m unittest discover -s tests -v
python3 scripts/build.py --check
node --check assets/js/boot.js
node --check assets/js/home.js
node --check assets/js/navigation.js
node --check assets/js/sponsor.js
node --check assets/js/teams.js
python3 -m http.server 4317
```

開啟 [localhost:4317](http://localhost:4317)。Node.js 僅用於 JavaScript 語法檢查，不是建置或部署的必要條件。

建置會檢查必要模板欄位、所有頁面的圖片／本機資源路徑、CSS 圖片、頁內與跨頁導航錨點、URL 協定和飛行數據；資料與連結驗證失敗時不會覆寫發布頁面。`--check` 也會確認所有提交的發布頁面與 JSON、模板一致，GitHub Actions 在推送或 PR 時執行相同檢查。

GitHub Pages 沿用原有部署設定。它不會替你執行 Python；只修改來源而沒有重新產生並提交發布頁面，線上內容不會更新。

贊助頁與技術組內文的來源分別在 `src/templates/pages/sponsor.html` 與 `src/templates/pages/teams/*.html`，原有「待補」內容保留。這些內文目前仍是 HTML；首頁內容與全站表單／社群網址使用 JSON。不要修改發布目錄下的副本。
