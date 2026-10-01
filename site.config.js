const CONFIG = {
  // profile setting (required)
  profile: {
    name: "Nguyen Mau Minh Duc",
    image: "/avatar.png",
    role: "Fullstack Developer",
    bio: "I build the services and read models behind product UIs. Based in Ho Chi Minh City.",
    email: "mauduckiengiang@gmail.com",
    linkedin: "mauduckg",
    github: "ducnmm",
    instagram: "",
  },
  projects: [
    {
      name: "MemWal",
      href: "https://memory.walrus.xyz/",
    },
    {
      name: "Rememe",
      href: "https://app.rememe.art/",
    },
  ],
  // blog setting (required)
  blog: {
    title: "Nguyen Mau Minh Duc",
    description: "Notes on backends, storage, and on-chain systems.",
    scheme: "light", // 'light' | 'dark' | 'system'
  },

  // CONFIG configration (required)
  link: "https://morethan-log-production.up.railway.app",
  since: 2026,
  lang: "en-US", // ['en-US', 'zh-CN', 'zh-HK', 'zh-TW', 'ja-JP', 'es-ES', 'ko-KR']
  ogImageGenerateURL: "https://og-image-korean.vercel.app",

  // notion configuration (required)
  // Public database "Duc log" in Duc's Notion. Override with NOTION_PAGE_ID if it changes.
  notionConfig: {
    pageId: process.env.NOTION_PAGE_ID || "9c87f33335894a839c70ce28155b2899",
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
    enable: false,
    config: {
      repo: process.env.NEXT_PUBLIC_UTTERANCES_REPO || "ducnmm/morethan-log",
      "issue-term": "og:title",
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
  revalidateTime: 3600,
}

module.exports = { CONFIG }
