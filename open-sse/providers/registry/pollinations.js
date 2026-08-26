export default {
  id: "pollinations",
  priority: 50,
  hasFree: true,
  alias: "pollinations",
  aliases: [
    "pn",
    "poll",
  ],
  uiAlias: "pn",
  display: {
    name: "Pollinations AI",
    icon: "eco",
    color: "#10B981",
    textIcon: "PN",
    website: "https://pollinations.ai",
    notice: {
      text: "Pollinations — free, no API key required. OpenAI-compatible endpoint with rate limiting.",
    },
  },
  category: "free",
  noAuth: true,
  featured: true,
  transport: {
    baseUrl: "https://text.pollinations.ai/openai/v1/chat/completions",
    noAuth: true,
    validateUrl: "https://text.pollinations.ai/openai/v1/models",
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; 9Router/1.0)",
    },
  },
  models: [
    { id: "openai", name: "Pollinations OpenAI (GPT-OSS-20B)", contextLength: 128000 },
    { id: "gpt-4o-mini", name: "GPT-4o Mini (Pollinations)", contextLength: 128000 },
    { id: "gpt-4o", name: "GPT-4o (Pollinations)", contextLength: 128000 },
    { id: "llama", name: "Llama (Pollinations)", contextLength: 128000 },
  ],
  passthroughModels: true,
};
