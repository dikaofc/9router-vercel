export default {
  id: "opencode-go",
  priority: 210,
  alias: "opencode-go",
  aliases: [
    "ocg",
  ],
  uiAlias: "ocg",
  display: {
    name: "OpenCode Go",
    icon: "terminal",
    color: "#E87040",
    textIcon: "OC",
    website: "https://opencode.ai/auth",
    notice: {
      text: "OpenCode Go — no subscription needed. Free model ox-alpha-free + paid Kimi/GLM/Qwen/MiMo/MiniMax. Get API key at opencode.ai/auth.",
      apiKeyUrl: "https://opencode.ai/auth",
    },
  },
  category: "apikey",
  transport: {
    baseUrl: "https://opencode.ai/zen/go/v1/chat/completions",
    headers: {},
  },
  // Multi-endpoint: pick the transport matching the client sourceFormat to skip
  // translation. Guarded per-model by `supportedFormats` (see chatCore) because
  // opencode-go models differ in endpoint support.
  transports: [
    { format: "openai", baseUrl: "https://opencode.ai/zen/go/v1/chat/completions", auth: { combined: true, header: "Authorization", scheme: "bearer" } },
    { format: "claude", baseUrl: "https://opencode.ai/zen/go/v1/messages", auth: { combined: true, header: "x-api-key", scheme: "raw", anthropicVersion: true } },
    { format: "openai-responses", baseUrl: "https://opencode.ai/zen/go/v1/responses", auth: { combined: true, header: "Authorization", scheme: "bearer" } },
  ],
  models: [
    // Free tier — upstream id == client id (no remap needed).
    { id: "ox-alpha-free", name: "Ox Alpha Free", supportedFormats: ["openai", "claude", "openai-responses"] },
    { id: "hy3", name: "Hy3", supportedFormats: ["openai", "claude", "openai-responses"] },
    { id: "hy3-preview", name: "Hy3 Preview", supportedFormats: ["openai", "claude", "openai-responses"] },
    { id: "muse-spark-1.2-contributor", name: "Muse Spark 1.2 Contributor", supportedFormats: ["openai"] },
    // deepseek-v4-flash-free is a client-facing alias for the upstream
    // `deepseek-v4-flash` model (the upstream has no "-free" suffix, so sending
    // it verbatim returned "Model is unavailable"). Remapped via upstreamModelId.
    { id: "deepseek-v4-flash-free", name: "DeepSeek V4 Flash (Free)", upstreamModelId: "deepseek-v4-flash", supportedFormats: ["openai", "claude", "openai-responses"] },
    { id: "deepseek-v4-flash", name: "DeepSeek V4 Flash", supportedFormats: ["openai", "claude", "openai-responses"] },
    { id: "deepseek-v4-pro", name: "DeepSeek V4 Pro", supportedFormats: ["openai", "claude", "openai-responses"] },
    { id: "glm-5", name: "GLM 5", supportedFormats: ["openai"] },
    { id: "glm-5.1", name: "GLM 5.1", supportedFormats: ["openai"] },
    { id: "glm-5.2", name: "GLM 5.2", supportedFormats: ["openai"] },
    { id: "glm-5.3", name: "GLM 5.3", supportedFormats: ["openai"] },
    { id: "kimi-k2.5", name: "Kimi K2.5", supportedFormats: ["openai"] },
    { id: "kimi-k2.6", name: "Kimi K2.6", supportedFormats: ["openai"] },
    { id: "kimi-k2.7-code", name: "Kimi K2.7 Code", supportedFormats: ["openai"] },
    { id: "kimi-k3", name: "Kimi K3", supportedFormats: ["openai"] },
    { id: "mimo-v2.5", name: "MiMo V2.5", supportedFormats: ["openai"] },
    { id: "mimo-v2.5-pro", name: "MiMo V2.5 Pro", supportedFormats: ["openai"] },
    { id: "mimo-v2-pro", name: "MiMo V2 Pro", supportedFormats: ["openai"] },
    { id: "mimo-v2-omni", name: "MiMo V2 Omni", supportedFormats: ["openai"] },
    { id: "minimax-m3", name: "MiniMax M3", supportedFormats: ["openai", "claude"] },
    { id: "minimax-m2.7", name: "MiniMax M2.7", supportedFormats: ["openai", "claude"] },
    { id: "minimax-m2.5", name: "MiniMax M2.5", supportedFormats: ["openai", "claude"] },
    { id: "qwen3.5-plus", name: "Qwen 3.5 Plus", supportedFormats: ["openai", "claude"] },
    { id: "qwen3.6-plus", name: "Qwen 3.6 Plus", supportedFormats: ["openai", "claude"] },
    { id: "qwen3.7-plus", name: "Qwen 3.7 Plus", supportedFormats: ["openai", "claude"] },
    { id: "qwen3.7-max", name: "Qwen 3.7 Max", supportedFormats: ["openai", "claude"] },
    { id: "qwen3.8-max", name: "Qwen 3.8 Max", supportedFormats: ["openai", "claude"] },
  ],
};
