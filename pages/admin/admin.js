const { localArticles, mapRiskLabel } = require("../../utils/articles");

const riskLevels = [
  { label: "低风险", value: "low" },
  { label: "中风险", value: "medium" },
  { label: "高风险", value: "high" }
];

const defaultForm = {
  title: "",
  summary: "",
  content: "",
  warning: "",
  sources: "",
  cover: "",
  riskLevel: "medium",
  readCount: 0
};

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function splitLines(text) {
  return (text || "")
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildContentBlocks(content, warning) {
  const blocks = splitLines(content).map((text) => ({
    type: "paragraph",
    text
  }));

  if (warning && warning.trim()) {
    blocks.unshift({
      type: "warning",
      text: warning.trim()
    });
  }

  return blocks;
}

function blocksToText(blocks, type) {
  return (blocks || [])
    .filter((item) => item.type === type)
    .map((item) => item.text)
    .join("\n");
}

function toDisplayArticle(item) {
  return {
    ...item,
    riskLevelLabel: mapRiskLabel(item.riskLevel)
  };
}

Page({
  data: {
    articles: [],
    form: { ...defaultForm },
    editingDocId: "",
    editingId: "",
    riskOptions: riskLevels.map((item) => item.label),
    riskValues: riskLevels.map((item) => item.value),
    riskIndex: 1
  },
  onLoad() {
    this.loadArticles();
  },
  async loadArticles() {
    if (!wx.cloud || !wx.cloud.database) {
      wx.showToast({
        title: "云开发未就绪",
        icon: "none"
      });
      return;
    }

    const db = wx.cloud.database();
    const res = await db.collection("articles").orderBy("publishTime", "desc").get();

    this.setData({
      articles: (res.data || []).map(toDisplayArticle)
    });
  },
  onFieldChange(event) {
    const field = event.currentTarget.dataset.field;
    const value = event.detail.value;
    this.setData({
      [`form.${field}`]: value
    });
  },
  onRiskChange(event) {
    const index = Number(event.detail.value || 0);
    const riskLevel = this.data.riskValues[index];
    this.setData({
      riskIndex: index,
      "form.riskLevel": riskLevel
    });
  },
  onReset() {
    this.setData({
      form: { ...defaultForm },
      editingDocId: "",
      editingId: "",
      riskIndex: 1
    });
  },
  async onSubmit() {
    const { form, editingDocId, editingId } = this.data;

    if (!form.title.trim()) {
      wx.showToast({ title: "请填写标题", icon: "none" });
      return;
    }

    if (!form.summary.trim()) {
      wx.showToast({ title: "请填写摘要", icon: "none" });
      return;
    }

    const articleData = {
      id: editingId || `a_${Date.now()}`,
      title: form.title.trim(),
      summary: form.summary.trim(),
      cover: form.cover.trim(),
      publishTime: form.publishTime || getToday(),
      readCount: form.readCount || 0,
      riskLevel: form.riskLevel,
      contentBlocks: buildContentBlocks(form.content, form.warning),
      sources: splitLines(form.sources)
    };

    if (!wx.cloud || !wx.cloud.database) {
      wx.showToast({ title: "云开发未就绪", icon: "none" });
      return;
    }

    const db = wx.cloud.database();

    if (editingDocId) {
      await db.collection("articles").doc(editingDocId).update({
        data: articleData
      });
      wx.showToast({ title: "已更新", icon: "success" });
    } else {
      await db.collection("articles").add({
        data: articleData
      });
      wx.showToast({ title: "已发布", icon: "success" });
    }

    this.onReset();
    this.loadArticles();
  },
  onEdit(event) {
    const docId = event.currentTarget.dataset.id;
    const article = this.data.articles.find((item) => item._id === docId);

    if (!article) {
      return;
    }

    const riskIndex = this.data.riskValues.indexOf(article.riskLevel);

    this.setData({
      editingDocId: docId,
      editingId: article.id,
      riskIndex: riskIndex === -1 ? 1 : riskIndex,
      form: {
        title: article.title || "",
        summary: article.summary || "",
        content: blocksToText(article.contentBlocks, "paragraph"),
        warning: blocksToText(article.contentBlocks, "warning"),
        sources: (article.sources || []).join("\n"),
        cover: article.cover || "",
        riskLevel: article.riskLevel || "medium",
        readCount: article.readCount || 0
      }
    });
  },
  onDelete(event) {
    const docId = event.currentTarget.dataset.id;

    wx.showModal({
      title: "删除文章",
      content: "删除后无法恢复，是否继续？",
      success: async (res) => {
        if (!res.confirm) {
          return;
        }
        const db = wx.cloud.database();
        await db.collection("articles").doc(docId).remove();
        this.loadArticles();
      }
    });
  },
  async onSeed() {
    if (!wx.cloud || !wx.cloud.database) {
      wx.showToast({ title: "云开发未就绪", icon: "none" });
      return;
    }

    if (this.data.articles.length > 0) {
      wx.showToast({ title: "已有内容，无需导入", icon: "none" });
      return;
    }

    const db = wx.cloud.database();

    for (const article of localArticles) {
      await db.collection("articles").add({
        data: {
          id: article.id,
          title: article.title,
          summary: article.summary,
          cover: article.cover,
          publishTime: article.publishTime,
          readCount: article.readCount,
          riskLevel: article.riskLevel,
          contentBlocks: article.contentBlocks,
          sources: article.sources
        }
      });
    }

    wx.showToast({ title: "示例数据已导入", icon: "success" });
    this.loadArticles();
  }
});