项目概述（lvyouxcx）
- 目的：微信小程序“旅安指南”，提供旅行安全/医学科普信息流 + 详情阅读，并包含一个内容管理页。
- 技术栈：微信小程序原生（WXML/WXSS/JS），无 npm 构建链。
- 结构：
  - app.js / app.json / app.wxss / sitemap.json
  - pages/home（首页信息流）
  - pages/detail（详情页）
  - pages/admin（内容管理页）
  - utils/articles.js（本地示例数据与风险标签映射）
- 数据：优先云开发数据库集合 `articles`，不可用时回退本地示例数据。

