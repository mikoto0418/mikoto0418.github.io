const DATA_URL = "./data/articles.json";
const ADMIN_ROUTE = "/__admin";
const ARTICLE_ROUTE_PREFIX = "/article/";
const ADMIN_PASSWORD = "travel-admin";
const AUTH_KEY = "travel_admin_auth";
const LOCAL_DATA_KEY = "travel_articles_data";
const GITHUB_DEFAULT_OWNER = "mikoto0418";
const GITHUB_DEFAULT_REPO = "mikoto0418.github.io";
const GITHUB_BRANCH = "main";
const GITHUB_CONTENT_PATH = "web-admin/data/articles.json";
const DATA_DB_NAME = "travel_admin_db";
const DATA_DB_VERSION = 1;
const DATA_DB_STORE = "kv";
const MAX_EMBED_IMAGE_BYTES = 380 * 1024;

const RISK_LABEL_MAP = {
  low: "低风险",
  medium: "中风险",
  high: "高风险"
};

const state = {
  isAdminAuthed: localStorage.getItem(AUTH_KEY) === "1",
  articles: [],
  defaultArticles: [],
  editingId: ""
};

const dom = {
  brandHomeBtn: document.getElementById("brandHomeBtn"),
  frontPanel: document.getElementById("frontPanel"),
  frontListView: document.getElementById("frontListView"),
  frontDetailView: document.getElementById("frontDetailView"),
  frontList: document.getElementById("frontList"),
  detailArticle: document.getElementById("detailArticle"),
  backToListBtn: document.getElementById("backToListBtn"),

  adminRoot: document.getElementById("adminRoot"),
  loginPanel: document.getElementById("loginPanel"),
  adminPanel: document.getElementById("adminPanel"),
  password: document.getElementById("password"),
  loginBtn: document.getElementById("loginBtn"),
  loginError: document.getElementById("loginError"),

  refreshBtn: document.getElementById("refreshBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  exportBtn: document.getElementById("exportBtn"),
  importBtn: document.getElementById("importBtn"),
  restoreBtn: document.getElementById("restoreBtn"),
  importFile: document.getElementById("importFile"),
  dataStatus: document.getElementById("dataStatus"),

  title: document.getElementById("title"),
  summary: document.getElementById("summary"),
  publishTime: document.getElementById("publishTime"),
  riskLevel: document.getElementById("riskLevel"),
  content: document.getElementById("content"),
  warning: document.getElementById("warning"),
  sources: document.getElementById("sources"),
  coverUrl: document.getElementById("coverUrl"),
  coverFile: document.getElementById("coverFile"),
  uploadBtn: document.getElementById("uploadBtn"),
  uploadStatus: document.getElementById("uploadStatus"),
  coverPreview: document.getElementById("coverPreview"),
  submitBtn: document.getElementById("submitBtn"),
  resetBtn: document.getElementById("resetBtn"),
  formError: document.getElementById("formError"),
  articleList: document.getElementById("articleList"),

  tokenModal: document.getElementById("tokenModal"),
  tokenInput: document.getElementById("tokenInput"),
  tokenError: document.getElementById("tokenError"),
  tokenCancelBtn: document.getElementById("tokenCancelBtn"),
  tokenConfirmBtn: document.getElementById("tokenConfirmBtn")
};

let tokenDialogPending = null;

function today() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function closeTokenDialog() {
  if (!dom.tokenModal) return;
  dom.tokenModal.classList.add("hidden");
}

function failTokenDialog(message) {
  if (!tokenDialogPending) return;
  const { reject } = tokenDialogPending;
  tokenDialogPending = null;
  closeTokenDialog();
  reject(new Error(message || "已取消发布：未输入 GitHub Token。"));
}

function resolveTokenDialog(token) {
  if (!tokenDialogPending) return;
  const { resolve } = tokenDialogPending;
  tokenDialogPending = null;
  closeTokenDialog();
  resolve(token);
}

function confirmTokenDialog() {
  const value = String(dom.tokenInput && dom.tokenInput.value ? dom.tokenInput.value : "").trim();
  if (!value) {
    setError(dom.tokenError, "请输入 GitHub Token");
    if (dom.tokenInput) {
      dom.tokenInput.focus();
    }
    return;
  }
  setError(dom.tokenError, "");
  if (dom.tokenInput) {
    dom.tokenInput.value = "";
  }
  resolveTokenDialog(value);
}

function requestPublishToken() {
  if (!dom.tokenModal || !dom.tokenInput || !dom.tokenConfirmBtn || !dom.tokenCancelBtn) {
    const token = window.prompt("请输入本次发布使用的 GitHub Token：");
    const normalized = String(token || "").trim();
    if (!normalized) {
      throw new Error("已取消发布：未输入 GitHub Token。");
    }
    return Promise.resolve(normalized);
  }

  if (tokenDialogPending) {
    return Promise.reject(new Error("已有发布请求正在等待 Token。"));
  }

  return new Promise((resolve, reject) => {
    tokenDialogPending = { resolve, reject };
    setError(dom.tokenError, "");
    dom.tokenInput.value = "";
    dom.tokenModal.classList.remove("hidden");
    dom.tokenInput.focus();
  });
}

function resolveGithubTarget() {
  const host = String(window.location.hostname || "");
  const match = host.match(/^([a-z\d-]+)\.github\.io$/i);
  if (match && match[1]) {
    const owner = match[1];
    return {
      owner,
      repo: `${owner}.github.io`
    };
  }

  return {
    owner: GITHUB_DEFAULT_OWNER,
    repo: GITHUB_DEFAULT_REPO
  };
}

function toBase64Utf8(text) {
  const bytes = new TextEncoder().encode(String(text || ""));
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    const part = bytes.slice(i, i + chunk);
    binary += String.fromCharCode(...part);
  }
  return btoa(binary);
}

function createGithubHeaders(token) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28"
  };
}

async function readGithubError(response) {
  try {
    const data = await response.json();
    if (data && data.message) {
      return data.message;
    }
  } catch (err) {
    // ignore
  }
  return `HTTP ${response.status}`;
}

function buildPublishError(response, message) {
  if (response && (response.status === 401 || response.status === 403)) {
    return new Error(`Token 无效或权限不足：${message}`);
  }
  return new Error(message);
}

async function publishArticlesToGithub(token) {
  const normalizedToken = String(token || "").trim();
  if (!normalizedToken) {
    throw new Error("未提供发布 Token。");
  }
  const { owner, repo } = resolveGithubTarget();
  const endpoint = `https://api.github.com/repos/${owner}/${repo}/contents/${GITHUB_CONTENT_PATH}`;
  const headers = createGithubHeaders(normalizedToken);

  const payload = JSON.stringify(sortArticles(state.articles), null, 2);
  const contentBase64 = toBase64Utf8(`${payload}\n`);
  const commitMessage = `content: publish articles ${new Date().toISOString()}`;

  let sha = null;
  const metaRes = await fetch(`${endpoint}?ref=${GITHUB_BRANCH}`, { headers });
  if (metaRes.status === 200) {
    const meta = await metaRes.json();
    sha = meta.sha || null;
  } else if (metaRes.status !== 404) {
    throw buildPublishError(metaRes, `读取仓库文件失败：${await readGithubError(metaRes)}`);
  }

  const body = {
    message: commitMessage,
    content: contentBase64,
    branch: GITHUB_BRANCH
  };
  if (sha) {
    body.sha = sha;
  }

  const putRes = await fetch(endpoint, {
    method: "PUT",
    headers,
    body: JSON.stringify(body)
  });

  if (!putRes.ok) {
    throw buildPublishError(putRes, `发布到 GitHub 失败：${await readGithubError(putRes)}`);
  }
}

async function publishCurrentArticles() {
  const token = await requestPublishToken();
  await publishArticlesToGithub(token);
}

let dataDbPromise = null;

function isQuotaError(err) {
  if (!err) return false;
  if (err.name === "QuotaExceededError") return true;
  return typeof err.message === "string" && err.message.toLowerCase().includes("quota");
}

function openDataDb() {
  if (!("indexedDB" in window)) {
    return Promise.resolve(null);
  }
  if (dataDbPromise) {
    return dataDbPromise;
  }

  dataDbPromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATA_DB_NAME, DATA_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DATA_DB_STORE)) {
        db.createObjectStore(DATA_DB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }).catch((err) => {
    console.warn("IndexedDB 初始化失败，将回退 localStorage", err);
    dataDbPromise = Promise.resolve(null);
    return null;
  });

  return dataDbPromise;
}

async function idbGet(key) {
  const db = await openDataDb();
  if (!db) return null;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(DATA_DB_STORE, "readonly");
    const store = tx.objectStore(DATA_DB_STORE);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key, value) {
  const db = await openDataDb();
  if (!db) return false;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(DATA_DB_STORE, "readwrite");
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
    tx.objectStore(DATA_DB_STORE).put(value, key);
  });
}

function isEditorField(element) {
  return element && element.getAttribute("contenteditable") === "true";
}

function getFieldText(element) {
  if (!element) return "";
  if (isEditorField(element)) {
    return (element.innerText || "").trim();
  }
  return (element.value || "").trim();
}

function getFieldHtml(element) {
  if (!element) return "";
  if (isEditorField(element)) {
    return (element.innerHTML || "").trim();
  }
  return (element.value || "").trim();
}

function setFieldValue(element, htmlValue, textValue) {
  if (!element) return;
  if (isEditorField(element)) {
    if (htmlValue) {
      element.innerHTML = htmlValue;
    } else {
      element.textContent = textValue || "";
    }
  } else {
    element.value = textValue || "";
  }
}

function setError(target, message) {
  if (target) {
    target.textContent = message || "";
  }
}

function setStatus(message) {
  if (dom.dataStatus) {
    dom.dataStatus.textContent = message || "";
  }
}

function splitLines(text) {
  return String(text || "")
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function blocksToText(blocks, type) {
  return (blocks || [])
    .filter((item) => item && item.type === type)
    .map((item) => (item.text || "").trim())
    .filter(Boolean)
    .join("\n");
}

function buildContentBlocks(content, warning) {
  const blocks = splitLines(content).map((text) => ({
    type: "paragraph",
    text
  }));
  const warningText = String(warning || "").trim();
  if (warningText) {
    blocks.unshift({ type: "warning", text: warningText });
  }
  return blocks;
}

function stripHtml(html) {
  const div = document.createElement("div");
  div.innerHTML = html || "";
  return (div.textContent || div.innerText || "").trim();
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(text) {
  return escapeHtml(String(text || "")).replaceAll("`", "&#96;");
}

function normalizeRiskLevel(level) {
  return Object.prototype.hasOwnProperty.call(RISK_LABEL_MAP, level) ? level : "medium";
}

function normalizeArticle(input, index = 0) {
  const source = input || {};
  const id = String(source.id || source._id || `a_${Date.now()}_${index}`);
  const title = String(source.title || "").trim();

  const summaryHtml = typeof source.summaryHtml === "string" ? source.summaryHtml.trim() : "";
  const summary = String(source.summary || stripHtml(summaryHtml) || "").trim();

  const publishTime = String(source.publishTime || today()).slice(0, 10);
  const riskLevel = normalizeRiskLevel(source.riskLevel);
  const cover = String(source.cover || "").trim();
  const readCount = Number(source.readCount) || 0;

  const warningHtml = typeof source.warningHtml === "string" ? source.warningHtml.trim() : "";
  const warningText = String(stripHtml(warningHtml) || source.warning || "").trim();

  const contentHtml = typeof source.contentHtml === "string" ? source.contentHtml.trim() : "";
  const contentText = String(stripHtml(contentHtml) || source.content || "").trim();

  let contentBlocks = Array.isArray(source.contentBlocks)
    ? source.contentBlocks
        .map((item) => ({
          type: item && item.type === "warning" ? "warning" : "paragraph",
          text: String((item && item.text) || "").trim()
        }))
        .filter((item) => item.text)
    : [];

  if (!contentBlocks.length) {
    contentBlocks = buildContentBlocks(contentText, warningText);
  }

  const sources = Array.isArray(source.sources)
    ? source.sources.map((item) => String(item || "").trim()).filter(Boolean)
    : splitLines(stripHtml(source.sourcesHtml || ""));

  const sourcesHtml = typeof source.sourcesHtml === "string" ? source.sourcesHtml.trim() : sources.join("<br>");

  return {
    id,
    title,
    summary,
    summaryHtml,
    publishTime,
    riskLevel,
    cover,
    readCount,
    contentBlocks,
    contentHtml,
    warningHtml,
    sources,
    sourcesHtml
  };
}

function sortArticles(items) {
  return [...(items || [])].sort((a, b) => {
    const dateA = String(a.publishTime || "");
    const dateB = String(b.publishTime || "");
    return dateB.localeCompare(dateA);
  });
}

async function persistArticles() {
  const payload = JSON.stringify(state.articles);

  try {
    const saved = await idbSet(LOCAL_DATA_KEY, payload);
    if (saved) {
      return;
    }
  } catch (err) {
    if (!isQuotaError(err)) {
      console.warn("IndexedDB 写入失败，尝试回退 localStorage", err);
    }
  }

  try {
    localStorage.setItem(LOCAL_DATA_KEY, payload);
  } catch (err) {
    if (isQuotaError(err)) {
      throw new Error("本地存储空间不足。请压缩图片、改用外链，或删除部分历史数据。");
    }
    throw err;
  }
}

async function loadLocalArticles() {
  let raw = null;
  try {
    raw = await idbGet(LOCAL_DATA_KEY);
  } catch (err) {
    console.warn("IndexedDB 读取失败，尝试回退 localStorage", err);
  }

  if (!raw) {
    raw = localStorage.getItem(LOCAL_DATA_KEY);
    if (raw) {
      try {
        await idbSet(LOCAL_DATA_KEY, raw);
      } catch (err) {
        // ignore migration failure
      }
    }
  }

  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return null;
    }
    return parsed.map((item, index) => normalizeArticle(item, index));
  } catch (err) {
    console.warn("本地数据解析失败", err);
    return null;
  }
}

async function loadDefaultArticles() {
  try {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const list = await res.json();
    if (!Array.isArray(list)) {
      throw new Error("data/articles.json 必须是数组");
    }
    return list.map((item, index) => normalizeArticle(item, index));
  } catch (err) {
    console.error("加载默认数据失败", err);
    return [];
  }
}

function parseRoute() {
  const hash = decodeURIComponent((window.location.hash || "").replace(/^#/, ""));
  if (!hash || hash === "/") {
    return { name: "home" };
  }
  if (hash === ADMIN_ROUTE) {
    return { name: "admin" };
  }
  if (hash.startsWith(ARTICLE_ROUTE_PREFIX)) {
    return {
      name: "detail",
      id: hash.slice(ARTICLE_ROUTE_PREFIX.length)
    };
  }
  return { name: "home" };
}

function showLogin() {
  dom.loginPanel.classList.remove("hidden");
  dom.adminPanel.classList.add("hidden");
}

function showAdmin() {
  dom.loginPanel.classList.add("hidden");
  dom.adminPanel.classList.remove("hidden");
}

function resetForm() {
  dom.title.value = "";
  setFieldValue(dom.summary, "", "");
  dom.publishTime.value = today();
  dom.riskLevel.value = "medium";
  setFieldValue(dom.content, "", "");
  setFieldValue(dom.warning, "", "");
  setFieldValue(dom.sources, "", "");
  dom.coverUrl.value = "";
  dom.coverFile.value = "";
  dom.uploadStatus.textContent = "";
  dom.coverPreview.classList.add("hidden");
  dom.coverPreview.src = "";
  dom.submitBtn.textContent = "发布";
  state.editingId = "";
  setError(dom.formError, "");
}

function getRiskLabel(level) {
  return RISK_LABEL_MAP[level] || "中风险";
}

function renderFrontList() {
  const list = sortArticles(state.articles);
  if (!list.length) {
    dom.frontList.innerHTML = '<div class="muted">暂无文章</div>';
    return;
  }

  dom.frontList.innerHTML = list
    .map((item) => {
      const summary = item.summary || stripHtml(item.summaryHtml);
      const cover = item.cover
        ? `<img class="article-cover" src="${escapeAttr(item.cover)}" alt="${escapeAttr(item.title)}" />`
        : '<div class="article-cover"></div>';

      return `
        <a class="article-card" href="#${ARTICLE_ROUTE_PREFIX}${encodeURIComponent(item.id)}">
          ${cover}
          <div class="article-body">
            <h2 class="article-title">${escapeHtml(item.title || "未命名")}</h2>
            <p class="article-summary">${escapeHtml(summary || "暂无摘要")}</p>
            <div class="article-meta">
              <span class="tag ${escapeAttr(item.riskLevel)}">${escapeHtml(getRiskLabel(item.riskLevel))}</span>
              <span>${escapeHtml(item.publishTime || "未标注日期")}</span>
            </div>
          </div>
        </a>
      `;
    })
    .join("");
}

function buildParagraphHtml(article) {
  if (article.contentHtml) {
    return article.contentHtml;
  }
  return (article.contentBlocks || [])
    .filter((item) => item.type === "paragraph")
    .map((item) => `<p>${escapeHtml(item.text)}</p>`)
    .join("");
}

function buildWarningHtml(article) {
  if (article.warningHtml) {
    return article.warningHtml;
  }
  const warning = (article.contentBlocks || [])
    .filter((item) => item.type === "warning")
    .map((item) => item.text)
    .join("\n");
  return warning ? escapeHtml(warning).replaceAll("\n", "<br>") : "";
}

function buildSources(article) {
  if (Array.isArray(article.sources) && article.sources.length) {
    return article.sources;
  }
  return splitLines(stripHtml(article.sourcesHtml || ""));
}

function renderFrontDetail(articleId) {
  const article = state.articles.find((item) => item.id === articleId);

  if (!article) {
    dom.detailArticle.innerHTML = "<p>文章不存在或已删除。</p>";
    return;
  }

  const coverHtml = article.cover
    ? `<img class="detail-cover" src="${escapeAttr(article.cover)}" alt="${escapeAttr(article.title)}" />`
    : "";

  const warningHtml = buildWarningHtml(article);
  const paragraphHtml = buildParagraphHtml(article);
  const sourceList = buildSources(article)
    .map((source) => `<li>${escapeHtml(source)}</li>`)
    .join("");

  dom.detailArticle.innerHTML = `
    <h1>${escapeHtml(article.title || "未命名")}</h1>
    <div class="detail-meta">
      <span class="tag ${escapeAttr(article.riskLevel)}">${escapeHtml(getRiskLabel(article.riskLevel))}</span>
      <span>发布时间：${escapeHtml(article.publishTime || "未标注")}</span>
      <span>阅读：${escapeHtml(String(article.readCount || 0))}</span>
    </div>
    ${coverHtml}
    ${warningHtml ? `<div class="detail-warning">${warningHtml}</div>` : ""}
    <div class="detail-content">${paragraphHtml || "<p>暂无正文</p>"}</div>
    ${sourceList ? `<section class="detail-sources"><h3>资料来源</h3><ul>${sourceList}</ul></section>` : ""}
  `;
}

function renderAdminList() {
  const list = sortArticles(state.articles);
  if (!list.length) {
    dom.articleList.innerHTML = '<div class="muted">暂无内容</div>';
    return;
  }

  dom.articleList.innerHTML = list
    .map((item) => {
      return `
        <div class="list-item">
          <div class="list-title">${escapeHtml(item.title || "未命名")}</div>
          <div class="list-meta">
            <span class="tag ${escapeAttr(item.riskLevel)}">${escapeHtml(getRiskLabel(item.riskLevel))}</span>
            <span>${escapeHtml(item.publishTime || "未标注日期")}</span>
          </div>
          <div class="list-actions">
            <button class="button ghost" data-action="edit" data-id="${escapeAttr(item.id)}" type="button">编辑</button>
            <button class="button ghost" data-action="delete" data-id="${escapeAttr(item.id)}" type="button">删除</button>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderRoute() {
  const route = parseRoute();

  if (route.name === "admin") {
    dom.frontPanel.classList.add("hidden");
    dom.adminRoot.classList.remove("hidden");

    if (state.isAdminAuthed) {
      showAdmin();
      renderAdminList();
    } else {
      showLogin();
    }
    return;
  }

  dom.adminRoot.classList.add("hidden");
  dom.frontPanel.classList.remove("hidden");

  if (route.name === "detail") {
    dom.frontListView.classList.add("hidden");
    dom.frontDetailView.classList.remove("hidden");
    renderFrontDetail(route.id);
  } else {
    dom.frontDetailView.classList.add("hidden");
    dom.frontListView.classList.remove("hidden");
    renderFrontList();
  }
}

function getArticleById(articleId) {
  return state.articles.find((item) => item.id === articleId);
}

function fillForm(article) {
  dom.title.value = article.title || "";
  setFieldValue(dom.summary, article.summaryHtml, article.summary || "");
  dom.publishTime.value = article.publishTime || today();
  dom.riskLevel.value = article.riskLevel || "medium";
  setFieldValue(dom.content, article.contentHtml, blocksToText(article.contentBlocks, "paragraph"));
  setFieldValue(dom.warning, article.warningHtml, blocksToText(article.contentBlocks, "warning"));
  setFieldValue(dom.sources, article.sourcesHtml, (article.sources || []).join("\n"));
  dom.coverUrl.value = article.cover || "";
  state.editingId = article.id;
  dom.submitBtn.textContent = "更新";

  if (article.cover) {
    dom.coverPreview.src = article.cover;
    dom.coverPreview.classList.remove("hidden");
  } else {
    dom.coverPreview.src = "";
    dom.coverPreview.classList.add("hidden");
  }
}

async function persistAndRender() {
  await persistArticles();
  renderFrontList();
  renderAdminList();
  renderRoute();
}

function createArticlePayload() {
  const title = dom.title.value.trim();
  const summaryText = getFieldText(dom.summary);
  const summaryHtml = getFieldHtml(dom.summary);
  const contentText = getFieldText(dom.content);
  const contentHtml = getFieldHtml(dom.content);
  const warningText = getFieldText(dom.warning);
  const warningHtml = getFieldHtml(dom.warning);
  const sourcesText = getFieldText(dom.sources);
  const sourcesHtml = getFieldHtml(dom.sources);

  if (!title || !summaryText) {
    throw new Error("标题和摘要为必填项");
  }

  const previous = state.editingId ? getArticleById(state.editingId) : null;

  return {
    id: state.editingId || `a_${Date.now()}`,
    title,
    summary: summaryText,
    summaryHtml,
    publishTime: dom.publishTime.value || today(),
    riskLevel: normalizeRiskLevel(dom.riskLevel.value),
    contentBlocks: buildContentBlocks(contentText, warningText),
    contentHtml,
    warningHtml,
    sources: splitLines(sourcesText),
    sourcesHtml,
    cover: dom.coverUrl.value.trim(),
    readCount: previous ? Number(previous.readCount) || 0 : 0
  };
}

function login() {
  setError(dom.loginError, "");
  const password = dom.password.value.trim();

  if (!password) {
    setError(dom.loginError, "请输入口令");
    return;
  }

  if (password !== ADMIN_PASSWORD) {
    setError(dom.loginError, "口令错误");
    return;
  }

  state.isAdminAuthed = true;
  localStorage.setItem(AUTH_KEY, "1");
  dom.password.value = "";
  showAdmin();
  renderAdminList();
}

function logout() {
  state.isAdminAuthed = false;
  localStorage.removeItem(AUTH_KEY);
  showLogin();
  resetForm();
}

async function handleSubmit() {
  setError(dom.formError, "");
  setStatus("发布中...");

  try {
    const article = normalizeArticle(createArticlePayload());
    const index = state.articles.findIndex((item) => item.id === article.id);
    const actionText = index >= 0 ? "更新" : "发布";

    if (index >= 0) {
      state.articles.splice(index, 1, article);
    } else {
      state.articles.unshift(article);
    }

    await persistAndRender();
    await publishCurrentArticles();
    state.defaultArticles = deepClone(state.articles);
    resetForm();
    setStatus(`文章已${actionText}并同步。约 20-60 秒后全员可见。`);
  } catch (err) {
    setError(dom.formError, err.message || "保存失败");
    setStatus(`发布失败：${err.message || "未知错误"}`);
  }
}

async function handleDelete(articleId) {
  if (!window.confirm("确认删除该文章？")) {
    return;
  }

  try {
    state.articles = state.articles.filter((item) => item.id !== articleId);
    await persistAndRender();
    setStatus("文章已删除（已保存到浏览器本地）");

    if (state.editingId === articleId) {
      resetForm();
    }

    const route = parseRoute();
    if (route.name === "detail" && route.id === articleId) {
      window.location.hash = "#/";
    }
  } catch (err) {
    setStatus(`删除失败：${err.message || "未知错误"}`);
  }
}

function dataUrlByteLength(dataUrl) {
  if (typeof dataUrl !== "string") return 0;
  const base64 = dataUrl.split(",")[1] || "";
  return Math.ceil((base64.length * 3) / 4);
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };
    image.src = objectUrl;
  });
}

async function compressImageToDataUrl(file) {
  const image = await loadImageFromFile(file);
  const maxSide = 1280;
  const ratio = Math.min(1, maxSide / Math.max(image.width, image.height));
  const targetWidth = Math.max(1, Math.round(image.width * ratio));
  const targetHeight = Math.max(1, Math.round(image.height * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

  let quality = 0.86;
  let output = canvas.toDataURL("image/jpeg", quality);
  let bytes = dataUrlByteLength(output);

  while (bytes > MAX_EMBED_IMAGE_BYTES && quality > 0.42) {
    quality -= 0.08;
    output = canvas.toDataURL("image/jpeg", quality);
    bytes = dataUrlByteLength(output);
  }

  if (bytes > MAX_EMBED_IMAGE_BYTES) {
    throw new Error("图片体积过大，请改用图片链接（URL）或继续压缩后再上传。");
  }

  return output;
}

async function handleUpload() {
  const file = dom.coverFile.files && dom.coverFile.files[0];
  if (!file) {
    dom.uploadStatus.textContent = "请先选择图片";
    return;
  }

  dom.uploadStatus.textContent = "转码中...";
  try {
    const base64 = await compressImageToDataUrl(file);
    dom.coverUrl.value = String(base64);
    dom.coverPreview.src = String(base64);
    dom.coverPreview.classList.remove("hidden");
    dom.uploadStatus.textContent = "已压缩并写入封面（Base64）";
  } catch (err) {
    dom.uploadStatus.textContent = `图片处理失败：${err.message || "未知错误"}`;
  }
}

function exportArticles() {
  const payload = JSON.stringify(sortArticles(state.articles), null, 2);
  const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `articles-${today()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  setStatus("已导出 JSON，可作为离线备份。");
}

async function restoreDefaultArticles() {
  if (!state.defaultArticles.length) {
    setStatus("默认数据为空，无法恢复。");
    return;
  }

  if (!window.confirm("确认恢复默认数据？当前本地改动会被覆盖。")) {
    return;
  }

  try {
    state.articles = deepClone(state.defaultArticles);
    await persistAndRender();
    resetForm();
    setStatus("已恢复默认数据。");
  } catch (err) {
    setStatus(`恢复失败：${err.message || "未知错误"}`);
  }
}

async function handleImportFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      throw new Error("JSON 根节点必须是数组");
    }

    state.articles = parsed.map((item, index) => normalizeArticle(item, index));
    await persistAndRender();
    resetForm();
    setStatus("导入成功，已写入浏览器本地存储。");
  } catch (err) {
    console.error(err);
    setStatus(`导入失败：${err.message || "格式错误"}`);
  } finally {
    dom.importFile.value = "";
  }
}

function bindEvents() {
  dom.brandHomeBtn.addEventListener("click", () => {
    window.location.hash = "#/";
  });

  dom.backToListBtn.addEventListener("click", () => {
    window.location.hash = "#/";
  });

  dom.loginBtn.addEventListener("click", login);
  dom.password.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      login();
    }
  });

  dom.refreshBtn.addEventListener("click", async () => {
    try {
      const latest = await loadDefaultArticles();
      if (latest.length) {
        state.defaultArticles = latest;
        state.articles = deepClone(latest);
        await persistArticles();
        setStatus("已从线上数据刷新。");
      } else {
        const local = await loadLocalArticles();
        if (local && local.length) {
          state.articles = local;
          setStatus("线上数据不可用，已回退本地缓存。");
        } else {
          setStatus("刷新失败：线上和本地都没有可用数据。");
          return;
        }
      }
      renderFrontList();
      renderAdminList();
      renderRoute();
    } catch (err) {
      setStatus(`刷新失败：${err.message || "未知错误"}`);
    }
  });

  dom.logoutBtn.addEventListener("click", logout);
  dom.submitBtn.addEventListener("click", handleSubmit);
  dom.resetBtn.addEventListener("click", resetForm);
  dom.uploadBtn.addEventListener("click", handleUpload);
  dom.exportBtn.addEventListener("click", exportArticles);
  dom.importBtn.addEventListener("click", () => dom.importFile.click());
  dom.restoreBtn.addEventListener("click", restoreDefaultArticles);
  dom.importFile.addEventListener("change", handleImportFile);
  if (dom.tokenConfirmBtn) {
    dom.tokenConfirmBtn.addEventListener("click", confirmTokenDialog);
  }
  if (dom.tokenCancelBtn) {
    dom.tokenCancelBtn.addEventListener("click", () => {
      failTokenDialog("已取消发布：未输入 GitHub Token。");
    });
  }
  if (dom.tokenModal) {
    dom.tokenModal.addEventListener("click", (event) => {
      if (event.target === dom.tokenModal) {
        failTokenDialog("已取消发布：未输入 GitHub Token。");
      }
    });
  }
  if (dom.tokenInput) {
    dom.tokenInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        confirmTokenDialog();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        failTokenDialog("已取消发布：未输入 GitHub Token。");
      }
    });
  }

  dom.articleList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action][data-id]");
    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;

    if (action === "edit") {
      const article = getArticleById(id);
      if (article) {
        fillForm(article);
      }
      return;
    }

    if (action === "delete") {
      handleDelete(id);
    }
  });

  document.querySelectorAll(".editor-toolbar").forEach((toolbar) => {
    toolbar.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-cmd]");
      if (!button) return;
      const editor = toolbar.parentElement.querySelector(".editor");
      if (!editor) return;
      editor.focus();
      document.execCommand(button.dataset.cmd, false, button.dataset.value || null);
    });

    const colorInput = toolbar.querySelector(".tool-color");
    if (colorInput) {
      colorInput.addEventListener("input", () => {
        const editor = toolbar.parentElement.querySelector(".editor");
        if (!editor) return;
        editor.focus();
        document.execCommand("styleWithCSS", false, true);
        document.execCommand("foreColor", false, colorInput.value);
      });
    }
  });

  window.addEventListener("hashchange", renderRoute);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && tokenDialogPending) {
      event.preventDefault();
      failTokenDialog("已取消发布：未输入 GitHub Token。");
      return;
    }
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "a") {
      window.location.hash = `#${ADMIN_ROUTE}`;
    }
  });
}

async function initData() {
  state.defaultArticles = await loadDefaultArticles();

  if (state.defaultArticles.length) {
    state.articles = deepClone(state.defaultArticles);
    await persistArticles();
    setStatus("已加载线上数据。编辑后点击“发布”即可全员同步。");
    return;
  }

  const local = await loadLocalArticles();
  if (local && local.length) {
    state.articles = local;
    setStatus("线上数据不可用，已加载本地缓存。");
  } else {
    state.articles = [];
    setStatus("当前无数据，请导入 JSON 或在后台新建。");
  }
}

async function init() {
  bindEvents();
  await initData();
  resetForm();
  renderFrontList();
  renderAdminList();

  if (!window.location.hash) {
    window.location.hash = "#/";
  } else {
    renderRoute();
  }
}

init();
