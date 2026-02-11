const baseArticles = [
  {
    id: "a1",
    title: "高原反应的早期识别与自救",
    summary: "识别高原反应、降低风险与紧急处理要点。",
    cover: "",
    publishTime: "2025-01-12",
    readCount: 1523,
    riskLevel: "medium",
    contentBlocks: [
      { type: "paragraph", text: "高原反应多发生在海拔 2500 米以上，尤其是短时间内快速上升。" },
      { type: "paragraph", text: "早期表现常见为头痛、乏力、恶心、食欲下降、睡眠差。" },
      { type: "paragraph", text: "有心肺基础病、近期劳累或睡眠不足者更易出现症状。" },
      { type: "paragraph", text: "预防上建议循序渐进，每天上升不超过 300-500 米，并适当休息。" },
      { type: "paragraph", text: "保持充足饮水，避免饮酒与剧烈运动，可携带便携血氧仪监测。" },
      { type: "paragraph", text: "若休息后仍加重，应尽快下撤或寻求医疗帮助。" },
      { type: "warning", text: "出现持续性呼吸困难、意识模糊或剧烈头痛时需立即就医。" }
    ],
    sources: ["WHO 旅行健康指南 2024", "国家卫健委科普资料"]
  },
  {
    id: "a2",
    title: "高温旅行防中暑指南",
    summary: "高温出行的补水、降温与应急处理。",
    cover: "",
    publishTime: "2025-01-10",
    readCount: 987,
    riskLevel: "high",
    contentBlocks: [
      { type: "paragraph", text: "高温环境下人体散热困难，持续暴晒易引发热射病。" },
      { type: "paragraph", text: "出行尽量避开 11:00-15:00 高温时段，安排在清晨或傍晚。" },
      { type: "paragraph", text: "穿浅色透气衣物，随身带遮阳帽与防晒用品。" },
      { type: "paragraph", text: "补水应少量多次，可选择含电解质的饮品。" },
      { type: "paragraph", text: "老人、儿童、慢性病患者需重点防护，避免长时间暴露。" },
      { type: "paragraph", text: "若出现头晕、心跳加快、体温升高，先转移到阴凉处并降温。" },
      { type: "warning", text: "意识模糊、抽搐或体温持续升高，立即就医或呼叫急救。" }
    ],
    sources: ["WHO 高温健康指南", "应急科普提示"]
  },
  {
    id: "a3",
    title: "旅行急救包清单（轻装版）",
    summary: "轻量急救包必须品与使用提示。",
    cover: "",
    publishTime: "2025-01-08",
    readCount: 642,
    riskLevel: "low",
    contentBlocks: [
      { type: "paragraph", text: "轻装急救包建议包含创可贴、消毒湿巾、绷带、止泻药。" },
      { type: "paragraph", text: "高原或户外旅行可备止痛药、抗过敏药与血氧仪。" },
      { type: "paragraph", text: "常用处方药需备足疗程并随身携带用药说明。" },
      { type: "paragraph", text: "药品需避免高温暴晒，注意有效期与保存条件。" },
      { type: "paragraph", text: "遇到伤口出血先止血并清洁，再根据情况包扎。" },
      { type: "paragraph", text: "重大外伤或持续不适应及时寻求医疗帮助。" },
      { type: "warning", text: "处方药不可随意借给他人，以免发生不良反应。" }
    ],
    sources: ["旅行门诊建议", "公共卫生指引"]
  }
];

const riskLabels = {
  low: "低风险",
  medium: "中风险",
  high: "高风险"
};

function mapRiskLabel(level) {
  return riskLabels[level] || "提示";
}

const localArticles = baseArticles.map((item) => ({
  ...item,
  riskLevelLabel: mapRiskLabel(item.riskLevel)
}));

function getLocalArticleById(id) {
  return localArticles.find((item) => item.id === id);
}

module.exports = {
  localArticles,
  getLocalArticleById,
  mapRiskLabel
};