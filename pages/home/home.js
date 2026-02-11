const { localArticles, mapRiskLabel } = require("../../utils/articles");

const PAGE_SIZE = 10;
const COVER_FUNCTION = "adminApi";

function normalizeArticle(item, index) {
  const riskLevel = item.riskLevel || "medium";
  const listKey = item._id || item.id || `idx-${index}`;
  return {
    ...item,
    id: item._id || item.id || listKey,
    listKey,
    riskLevel,
    riskLevelLabel: item.riskLevelLabel || mapRiskLabel(riskLevel),
    riskLevelClass: `risk-${riskLevel}`,
    readCount: Number(item.readCount) || 0,
    publishTimeLabel: item.publishTime || "未标注日期",
    delay: Math.min(index * 0.05, 0.3)
  };
}

async function resolveCoverUrls(list) {
  if (!wx.cloud) {
    return list;
  }

  const cloudFiles = list
    .filter((item) => item.cover && item.cover.startsWith("cloud://"))
    .map((item) => item.cover);

  if (!cloudFiles.length) {
    return list;
  }

  const uniqueFiles = Array.from(new Set(cloudFiles));
  const mapping = {};

  if (wx.cloud.callFunction) {
    try {
      const res = await wx.cloud.callFunction({
        name: COVER_FUNCTION,
        data: { action: "getCoverUrls", data: { fileIDs: uniqueFiles } }
      });
      if (res && res.result && res.result.ok && res.result.data) {
        Object.assign(mapping, res.result.data);
      }
    } catch (err) {
      // ignore and fallback
    }
  }

  let pending = uniqueFiles.filter((fileID) => !mapping[fileID]);

  if (pending.length && wx.cloud.getTempFileURL) {
    try {
      const res = await wx.cloud.getTempFileURL({
        fileList: pending.map((fileID) => ({ fileID, maxAge: 6 * 60 * 60 }))
      });

      const missing = [];
      (res.fileList || []).forEach((file) => {
        if (file.fileID && file.tempFileURL) {
          mapping[file.fileID] = file.tempFileURL;
        } else if (file.fileID) {
          missing.push(file.fileID);
        }
      });
      pending = missing;
    } catch (err) {
      // keep pending
    }
  }

  if (pending.length && wx.cloud.downloadFile) {
    const downloads = await Promise.all(
      pending.map((fileID) =>
        wx.cloud
          .downloadFile({ fileID })
          .then((res) => ({ fileID, tempFilePath: res.tempFilePath }))
          .catch(() => null)
      )
    );

    downloads.forEach((item) => {
      if (item && item.fileID && item.tempFilePath) {
        mapping[item.fileID] = item.tempFilePath;
      }
    });
  }

  return list.map((item) =>
    mapping[item.cover] ? { ...item, cover: mapping[item.cover] } : item
  );
}

Page({
  data: {
    articles: [],
    page: 0,
    hasMore: true,
    loading: false,
    useCloud: true
  },
  onLoad() {
    this.loadArticles(true);
  },
  onPullDownRefresh() {
    this.loadArticles(true)
      .then(() => wx.stopPullDownRefresh())
      .catch(() => wx.stopPullDownRefresh());
  },
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadArticles(false);
    }
  },
  async loadArticles(refresh) {
    if (this.data.loading) {
      return;
    }
    this.setData({ loading: true });

    if (!wx.cloud || !wx.cloud.database) {
      const fallback = await resolveCoverUrls(
        localArticles.map((item, index) => normalizeArticle(item, index))
      );
      this.setData({
        articles: fallback,
        hasMore: false,
        loading: false,
        useCloud: false
      });
      return;
    }

    const db = wx.cloud.database();
    const pageIndex = refresh ? 0 : this.data.page;

    try {
      const res = await db
        .collection("articles")
        .orderBy("publishTime", "desc")
        .skip(pageIndex * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .get();

      const list = (res.data || []).map((item, index) => normalizeArticle(item, index));
      const resolved = await resolveCoverUrls(list);
      const next = refresh ? resolved : this.data.articles.concat(resolved);

      this.setData({
        articles: next,
        page: pageIndex + 1,
        hasMore: list.length === PAGE_SIZE,
        loading: false,
        useCloud: true
      });
    } catch (err) {
      this.setData({
        articles: await resolveCoverUrls(
          localArticles.map((item, index) => normalizeArticle(item, index))
        ),
        hasMore: false,
        loading: false,
        useCloud: false
      });
      wx.showToast({
        title: "云端不可用，已使用本地数据",
        icon: "none"
      });
    }
  },
  onOpenDetail(event) {
    const id = event.currentTarget.dataset.id;
    if (!id) {
      return;
    }
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  }
});
