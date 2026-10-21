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
docs/maintenance.md        資料欄位與維護說明
.github/workflows/         自動檢查
index.html                 產生的首頁
sponsor/index.html         產生的贊助頁
teams/*/index.html         產生的技術組頁
CNAME                      GitHub Pages 自訂網域
.nojekyll                  GitHub Pages 靜態發布標記（空檔案）
```

**修改 `src/` 或 `assets/`，再執行建置。不要直接修改發布用的 HTML，建置會覆寫它們。** 五個頁面的網址維持 `/`、`/sponsor/`、`/teams/avionics/`、`/teams/structure/` 與 `/teams/propulsion/`。

首頁內容使用 `src/data/*.json`；贊助頁和技術組內文使用 `src/templates/pages/`。全站表單與社群網址共用 `src/data/site.json`。詳細欄位與範例請見[維護指南](docs/maintenance.md)。

## 建置與預覽

```bash
python3 scripts/build.py
python3 -m unittest discover -s tests -v
python3 scripts/build.py --check
python3 -m http.server 4317
```

開啟 [localhost:4317](http://localhost:4317)。建置會先驗證所有頁面、圖片、樣式中的資源及跨頁錨點，再寫入發布檔案。`--check` 用於確認五個發布頁面是否與來源一致。

提交時包含來源、資源搬移與重新產生的 HTML。現有 GitHub Pages 不會替你執行 Python，不能只提交來源。GitHub Actions 會執行測試、一致性與 JavaScript 語法檢查。

## `.nojekyll` 是什麼？

`.nojekyll` 是一個**刻意留空的標記檔**，通知 GitHub Pages 略過 Jekyll，直接發布已建置的靜態網站。檔名前的 `.` 讓它在某些檔案管理器中隱藏；它不是程式，也不需要填入設定。

本網站自行產生 HTML，因此保留根目錄的 `.nojekyll`。`CNAME` 則指定自訂網域，兩者用途不同，都不移入 `src/`。[GitHub 官方文件](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)

`.claude/` 是本機工具的工作目錄，已加入忽略清單；這次整理不刪除其中的 Git worktree。
