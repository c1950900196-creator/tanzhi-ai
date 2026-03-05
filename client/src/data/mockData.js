export const MOCK_DATA = {
  developer: {
    tags: ["前端开发", "后端架构", "AI/机器学习", "系统设计", "DevOps", "数据库", "开源社区", "性能优化"],
    cards: [
      {
        id: "d1",
        tags: ["#系统设计", "#分布式"],
        heat: "🔥热门",
        title: "为什么 Kafka 在超大规模下正在被 Redpanda 替代？",
        summary: "Redpanda 用 C++ 重写了 Kafka 的核心协议层，去掉了 JVM 和 ZooKeeper 依赖...",
        gradient: "linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 40%, #ede9fe 100%)",
        author: { name: "陆知行", avatar: "L", color: "#3b82f6", title: "分布式系统架构师" },
        aiFirstMessage: "Kafka 过去十年的统治地位确实在动摇。",
        quickReplies: ["Thread-per-core 是什么？", "迁移成本高吗？", "它们如何做存储分离？"]
      },
      {
        id: "d2",
        tags: ["#编程语言", "#争议"],
        heat: "✨精选",
        title: "为什么 Go 的错误处理被称为'反人类设计'？",
        summary: "Go 语言 if err != nil 的错误处理方式一直是社区最大的争议点之一...",
        gradient: "linear-gradient(135deg, #fef3c7 0%, #fffbeb 40%, #fce7f3 100%)",
        author: { name: "苏栈桥", avatar: "S", color: "#f59e0b", title: "Go/Rust 语言布道者" },
        aiFirstMessage: "Go 的 `if err != nil` 确实让很多习惯了 try-catch 的开发者抓狂。",
        quickReplies: ["对比一下 Rust 的 Result", "Go 大型项目的最佳实践", "为什么不加 try-catch？"]
      }
    ]
  },
  product_manager: {
    tags: ["用户体验", "增长策略", "AI产品设计", "B端SaaS", "C端消费", "竞品分析", "商业变现", "数据驱动"],
    cards: [
      {
        id: "p1",
        tags: ["#产品策略", "#SaaS"],
        heat: "🔥热门",
        title: "PLG（产品驱动增长）在 B 端 SaaS 为什么频频失败？",
        summary: "Notion、Figma 的 PLG 神话让无数 B 端产品跟风...",
        gradient: "linear-gradient(135deg, #ede9fe 0%, #faf5ff 40%, #e0f2fe 100%)",
        author: { name: "沈思远", avatar: "沈", color: "#8b5cf6", title: "SaaS 增长策略顾问" },
        aiFirstMessage: "自从 Notion 和 Figma 靠 PLG 杀出重围，几乎所有 B 端产品都想复制这条路。",
        quickReplies: ["怎么判断适不适合PLG？", "拆解几个失败案例", "什么是 Product-Led Sales？"]
      }
    ]
  }
};

export const DAILY_QUOTES = [
  "认知决定上限，执行决定下限。",
  "好的产品是长出来的，不是规划出来的。",
  "技术是手段，解决问题才是目的。",
  "不要用战术上的勤奋掩盖战略上的懒惰。",
  "保持好奇，探索未知。"
];

export const FALLBACK_TAGS = {
  developer: ["前端开发", "后端架构", "AI/机器学习", "系统设计", "DevOps", "数据库", "开源社区", "性能优化"],
  product_manager: ["用户体验", "增长策略", "AI产品设计", "B端SaaS", "C端消费", "竞品分析", "商业变现", "数据驱动"]
};
