const cloud = require("wx-server-sdk");
const crypto = require("crypto");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const adminPassword = process.env.ADMIN_PASSWORD || "admin";
const adminToken = crypto.createHash("sha256").update(adminPassword).digest("hex");
const MAX_COVER_FILES = 30;

function isAuthorized(token) {
  return token && token === adminToken;
}

function today() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeArticle(input) {
  return {
    id: input.id || `a_${Date.now()}`,
    title: (input.title || "").trim(),
    summary: (input.summary || "").trim(),
    summaryHtml: typeof input.summaryHtml === "string" ? input.summaryHtml.trim() : "",
    cover: input.cover || "",
    publishTime: input.publishTime || today(),
    readCount: Number(input.readCount) || 0,
    riskLevel: input.riskLevel || "medium",
    contentBlocks: Array.isArray(input.contentBlocks) ? input.contentBlocks : [],
    contentHtml: typeof input.contentHtml === "string" ? input.contentHtml.trim() : "",
    warningHtml: typeof input.warningHtml === "string" ? input.warningHtml.trim() : "",
    sources: Array.isArray(input.sources) ? input.sources : [],
    sourcesHtml: typeof input.sourcesHtml === "string" ? input.sourcesHtml.trim() : ""
  };
}

function sanitizeFileName(name) {
  return (name || "cover.png").replace(/[^a-zA-Z0-9._-]/g, "_");
}

function filterCoverFileIds(fileIDs) {
  const list = Array.isArray(fileIDs) ? fileIDs : [fileIDs];
  return list
    .filter((item) => typeof item === "string" && item.startsWith("cloud://"))
    .filter((item) => item.includes("/covers/"))
    .slice(0, MAX_COVER_FILES);
}

async function getCoverUrls(data) {
  const fileIDs = filterCoverFileIds(data.fileIDs || data.fileID);
  if (!fileIDs.length) {
    return { ok: true, data: {} };
  }

  const res = await cloud.getTempFileURL({
    fileList: fileIDs.map((fileID) => ({ fileID, maxAge: 6 * 60 * 60 }))
  });

  const mapping = {};
  (res.fileList || []).forEach((file) => {
    if (file.fileID && file.tempFileURL) {
      mapping[file.fileID] = file.tempFileURL;
    }
  });

  return { ok: true, data: mapping };
}

async function uploadImage(data) {
  const base64 = (data.base64 || "").replace(/^data:.*;base64,/, "");
  if (!base64) {
    return { ok: false, message: "缺少图片数据" };
  }

  const buffer = Buffer.from(base64, "base64");
  if (buffer.length > 2 * 1024 * 1024) {
    return { ok: false, message: "图片过大，请压缩后再上传" };
  }

  const fileName = sanitizeFileName(data.fileName);
  const cloudPath = `covers/${Date.now()}-${fileName}`;
  const uploadRes = await cloud.uploadFile({
    cloudPath,
    fileContent: buffer
  });

  return {
    ok: true,
    data: {
      fileID: uploadRes.fileID,
      cloudPath: uploadRes.cloudPath
    }
  };
}

async function getTempUrl(data) {
  if (!data.fileID) {
    return { ok: false, message: "缺少 fileID" };
  }

  const res = await cloud.getTempFileURL({
    fileList: [{ fileID: data.fileID, maxAge: 6 * 60 * 60 }]
  });

  const file = res.fileList && res.fileList[0];

  return {
    ok: true,
    data: {
      tempFileURL: file ? file.tempFileURL : ""
    }
  };
}

exports.main = async (event) => {
  const { action, data = {}, token } = event;

  if (action === "getCoverUrls") {
    return getCoverUrls(data);
  }

  if (action === "login") {
    if (!data.password || data.password !== adminPassword) {
      return { ok: false, message: "口令错误" };
    }
    return { ok: true, data: { token: adminToken } };
  }

  if (!isAuthorized(token)) {
    return { ok: false, code: "UNAUTHORIZED", message: "未授权" };
  }

  if (action === "uploadImage") {
    return uploadImage(data);
  }

  if (action === "getTempUrl") {
    return getTempUrl(data);
  }

  if (action === "list") {
    const res = await db.collection("articles").orderBy("publishTime", "desc").get();
    return { ok: true, data: res.data || [] };
  }

  if (action === "create") {
    const article = normalizeArticle(data.article || {});
    if (!article.title || !article.summary) {
      return { ok: false, message: "标题和摘要必填" };
    }
    const res = await db.collection("articles").add({ data: article });
    return { ok: true, data: { _id: res._id } };
  }

  if (action === "update") {
    if (!data.docId) {
      return { ok: false, message: "缺少 docId" };
    }
    const article = normalizeArticle(data.article || {});
    if (!article.title || !article.summary) {
      return { ok: false, message: "标题和摘要必填" };
    }
    await db.collection("articles").doc(data.docId).update({ data: article });
    return { ok: true, data: {} };
  }

  if (action === "remove") {
    if (!data.docId) {
      return { ok: false, message: "缺少 docId" };
    }
    await db.collection("articles").doc(data.docId).remove();
    return { ok: true, data: {} };
  }

  return { ok: false, message: "未知操作" };
};
