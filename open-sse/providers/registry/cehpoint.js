export default {
  id: "cehpoint",
  priority: 50,
  hasFree: true,
  alias: "cph",
  uiAlias: "cph",
  display: {
    name: "Cehpoint AI",
    icon: "smart_toy",
    color: "#7C4DFF",
    textIcon: "CP",
    website: "https://cehpoint.co.in",
    notice: {
      text: "Cehpoint AI — free, no API key required. Multilingual AI model.",
    },
  },
  category: "free",
  noAuth: true,
  transport: {
    baseUrl: "https://ai-api.cehpoint.co.in/v1/chat/completions",
    noAuth: true,
  },
  models: [
    { id: "cehpoint-ai", name: "Cehpoint AI" },
    { id: "cehpoint-ai-multilingual", name: "Cehpoint AI Multilingual" },
  ],
  passthroughModels: true,
};
