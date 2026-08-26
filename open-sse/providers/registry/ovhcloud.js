export default {
  id: "ovhcloud",
  priority: 50,
  hasFree: true,
  alias: "ovh",
  uiAlias: "ovh",
  display: {
    name: "OVHcloud AI",
    icon: "cloud",
    color: "#0050D7",
    textIcon: "OV",
    website: "https://api.ovhcloud.ai",
    notice: {
      text: "OVHcloud AI Endpoints — free tier with rate limits (2 RPM/IP/model). No API key required for basic usage.",
    },
  },
  category: "free",
  noAuth: true,
  transport: {
    baseUrl: "https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions",
    noAuth: true,
  },
  models: [
    { id: "Qwen3-32B", name: "Qwen3 32B" },
    { id: "Qwen3.5-9B", name: "Qwen3.5 9B" },
    { id: "Qwen3-Coder-30B-A3B-Instruct", name: "Qwen3 Coder 30B" },
    { id: "Meta-Llama-3_3-70B-Instruct", name: "Llama 3.3 70B" },
    { id: "Mistral-Small-3.2-24B-Instruct-2506", name: "Mistral Small 3.2" },
    { id: "gpt-oss-120b", name: "GPT-OSS 120B" },
  ],
  passthroughModels: true,
};
