/** @type {import('next-sitemap').IConfig} */
const config = {
  siteUrl: "https://ai.aeternumindia.com",
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  changefreq: "weekly",
  priority: 0.7,
  exclude: ["/ai-shopping"],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [],
      },
    ],
    additionalSitemaps: [],
  },
  transform: async (config, path) => {
    const priorityMap = {
      "/": 1.0,
      "/virtual-try-on": 0.9,
      "/color-analysis": 0.8,
      "/ai-shopping/ucp": 0.9,
    };

    return {
      loc: path,
      changefreq: path === "/" ? "daily" : "weekly",
      priority: priorityMap[path] ?? 0.5,
      lastmod: new Date().toISOString(),
    };
  },
};

export default config;
