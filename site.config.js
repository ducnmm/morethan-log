const CONFIG = {
  // profile setting (required)
  profile: {
    name: "Nguyen Mau Minh Duc",
    image: "/avatar.png",
    role: "Fullstack Developer",
    bio: "Shipping backends, indexers & on-chain glue. // Ho Chi Minh City",
    email: "mauduckiengiang@gmail.com",
    linkedin: "mauduckg",
    github: "ducnmm",
    twitter: "0xducnmm",
    instagram: "",
  },
  projects: [
    {
      name: "MemWal",
      href: "https://memory.walrus.xyz/",
      icon: "🧠",
    },
    {
      name: "Rememe",
      href: "https://app.rememe.art/",
      icon: "🎨",
    },
    {
      name: "Sui Agent Payment",
      href: "https://www.sui.io/agentpayments",
      icon: "⚡",
    },
  ],
  // blog setting (required)
  blog: {
    title: "ducnmm-log",
    description: "Notes on backends, storage, and on-chain systems.",
    scheme: "system", // 'light' | 'dark' | 'system'
  },

  // CONFIG configration (required)
  link: "https://ducnmm-log.xyz",
  since: 2026,
  lang: "en-US", // ['en-US', 'zh-CN', 'zh-HK', 'zh-TW', 'ja-JP', 'es-ES', 'ko-KR']
  ogImageGenerateURL: "https://og-image-korean.vercel.app",

  // notion configuration (required)
  // Personal Notion CMS database. Override with NOTION_PAGE_ID if it changes.
  notionConfig: {
    pageId: process.env.NOTION_PAGE_ID || "1a18521afa6a80c19850cbda0179c57d",
  },

  // plugin configuration (optional)
  googleAnalytics: {
    enable: false,
    config: {
      measurementId: process.env.NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID || "",
    },
  },
  googleSearchConsole: {
    enable: false,
    config: {
      siteVerification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
    },
  },
  naverSearchAdvisor: {
    enable: false,
    config: {
      siteVerification: process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION || "",
    },
  },
  utterances: {
    enable: true,
    config: {
      repo: process.env.NEXT_PUBLIC_UTTERANCES_REPO || "ducnmm/morethan-log",
      "issue-term": "pathname",
      label: "💬 Utterances",
    },
  },
  cusdis: {
    enable: false,
    config: {
      host: "https://cusdis.com",
      appid: "",
    },
  },
  isProd: process.env.RAILWAY_ENVIRONMENT === "production" || process.env.VERCEL_ENV === "production",
  revalidateTime: 60,
}

module.exports = { CONFIG }
