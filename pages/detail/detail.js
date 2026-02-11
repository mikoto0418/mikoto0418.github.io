const { getLocalArticleById, mapRiskLabel } = require("../../utils/articles");

const COVER_FUNCTION = "adminApi";

function stripHtml(value) {
  return (value || "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function extractWarning(blocks) {
  if (!Array.isArray(blocks)) return "";
  const warning = blocks.find((item) => item.type === "warning");
  return warning ? warning.text || "" : "";
}

function normalizeArticle(item) {
  const riskLevel = item.riskLevel || "medium";
  const summaryHtml = item.summaryHtml || "";
  const summaryText = item.summary || stripHtml(summaryHtml) || "";
  const warningHtml = item.warningHtml || "";
  const warningText = warningHtml ? stripHtml(warningHtml) : extractWarning(item.contentBlocks);
  return {
    ...item,
    id: item._id || item.id,
    riskLevel,
    riskLevelLabel: item.riskLevelLabel || mapRiskLabel(riskLevel),
    riskLevelClass: `risk-${riskLevel}`,
    readCount: Number(item.readCount) || 0,
    publishTimeLabel: item.publishTime || "未标注日期",
    summary: summaryText,
    summaryHtml,
    contentHtml: item.contentHtml || "",
    warningHtml,
    warningText,
    sourcesHtml: item.sourcesHtml || ""
  };
}

async function resolveCoverUrl(article) {
  if (
    !article ||
    !article.cover ||
    !article.cover.startsWith("cloud://") ||
    !wx.cloud
  ) {
    return article;
  }

  const fileID = article.cover;

  if (wx.cloud.callFunction) {
    try {
      const res = await wx.cloud.callFunction({
        name: COVER_FUNCTION,
        data: { action: "getCoverUrls", data: { fileIDs: [fileID] } }
      });
      if (res && res.result && res.result.ok && res.result.data) {
        const url = res.result.data[fileID];
        if (url) {
          return { ...article, cover: url };
        }
      }
    } catch (err) {
      // ignore and fallback
    }
  }

  try {
    if (wx.cloud.getTempFileURL) {
      const res = await wx.cloud.getTempFileURL({
        fileList: [{ fileID, maxAge: 6 * 60 * 60 }]
      });
      const file = res.fileList && res.fileList[0];
      if (file && file.tempFileURL) {
        return { ...article, cover: file.tempFileURL };
      }
    }
  } catch (err) {
    // fallthrough
  }

  if (wx.cloud.downloadFile) {
    try {
      const res = await wx.cloud.downloadFile({ fileID });
      if (res.tempFilePath) {
        return { ...article, cover: res.tempFilePath };
      }
    } catch (err) {
      return article;
    }
  }

  return article;
}

async function fetchByIdField(db, id) {
  const res = await db
    .collection("articles")
    .where({ id })
    .limit(1)
    .get();
  return res.data && res.data[0] ? res.data[0] : null;
}

async function fetchByDocId(db, id) {
  const res = await db.collection("articles").doc(id).get();
  return res.data || null;
}

Page({
  data: {
    article: null,
    notFound: false
  },
  onLoad(options) {
    this.loadArticle(options.id);
  },
  async loadArticle(id) {
    if (!id) {
      this.setData({ notFound: true });
      return;
    }

    let article = null;

    if (wx.cloud && wx.cloud.database) {
      const db = wx.cloud.database();
      try {
        article = await fetchByIdField(db, id);
        if (!article) {
          article = await fetchByDocId(db, id);
        }
      } catch (err) {
        article = null;
      }
    }

    if (!article) {
      article = getLocalArticleById(id);
    }

    if (!article) {
      this.setData({ notFound: true });
      return;
    }

    const normalized = normalizeArticle(article);
    const resolved = await resolveCoverUrl(normalized);

    this.setData({
      article: resolved,
      notFound: false
    });
  }
});
