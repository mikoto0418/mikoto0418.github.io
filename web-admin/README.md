# 旅安指南（纯静态版）

## 入口
- 本地预览前台：`/web-admin/`
- 线上前台：`https://<你的GitHub账号>.github.io/`
- 后台：`https://<你的GitHub账号>.github.io/#/__admin`
- 后台口令：在 `web-admin/app.js` 中修改 `ADMIN_PASSWORD`

## 数据存储
- 默认数据文件：`web-admin/data/articles.json`
- 运行时编辑数据：浏览器 `localStorage`（键：`travel_articles_data`）

## 发布流程（无后端）
1. 打开后台编辑内容。
2. 点击“导出 JSON”。
3. 用导出的文件覆盖 `web-admin/data/articles.json`。
4. 提交并推送到 GitHub，Pages 自动更新。

## GitHub Pages 配置
1. 已内置工作流文件：`.github/workflows/pages.yml`（自动把 `web-admin/` 发布为站点根目录）。
2. 仓库 Settings -> Pages -> Source 选择 `GitHub Actions`。
3. 仓库建议命名为 `<你的GitHub账号>.github.io`，这样地址才是主域名根路径。
4. 每次 push 到 `main`/`master` 后，Actions 会自动重新部署。

## 说明
- 当前为纯前端方案，口令与路由可被查看，不适合强安全场景。
- 仅适用于低安全要求的内容管理。
