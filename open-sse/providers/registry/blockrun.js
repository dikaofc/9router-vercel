export default {
  id: "blockrun",
  priority: 50,
  hasFree: true,
  alias: "br",
  uiAlias: "br",
  display: {
    name: "BlockRun Free",
    icon: "speed",
    color: "#FF5722",
    textIcon: "BR",
    website: "https://blockrun.ai",
    notice: {
      text: "BlockRun — free tier with NVIDIA models, no API key required. Rate-limited.",
    },
  },
  category: "free",
  noAuth: true,
  transport: {
    baseUrl: "https://blockrun.ai/api/v1/chat/completions",
    noAuth: true,
  },
  models: [
    { id: "nvidia/step-3.7-flash", name: "Step 3.7 Flash (NVIDIA)" },
    { id: "nvidia/gpt-oss-120b", name: "GPT-OSS 120B (NVIDIA)" },
  ],
  passthroughModels: true,
};
